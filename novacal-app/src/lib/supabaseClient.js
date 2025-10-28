import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce'
  }
});

// Session timeout check (8 hours = 28800 seconds)
const SESSION_TIMEOUT = 8 * 60 * 60 * 1000; // 8 hours in milliseconds
let lastActivityTime = Date.now();

// Update last activity time
export const updateActivity = () => {
  lastActivityTime = Date.now();
};

// Check if session has expired due to inactivity
export const checkSessionTimeout = async () => {
  const inactiveTime = Date.now() - lastActivityTime;
  if (inactiveTime > SESSION_TIMEOUT) {
    await supabase.auth.signOut();
    return true;
  }
  return false;
};

// Setup activity listeners
if (typeof window !== 'undefined') {
  ['mousedown', 'keydown', 'scroll', 'touchstart'].forEach(event => {
    window.addEventListener(event, updateActivity, true);
  });

  // Check session timeout every minute
  setInterval(async () => {
    const timedOut = await checkSessionTimeout();
    if (timedOut) {
      window.location.href = '/login';
    }
  }, 60000); // Check every minute
}
