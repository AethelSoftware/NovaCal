# NovaCal Supabase Migration Guide

## Overview
Your NovaCal application has been successfully migrated from Flask backend to Supabase with TypeScript. This eliminates the need for a separate backend deployment.

## What Changed

### ✅ Backend Migration
- **From:** Flask + SQLAlchemy + PostgreSQL/SQLite
- **To:** Supabase (PostgreSQL with Row Level Security)
- **Authentication:** JWT tokens → Supabase Auth with email confirmation
- **Session Management:** 8-hour inactivity timeout implemented

### ✅ Authentication Flow
1. **Signup:** User creates account → Email confirmation sent → Temporary page shown
2. **Email Confirmation:** User clicks link → Redirected to dashboard
3. **Login:** Email + Password → Auto-redirect to dashboard
4. **Session Timeout:** Automatic logout after 8 hours of inactivity

### ✅ Frontend Updates
- React Router updated with email confirmation route
- Supabase client integrated (`@supabase/supabase-js`)
- All API calls now use Supabase client instead of fetch
- Vercel routing fix added (`vercel.json`)

## File Structure

```
/app/novacal-app/
├── supabase/
│   ├── config.toml                          # Supabase configuration
│   ├── functions/                           # Edge functions (TypeScript)
│   └── migrations/
│       ├── 20250106000001_initial_schema.sql  # Database tables
│       └── 20250106000002_enable_rls.sql      # Row Level Security
├── novacal-frontend/
│   ├── .env                                 # Supabase credentials
│   └── src/
│       ├── lib/
│       │   ├── supabaseClient.js           # Supabase client setup
│       │   └── supabaseApi.js              # API wrapper functions
│       ├── EmailConfirmation.jsx           # Email confirmation page
│       ├── LoginPage.jsx                   # Updated with Supabase
│       └── SignupPage.jsx                  # Updated with Supabase
├── vercel.json                              # Vercel SPA routing fix
└── .env                                     # Root env file
```

## Setup Instructions

### 1. Apply Database Migrations
You need to run these migrations in your Supabase dashboard:

1. Go to https://ljikmyreemennkkwisow.supabase.co
2. Navigate to **SQL Editor**
3. Copy and paste the contents of `supabase/migrations/20250106000001_initial_schema.sql`
4. Click **Run**
5. Repeat for `supabase/migrations/20250106000002_enable_rls.sql`

**OR** use the Supabase CLI:
```bash
cd /app/novacal-app
supabase db push
```

### 2. Configure Email Templates (Important!)
1. Go to Supabase Dashboard → **Authentication** → **Email Templates**
2. Update the **Confirm Signup** template with your redirect URL:
   ```
   Confirmation URL: {{ .ConfirmationURL }}
   ```
3. Make sure the redirect URL points to your deployed frontend

### 3. Deploy Frontend to Vercel

#### Option A: Via Vercel Dashboard
1. Go to https://vercel.com
2. Import your repository
3. Set **Root Directory** to: `novacal-app/novacal-frontend`
4. Add Environment Variables:
   ```
   VITE_SUPABASE_URL=https://ljikmyreemennkkwisow.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxqaWtteXJlZW1lbm5ra3dpc293Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA0OTIyOTMsImV4cCI6MjA3NjA2ODI5M30.lUI_fEMxTAWm7R7rrSs_UlNMLjroEUGUIyBxLNKb_gM
   ```
5. Click **Deploy**

#### Option B: Via Vercel CLI
```bash
cd /app/novacal-app/novacal-frontend
vercel --prod
```

### 4. Update Supabase Redirect URLs
After deployment, update your Supabase settings:

1. Go to Supabase Dashboard → **Authentication** → **URL Configuration**
2. Add your Vercel deployment URL to:
   - **Site URL**: `https://your-app.vercel.app`
   - **Redirect URLs**: `https://your-app.vercel.app/**`

## Testing Locally

### 1. Install Dependencies
```bash
cd /app/novacal-app/novacal-frontend
yarn install
```

### 2. Run Development Server
```bash
yarn dev
```

The app will run on `http://localhost:3000`

### 3. Test Authentication Flow
1. Navigate to `/signup`
2. Create an account
3. Check your email for confirmation
4. Click the link
5. Verify redirect to dashboard

## Features

### ✅ All Original Features Preserved
- ✅ Task management (create, update, delete)
- ✅ Custom tasks with split functionality
- ✅ Focus sessions tracking
- ✅ Completed tasks history
- ✅ Working hours configuration
- ✅ Habits tracking with schedules
- ✅ Calendar view
- ✅ Dashboard analytics
- ✅ Auto-scheduling (simplified)

### ✅ New Features Added
- ✅ Email confirmation on signup
- ✅ 8-hour session timeout
- ✅ Automatic session refresh
- ✅ Vercel deployment fix (no more reload issues)
- ✅ Row Level Security (RLS) for data protection

## Security Improvements

### Row Level Security (RLS)
All tables now have RLS policies ensuring:
- Users can only view their own data
- Users can only modify their own data
- No data leakage between users

### Authentication
- Email verification required
- Secure session management
- Automatic token refresh
- Activity-based timeout

## Troubleshooting

### Issue: "Email not confirmed" error
**Solution:** Check your email and click the confirmation link. If not received, click "Resend confirmation email" on the email confirmation page.

### Issue: Page shows blank on reload after deployment
**Solution:** The `vercel.json` file should fix this. Make sure it's in the root of your repository.

### Issue: Session expires too quickly
**Solution:** The timeout is set to 8 hours. Activity (mouse, keyboard, scroll) resets the timer.

### Issue: Migration files not working
**Solution:** Make sure you're running them in the correct order:
1. `20250106000001_initial_schema.sql` (creates tables)
2. `20250106000002_enable_rls.sql` (enables security)

## API Migration Reference

### Old Backend Endpoints → New Supabase Functions

| Old Endpoint | New Method |
|-------------|------------|
| `POST /api/register` | `supabase.auth.signUp()` |
| `POST /api/login` | `supabase.auth.signInWithPassword()` |
| `GET /api/tasks` | `getTasks()` from supabaseApi.js |
| `POST /api/tasks` | `createTask()` from supabaseApi.js |
| `PATCH /api/tasks/:id` | `updateTask()` from supabaseApi.js |
| `DELETE /api/tasks/:id` | `deleteTask()` from supabaseApi.js |
| `GET /api/habits` | `getHabits()` from supabaseApi.js |
| `POST /api/habits` | `createHabit()` from supabaseApi.js |
| ... and more | See `supabaseApi.js` for all functions |

## Support

If you encounter any issues:
1. Check the browser console for errors
2. Check Supabase logs in the dashboard
3. Verify environment variables are set correctly
4. Ensure migrations were applied successfully

## Next Steps

1. ✅ Run database migrations
2. ✅ Configure email templates in Supabase
3. ✅ Deploy frontend to Vercel
4. ✅ Update Supabase redirect URLs
5. ✅ Test the complete flow
6. ✅ Celebrate! 🎉
