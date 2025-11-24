import { stripe } from '~/server/utils/stripe'
import Stripe from 'stripe'

export default defineEventHandler(async (event) => {
  try {
    const body = await readRawBody(event)
    const signature = getHeader(event, 'stripe-signature')

    if (!body || !signature) {
      throw createError({
        statusCode: 400,
        message: 'Missing body or signature'
      })
    }

    // Verify webhook signature
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
    if (!webhookSecret) {
      throw new Error('STRIPE_WEBHOOK_SECRET is not set')
    }

    let stripeEvent: Stripe.Event
    try {
      stripeEvent = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    } catch (err: any) {
      console.error('Webhook signature verification failed:', err.message)
      throw createError({
        statusCode: 400,
        message: 'Invalid signature'
      })
    }

    const client = await serverSupabaseServiceRole(event)

    // Handle different event types
    switch (stripeEvent.type) {
      case 'checkout.session.completed': {
        const session = stripeEvent.data.object as Stripe.Checkout.Session
        const userId = session.metadata?.userId
        const planId = session.metadata?.planId
        const customerId = session.customer as string
        const subscriptionId = session.subscription as string

        if (!userId) {
          console.error('No userId in session metadata')
          break
        }

        // Get organization for this user
        const { data: profile } = await client
          .from('profiles')
          .select('organization_id')
          .eq('id', userId)
          .single()

        if (!profile) {
          console.error('Profile not found for user:', userId)
          break
        }

        // Update or create subscription
        const { error: subError } = await client
          .from('subscriptions')
          .upsert({
            organization_id: profile.organization_id,
            stripe_subscription_id: subscriptionId,
            stripe_customer_id: customerId,
            plan_type: planId || 'pro',
            status: 'active',
            current_period_end: new Date(session.expires_at * 1000).toISOString(),
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'organization_id'
          })

        if (subError) {
          console.error('Error upserting subscription:', subError)
        } else {
          console.log('Subscription created/updated for user:', userId)
        }

        break
      }

      case 'customer.subscription.updated': {
        const subscription = stripeEvent.data.object as Stripe.Subscription
        const subscriptionId = subscription.id
        const status = subscription.status

        // Map Stripe status to our status
        const mappedStatus = status === 'active' || status === 'trialing' ? 'active' :
                            status === 'past_due' ? 'past_due' :
                            'canceled'

        const { error: updateError } = await client
          .from('subscriptions')
          .update({
            status: mappedStatus,
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('stripe_subscription_id', subscriptionId)

        if (updateError) {
          console.error('Error updating subscription:', updateError)
        } else {
          console.log('Subscription updated:', subscriptionId)
        }

        break
      }

      case 'customer.subscription.deleted': {
        const subscription = stripeEvent.data.object as Stripe.Subscription
        const subscriptionId = subscription.id

        // Downgrade to free plan
        const { error: deleteError } = await client
          .from('subscriptions')
          .update({
            plan_type: 'free',
            status: 'canceled',
            stripe_subscription_id: null,
            stripe_customer_id: null,
            updated_at: new Date().toISOString()
          })
          .eq('stripe_subscription_id', subscriptionId)

        if (deleteError) {
          console.error('Error canceling subscription:', deleteError)
        } else {
          console.log('Subscription canceled:', subscriptionId)
        }

        break
      }

      default:
        console.log('Unhandled event type:', stripeEvent.type)
    }

    return { received: true }
  } catch (error: any) {
    console.error('Webhook error:', error)

    throw createError({
      statusCode: 500,
      message: error.message || 'Webhook processing failed'
    })
  }
})
