# 🚀 Deployment Checklist

Follow these steps to deploy your NovaCal application successfully.

## ✅ Pre-Deployment

### 1. Verify Environment Setup
- [ ] Supabase project is created and accessible
- [ ] Supabase URL and anon key are correct in `.env` files
- [ ] All dependencies are installed (`yarn install`)
- [ ] Application runs locally without errors

### 2. Database Setup
- [ ] Run migration: `20250106000001_initial_schema.sql`
  - Creates all tables (tasks, habits, focus_sessions, etc.)
  - Sets up foreign key relationships
  - Creates indexes for performance
- [ ] Run migration: `20250106000002_enable_rls.sql`
  - Enables Row Level Security on all tables
  - Creates RLS policies for user data isolation

**How to run migrations:**
```bash
# Via Supabase Dashboard
1. Go to SQL Editor
2. Copy/paste migration content
3. Click "Run"

# Via Supabase CLI
supabase db push
```

### 3. Configure Supabase Authentication

#### Email Templates
- [ ] Go to **Authentication** → **Email Templates**
- [ ] Update **Confirm Signup** template
  - Default template should work
  - Optionally customize branding
- [ ] Test email delivery (create test account)

#### URL Configuration
- [ ] Go to **Authentication** → **URL Configuration**
- [ ] Add development URLs (for local testing):
  ```
  http://localhost:3000
  http://localhost:3000/**
  ```
- [ ] These will be updated post-deployment

### 4. Test Locally
- [ ] Sign up flow works
- [ ] Email confirmation is received
- [ ] Login works after email confirmation
- [ ] Tasks can be created/edited/deleted
- [ ] All features function correctly
- [ ] No console errors

## 🌐 Vercel Deployment

### 1. Prepare Repository
- [ ] Commit all changes
- [ ] Push to GitHub/GitLab/Bitbucket
- [ ] Ensure `vercel.json` is in root of `novacal-app/`

### 2. Create Vercel Project
- [ ] Go to [vercel.com](https://vercel.com)
- [ ] Click "Add New" → "Project"
- [ ] Import your repository
- [ ] **IMPORTANT:** Set Root Directory to `novacal-app/novacal-frontend`

### 3. Configure Build Settings
```
Framework Preset: Vite
Build Command: yarn build
Output Directory: dist
Install Command: yarn install
```

### 4. Add Environment Variables
Add these in Vercel project settings:
```
VITE_SUPABASE_URL=https://ljikmyreemennkkwisow.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxqaWtteXJlZW1lbm5ra3dpc293Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA0OTIyOTMsImV4cCI6MjA3NjA2ODI5M30.lUI_fEMxTAWm7R7rrSs_UlNMLjroEUGUIyBxLNKb_gM
```

- [ ] Environment variables added
- [ ] Variables applied to Production, Preview, and Development

### 5. Deploy
- [ ] Click "Deploy"
- [ ] Wait for build to complete (~2-3 minutes)
- [ ] Note your deployment URL (e.g., `https://your-app.vercel.app`)

## 🔧 Post-Deployment Configuration

### 1. Update Supabase URLs
- [ ] Go to Supabase Dashboard → **Authentication** → **URL Configuration**
- [ ] Update **Site URL**: `https://your-app.vercel.app`
- [ ] Add **Redirect URLs**:
  ```
  https://your-app.vercel.app
  https://your-app.vercel.app/**
  https://your-app.vercel.app/dashboard
  https://your-app.vercel.app/email-confirmation
  ```

### 2. Test Deployed Application
- [ ] Visit your Vercel URL
- [ ] Sign up with a real email
- [ ] Check email and click confirmation link
- [ ] Verify redirect to dashboard works
- [ ] Test all major features:
  - [ ] Task creation
  - [ ] Task editing
  - [ ] Task deletion
  - [ ] Calendar view
  - [ ] Habits management
  - [ ] Focus sessions
  - [ ] Analytics

### 3. Test Routing Fix
- [ ] Navigate to `/dashboard`
- [ ] Reload the page (F5 or Cmd+R)
- [ ] Verify page loads correctly (no 404)
- [ ] Test with other routes: `/calendar`, `/habits`, `/analytics`

### 4. Test Session Timeout
- [ ] Log in
- [ ] Wait 8 hours OR manually test:
  ```javascript
  // In browser console
  localStorage.clear();
  location.reload();
  ```
- [ ] Verify automatic logout works

## 🎯 Optional: Deploy Edge Functions

If you want to use the advanced auto-schedule function:

### 1. Install Supabase CLI
```bash
npm install -g supabase
```

### 2. Login and Link Project
```bash
supabase login
supabase link --project-ref ljikmyreemennkkwisow
```

### 3. Deploy Function
```bash
cd /app/novacal-app
supabase functions deploy auto-schedule
```

### 4. Update Frontend to Use Edge Function
In `supabaseApi.js`, update `autoScheduleTasks`:
```javascript
export const autoScheduleTasks = async (taskIds) => {
  const { data, error } = await supabase.functions.invoke('auto-schedule', {
    body: { task_ids: taskIds }
  });
  
  if (error) throw error;
  return data;
};
```

## 📊 Monitoring & Maintenance

### Vercel
- [ ] Set up Vercel Analytics (optional)
- [ ] Configure deployment notifications
- [ ] Set up custom domain (optional)

### Supabase
- [ ] Monitor database usage in dashboard
- [ ] Check authentication metrics
- [ ] Review logs for errors
- [ ] Set up database backups (automatic in Supabase)

### Regular Checks
- [ ] Monitor user signups
- [ ] Check email delivery rates
- [ ] Review error logs weekly
- [ ] Update dependencies monthly

## 🆘 Troubleshooting

### Build Fails on Vercel
**Problem:** Build errors or dependency issues

**Solutions:**
1. Check build logs in Vercel dashboard
2. Verify `package.json` dependencies
3. Ensure Node version is 18+
4. Clear cache and rebuild

### Email Confirmation Not Working
**Problem:** Users don't receive confirmation emails

**Solutions:**
1. Check Supabase Auth settings
2. Verify email templates are enabled
3. Check spam folder
4. Use test email provider for development

### 404 on Page Reload
**Problem:** App shows 404 when reloading `/dashboard`

**Solutions:**
1. Verify `vercel.json` is in correct location
2. Ensure Vercel is using the file
3. Check rewrite rules in Vercel settings

### Session Issues
**Problem:** Users logged out immediately or stay logged in forever

**Solutions:**
1. Check browser cookies enabled
2. Verify Supabase auth settings
3. Check session timeout logic in `supabaseClient.js`
4. Clear browser storage and retry

### Database Permission Errors
**Problem:** "Permission denied" or RLS errors

**Solutions:**
1. Verify RLS policies are applied
2. Check user is authenticated
3. Test queries in Supabase SQL editor
4. Review policy definitions

## ✨ Success Criteria

Your deployment is successful when:
- ✅ Users can sign up and receive confirmation email
- ✅ Email confirmation redirects to dashboard
- ✅ Login works correctly
- ✅ All pages load without errors
- ✅ Page reloads work on any route
- ✅ Session timeout works after 8 hours
- ✅ Tasks/habits can be created and managed
- ✅ No console errors in production

## 📝 Notes

- Keep your Supabase anon key secret (don't commit to public repos)
- Supabase anon key is safe for client-side use (RLS protects data)
- Service role key should NEVER be used in frontend
- Monitor Supabase usage to avoid hitting free tier limits
- Consider upgrading Supabase plan for production use

---

**Last Updated:** 2025-01-06
**Version:** 1.0.0

Need help? Check the [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md) or [README.md](./README.md)
