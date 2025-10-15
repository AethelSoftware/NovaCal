# 🚀 Deploy Your NovaCal App Now!

## Step 1: Save Code to GitHub ✅

**Use the "Save to Github" button** in the chat interface (at the bottom of the screen).

This will commit all the new Supabase migration code to your repository:
- Repository: `AethelSoftware/NovaCal`

---

## Step 2: Apply Database Migrations 📊

**CRITICAL: Do this BEFORE deploying to Vercel!**

### Option A: Via Supabase Dashboard (Recommended)

1. Go to https://ljikmyreemennkkwisow.supabase.co
2. Click **SQL Editor** in the left sidebar
3. Click **New Query**
4. Copy the entire content from: `novacal-app/supabase/migrations/20250106000001_initial_schema.sql`
5. Paste into the editor
6. Click **Run** (bottom right)
7. Wait for success message
8. Repeat steps 3-7 with: `novacal-app/supabase/migrations/20250106000002_enable_rls.sql`

✅ **Verify:** Go to **Table Editor** and you should see these tables:
- tasks
- custom_tasks
- focus_sessions
- completed_tasks
- working_hours
- habits

### Option B: Via Supabase CLI (Advanced)

```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref ljikmyreemennkkwisow

# Push migrations
cd /app/novacal-app
supabase db push
```

---

## Step 3: Deploy to Vercel 🌐

### Option A: Via Vercel Dashboard (Easiest)

1. Go to https://vercel.com/new
2. Click **Import Project**
3. Select **Import Git Repository**
4. Choose: `AethelSoftware/NovaCal`
5. **IMPORTANT:** Configure these settings:

   **Root Directory:**
   ```
   novacal-app/novacal-frontend
   ```
   ⚠️ This is critical! Click "Edit" next to Root Directory and enter exactly: `novacal-app/novacal-frontend`

   **Framework Preset:** Vite (auto-detected)
   
   **Build Command:** `yarn build` (auto-detected)
   
   **Output Directory:** `dist` (auto-detected)

6. **Add Environment Variables:**
   Click "Environment Variables" and add:
   
   **Variable 1:**
   - Name: `VITE_SUPABASE_URL`
   - Value: `https://ljikmyreemennkkwisow.supabase.co`
   - Environments: ✅ Production, ✅ Preview, ✅ Development
   
   **Variable 2:**
   - Name: `VITE_SUPABASE_ANON_KEY`
   - Value: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxqaWtteXJlZW1lbm5ra3dpc293Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA0OTIyOTMsImV4cCI6MjA3NjA2ODI5M30.lUI_fEMxTAWm7R7rrSs_UlNMLjroEUGUIyBxLNKb_gM`
   - Environments: ✅ Production, ✅ Preview, ✅ Development

7. Click **Deploy**
8. Wait 2-3 minutes for build to complete
9. **Copy your deployment URL** (e.g., `https://nova-cal-xyz.vercel.app`)

### Option B: Via Vercel CLI (Advanced)

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy
cd /app/novacal-app/novacal-frontend
vercel --prod

