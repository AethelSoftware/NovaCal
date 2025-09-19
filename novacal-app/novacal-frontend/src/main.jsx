// src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';

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

// Simple Auth check
const isLoggedIn = !!localStorage.getItem("access_token");

const router = createBrowserRouter([
  {
    element: <MainLayout />,
    children: [
      {
        path: '/',
        element: isLoggedIn ? <Navigate to="/dashboard" /> : <Navigate to="/home" />,
      },
      {
        path: '/home',
        element: !isLoggedIn ? <HomePage /> : <Navigate to="/dashboard" />,
      },
      {
        path: '/dashboard',
        element: isLoggedIn ? <DashboardPage /> : <Navigate to="/home" />,
      },
      {
        path: '/calendar',
        element: isLoggedIn ? <CalendarPage /> : <Navigate to="/home" />,
      },
      {
        path: '/hours',
        element: isLoggedIn ? <HoursPage /> : <Navigate to="/home" />,
      },
      {
        path: '/analytics',
        element: isLoggedIn ? <AnalyticsPage /> : <Navigate to="/home" />,
      },
      {
        path: '/habits',
        element: isLoggedIn ? <HabitsPage /> : <Navigate to="/home" />,
      },
      {
        path: '/login',
        element: !isLoggedIn ? <LoginPage /> : <Navigate to="/dashboard" />,
      },
      {
        path: '/signup',
        element: !isLoggedIn ? <SignupPage /> : <Navigate to="/dashboard" />,
      },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);
