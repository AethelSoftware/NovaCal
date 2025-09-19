// src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';

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

const router = createBrowserRouter([
  {
    element: <MainLayout />,
    children: [
      {
        path: '/calendar',
        element: <CalendarPage />,
      },
      {
        path: '/dashboard',
        element: <DashboardPage />,
      },
      {
        path: '/',
        element: <DashboardPage />,
      },
      {
        path: '/hours',
        element: <HoursPage />,
      },
      {
        path: '/analytics',
        element: <AnalyticsPage />,
      },
      {
        path: '/habits',
        element: <HabitsPage />,
      },
      {
        path: '/login',
        element: <LoginPage />,
      },
      {
        path: '/signup',
        element: <SignupPage />,
      },
      {
        path: '/home',
        element: <HomePage />,
      },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* No AuthProvider or DataProvider needed for a "brand new app, no login, no nuthin" */}
    <RouterProvider router={router} />
  </React.StrictMode>
);