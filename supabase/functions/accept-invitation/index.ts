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
    const { token } = await req.json()

    if (!token) {
      return new Response(
        JSON.stringify({ error: 'Token is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create admin client for service operations
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get invitation by token
    const { data: invitation, error: inviteError } = await supabaseAdmin
      .from('organization_invitations')
      .select(`
        id,
        organization_id,
        email,
        role,
        status,
        expires_at,
        organizations (
          id,
          name
        )
      `)
      .eq('token', token)
      .single()

    if (inviteError || !invitation) {
      return new Response(
        JSON.stringify({ error: 'Invalid invitation token' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if invitation is still valid
    if (invitation.status !== 'pending') {
      return new Response(
        JSON.stringify({ error: `This invitation has been ${invitation.status}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (new Date(invitation.expires_at) < new Date()) {
      // Update status to expired
      await supabaseAdmin
        .from('organization_invitations')
        .update({ status: 'expired' })
        .eq('id', invitation.id)

      return new Response(
        JSON.stringify({ error: 'This invitation has expired' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // If just getting invitation details (GET-like behavior with POST)
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      // No auth - just return invitation details for display
      return new Response(
        JSON.stringify({
          invitation: {
            email: invitation.email,
            role: invitation.role,
            organizationName: invitation.organizations?.name,
            expiresAt: invitation.expires_at
          }
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // User is authenticated - process acceptance
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )

    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verify user's email matches invitation
    if (user.email?.toLowerCase() !== invitation.email.toLowerCase()) {
      return new Response(
        JSON.stringify({ error: 'This invitation was sent to a different email address' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if user is already a member
    const { data: existingMember } = await supabaseAdmin
      .from('organization_members')
      .select('id')
      .eq('organization_id', invitation.organization_id)
      .eq('user_id', user.id)
      .single()

    if (existingMember) {
      return new Response(
        JSON.stringify({ error: 'You are already a member of this organization' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Add user to organization_members
    const { error: memberError } = await supabaseAdmin
      .from('organization_members')
      .insert({
        organization_id: invitation.organization_id,
        user_id: user.id,
        role: invitation.role
      })

    if (memberError) throw memberError

    // Update user's profile with the new organization
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({
        organization_id: invitation.organization_id,
        active_organization_id: invitation.organization_id,
        role: invitation.role
      })
      .eq('id', user.id)

    if (profileError) throw profileError

    // Mark invitation as accepted
    const { error: updateError } = await supabaseAdmin
      .from('organization_invitations')
      .update({
        status: 'accepted',
        accepted_at: new Date().toISOString()
      })
      .eq('id', invitation.id)

    if (updateError) throw updateError

    // Dismiss any notification the user had for this invite
    await supabaseAdmin
      .from('notifications')
      .update({
        read_at: new Date().toISOString(),
        dismissed_at: new Date().toISOString()
      })
      .eq('user_id', user.id)
      .eq('type', 'team_invite')
      .contains('metadata', { invitation_id: invitation.id })

    // Notify existing org members that someone joined
    const { data: orgMembers } = await supabaseAdmin
      .from('organization_members')
      .select('user_id')
      .eq('organization_id', invitation.organization_id)
      .neq('user_id', user.id)

    if (orgMembers && orgMembers.length > 0) {
      const memberNotifications = orgMembers.map(m => ({
        user_id: m.user_id,
        type: 'member_joined',
        title: 'New team member',
        message: `${user.email} joined ${invitation.organizations?.name || 'the team'}`,
        metadata: {
          organization_id: invitation.organization_id,
          organization_name: invitation.organizations?.name,
          new_member_email: user.email,
          new_member_id: user.id
        }
      }))

      await supabaseAdmin
        .from('notifications')
        .insert(memberNotifications)
    }

    return new Response(
      JSON.stringify({
        success: true,
        organizationId: invitation.organization_id,
        organizationName: invitation.organizations?.name
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Accept invitation error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
