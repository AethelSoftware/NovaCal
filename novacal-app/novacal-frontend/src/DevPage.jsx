"use client";

import React from "react";
import { motion } from "framer-motion";
import { Calendar, Plus, Search, Clock, CheckCircle2, Trash2 } from "lucide-react";

export default function DevPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col items-center p-6 space-y-10">
      
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-2"
      >
        <h1 className="text-4xl font-bold tracking-wide">Novacal Devpage</h1>
        <p className="text-gray-400 max-w-xl mx-auto">
          Explore all the features of the app with dummy content for now. Fully glassmorphic and ergonomic UI.
        </p>
      </motion.div>

      {/* Main Features Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 w-full max-w-6xl">
        
        {/* Feature Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 flex flex-col items-center space-y-4 hover:scale-105 transition-transform"
        >
          <Calendar className="w-12 h-12 text-purple-400" />
          <h2 className="text-xl font-semibold">View Calendar</h2>
          <p className="text-gray-300 text-center">
            Navigate daily, weekly, or monthly views. Dummy events populate each day.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 flex flex-col items-center space-y-4 hover:scale-105 transition-transform"
        >
          <Plus className="w-12 h-12 text-green-400" />
          <h2 className="text-xl font-semibold">Add Tasks & Events</h2>
          <p className="text-gray-300 text-center">
            Click to create new tasks or events. All inputs are dummy for demonstration.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 flex flex-col items-center space-y-4 hover:scale-105 transition-transform"
        >
          <Clock className="w-12 h-12 text-yellow-400" />
          <h2 className="text-xl font-semibold">Set Reminders</h2>
          <p className="text-gray-300 text-center">
            Dummy reminders can be set for tasks. Visual cues indicate upcoming events.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 flex flex-col items-center space-y-4 hover:scale-105 transition-transform"
        >
          <CheckCircle2 className="w-12 h-12 text-blue-400" />
          <h2 className="text-xl font-semibold">Mark Tasks Complete</h2>
          <p className="text-gray-300 text-center">
            Check off tasks to see your progress. All task states are dummy for now.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 flex flex-col items-center space-y-4 hover:scale-105 transition-transform"
        >
          <Trash2 className="w-12 h-12 text-red-400" />
          <h2 className="text-xl font-semibold">Delete Tasks/Events</h2>
          <p className="text-gray-300 text-center">
            Remove unwanted items quickly. Placeholder actions for demo purposes.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 flex flex-col items-center space-y-4 hover:scale-105 transition-transform"
        >
          <Search className="w-12 h-12 text-pink-400" />
          <h2 className="text-xl font-semibold">Search Events</h2>
          <p className="text-gray-300 text-center">
            Quickly find tasks or events using our search bar. Demo results shown here.
          </p>
        </motion.div>
      </div>

      {/* Dummy Calendar Preview */}

      {/* Footer */}
      <p className="text-gray-500 text-sm mt-10">
        &copy; 2025 Calendar App Demo. All content is dummy.
      </p>
    </div>
  );
}
