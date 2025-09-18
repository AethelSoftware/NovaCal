import React, { useState, useEffect, useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Clock, Target, CheckCircle2, TrendingUp } from "lucide-react";
import { format, startOfWeek, startOfMonth } from "date-fns";

export default function AnalyticsPage() {
  const [focusSessions, setFocusSessions] = useState([]);
  const [completedTasks, setCompletedTasks] = useState([]);
  const [habits, setHabits] = useState([]);
  const [range, setRange] = useState("week"); // day | week | month
  const [loading, setLoading] = useState(true);

  const greeting =
    new Date().getHours() < 12
      ? "Morning"
      : new Date().getHours() < 18
      ? "Afternoon"
      : "Evening";

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const [fsRes, ctRes, hbRes] = await Promise.all([
          fetch("http://127.0.0.1:5000//api/focus_sessions").then((r) => r.json()),
          fetch("http://127.0.0.1:5000//api/completed_tasks").then((r) => r.json()),
          fetch("http://127.0.0.1:5000//api/habits").then((r) => r.json()).catch(() => []), // optional
        ]);

        // Normalize sessions
        const normalizedFS = fsRes.map((s) => ({
          ...s,
          start_time: new Date(s.start_time),
          duration: Number(s.duration) || 0,
        }));

        // Normalize tasks
        const normalizedCT = ctRes.map((c) => ({
          ...c,
          completion_date: new Date(c.completion_date),
        }));

        setFocusSessions(normalizedFS);
        setCompletedTasks(normalizedCT);
        setHabits(hbRes || []);
      } catch (err) {
        console.error("Error fetching analytics:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  // Aggregate data for chart + stats
  const { chartData, totals } = useMemo(() => {
    const now = new Date();
    let startDate;

    if (range === "day") startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    if (range === "week") startDate = startOfWeek(now, { weekStartsOn: 1 });
    if (range === "month") startDate = startOfMonth(now);

    // Filter relevant sessions and tasks
    const fsInRange = focusSessions.filter((s) => s.start_time >= startDate);
    const ctInRange = completedTasks.filter((c) => c.completion_date >= startDate);

    // Grouped chart data
    const chartMap = {};

    if (range === "day") {
      for (let i = 0; i < 24; i++) {
        chartMap[i] = { label: `${i}:00`, focusedHours: 0, tasksCompleted: 0 };
      }
      fsInRange.forEach((s) => {
        const h = s.start_time.getHours();
        chartMap[h].focusedHours += s.duration / 60;
      });
      ctInRange.forEach((c) => {
        const h = c.completion_date.getHours();
        chartMap[h].tasksCompleted += 1;
      });
    } else if (range === "week") {
      const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
      days.forEach((d) => (chartMap[d] = { label: d, focusedHours: 0, tasksCompleted: 0 }));
      fsInRange.forEach((s) => {
        const day = days[s.start_time.getDay() === 0 ? 6 : s.start_time.getDay() - 1];
        chartMap[day].focusedHours += s.duration / 60;
      });
      ctInRange.forEach((c) => {
        const day = days[c.completion_date.getDay() === 0 ? 6 : c.completion_date.getDay() - 1];
        chartMap[day].tasksCompleted += 1;
      });
    } else if (range === "month") {
      for (let i = 1; i <= 31; i++) {
        chartMap[i] = { label: i.toString(), focusedHours: 0, tasksCompleted: 0 };
      }
      fsInRange.forEach((s) => {
        const day = s.start_time.getDate();
        if (chartMap[day]) chartMap[day].focusedHours += s.duration / 60;
      });
      ctInRange.forEach((c) => {
        const day = c.completion_date.getDate();
        if (chartMap[day]) chartMap[day].tasksCompleted += 1;
      });
    }

    const chartData = Object.values(chartMap);

    const totals = {
      focusedHours: fsInRange.reduce((acc, s) => acc + s.duration / 60, 0),
      sessions: fsInRange.length,
      tasksCompleted: ctInRange.length,
    };

    return { chartData, totals };
  }, [focusSessions, completedTasks, range]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white">
        Loading analytics...
      </div>
    );
  }

  return (
    <div className="min-h-screen dashboard-background p-6 bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900">
      <div className="max-w-7xl mx-auto backdrop-blur-sm rounded-xl shadow-lg border-2 border-white/20 p-6 h-full bg-white/5">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-white">
              Good {greeting}
            </h1>
            <p className="text-stone-400 mt-2 text-lg">
              {format(new Date(), "EEEE, MMMM d, yyyy")}
            </p>
          </div>
          {/* Range Selector */}
          <div className="flex gap-2">
            {["day", "week", "month"].map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`px-4 py-2 rounded-lg text-white ${
                  range === r ? "bg-emerald-500" : "bg-white/10"
                }`}
              >
                {r.charAt(0).toUpperCase() + r.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Main Analytics Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Chart */}
          <div className="lg:col-span-2 p-6 rounded-xl shadow-lg backdrop-blur-md bg-white/10 border border-white/20">
            <h2 className="text-xl font-semibold text-white mb-4">
              {range.charAt(0).toUpperCase() + range.slice(1)} Focus Analytics
            </h2>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={chartData}
                  margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(255,255,255,0.1)"
                  />
                  <XAxis dataKey="label" stroke="white" />
                  <YAxis stroke="white" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgba(0,0,0,0.7)",
                      border: "none",
                      color: "white",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="focusedHours"
                    stroke="#0ea5e9"
                    strokeWidth={3}
                    activeDot={{ r: 6 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="tasksCompleted"
                    stroke="#10b981"
                    strokeWidth={3}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Overview Section */}
            <div className="mt-6 flex items-center gap-3 p-4 rounded-lg bg-emerald-500/10 border border-emerald-400/30">
              <TrendingUp className="w-6 h-6 text-emerald-400" />
              <p className="text-white font-medium">
                Your productivity is being tracked in{" "}
                <span className="text-emerald-400">{range}</span> view
              </p>
            </div>
          </div>

          {/* Right: Stat Cards */}
          <div className="flex flex-col gap-6">
            <div className="p-6 rounded-xl shadow-lg backdrop-blur-md bg-white/10 border border-white/20">
              <div className="flex items-center mb-3">
                <Clock className="w-6 h-6 text-sky-400 mr-2" />
                <h2 className="text-lg font-semibold text-white">
                  Total Focused Time
                </h2>
              </div>
              <p className="text-3xl font-bold text-white">
                {totals.focusedHours.toFixed(1)}h
              </p>
              <p className="text-stone-400 mt-1">This {range}</p>
            </div>

            <div className="p-6 rounded-xl shadow-lg backdrop-blur-md bg-white/10 border border-white/20">
              <div className="flex items-center mb-3">
                <Target className="w-6 h-6 text-purple-400 mr-2" />
                <h2 className="text-lg font-semibold text-white">
                  Focus Sessions
                </h2>
              </div>
              <p className="text-3xl font-bold text-white">{totals.sessions}</p>
              <p className="text-stone-400 mt-1">This {range}</p>
            </div>

            <div className="p-6 rounded-xl shadow-lg backdrop-blur-md bg-white/10 border border-white/20">
              <div className="flex items-center mb-3">
                <CheckCircle2 className="w-6 h-6 text-emerald-400 mr-2" />
                <h2 className="text-lg font-semibold text-white">
                  Tasks Completed
                </h2>
              </div>
              <p className="text-3xl font-bold text-white">
                {totals.tasksCompleted}
              </p>
              <p className="text-stone-400 mt-1">This {range}</p>
            </div>
          </div>
        </div>

        {/* Habits Section */}
        <div className="mt-10 p-6 rounded-xl shadow-lg backdrop-blur-md bg-white/10 border border-white/20">
          <h2 className="text-xl font-semibold text-white mb-4">Habits Overview</h2>
          {habits.length === 0 ? (
            <p className="text-stone-400">No habit data available yet.</p>
          ) : (
            <ul className="space-y-2">
              {habits.map((h) => (
                <li key={h.id} className="text-white">
                  {h.name}: <span className="text-emerald-400">{h.total_minutes || 0} min</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
