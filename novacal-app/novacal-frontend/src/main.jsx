import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider, Navigate } from "react-router-dom";

import { AuthProvider, useAuth } from "./AuthContext";

import MainLayout from "./layouts/MainLayout";
import CalendarPage from "./Calendar";
import DashboardPage from "./Dashboard";
import HoursPage from "./Hours";
import AnalyticsPage from "./Analytics";
import HabitsPage from "./Habits";
import LoginPage from "./LoginPage";
import SignupPage from "./SignupPage";
import HomePage from "./Home";

import "./index.css";

function ProtectedRoute({ children }) {
  const { isLoggedIn } = useAuth();
  return isLoggedIn ? children : <Navigate to="/home" replace />;
}

function PublicRoute({ children }) {
  const { isLoggedIn } = useAuth();
  return !isLoggedIn ? children : <Navigate to="/dashboard" replace />;
}

function RouterSetup() {
  return (
    <RouterProvider
      router={createBrowserRouter([
        {
          element: <MainLayout />,
          children: [
            {
              path: "/",
              element: <HomePage />, // Or redirect logic here if needed
            },
            {
              path: "/home",
              element: <PublicRoute><HomePage /></PublicRoute>,
            },
            {
              path: "/dashboard",
              element: <ProtectedRoute><DashboardPage /></ProtectedRoute>,
            },
            {
              path: "/calendar",
              element: <ProtectedRoute><CalendarPage /></ProtectedRoute>,
            },
            {
              path: "/hours",
              element: <ProtectedRoute><HoursPage /></ProtectedRoute>,
            },
            {
              path: "/analytics",
              element: <ProtectedRoute><AnalyticsPage /></ProtectedRoute>,
            },
            {
              path: "/habits",
              element: <ProtectedRoute><HabitsPage /></ProtectedRoute>,
            },
            {
              path: "/login",
              element: <PublicRoute><LoginPage /></PublicRoute>,
            },
            {
              path: "/signup",
              element: <PublicRoute><SignupPage /></PublicRoute>,
            },
          ],
        },
      ])}
    />
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AuthProvider>
      <RouterSetup />
    </AuthProvider>
  </React.StrictMode>
);
