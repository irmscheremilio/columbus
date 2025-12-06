import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import Stripe from 'https://esm.sh/stripe@14.10.0?target=deno'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create Supabase client with user's auth
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )

    // Get authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get request body
    const { planId, billingPeriod = 'monthly', successUrl, cancelUrl } = await req.json()

    if (!planId || planId === 'free') {
      return new Response(
        JSON.stringify({ error: 'Invalid plan ID' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!['monthly', 'yearly'].includes(billingPeriod)) {
      return new Response(
        JSON.stringify({ error: 'Invalid billing period. Must be monthly or yearly' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Fetch plan from database using service role client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    console.log('Looking up plan:', planId)

    const { data: plan, error: planError } = await supabaseAdmin
      .from('subscription_tiers')
      .select('*')
      .eq('id', planId)
      .single()

    if (planError) {
      console.error('Plan lookup error:', planError)
    }

    if (planError || !plan) {
      // Try to list available plans for debugging
      const { data: allPlans } = await supabaseAdmin
        .from('subscription_tiers')
        .select('id, name')

      console.log('Available plans:', allPlans)

      return new Response(
        JSON.stringify({
          error: 'Plan not found',
          requestedPlan: planId,
          availablePlans: allPlans?.map(p => p.id) || []
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const priceId = billingPeriod === 'yearly' ? plan.stripe_yearly_price_id : plan.stripe_monthly_price_id
    if (!priceId) {
      return new Response(
        JSON.stringify({ error: `Price ID not configured for ${plan.name} ${billingPeriod} plan` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get user's organization
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('organization_id, active_organization_id')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return new Response(
        JSON.stringify({ error: 'Profile not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const organizationId = profile.active_organization_id || profile.organization_id

    // Initialize Stripe
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY')
    if (!stripeSecretKey) {
      throw new Error('Missing Stripe configuration')
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2023-10-16',
      httpClient: Stripe.createFetchHttpClient(),
    })

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1
        }
      ],
      mode: 'subscription',
      success_url: successUrl || `${req.headers.get('origin')}/dashboard?checkout=success`,
      cancel_url: cancelUrl || `${req.headers.get('origin')}/pricing?checkout=canceled`,
      customer_email: user.email,
      client_reference_id: user.id,
      metadata: {
        userId: user.id,
        organizationId: organizationId,
        plan: planId,
        billingPeriod: billingPeriod
      },
      subscription_data: {
        metadata: {
          userId: user.id,
          organizationId: organizationId,
          plan: planId,
          billingPeriod: billingPeriod
        }
      }
    })

    return new Response(
      JSON.stringify({ url: session.url }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Checkout error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
