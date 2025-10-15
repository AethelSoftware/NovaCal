import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider, Navigate, Outlet, useLocation } from 'react-router-dom';

import MainLayout from './layouts/MainLayout';

import CalendarPage from './Calendar';
import DashboardPage from './Dashboard';
import HoursPage from "./Hours";
import AnalyticsPage from './Analytics';
import HabitsPage from './Habits';
import LoginPage from './LoginPage';
import SignupPage from './SignupPage';
import HomePage from './Home';
import DevPage from './DevPage';
import EmailConfirmation from './EmailConfirmation';

import { supabase } from './lib/supabaseClient';

import './index.css'; // Your global styles

// Auth check using Supabase session
function useIsAuthenticated() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthenticated(!!session?.user?.email_confirmed_at);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session?.user?.email_confirmed_at);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  return { isAuthenticated, loading };
}

// Route guard for protected pages
function ProtectedRoute() {
  const { isAuthenticated, loading } = useIsAuthenticated();
  const location = useLocation();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-500"></div>
      </div>
    );
  }
  
  // If not logged in, go to /home
  if (!isAuthenticated) {
    return <Navigate to="/home" state={{ from: location }} replace />;
  }
  return <Outlet />;
}

// Route guard for public pages (home, login, signup)
function PublicRoute() {
  const { isAuthenticated, loading } = useIsAuthenticated();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-500"></div>
      </div>
    );
  }
  
  // If logged in, send to dashboard
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }
  return <Outlet />;
}

const router = createBrowserRouter([
  {
    element: <MainLayout />,
    children: [
      // Home, login and signup are public
      {
        element: <PublicRoute />,
        children: [
          { path: '/home', element: <HomePage /> },
          { path: '/login', element: <LoginPage /> },
          { path: '/signup', element: <SignupPage /> },
        ],
      },

      // All other pages are protected
      {
        element: <ProtectedRoute />,
        children: [
          { path: '/calendar', element: <CalendarPage /> },
          { path: '/dashboard', element: <DashboardPage /> },
          { path: '/', element: <Navigate to="/dashboard" replace /> },
          { path: '/hours', element: <HoursPage /> },
          { path: '/analytics', element: <AnalyticsPage /> },
          { path: '/habits', element: <HabitsPage /> },
          { path: '/development', element: <DevPage /> },
        ],
      },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);