# NovaCal - Smart Calendar & Task Management

A modern, full-stack task management and calendar application with AI-powered scheduling, built with React and Supabase.

## 🚀 Features

### Core Functionality
- **Task Management**: Create, edit, delete, and organize tasks with deadlines
- **Custom Tasks**: Split large tasks into manageable blocks
- **Smart Scheduling**: Auto-schedule tasks based on availability and priority
- **Focus Sessions**: Track focused work time with Pomodoro-style sessions
- **Habits Tracking**: Build and maintain daily habits with custom schedules
- **Working Hours**: Configure your available work hours per day
- **Analytics Dashboard**: Visualize productivity and task completion

### Security & Authentication
- **Email Confirmation**: Secure signup with email verification
- **Session Timeout**: Automatic logout after 8 hours of inactivity
- **Row Level Security**: PostgreSQL RLS ensures data isolation between users
- **Secure Authentication**: Powered by Supabase Auth

## 🛠️ Tech Stack

### Frontend
- **React 19** - UI framework
- **Vite** - Build tool and dev server
- **React Router v7** - Client-side routing
- **Tailwind CSS 4** - Utility-first styling
- **Framer Motion** - Animations
- **Recharts** - Data visualization
- **Lucide React** - Icon library
- **date-fns** - Date utilities

### Backend
- **Supabase** - Backend-as-a-Service
  - PostgreSQL database
  - Authentication
  - Row Level Security
  - Edge Functions (Deno/TypeScript)
  - Real-time subscriptions

### Deployment
- **Vercel** - Frontend hosting
- **Supabase Cloud** - Backend & database

## 📁 Project Structure

```
novacal-app/
├── supabase/
│   ├── config.toml                           # Supabase project config
│   ├── functions/                            # Edge functions
│   │   └── auto-schedule/                    # Auto-scheduling function
│   │       ├── index.ts
│   │       └── deno.json
│   └── migrations/                           # Database migrations
│       ├── 20250106000001_initial_schema.sql
│       └── 20250106000002_enable_rls.sql
├── novacal-frontend/
│   ├── public/                               # Static assets
│   ├── src/
│   │   ├── lib/
│   │   │   ├── supabaseClient.js            # Supabase client setup
│   │   │   └── supabaseApi.js               # API wrapper functions
│   │   ├── components/                       # Reusable components
│   │   ├── layouts/                          # Layout components
│   │   ├── utils/                            # Utility functions
│   │   ├── Calendar.jsx                      # Calendar view
│   │   ├── Dashboard.jsx                     # Main dashboard
│   │   ├── Analytics.jsx                     # Analytics page
│   │   ├── Habits.jsx                        # Habits tracker
│   │   ├── Hours.jsx                         # Working hours config
│   │   ├── LoginPage.jsx                     # Login page
│   │   ├── SignupPage.jsx                    # Signup page
│   │   ├── EmailConfirmation.jsx             # Email verification page
│   │   ├── main.jsx                          # App entry point
│   │   └── index.css                         # Global styles
│   ├── .env                                  # Environment variables
│   ├── package.json
│   ├── vite.config.js
│   └── tailwind.config.js
├── vercel.json                               # Vercel deployment config
├── MIGRATION_GUIDE.md                        # Migration documentation
└── README.md                                 # This file
```

## 🚦 Getting Started

### Prerequisites
- Node.js 18+ and Yarn
- Supabase account
- Vercel account (for deployment)

### 1. Clone and Install

```bash
git clone <your-repo>
cd novacal-app/novacal-frontend
yarn install
```

### 2. Configure Environment Variables

Create `.env` in `novacal-frontend/`:

```env
VITE_SUPABASE_URL=https://ljikmyreemennkkwisow.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxqaWtteXJlZW1lbm5ra3dpc293Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA0OTIyOTMsImV4cCI6MjA3NjA2ODI5M30.lUI_fEMxTAWm7R7rrSs_UlNMLjroEUGUIyBxLNKb_gM
```

### 3. Set Up Supabase Database

