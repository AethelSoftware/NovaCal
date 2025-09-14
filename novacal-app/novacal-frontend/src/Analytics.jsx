import React from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Clock, Target, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";

const dummyData = [
  { day: "Mon", focusedHours: 2, tasksCompleted: 3 },
  { day: "Tue", focusedHours: 3, tasksCompleted: 2 },
  { day: "Wed", focusedHours: 1.5, tasksCompleted: 5 },
  { day: "Thu", focusedHours: 4, tasksCompleted: 4 },
  { day: "Fri", focusedHours: 3.5, tasksCompleted: 3 },
  { day: "Sat", focusedHours: 2, tasksCompleted: 2 },
  { day: "Sun", focusedHours: 1, tasksCompleted: 1 },
];

export default function AnalyticsPage() {
  const greeting = new Date().getHours() < 12
    ? "Morning"
    : new Date().getHours() < 18
    ? "Afternoon"
    : "Evening";

  return (
    <div className="min-h-screen dashboard-background p-6 bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900">
      <div className="max-w-7xl mx-auto backdrop-blur-sm rounded-xl shadow-lg border-2 border-white/20 p-6 h-full bg-white/5">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-white">
              Good {greeting}
            </h1>
            <p className="text-stone-400 mt-2 text-lg">{format(new Date(), "EEEE, MMMM d, yyyy")}</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <div className="p-6 rounded-xl shadow-lg backdrop-blur-md bg-white/10 border border-white/20">
            <div className="flex items-center mb-3">
              <Clock className="w-6 h-6 text-sky-400 mr-2" />
              <h2 className="text-lg font-semibold text-white">Total Focused Time</h2>
            </div>
            <p className="text-3xl font-bold text-white">15h</p>
            <p className="text-stone-400 mt-1">This week</p>
          </div>
          <div className="p-6 rounded-xl shadow-lg backdrop-blur-md bg-white/10 border border-white/20">
            <div className="flex items-center mb-3">
              <Target className="w-6 h-6 text-purple-400 mr-2" />
              <h2 className="text-lg font-semibold text-white">Focus Sessions</h2>
            </div>
            <p className="text-3xl font-bold text-white">12</p>
            <p className="text-stone-400 mt-1">This week</p>
          </div>
          <div className="p-6 rounded-xl shadow-lg backdrop-blur-md bg-white/10 border border-white/20">
            <div className="flex items-center mb-3">
              <CheckCircle2 className="w-6 h-6 text-emerald-400 mr-2" />
              <h2 className="text-lg font-semibold text-white">Tasks Completed</h2>
            </div>
            <p className="text-3xl font-bold text-white">18</p>
            <p className="text-stone-400 mt-1">This week</p>
          </div>
        </div>

        {/* Analytics Chart */}
        <div className="p-6 rounded-xl shadow-lg backdrop-blur-md bg-white/10 border border-white/20 h-96">
          <h2 className="text-xl font-semibold text-white mb-4">Weekly Focus Analytics</h2>
          <ResponsiveContainer width="100%" height="85%">
            <LineChart data={dummyData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="day" stroke="white" />
              <YAxis stroke="white" />
              <Tooltip contentStyle={{ backgroundColor: "rgba(255,255,255,0.1)", border: "none", color: "white" }} />
              <Line type="monotone" dataKey="focusedHours" stroke="#0ea5e9" strokeWidth={3} activeDot={{ r: 6 }} />
              <Line type="monotone" dataKey="tasksCompleted" stroke="#10b981" strokeWidth={3} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
