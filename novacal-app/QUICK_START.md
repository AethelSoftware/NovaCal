# 🚀 Quick Start Guide

Get your NovaCal app up and running in 5 steps!

## Prerequisites
✅ Supabase account with project created  
✅ Node.js 18+ and Yarn installed  
✅ Vercel account (for deployment)

## 📋 5-Step Setup

### Step 1: Apply Database Migrations (5 minutes)

1. Go to https://ljikmyreemennkkwisow.supabase.co
2. Navigate to **SQL Editor**
3. Copy content from `supabase/migrations/20250106000001_initial_schema.sql`
4. Paste and click **Run**
5. Repeat with `supabase/migrations/20250106000002_enable_rls.sql`

✅ **Verify:** Check that tables appear in **Table Editor**

### Step 2: Configure Supabase Auth (3 minutes)

1. Go to **Authentication** → **Email Templates**
2. Verify **Confirm Signup** template is enabled
3. Go to **Authentication** → **URL Configuration**
4. Add these URLs temporarily (update after deployment):
   ```
   Site URL: http://localhost:3000
   Redirect URLs: http://localhost:3000/**
   ```

✅ **Verify:** Settings saved successfully

### Step 3: Test Locally (5 minutes)

```bash
cd /app/novacal-app/novacal-frontend
yarn install
yarn dev
```

1. Open http://localhost:3000
2. Create an account
3. Check your email for confirmation
4. Click the link
5. Verify you're redirected to dashboard

✅ **Verify:** All features work locally

### Step 4: Deploy to Vercel (5 minutes)

1. Go to https://vercel.com/new
2. Import your repository
3. **CRITICAL:** Set Root Directory to `novacal-app/novacal-frontend`
4. Add environment variables:
   ```
   VITE_SUPABASE_URL=https://ljikmyreemennkkwisow.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxqaWtteXJlZW1lbm5ra3dpc293Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA0OTIyOTMsImV4cCI6MjA3NjA2ODI5M30.lUI_fEMxTAWm7R7rrSs_UlNMLjroEUGUIyBxLNKb_gM
   ```
5. Click **Deploy**
6. Wait 2-3 minutes
7. Copy your deployment URL (e.g., `https://your-app.vercel.app`)

✅ **Verify:** Site is live and accessible

### Step 5: Update Supabase URLs (2 minutes)

1. Go back to Supabase Dashboard
2. **Authentication** → **URL Configuration**
3. Update:
   ```
   Site URL: https://your-app.vercel.app
   
   Redirect URLs:
   https://your-app.vercel.app/**
   http://localhost:3000/**
   ```

✅ **Verify:** Test signup on production site

## 🎉 You're Done!

Your app is now live! Test it by:
1. Signing up on your production URL
2. Confirming your email
3. Creating some tasks
4. Trying all features

## 🐛 Common Issues

### "Invalid redirect URL" error
**Fix:** Make sure you added `https://your-app.vercel.app/**` to Supabase redirect URLs

### Email not arriving
**Fix:** Check spam folder, or use a different email provider

### 404 on page reload
**Fix:** Verify `vercel.json` is in `/app/novacal-app/` directory (not in frontend folder)

### Build fails on Vercel
**Fix:** Ensure Root Directory is set to `novacal-app/novacal-frontend`

## 📚 Next Steps

- [ ] Read [README.md](./README.md) for full documentation
- [ ] Review [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md) for technical details
- [ ] Check [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md) for production best practices
- [ ] Customize email templates in Supabase
- [ ] Set up custom domain (optional)
- [ ] Enable Vercel Analytics (optional)

## 🆘 Need Help?

1. Check browser console for errors
2. Review Supabase logs in dashboard
3. Verify all environment variables
4. Ensure migrations ran successfully
5. Test auth flow step-by-step

---

**Total Setup Time:** ~20 minutes  
**Difficulty:** Easy ⭐⭐☆☆☆

Happy building! 🚀
