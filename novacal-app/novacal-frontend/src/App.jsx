// app.jsx
"use client";

import React, { useState, useEffect } from "react";
import CalendarView from "./components/CalendarView";

export default function App() {
  const [viewType] = useState(7); // You can change this as needed: 3, 5, or 7
  const [tasks, setTasks] = useState([]);

  // Fetch tasks on mount
  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const res = await fetch("http://127.0.0.1:5000/api/tasks");
        if (!res.ok) throw new Error("Failed to fetch tasks");
        const data = await res.json();
        setTasks(data);
      } catch (err) {
        console.error("Error loading tasks:", err);
      }
    };

    fetchTasks();
  }, []);

  // Add a new task to backend and state
  const addNewTask = async (task) => {
    try {
      const res = await fetch("http://127.0.0.1:5000/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(task), // expects { name, start, end, description? }
      });

      if (!res.ok) throw new Error("Failed to add task");
      const newTask = await res.json();
      setTasks((prev) => [...prev, newTask]);
    } catch (err) {
      console.error("Error adding task:", err);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-slate-900 to-black text-gray-100 font-sans p-6 sm:p-10">
      {/* Header */}
      <header className="mb-10 flex items-center justify-between">
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-transparent bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 bg-clip-text drop-shadow-xl">
          NovaCal
        </h1>
      </header>

      {/* Calendar */}
      <main className="max-w-[1200px] mx-auto bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-3xl shadow-xl p-6 sm:p-10">
        <CalendarView viewType={viewType} tasks={tasks} onAddTask={addNewTask} />
      </main>

      {/* Debug Panel */}
      <section className="mt-12 max-w-[1200px] mx-auto bg-slate-800 border border-slate-700 text-slate-300 rounded-2xl p-6 font-mono text-sm overflow-x-auto">
        <h2 className="mb-4 text-lg font-semibold border-b border-slate-600 pb-2">
          🐛 Debug: Current Tasks
        </h2>
        <pre>{JSON.stringify(tasks, null, 2)}</pre>
      </section>
    </div>
  );
}
