import React from 'react';
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

import './index.css'; // Your global styles

// Simple auth check using localStorage token
function useIsAuthenticated() {
  return !!localStorage.getItem("api_token");
}

// Route guard for protected pages
function ProtectedRoute() {
  const isAuthenticated = useIsAuthenticated();
  const location = useLocation();
  // If not logged in, go to /home
  if (!isAuthenticated) {
    return <Navigate to="/home" state={{ from: location }} replace />;
  }
  return <Outlet />;
}

// Route guard for public pages (home, login, signup)
function PublicRoute() {
  const isAuthenticated = useIsAuthenticated();
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