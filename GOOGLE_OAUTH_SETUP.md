# Google OAuth Setup Guide

## Step 1: Create Google OAuth Credentials

### 1.1 Go to Google Cloud Console
Visit: https://console.cloud.google.com/

### 1.2 Create a New Project (or select existing)
1. Click on the project dropdown at the top
2. Click "New Project"
3. Name: `Columbus AEO`
4. Click "Create"

### 1.3 Enable Google+ API
1. Go to "APIs & Services" > "Library"
2. Search for "Google+ API"
3. Click "Enable"

### 1.4 Configure OAuth Consent Screen
1. Go to "APIs & Services" > "OAuth consent screen"
2. Choose "External" (for public access)
3. Fill in required fields:
   - **App name:** Columbus - AI Engine Optimization
   - **User support email:** Your email
   - **Developer contact:** Your email
4. Add scopes:
   - `userinfo.email`
   - `userinfo.profile`
5. Click "Save and Continue"
6. Add test users (optional for development)
7. Click "Save and Continue"

### 1.5 Create OAuth Credentials
1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth client ID"
3. Choose "Web application"
4. Name: `Columbus Web Client`
5. Add Authorized JavaScript origins:
   ```
   http://localhost:3000
   http://localhost:3003
   https://your-domain.com
   ```
6. Add Authorized redirect URIs:
   ```
   https://[your-supabase-project-ref].supabase.co/auth/v1/callback
   http://localhost:3000/auth/callback
   http://localhost:3003/auth/callback
   ```
7. Click "Create"
8. **Copy the Client ID and Client Secret** - you'll need these!

---

## Step 2: Configure Supabase

### 2.1 Go to Supabase Dashboard
Visit: https://app.supabase.com/project/[your-project-ref]/auth/providers

### 2.2 Enable Google Provider
1. Navigate to **Authentication** > **Providers**
2. Find **Google** in the list
3. Toggle it **ON**
4. Paste your **Client ID** from Google Console
5. Paste your **Client Secret** from Google Console
6. Click **Save**

### 2.3 Copy Your Redirect URL
Supabase will show you the callback URL:
```
https://[your-project-ref].supabase.co/auth/v1/callback
```

Make sure this matches what you entered in Google Console!

---

## Step 3: Update Your Frontend .env

Add to `frontend/.env`:

```env
# No additional env vars needed!
# Google OAuth works automatically through Supabase
```

---

## Step 4: Test Google OAuth

### Local Testing
1. Start your dev server: `npm run dev`
2. Go to http://localhost:3000/auth/login
3. Click "Continue with Google"
4. Sign in with your Google account
5. You should be redirected to `/dashboard`

### Production Testing
1. Deploy your frontend to Vercel/Netlify
2. Add your production domain to Google Console authorized origins
3. Add your production callback URL to Google Console redirect URIs
4. Test the OAuth flow in production

---

## Troubleshooting

### Error: "redirect_uri_mismatch"
**Solution:** Make sure the redirect URI in Google Console exactly matches Supabase's callback URL

### Error: "Access blocked: This app's request is invalid"
**Solution:**
1. Make sure you've added the correct scopes in OAuth consent screen
2. Enable Google+ API in Google Cloud Console

### Error: "User not found" after OAuth
**Solution:** Check that your `setup-user` edge function is handling OAuth users correctly

### Users Stuck on OAuth Consent Screen
**Solution:** If app is in "Testing" mode, you need to add users as test users in Google Console

---

## Security Best Practices

1. **Never commit credentials** - Keep Client Secret secure
2. **Use environment variables** - Store in Supabase dashboard, not in code
3. **Validate redirect URIs** - Only allow trusted domains
4. **Enable HTTPS in production** - Required for OAuth
5. **Rotate secrets regularly** - Update Client Secret periodically

---

## What Happens During OAuth Flow

```
1. User clicks "Continue with Google"
   ↓
2. Supabase redirects to Google OAuth consent screen
   ↓
3. User grants permissions
   ↓
4. Google redirects back to Supabase callback URL
   ↓
5. Supabase creates/updates user in auth.users
   ↓
6. Supabase redirects to /auth/callback
   ↓
7. Frontend checks if user needs setup (first login)
   ↓
8. If first login: redirect to onboarding/setup
   ↓
9. If existing user: redirect to /dashboard
```

---

## Customizing OAuth Flow

You can customize the OAuth experience by:

1. **Adding more scopes** (e.g., Google Calendar)
2. **Customizing the consent screen** branding
3. **Pre-filling organization data** from Google Workspace
4. **Auto-creating team members** from Google org

See the updated `auth/callback.vue` for implementation details.
