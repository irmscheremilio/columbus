import { createCheckoutSession, type PlanId } from '~/server/utils/stripe'

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

    // Get request body
    const body = await readBody(event)
    const { planId } = body as { planId: PlanId }

    if (!planId || planId === 'FREE') {
      throw createError({
        statusCode: 400,
        message: 'Invalid plan ID'
      })
    }

    // Get base URL for redirect
    const headers = getHeaders(event)
    const host = headers.host || 'localhost:3000'
    const protocol = host.includes('localhost') ? 'http' : 'https'
    const baseUrl = `${protocol}://${host}`

    // Create checkout session
    const session = await createCheckoutSession({
      userId: user.id,
      userEmail: user.email!,
      planId,
      successUrl: `${baseUrl}/dashboard?checkout=success`,
      cancelUrl: `${baseUrl}/pricing?checkout=canceled`
    })

    return {
      url: session.url
    }
  } catch (error: any) {
    console.error('Error creating checkout session:', error)

    throw createError({
      statusCode: 500,
      message: error.message || 'Failed to create checkout session'
    })
  }
})
