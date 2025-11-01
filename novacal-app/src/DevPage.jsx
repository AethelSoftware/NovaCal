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
  Brain,
  Target,
  Sparkles,
  Code,
  GitBranch,
  Server,
  Database,
  Cpu,
  Terminal,
  Package,
  Workflow,
} from "lucide-react";

export default function DevPage() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.6, ease: "easeOut" } },
  };

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      {/* Soft Background Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black via-[#0a0a0a] to-[#030303]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.05),transparent_60%)]" />

      <div className="relative z-10 flex flex-col items-center p-8 py-16 space-y-20 max-w-7xl mx-auto">
        {/* Hero Header */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center space-y-5"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
              <Code className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Novacal Dev
            </h1>
          </div>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Technical documentation & feature roadmap for Novacal v1.0.0
          </p>
          <div className="flex gap-3 justify-center mt-6">
            <div className="px-3 py-1 bg-white/10 text-blue-300 rounded-full text-sm border border-white/10 backdrop-blur-md">
              MVP Status
            </div>
            <div className="px-3 py-1 bg-white/10 text-green-300 rounded-full text-sm border border-white/10 backdrop-blur-md">
              Active Development
            </div>
          </div>
        </motion.div>

        {/* Current Implementation */}
        <motion.section
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="w-full space-y-8"
        >
          <motion.div variants={itemVariants} className="text-center">
            <h2 className="text-3xl font-bold mb-3 text-blue-300">Current Implementation</h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Core features currently deployed and under active development
            </p>
          </motion.div>

          <motion.div
            variants={containerVariants}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            <TechFeatureCard
              icon={<Calendar className="w-8 h-8" />}
              title="Calendar Engine"
              description="Multi-view calendar system with real-time updates and drag-drop functionality"
              status="Stable"
              tech={["React", "FullCalendar", "IndexedDB"]}
              gradient="from-blue-500/10 to-cyan-500/5"
            />
            <TechFeatureCard
              icon={<Brain className="w-8 h-8" />}
              title="Smart Event System"
              description="Intuitive event creation and management with conflict detection"
              status="Coming Soon"
              tech={["TypeScript", "React Hook Form", "Zod"]}
              gradient="from-purple-500/10 to-pink-500/5"
            />
            <TechFeatureCard
              icon={<LayoutDashboard className="w-8 h-8" />}
              title="Dashboard Core"
              description="Comprehensive overview with widgets and quick actions"
              status="Beta"
              tech={["React", "Recharts", "Framer Motion"]}
              gradient="from-green-500/10 to-emerald-500/5"
            />
            <TechFeatureCard
              icon={<Clock className="w-8 h-8" />}
              title="Habit System"
              description="Automated scheduling around user-defined habits and routines"
              status="Beta"
              tech={["Local Storage", "CRON Logic", "State Machines"]}
              gradient="from-orange-500/10 to-red-500/5"
            />
            <TechFeatureCard
              icon={<Hourglass className="w-8 h-8" />}
              title="Custom Hours"
              description="Flexible working hour configuration with boundary enforcement"
              status="Beta"
              tech={["Time Utilities", "Validation", "Persistent Config"]}
              gradient="from-indigo-500/10 to-blue-500/5"
            />
            <TechFeatureCard
              icon={<Search className="w-8 h-8" />}
              title="Analytics Engine"
              description="Productivity tracking and visualization system"
              status="Alpha"
              tech={["Chart.js", "Data Aggregation", "Local Analytics"]}
              gradient="from-cyan-500/10 to-teal-500/5"
            />
          </motion.div>
        </motion.section>

        {/* Technical Stack */}
        <motion.section
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="w-full space-y-8"
        >
          <div className="text-center">
            <h2 className="text-3xl font-bold mb-3 text-purple-300">Technical Stack</h2>
            <p className="text-gray-400">Technologies powering Novacal's foundation</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { name: "Vite", icon: <Server className="w-5 h-5" />, type: "Framework" },
              { name: "JavaScript", icon: <Terminal className="w-5 h-5" />, type: "Language" },
              { name: "Tailwind CSS", icon: <Package className="w-5 h-5" />, type: "Styling" },
              { name: "Framer Motion", icon: <Workflow className="w-5 h-5" />, type: "Animation" },
              { name: "Supabase", icon: <Database className="w-5 h-5" />, type: "Storage" },
              { name: "TypeScript", icon: <GitBranch className="w-5 h-5" />, type: "Backend" },
              { name: "OAuth", icon: <Cpu className="w-5 h-5" />, type: "Validation" },
              { name: "Lucide Icons", icon: <Sparkles className="w-5 h-5" />, type: "Icons" },
            ].map((tech, index) => (
              <motion.div
                key={tech.name}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white/5 border border-white/10 rounded-xl p-4 text-center backdrop-blur-md hover:bg-white/10 transition-all group"
              >
                <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform text-blue-300">
                  {tech.icon}
                </div>
                <h3 className="font-semibold text-white mb-1">{tech.name}</h3>
                <p className="text-gray-400 text-sm">{tech.type}</p>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Roadmap */}
        <motion.section
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="w-full space-y-8"
        >
          <motion.div variants={itemVariants} className="text-center">
            <h2 className="text-3xl font-bold mb-3 text-green-300">Development Roadmap</h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Planned features and technical improvements for future releases
            </p>
          </motion.div>

          <motion.div
            variants={containerVariants}
            className="grid grid-cols-1 lg:grid-cols-2 gap-6"
          >
            <RoadmapItem
              icon={<Rocket className="w-6 h-6" />}
              title="AI Task Scheduling"
              description="Machine learning powered scheduling optimization and time prediction"
              status="Planned"
              phase="Q2 2024"
              tech={["TensorFlow.js", "ML Models", "Pattern Recognition"]}
            />
            <RoadmapItem
              icon={<Users className="w-6 h-6" />}
              title="Collaboration Suite"
              description="Real-time calendar sharing and team coordination features"
              status="Coming Soon"
              phase="Q3 2024"
              tech={["WebSockets", "CRDT", "Conflict Resolution"]}
            />
            <RoadmapItem
              icon={<Smartphone className="w-6 h-6" />}
              title="Mobile Applications"
              description="Cross-platform mobile apps with offline synchronization"
              status="Coming Soon"
              phase="Q4 2024"
              tech={["React Native", "Expo", "Offline First"]}
            />
            <RoadmapItem
              icon={<Shield className="w-6 h-6" />}
              title="Enhanced Security"
              description="End-to-end encryption and advanced privacy controls"
              status="Backlog"
              phase="Q1 2025"
              tech={["WebCrypto API", "Zero-Knowledge", "OAuth 2.0"]}
            />
            <RoadmapItem
              icon={<Zap className="w-6 h-6" />}
              title="API & Integrations"
              description="RESTful API and third-party service integrations"
              status="Planning"
              phase="Q2 2025"
              tech={["REST API", "Webhooks", "OAuth Integration"]}
            />
            <RoadmapItem
              icon={<Target className="w-6 h-6" />}
              title="Advanced Focus Tools"
              description="ADHD-friendly features and cognitive load optimization"
              status="Research"
              phase="Q3 2025"
              tech={["Behavioral Analytics", "UI/UX Research", "Accessibility"]}
            />
          </motion.div>
        </motion.section>

        {/* Footer */}
        <motion.footer
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="text-center space-y-4 pt-8 border-t border-white/10 w-full"
        >
          <p className="text-gray-500 text-sm">
            &copy; 2025 Novacal Development. Built with modern web technologies.
          </p>
          <div className="flex gap-4 justify-center text-xs text-gray-500">
            <span>Version: 1.0.0</span>
            <span>•</span>
            <span>Last Updated: {new Date().toLocaleDateString()}</span>
            <span>•</span>
            <span>Environment: Development</span>
          </div>
        </motion.footer>
      </div>
    </div>
  );
}

