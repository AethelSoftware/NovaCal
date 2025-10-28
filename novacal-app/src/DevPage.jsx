"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  Calendar,
  Search,
  Clock,
  LayoutDashboard,
  CheckCheck,
  Hourglass,
  Rocket,
  Users,
  Shield,
  Smartphone,
  Zap,
} from "lucide-react";

export default function DevPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col items-center p-10 py-14 space-y-10">
      
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-2"
      >
        <h1 className="text-4xl font-bold tracking-wide">Novacal Devpage</h1>
        <p className="text-gray-400 max-w-xl mx-auto">
          Explore all the features of Novacal v 1.0.0!
        </p>
      </motion.div>

      {/* Main Features Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 w-full max-w-6xl">
        
        {/* Feature Cards */}
        <FeatureCard
          icon={<Calendar className="w-12 h-12 text-purple-400" />}
          title="View Calendar"
          desc="Navigate your calendar with several views for convenience. Click on task blocks for more details."
        />
        <FeatureCard
          icon={<CheckCheck className="w-12 h-12 text-green-400" />}
          title="Easy to use"
          desc="The greatest advantage of Novacal is its simplicity, no need to learn complex UI through tutorials."
        />
        <FeatureCard
          icon={<Clock className="w-12 h-12 text-yellow-400" />}
          title="Set Habits"
          desc="Set time for habits so Novacal will automatically schedule around them."
        />
        <FeatureCard
          icon={<Hourglass className="w-12 h-12 text-blue-400" />}
          title="Set Custom Hours"
          desc="Set your own custom working hours so Novacal can help you achieve your tasks within the time frame."
        />
        <FeatureCard
          icon={<LayoutDashboard className="w-12 h-12 text-red-400" />}
          title="Comprehensive Dashboard Page"
          desc="Enjoy a dashboard page designed for your ease of use."
        />
        <FeatureCard
          icon={<Search className="w-12 h-12 text-pink-400" />}
          title="Analytics"
          desc="Track your productivity through our comprehensive analytics page."
        />
      </div>

      {/* Future Roadmap Section */}
      <div className="w-full max-w-6xl mt-20 space-y-6">
        <h2 className="text-3xl font-bold text-center mb-8 text-sky-300">
          What’s Next for Novacal
        </h2>

        <div className="flex flex-col space-y-4">
          <FutureRow
            icon={<Rocket className="w-6 h-6 text-purple-400" />}
            title="AI-powered Task Suggestions"
            desc="Leverage machine learning to suggest optimal times for your tasks and habits based on past patterns."
          />
          <FutureRow
            icon={<Users className="w-6 h-6 text-green-400" />}
            title="Collaboration Features"
            desc="Share calendars, assign tasks, and plan events together with your team or family."
          />
          <FutureRow
            icon={<Smartphone className="w-6 h-6 text-yellow-400" />}
            title="Cross-Platform Mobile App"
            desc="Seamless syncing between web, iOS, and Android so you can take Novacal on the go."
          />
          <FutureRow
            icon={<Shield className="w-6 h-6 text-blue-400" />}
            title="Advanced Privacy Controls"
            desc="Enhanced encryption and customizable privacy settings to keep your data secure."
          />
          <FutureRow
            icon={<Zap className="w-6 h-6 text-pink-400" />}
            title="Integrations"
            desc="Sync with tools like Google Calendar, Notion, or Slack to bring everything into one hub."
          />
        </div>
      </div>

      {/* Footer */}
      <p className="text-gray-500 text-sm mt-16">
        &copy; 2025 Calendar App Demo. All content is dummy.
      </p>
    </div>
  );
}

/* Reusable Feature Card */
function FeatureCard({ icon, title, desc }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 flex flex-col items-center space-y-4 hover:scale-105 transition-transform"
    >
      {icon}
      <h2 className="text-xl font-semibold">{title}</h2>
      <p className="text-gray-300 text-center">{desc}</p>
    </motion.div>
  );
}

/* Reusable Horizontal Row */
function FutureRow({ icon, title, desc }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -30 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex items-center gap-6 bg-white/5 backdrop-blur-md border border-white/10 rounded-xl px-6 py-4 hover:bg-white/10 transition-colors"
    >
      <div className="flex-shrink-0">{icon}</div>
      <div>
        <h3 className="text-lg font-semibold">{title}</h3>
        <p className="text-gray-300 text-sm">{desc}</p>
      </div>
    </motion.div>
  );
}
