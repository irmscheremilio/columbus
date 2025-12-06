import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
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
    const { email, companyName, website, intent } = await req.json()

    // Validate intent - ensure it's one of the allowed values
    const validIntents = ['free', 'pro', 'scaling']
    const finalIntent = validIntents.includes(intent) ? intent : 'free'

    // Validate input
    if (!email) {
      return new Response(
        JSON.stringify({ error: 'Email is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Insert into waitlist
    const { error: insertError } = await supabaseClient
      .from('waitlist')
      .insert([{
        email,
        company_name: companyName,
        website,
        intent: finalIntent,
      }])

    if (insertError) {
      throw insertError
    }

    // TODO: Send welcome email via Resend
    // You can add Resend API call here if needed
    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    if (resendApiKey) {
      try {
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'Columbus <noreply@columbus-aeo.com>',
            to: [email],
            subject: 'Welcome to Columbus - Your Free AEO Audit',
            html: `
              <h1>Welcome to Columbus!</h1>
              <p>Hi there,</p>
              <p>Thank you for joining our waitlist for <strong>${companyName}</strong>!</p>
              <p>We'll send you your free AI Engine Optimization audit within 24 hours.</p>
              <p>In the meantime, you can learn more about AEO at our website.</p>
              <p>Best regards,<br>The Columbus Team</p>
            `,
          }),
        })
      } catch (emailError) {
        console.error('Failed to send email:', emailError)
        // Don't fail the request if email fails
      }
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
