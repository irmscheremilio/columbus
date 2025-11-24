import { createBillingPortalSession } from '~/server/utils/stripe'

export default defineEventHandler(async (event) => {
  try {
    // Get user from session
    const client = await serverSupabaseClient(event)
    const user = await serverSupabaseUser(event)

    if (!user) {
      throw createError({
        statusCode: 401,
        message: 'Unauthorized'
      })
    }

    // Get user's organization
    const { data: profile } = await client
      .from('profiles')
      .select('organization_id')
      .eq('id', user.id)
      .single()

    if (!profile) {
      throw createError({
        statusCode: 404,
        message: 'Profile not found'
      })
    }

    // Get subscription with Stripe customer ID
    const { data: subscription } = await client
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('organization_id', profile.organization_id)
      .single()

    if (!subscription?.stripe_customer_id) {
      throw createError({
        statusCode: 400,
        message: 'No active subscription found'
      })
    }

    // Get base URL for return
    const headers = getHeaders(event)
    const host = headers.host || 'localhost:3000'
    const protocol = host.includes('localhost') ? 'http' : 'https'
    const returnUrl = `${protocol}://${host}/dashboard/settings`

    // Create billing portal session
    const session = await createBillingPortalSession({
      customerId: subscription.stripe_customer_id,
      returnUrl
    })

    return {
      url: session.url
    }
  } catch (error: any) {
    console.error('Error creating billing portal session:', error)

    throw createError({
      statusCode: 500,
      message: error.message || 'Failed to create billing portal session'
    })
  }
})