# Follow the prompts:
# - Link to existing project? Yes (if you have one) or No
# - Set root directory? No (we're already in it)
```

---

## Step 4: Update Supabase Redirect URLs 🔗

**CRITICAL: Do this immediately after deployment!**

1. Copy your Vercel deployment URL (from Step 3)
2. Go to https://ljikmyreemennkkwisow.supabase.co
3. Click **Authentication** in the left sidebar
4. Click **URL Configuration**
5. Update these fields:

   **Site URL:**
   ```
   https://your-vercel-url.vercel.app
   ```
   (Replace with your actual Vercel URL)

   **Redirect URLs (Add all of these):**
   ```
   https://your-vercel-url.vercel.app/**
   https://your-vercel-url.vercel.app/dashboard
   https://your-vercel-url.vercel.app/email-confirmation
   http://localhost:3000/**
   ```

6. Click **Save**

---

## Step 5: Test Your Deployment 🧪

### Test 1: Basic Access
1. Visit your Vercel URL
2. Verify the home page loads correctly
3. Check browser console for errors (F12)

### Test 2: Sign Up Flow
1. Click "Sign Up" or go to `/signup`
2. Create an account with a **real email address**
3. Check your email inbox (and spam folder)
4. Click the confirmation link
5. Verify you're redirected to the dashboard

### Test 3: Login Flow
1. Log out
2. Go to `/login`
3. Log in with your credentials
4. Verify redirect to dashboard

### Test 4: Routing (Reload Fix)
1. Navigate to `/dashboard`
2. Press **F5** (reload page)
3. ✅ Should load correctly (NOT show 404)
4. Try with other routes: `/calendar`, `/habits`

### Test 5: Core Features
1. Create a task
2. Edit a task
3. Delete a task
4. Navigate to different pages
5. Check that data persists

### Test 6: Session Timeout
1. Stay logged in
2. Leave browser idle for 8+ hours (or test with shorter time)
3. Verify automatic logout

---

## 🎉 Success Checklist

Mark these as you complete them:

- [ ] Code saved to GitHub using "Save to Github" button
- [ ] Database migrations applied in Supabase
- [ ] Vercel deployment created
- [ ] Root directory set to `novacal-app/novacal-frontend`
- [ ] Environment variables added in Vercel
- [ ] Deployment successful (got a URL)
- [ ] Supabase redirect URLs updated with Vercel URL
- [ ] Tested signup with email confirmation
- [ ] Tested login
- [ ] Tested page reload (no 404)
- [ ] Tested creating tasks
- [ ] No console errors

---

## 🐛 Troubleshooting

### Issue: Build Fails on Vercel
**Error:** "Cannot find module" or dependency errors

**Fix:**
1. Check that Root Directory is `novacal-app/novacal-frontend`
2. Verify `package.json` exists in that directory
3. Check build logs for specific error
4. Clear cache and redeploy

### Issue: "Invalid redirect URL" after email confirmation
**Error:** User clicks email link and gets an error

**Fix:**
1. Double-check Supabase redirect URLs
2. Make sure you added `https://your-url.vercel.app/**`
3. The `**` is important!
4. Allow 1-2 minutes for settings to propagate

### Issue: 404 on Page Reload
**Problem:** Reloading `/dashboard` shows 404

**Fix:**
1. Verify `vercel.json` exists in `/app/novacal-app/` (not in frontend folder)
2. Check Vercel build logs to confirm it was detected
3. Manually add a rewrite rule in Vercel dashboard:
   - Go to Project Settings → Rewrites
   - Source: `/(.*)`
   - Destination: `/`

### Issue: Email Not Received
**Problem:** Confirmation email doesn't arrive

**Fix:**
1. Check spam/junk folder
2. Try a different email provider (Gmail, Outlook)
3. In Supabase: Authentication → Email Templates → verify it's enabled
4. Check Supabase logs for email delivery errors

### Issue: Environment Variables Not Working
**Problem:** App can't connect to Supabase

**Fix:**
1. Verify variable names are EXACTLY: `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
2. Check they're applied to Production environment
3. After changing env vars, **redeploy** the project
4. Clear browser cache and test again

---

## 📊 Monitoring Your Deployment

### Vercel Dashboard
- Monitor build status
- View deployment logs
- Check analytics (if enabled)
- Domain/URL: `https://vercel.com/dashboard`

### Supabase Dashboard
- Monitor database usage
- Check authentication logs
- View query performance
- Review RLS policies
- Dashboard: `https://ljikmyreemennkkwisow.supabase.co`

---

## 🎯 Your Deployment URLs

After deployment, update these:

**Vercel Frontend:**
```
Production: https://__________.vercel.app
Preview: https://__________.vercel.app
```

**Supabase Backend:**
```
Database: https://ljikmyreemennkkwisow.supabase.co
```

**GitHub Repository:**
```
Repo: https://github.com/AethelSoftware/NovaCal
```

---

## 🆘 Need Help?

If you encounter issues:

1. **Check the docs:**
   - `QUICK_START.md` - Quick setup guide
   - `MIGRATION_GUIDE.md` - Technical details
   - `DEPLOYMENT_CHECKLIST.md` - Comprehensive checklist

2. **Check logs:**
   - Vercel: Project → Deployments → View Logs
   - Supabase: Logs section in dashboard
   - Browser: F12 → Console tab

3. **Common fixes:**
   - Clear browser cache
   - Redeploy after env variable changes
   - Verify all URLs match exactly
   - Check migrations were applied

---

## ⏱️ Estimated Time

- Step 1 (GitHub): 1 minute
- Step 2 (Migrations): 5 minutes
- Step 3 (Vercel Deploy): 5 minutes
- Step 4 (Update URLs): 2 minutes
- Step 5 (Testing): 10 minutes

**Total: ~23 minutes** ⚡

---

**Good luck with your deployment! 🚀**

Your NovaCal app will be live soon!
