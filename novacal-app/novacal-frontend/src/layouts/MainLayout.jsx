// src/layouts/MainLayout.jsx
import React from 'react';
import { Outlet } from 'react-router-dom'; // Essential for nested routes

// Assuming your Sidebar and UsageTracker are in 'components'
import Sidebar from '../components/sidebar';

export default function MainLayout() {
  return (
    <div className="flex h-screen bg-gray-100">
      {/* UsageTracker is here because it's part of the persistent layout for routes using MainLayout */}
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <Outlet /> {/* This is where the content of your specific pages will be rendered */}
      </main>
    </div>
  );
}