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

    // Get user's role in organization
    const { data: membership } = await supabaseAdmin
      .from('organization_members')
      .select('role')
      .eq('organization_id', organizationId)
      .eq('user_id', user.id)
      .single()

    // Fall back to checking if user is the organization creator (owner)
    const { data: org } = await supabaseAdmin
      .from('organizations')
      .select('created_by')
      .eq('id', organizationId)
      .single()

    const isOrgCreator = org?.created_by === user.id
    // Check multiple sources for owner status: org creator, membership role, or profile role
    const isOwnerByProfile = profile.role === 'owner'
    const userRole = membership?.role || (isOrgCreator ? 'owner' : (isOwnerByProfile ? 'owner' : profile.role))
    const isAdmin = ['owner', 'admin'].includes(userRole)

    const method = req.method

    // GET: List members
    if (method === 'GET') {
      const { data: members, error } = await supabaseAdmin
        .from('organization_members')
        .select(`
          id,
          role,
          joined_at,
          user_id,
          profiles!inner (
            id,
            email
          )
        `)
        .eq('organization_id', organizationId)
        .order('joined_at', { ascending: true })

      if (error) throw error

      // Transform data to cleaner format
      let memberList = members?.map(m => ({
        id: m.id,
        userId: m.user_id,
        email: m.profiles?.email,
        role: m.role,
        joinedAt: m.joined_at,
        isCurrentUser: m.user_id === user.id
      })) || []

      // If current user is owner but not in organization_members, add them
      const userInList = memberList.some(m => m.userId === user.id)
      const isOwner = isOrgCreator || isOwnerByProfile
      if (!userInList && isOwner) {
        // Get user's profile for email
        const { data: userProfile } = await supabaseAdmin
          .from('profiles')
          .select('email, created_at')
          .eq('id', user.id)
          .single()

        memberList = [{
          id: `owner-${user.id}`,
          userId: user.id,
          email: userProfile?.email || user.email,
          role: 'owner',
          joinedAt: userProfile?.created_at || new Date().toISOString(),
          isCurrentUser: true
        }, ...memberList]
      }

      return new Response(
        JSON.stringify({ members: memberList, currentUserRole: userRole }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // PATCH: Update member role
    if (method === 'PATCH') {
      if (!isAdmin) {
        return new Response(
          JSON.stringify({ error: 'Only owners and admins can update members' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const { memberId, role } = await req.json()

      if (!memberId || !role) {
        return new Response(
          JSON.stringify({ error: 'Member ID and role are required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      if (!['admin', 'member'].includes(role)) {
        return new Response(
          JSON.stringify({ error: 'Invalid role. Must be admin or member' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Get target member
      const { data: targetMember } = await supabaseAdmin
        .from('organization_members')
        .select('user_id, role')
        .eq('id', memberId)
        .eq('organization_id', organizationId)
        .single()

      if (!targetMember) {
        return new Response(
          JSON.stringify({ error: 'Member not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Cannot change owner's role
      if (targetMember.role === 'owner') {
        return new Response(
          JSON.stringify({ error: 'Cannot change the owner\'s role' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Only owners can promote to admin
      if (role === 'admin' && userRole !== 'owner') {
        return new Response(
          JSON.stringify({ error: 'Only the owner can promote members to admin' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Update role
      const { error: updateError } = await supabaseAdmin
        .from('organization_members')
        .update({ role })
        .eq('id', memberId)

      if (updateError) throw updateError

      // Also update profiles table for consistency
      await supabaseAdmin
        .from('profiles')
        .update({ role })
        .eq('id', targetMember.user_id)
        .eq('organization_id', organizationId)

      return new Response(
        JSON.stringify({ success: true }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // DELETE: Remove member
    if (method === 'DELETE') {
      const url = new URL(req.url)
      const memberId = url.searchParams.get('id')

      if (!memberId) {
        return new Response(
          JSON.stringify({ error: 'Member ID is required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Get target member
      const { data: targetMember } = await supabaseAdmin
        .from('organization_members')
        .select('user_id, role')
        .eq('id', memberId)
        .eq('organization_id', organizationId)
        .single()

      if (!targetMember) {
        return new Response(
          JSON.stringify({ error: 'Member not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Cannot remove the owner
      if (targetMember.role === 'owner') {
        return new Response(
          JSON.stringify({ error: 'Cannot remove the organization owner' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Users can remove themselves, admins can remove others
      const isSelf = targetMember.user_id === user.id
      if (!isSelf && !isAdmin) {
        return new Response(
          JSON.stringify({ error: 'Only owners and admins can remove other members' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Remove from organization_members
      const { error: deleteError } = await supabaseAdmin
        .from('organization_members')
        .delete()
        .eq('id', memberId)

      if (deleteError) throw deleteError

      // Clear organization from profile if leaving
      if (isSelf) {
        await supabaseAdmin
          .from('profiles')
          .update({
            organization_id: null,
            active_organization_id: null,
            role: 'member'
          })
          .eq('id', targetMember.user_id)
      }

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
    console.error('Team members error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
