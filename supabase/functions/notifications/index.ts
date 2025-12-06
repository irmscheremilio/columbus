import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

/**
 * Notifications Edge Function
 *
 * GET - List user's notifications with unread count
 * PATCH - Mark notification as read or dismissed
 * DELETE - Delete a notification
 * POST /accept-invite - Accept a team invite from notification
 * POST /decline-invite - Decline a team invite from notification
 */
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

    const url = new URL(req.url)
    const pathname = url.pathname.replace('/notifications', '')
    const method = req.method

    // POST /accept-invite - Accept a team invite
    if (method === 'POST' && pathname.includes('/accept-invite')) {
      const { notificationId } = await req.json()

      if (!notificationId) {
        return new Response(
          JSON.stringify({ error: 'Notification ID is required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Get the notification
      const { data: notification, error: notifError } = await supabaseAdmin
        .from('notifications')
        .select('*')
        .eq('id', notificationId)
        .eq('user_id', user.id)
        .eq('type', 'team_invite')
        .single()

      if (notifError || !notification) {
        return new Response(
          JSON.stringify({ error: 'Invitation notification not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const { invitation_id, organization_id, organization_name, role } = notification.metadata

      // Verify invitation is still valid
      const { data: invitation, error: inviteError } = await supabaseAdmin
        .from('organization_invitations')
        .select('*')
        .eq('id', invitation_id)
        .single()

      if (inviteError || !invitation) {
        // Mark notification as dismissed since invite no longer exists
        await supabaseAdmin
          .from('notifications')
          .update({ dismissed_at: new Date().toISOString() })
          .eq('id', notificationId)

        return new Response(
          JSON.stringify({ error: 'Invitation no longer exists' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      if (invitation.status !== 'pending') {
        return new Response(
          JSON.stringify({ error: `Invitation is ${invitation.status}` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      if (invitation.expires_at && new Date(invitation.expires_at) < new Date()) {
        await supabaseAdmin
          .from('organization_invitations')
          .update({ status: 'expired' })
          .eq('id', invitation_id)

        return new Response(
          JSON.stringify({ error: 'Invitation has expired' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Check if user is already a member
      const { data: existingMember } = await supabaseAdmin
        .from('organization_members')
        .select('id')
        .eq('organization_id', organization_id)
        .eq('user_id', user.id)
        .single()

      if (existingMember) {
        return new Response(
          JSON.stringify({ error: 'You are already a member of this organization' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Add user to organization
      const { error: memberError } = await supabaseAdmin
        .from('organization_members')
        .insert({
          organization_id: organization_id,
          user_id: user.id,
          role: role || 'member'
        })

      if (memberError) {
        console.error('Error adding member:', memberError)
        return new Response(
          JSON.stringify({ error: 'Failed to join organization' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Update user's active organization
      await supabaseAdmin
        .from('profiles')
        .update({ active_organization_id: organization_id })
        .eq('id', user.id)

      // Mark invitation as accepted
      await supabaseAdmin
        .from('organization_invitations')
        .update({
          status: 'accepted',
          accepted_at: new Date().toISOString()
        })
        .eq('id', invitation_id)

      // Mark notification as read and dismissed
      await supabaseAdmin
        .from('notifications')
        .update({
          read_at: new Date().toISOString(),
          dismissed_at: new Date().toISOString()
        })
        .eq('id', notificationId)

      // Get user email for notification to org members
      const { data: userProfile } = await supabaseAdmin
        .from('profiles')
        .select('email')
        .eq('id', user.id)
        .single()

      // Notify existing org members that someone joined
      const { data: orgMembers } = await supabaseAdmin
        .from('organization_members')
        .select('user_id')
        .eq('organization_id', organization_id)
        .neq('user_id', user.id)

      if (orgMembers && orgMembers.length > 0) {
        const memberNotifications = orgMembers.map(m => ({
          user_id: m.user_id,
          type: 'member_joined',
          title: 'New team member',
          message: `${userProfile?.email || 'Someone'} joined ${organization_name}`,
          metadata: {
            organization_id,
            organization_name,
            new_member_email: userProfile?.email,
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
          organization: { id: organization_id, name: organization_name }
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // POST /decline-invite - Decline a team invite
    if (method === 'POST' && pathname.includes('/decline-invite')) {
      const { notificationId } = await req.json()

      if (!notificationId) {
        return new Response(
          JSON.stringify({ error: 'Notification ID is required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Get the notification
      const { data: notification, error: notifError } = await supabaseAdmin
        .from('notifications')
        .select('*')
        .eq('id', notificationId)
        .eq('user_id', user.id)
        .eq('type', 'team_invite')
        .single()

      if (notifError || !notification) {
        return new Response(
          JSON.stringify({ error: 'Invitation notification not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const { invitation_id } = notification.metadata

      // Mark invitation as revoked/declined
      if (invitation_id) {
        await supabaseAdmin
          .from('organization_invitations')
          .update({ status: 'revoked' })
          .eq('id', invitation_id)
      }

      // Mark notification as dismissed
      await supabaseAdmin
        .from('notifications')
        .update({
          read_at: new Date().toISOString(),
          dismissed_at: new Date().toISOString()
        })
        .eq('id', notificationId)

      return new Response(
        JSON.stringify({ success: true }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // GET - List notifications
    if (method === 'GET') {
      const limit = parseInt(url.searchParams.get('limit') || '20')
      const includeRead = url.searchParams.get('includeRead') === 'true'

      let query = supabaseAdmin
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .is('dismissed_at', null)
        .order('created_at', { ascending: false })
        .limit(limit)

      // Filter expired notifications
      query = query.or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)

      if (!includeRead) {
        query = query.is('read_at', null)
      }

      const { data: notifications, error } = await query

      if (error) throw error

      // Get unread count
      const { data: unreadCount } = await supabaseAdmin
        .rpc('get_unread_notification_count')

      return new Response(
        JSON.stringify({
          notifications: notifications || [],
          unreadCount: unreadCount || 0
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // PATCH - Mark as read or dismissed
    if (method === 'PATCH') {
      const { id, action, ids } = await req.json()

      // Mark all as read
      if (action === 'mark_all_read' || ids) {
        let query = supabaseAdmin
          .from('notifications')
          .update({ read_at: new Date().toISOString() })
          .eq('user_id', user.id)
          .is('read_at', null)

        if (ids && Array.isArray(ids)) {
          query = query.in('id', ids)
        }

        const { error } = await query

        if (error) throw error

        return new Response(
          JSON.stringify({ success: true }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Single notification update
      if (!id) {
        return new Response(
          JSON.stringify({ error: 'Notification ID is required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const updates: Record<string, string> = {}
      if (action === 'read') {
        updates.read_at = new Date().toISOString()
      } else if (action === 'dismiss') {
        updates.dismissed_at = new Date().toISOString()
      } else {
        return new Response(
          JSON.stringify({ error: 'Invalid action. Use "read" or "dismiss"' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const { error: updateError } = await supabaseAdmin
        .from('notifications')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id)

      if (updateError) throw updateError

      return new Response(
        JSON.stringify({ success: true }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // DELETE - Delete notification
    if (method === 'DELETE') {
      const id = url.searchParams.get('id')

      if (!id) {
        return new Response(
          JSON.stringify({ error: 'Notification ID is required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const { error: deleteError } = await supabaseAdmin
        .from('notifications')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)

      if (deleteError) throw deleteError

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
    console.error('Notifications error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
