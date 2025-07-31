// src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';

// Import your layout component
import MainLayout from './layouts/MainLayout';

// Assuming your main content for the single page is in App.jsx
import CalendarPage from './Calendar';
import TutorialPage from './Tutorial';

import './index.css'; // Your global styles

const router = createBrowserRouter([
  {
    element: <MainLayout />, // This route uses your MainLayout
    children: [
      // This is the single route that will be rendered inside the <Outlet> of MainLayout
      {
        path: '/', // The root path for your single page
        element: <CalendarPage />, // Your main application content
      },
      {
        path: '/tutorial', // The root path for your single page
        element: <TutorialPage />, // Your main application content
      },
      // If you later add more pages that use the sidebar, you'd add them here:
      // {
      //   path: '/about',
      //   element: <AboutPage />,
      // },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* No AuthProvider or DataProvider needed for a "brand new app, no login, no nuthin" */}
    <RouterProvider router={router} />
  </React.StrictMode>
);