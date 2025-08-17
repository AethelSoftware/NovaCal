// src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';

// Import your layout component
import MainLayout from './layouts/MainLayout';

// Assuming your main content for the single page is in App.jsx
import CalendarPage from './Calendar';
import DashboardPage from './Dashboard';

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
    ],
  },
]);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* No AuthProvider or DataProvider needed for a "brand new app, no login, no nuthin" */}
    <RouterProvider router={router} />
  </React.StrictMode>
);