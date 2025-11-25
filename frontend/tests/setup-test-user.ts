/**
 * Script to create a test user for API tests
 * Run with: npx ts-node tests/setup-test-user.ts
 */
import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load env files
config()
config({ path: resolve(__dirname, '.env') })

async function setupTestUser() {
  const supabaseUrl = process.env.SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
    process.exit(1)
  }

  const testEmail = process.env.TEST_USER_EMAIL
  const testPassword = process.env.TEST_USER_PASSWORD

  if (!testEmail || !testPassword) {
    console.error('Missing TEST_USER_EMAIL or TEST_USER_PASSWORD')
    process.exit(1)
  }

  console.log(`Setting up test user: ${testEmail}`)
  console.log(`Password length: ${testPassword.length}`)

  // Use service role to create user (bypasses email confirmation)
  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })

  // Check if user already exists
  const { data: existingUsers } = await supabase.auth.admin.listUsers()
  const existingUser = existingUsers?.users?.find(u => u.email === testEmail)

  if (existingUser) {
    console.log('User already exists, updating password...')
    const { error } = await supabase.auth.admin.updateUserById(existingUser.id, {
      password: testPassword,
      email_confirm: true
    })
    if (error) {
      console.error('Failed to update user:', error)
      process.exit(1)
    }
    console.log('Password updated successfully')
  } else {
    console.log('Creating new user...')
    const { data, error } = await supabase.auth.admin.createUser({
      email: testEmail,
      password: testPassword,
      email_confirm: true // Skip email confirmation
    })

    if (error) {
      console.error('Failed to create user:', error)
      process.exit(1)
    }

    console.log('User created:', data.user?.id)
  }

  // Verify login works
  const anonSupabase = createClient(supabaseUrl, process.env.SUPABASE_KEY || process.env.SUPABASE_ANON_KEY!)

  const { data: loginData, error: loginError } = await anonSupabase.auth.signInWithPassword({
    email: testEmail,
    password: testPassword
  })

  if (loginError) {
    console.error('Login verification failed:', loginError)
    process.exit(1)
  }

  console.log('Login verified successfully!')
  console.log('User ID:', loginData.user?.id)

  // Check if profile and organization exist
  const { data: profile } = await anonSupabase
    .from('profiles')
    .select('*, organizations(*)')
    .eq('id', loginData.user!.id)
    .single()

  if (profile) {
    console.log('Profile exists:', profile.email)
    if (profile.organization_id) {
      console.log('Organization ID:', profile.organization_id)
    } else {
      console.log('No organization linked - creating one...')

      // Create organization
      const { data: org, error: orgError } = await anonSupabase
        .from('organizations')
        .insert({
          name: 'Test Organization',
          domain: 'test-example.com',
        })
        .select()
        .single()

      if (orgError) {
        console.error('Failed to create organization:', orgError)
      } else {
        console.log('Organization created:', org.id)

        // Link profile to organization
        const { error: updateError } = await anonSupabase
          .from('profiles')
          .update({ organization_id: org.id })
          .eq('id', loginData.user!.id)

        if (updateError) {
          console.error('Failed to link profile:', updateError)
        } else {
          console.log('Profile linked to organization')

          // Create a brand
          const { error: brandError } = await anonSupabase
            .from('brands')
            .insert({
              organization_id: org.id,
              name: 'Test Brand',
              website: 'https://test-example.com',
              is_active: true,
            })

          if (brandError) {
            console.error('Failed to create brand:', brandError)
          } else {
            console.log('Brand created')
          }
        }
      }
    }
  }

  console.log('\nTest user setup complete!')
}

setupTestUser().catch(console.error)
