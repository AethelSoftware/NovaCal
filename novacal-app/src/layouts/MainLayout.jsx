// src/layouts/MainLayout.jsx
import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from '../components/sidebar';

export default function MainLayout() {
  const location = useLocation();
  const isHomePage = location.pathname === "/home";

  return (
    <div className="flex h-screen bg-gray-100">
      {!isHomePage && <Sidebar />}
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