/* --- Components --- */
function TechFeatureCard({ icon, title, description, status, tech, gradient }) {
  return (
    <motion.div
      variants={{
        hidden: { y: 20, opacity: 0 },
        visible: { y: 0, opacity: 1 },
      }}
      className={`bg-gradient-to-br ${gradient} border border-white/10 rounded-xl p-6 backdrop-blur-lg hover:scale-[1.03] hover:shadow-[0_0_20px_rgba(255,255,255,0.1)] transition-all duration-300 group h-full`}
    >
      <div className="flex flex-col h-full">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center group-hover:scale-110 transition-transform">
            <div className="text-white">{icon}</div>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">{title}</h3>
            <div className={`px-2 py-1 rounded-full text-xs ${
              status === "Stable" ? "bg-green-500/20 text-green-300" :
              status === "Beta" ? "bg-yellow-500/20 text-yellow-300" :
              status === "Alpha" ? "bg-blue-500/20 text-blue-300" :
              "bg-purple-500/20 text-purple-300"
            }`}>
              {status}
            </div>
          </div>
        </div>
        <p className="text-gray-300 text-sm mb-4 flex-grow">{description}</p>
        <div className="flex flex-wrap gap-2">
          {tech.map((item, index) => (
            <span
              key={index}
              className="px-2 py-1 bg-white/5 rounded text-xs text-gray-400 border border-white/10"
            >
              {item}
            </span>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

function RoadmapItem({ icon, title, description, status, phase, tech }) {
  return (
    <motion.div
      variants={{
        hidden: { y: 20, opacity: 0 },
        visible: { y: 0, opacity: 1 },
      }}
      className="bg-white/5 border border-white/10 rounded-xl p-6 backdrop-blur-md hover:bg-white/10 transition-all group"
    >
      <div className="flex items-start gap-4 mb-4">
        <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center group-hover:scale-110 transition-transform">
          <div className="text-white">{icon}</div>
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-lg font-semibold text-white">{title}</h3>
            <div className={`px-2 py-1 rounded-full text-xs ${
              status === "Planned" ? "bg-blue-500/20 text-blue-300" :
              status === "Research" ? "bg-purple-500/20 text-purple-300" :
              status === "Design" ? "bg-yellow-500/20 text-yellow-300" :
              status === "Backlog" ? "bg-gray-500/20 text-gray-300" :
              "bg-purple-500/20 text-purple-300"
            }`}>
              {status}
            </div>
          </div>
          <p className="text-gray-300 text-sm mb-3">{description}</p>
          <div className="flex justify-between items-center">
            <div className="flex flex-wrap gap-2">
              {tech.map((item, index) => (
                <span key={index} className="px-2 py-1 bg-white/5 rounded text-xs text-gray-400">
                  {item}
                </span>
              ))}
            </div>
            <span className="text-xs text-gray-500 bg-black/30 px-2 py-1 rounded">{phase}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}