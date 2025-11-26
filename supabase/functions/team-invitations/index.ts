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

    // Create admin client for service operations
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get user's profile with organization
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('organization_id, active_organization_id, role')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return new Response(
        JSON.stringify({ error: 'Profile not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const organizationId = profile.active_organization_id || profile.organization_id

    // Check user has permission (must be owner or admin)
    // First check organization_members table
    const { data: membership } = await supabaseAdmin
      .from('organization_members')
      .select('role')
      .eq('organization_id', organizationId)
      .eq('user_id', user.id)
      .single()

    // Fall back to profile.role (for users who existed before organization_members was added)
    // Also check if user is the organization creator (owner)
    const { data: org } = await supabaseAdmin
      .from('organizations')
      .select('created_by')
      .eq('id', organizationId)
      .single()

    const isOrgCreator = org?.created_by === user.id
    // Check multiple sources for owner status: org creator, membership role, or profile role
    const isOwnerByProfile = profile.role === 'owner'
    const userRole = membership?.role || (isOrgCreator ? 'owner' : (isOwnerByProfile ? 'owner' : profile.role))

    if (!['owner', 'admin'].includes(userRole)) {
      return new Response(
        JSON.stringify({ error: 'Only owners and admins can manage invitations' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Route based on method
    const method = req.method

    // GET: List invitations
    if (method === 'GET') {
      const { data: invitations, error } = await supabase
        .from('organization_invitations')
        .select(`
          id,
          email,
          role,
          status,
          expires_at,
          created_at,
          invited_by (
            email
          )
        `)
        .eq('organization_id', organizationId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })

      if (error) throw error

      return new Response(
        JSON.stringify({ invitations }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // POST: Create invitation
    if (method === 'POST') {
      const { email, role } = await req.json()

      if (!email || !role) {
        return new Response(
          JSON.stringify({ error: 'Email and role are required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      if (!['admin', 'member'].includes(role)) {
        return new Response(
          JSON.stringify({ error: 'Invalid role. Must be admin or member' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Check if user is already a member
      const { data: existingMember } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('email', email)
        .eq('organization_id', organizationId)
        .single()

      if (existingMember) {
        return new Response(
          JSON.stringify({ error: 'User is already a member of this organization' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Check for existing pending invitation
      const { data: existingInvite } = await supabaseAdmin
        .from('organization_invitations')
        .select('id')
        .eq('organization_id', organizationId)
        .eq('email', email)
        .eq('status', 'pending')
        .single()

      if (existingInvite) {
        return new Response(
          JSON.stringify({ error: 'An invitation has already been sent to this email' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Get organization name for email
      const { data: org } = await supabase
        .from('organizations')
        .select('name')
        .eq('id', organizationId)
        .single()

      // Create invitation
      const { data: invitation, error: insertError } = await supabaseAdmin
        .from('organization_invitations')
        .insert({
          organization_id: organizationId,
          email,
          role,
          invited_by: user.id
        })
        .select('id, token')
        .single()

      if (insertError) throw insertError

      // Send invitation email
      const resendApiKey = Deno.env.get('RESEND_API_KEY')
      const appUrl = Deno.env.get('APP_URL') || 'https://columbus-aeo.com'

      if (resendApiKey) {
        try {
          const inviteUrl = `${appUrl}/invite/${invitation.token}`
          await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${resendApiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              from: 'Columbus <noreply@columbus-aeo.com>',
              to: [email],
              subject: `You've been invited to join ${org?.name || 'an organization'} on Columbus`,
              html: `
                <h1>You've been invited!</h1>
                <p>Hi there,</p>
                <p><strong>${user.email}</strong> has invited you to join <strong>${org?.name || 'their organization'}</strong> on Columbus as a ${role}.</p>
                <p>Click the link below to accept the invitation:</p>
                <p><a href="${inviteUrl}" style="display: inline-block; padding: 12px 24px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 6px;">Accept Invitation</a></p>
                <p>This invitation will expire in 7 days.</p>
                <p>If you don't have a Columbus account yet, you'll be asked to create one.</p>
                <p>Best regards,<br>The Columbus Team</p>
              `,
            }),
          })
        } catch (emailError) {
          console.error('Failed to send invitation email:', emailError)
        }
      }

      return new Response(
        JSON.stringify({ success: true, invitationId: invitation.id }),
        { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // DELETE: Revoke invitation
    if (method === 'DELETE') {
      const url = new URL(req.url)
      const invitationId = url.searchParams.get('id')

      if (!invitationId) {
        return new Response(
          JSON.stringify({ error: 'Invitation ID is required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const { error: updateError } = await supabaseAdmin
        .from('organization_invitations')
        .update({ status: 'revoked' })
        .eq('id', invitationId)
        .eq('organization_id', organizationId)

      if (updateError) throw updateError

      return new Response(
        JSON.stringify({ success: true }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Invitation error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
