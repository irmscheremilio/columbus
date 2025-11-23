import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import Stripe from 'https://esm.sh/stripe@14.10.0?target=deno'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const signature = req.headers.get('stripe-signature')
    if (!signature) {
      return new Response(
        JSON.stringify({ error: 'Missing stripe-signature header' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY')
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')

    if (!stripeSecretKey || !webhookSecret) {
      throw new Error('Missing Stripe configuration')
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2023-10-16',
      httpClient: Stripe.createFetchHttpClient(),
    })

    // Get raw body for signature verification
    const body = await req.text()

    // Verify webhook signature
    let event: Stripe.Event
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    } catch (err) {
      console.error('Webhook signature verification failed:', err.message)
      return new Response(
        JSON.stringify({ error: 'Webhook signature verification failed' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create Supabase admin client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session

        // Get organization_id from metadata
        const organizationId = session.metadata?.organization_id

        if (!organizationId) {
          console.error('Missing organization_id in session metadata')
          break
        }

        // Update organization with subscription info
        const { error: updateError } = await supabase
          .from('organizations')
          .update({
            plan: session.metadata?.plan || 'pro',
            stripe_customer_id: session.customer as string,
            stripe_subscription_id: session.subscription as string,
          })
          .eq('id', organizationId)

        if (updateError) {
          console.error('Failed to update organization:', updateError)
        }

        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription

        // Find organization by stripe_subscription_id
        const { data: org, error: orgError } = await supabase
          .from('organizations')
          .select('id')
          .eq('stripe_subscription_id', subscription.id)
          .single()

        if (orgError || !org) {
          console.error('Organization not found for subscription:', subscription.id)
          break
        }

        // Update subscription status
        const { error: updateError } = await supabase
          .from('organizations')
          .update({
            subscription_status: subscription.status,
          })
          .eq('id', org.id)

        if (updateError) {
          console.error('Failed to update subscription status:', updateError)
        }

        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription

        // Find organization by stripe_subscription_id
        const { data: org, error: orgError } = await supabase
          .from('organizations')
          .select('id')
          .eq('stripe_subscription_id', subscription.id)
          .single()

        if (orgError || !org) {
          console.error('Organization not found for subscription:', subscription.id)
          break
        }

        // Downgrade to free plan
        const { error: updateError } = await supabase
          .from('organizations')
          .update({
            plan: 'free',
            subscription_status: 'canceled',
          })
          .eq('id', org.id)

        if (updateError) {
          console.error('Failed to downgrade organization:', updateError)
        }

        break
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice
        console.log('Payment succeeded for invoice:', invoice.id)
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        console.log('Payment failed for invoice:', invoice.id)

        // Find organization by stripe_customer_id
        const { data: org, error: orgError } = await supabase
          .from('organizations')
          .select('id')
          .eq('stripe_customer_id', invoice.customer as string)
          .single()

        if (orgError || !org) {
          console.error('Organization not found for customer:', invoice.customer)
          break
        }

        // Update subscription status to past_due
        const { error: updateError } = await supabase
          .from('organizations')
          .update({
            subscription_status: 'past_due',
          })
          .eq('id', org.id)

        if (updateError) {
          console.error('Failed to update payment status:', updateError)
        }

        break
      }

      default:
        console.log('Unhandled event type:', event.type)
    }

    return new Response(
      JSON.stringify({ received: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Webhook error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