#### Option A: Using Supabase Dashboard
1. Go to your [Supabase project](https://ljikmyreemennkkwisow.supabase.co)
2. Navigate to **SQL Editor**
3. Run the migrations in order:
   - `supabase/migrations/20250106000001_initial_schema.sql`
   - `supabase/migrations/20250106000002_enable_rls.sql`

#### Option B: Using Supabase CLI
```bash
# Install Supabase CLI
npm install -g supabase

# Login
supabase login

# Link project
supabase link --project-ref ljikmyreemennkkwisow

# Push migrations
supabase db push
```

### 4. Configure Email Authentication

1. Go to Supabase Dashboard → **Authentication** → **Email Templates**
2. Customize the **Confirm Signup** template
3. Update redirect URLs in **URL Configuration**

### 5. Run Development Server

```bash
cd novacal-frontend
yarn dev
```

Visit `http://localhost:3000`

## 🌐 Deployment

### Deploy Frontend to Vercel

#### Via Vercel Dashboard
1. Import your repository
2. Set **Root Directory**: `novacal-app/novacal-frontend`
3. Add environment variables:
   ```
   VITE_SUPABASE_URL=https://ljikmyreemennkkwisow.supabase.co
   VITE_SUPABASE_ANON_KEY=<your-anon-key>
   ```
4. Deploy

#### Via Vercel CLI
```bash
cd novacal-frontend
vercel --prod
```

### Deploy Edge Functions

```bash
# Install Supabase CLI
npm install -g supabase

# Deploy auto-schedule function
supabase functions deploy auto-schedule
```

## 📚 API Reference

### Authentication

```javascript
import { supabase } from './lib/supabaseClient';

// Sign up
const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'password',
});

// Sign in
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password',
});

// Sign out
await supabase.auth.signOut();

// Get current user
const { data: { user } } = await supabase.auth.getUser();
```

### Task Management

```javascript
import { getTasks, createTask, updateTask, deleteTask } from './lib/supabaseApi';

// Get all tasks
const tasks = await getTasks();

// Create task
const task = await createTask({
  name: 'New Task',
  start: '2025-01-15T09:00:00',
  end: '2025-01-15T10:00:00',
  importance: 3,
});

// Update task
await updateTask(taskId, { name: 'Updated Task' });

// Delete task
await deleteTask(taskId);
```

### Habits

```javascript
import { getHabits, createHabit, updateHabit, deleteHabit } from './lib/supabaseApi';

// Get all habits
const habits = await getHabits();

// Create habit
const habit = await createHabit({
  name: 'Morning Exercise',
  schedules: [{ day: 'Monday', time: '06:00' }],
});
```

See `src/lib/supabaseApi.js` for complete API documentation.

## 🔒 Security

### Row Level Security (RLS)
All database tables are protected with RLS policies:
- Users can only access their own data
- All queries are automatically filtered by user ID
- No data leakage between users

### Session Management
- JWT tokens managed by Supabase
- Auto-refresh on activity
- 8-hour inactivity timeout
- Secure cookie storage

### Environment Variables
- Never commit `.env` files
- Use Vercel environment variables for production
- Rotate keys regularly

## 🧪 Testing

```bash
# Run linter
yarn lint

# Build for production
yarn build

# Preview production build
yarn preview
```

## 📖 Documentation

- [Migration Guide](./MIGRATION_GUIDE.md) - Detailed migration from Flask to Supabase
- [Supabase Docs](https://supabase.com/docs) - Official Supabase documentation
- [React Router Docs](https://reactrouter.com) - Client-side routing

## 🐛 Troubleshooting

### Email confirmation not working
- Check spam folder
- Verify email templates in Supabase dashboard
- Ensure redirect URLs are configured

### Blank page on reload after deployment
- Verify `vercel.json` is in the root directory
- Check Vercel build logs
- Ensure SPA fallback is enabled

### Session expires too quickly
- Activity resets the 8-hour timer
- Check browser console for errors
- Verify Supabase auth tokens

### Database queries failing
- Ensure migrations are applied
- Check RLS policies
- Verify user is authenticated

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is private and proprietary.

## 🙏 Acknowledgments

- [Supabase](https://supabase.com) - Backend infrastructure
- [Vercel](https://vercel.com) - Frontend hosting
- [Tailwind CSS](https://tailwindcss.com) - Styling
- [Lucide](https://lucide.dev) - Icons

---

**Built with ❤️ using React and Supabase**
