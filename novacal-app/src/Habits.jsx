"use client";
import React, { useState, useEffect } from "react";
import {
  CheckCircle2,
  Plus,
  Trash2,
  Search,
  Save,
  Clock,
  Calendar,
  Target,
  BarChart3
} from "lucide-react";

import AddHabitModal from "./components/habits/HabitsModal";
import IconGrid from "./components/habits/IconGrid";
import { authedFetch } from "./api";

const ALL_DAYS = [
  "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday",
];
const WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const WEEKENDS = ["Saturday", "Sunday"];

export default function HabitsPage() {
  const [habits, setHabits] = useState({});
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedHabitId, setSelectedHabitId] = useState(null);
  const [editIcon, setEditIcon] = useState(null);
  const [editDescription, setEditDescription] = useState("");
  const [scheduleMode, setScheduleMode] = useState("custom");
  const [timeRange, setTimeRange] = useState({ start: "09:00", end: "10:00" });
  const [customDays, setCustomDays] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    async function fetchHabits() {
      setLoading(true);
      try {
        const res = await authedFetch("habits");
        if (!res.ok) throw new Error("Failed to load habits");
        const data = await res.json();
        if (!mounted) return;
        const mapped = {};
        data.forEach((h) => {
          mapped[h.id] = { ...h, icon: CheckCircle2 };
        });
        setHabits(mapped);
        setError(null);
      } catch (err) {
        setError("Error loading habits");
        setHabits({});
      } finally {
        setLoading(false);
      }
    }
    fetchHabits();
    return () => { mounted = false; };
  }, []);

  // Calculate stats
  const calculateStats = () => {
    const totalHabits = Object.keys(habits).length;
    
    // Calculate total time (in hours)
    let totalTime = 0;
    Object.values(habits).forEach(habit => {
      habit.schedules?.forEach(schedule => {
        const start = new Date(`2000-01-01T${schedule.start}`);
        const end = new Date(`2000-01-01T${schedule.end}`);
        const hours = (end - start) / (1000 * 60 * 60);
        totalTime += hours;
      });
    });

    // Calculate average habits per day
    const dayCounts = {};
    ALL_DAYS.forEach(day => dayCounts[day] = 0);
    Object.values(habits).forEach(habit => {
      habit.schedules?.forEach(schedule => {
        dayCounts[schedule.day]++;
      });
    });
    const avgHabitsPerDay = Object.values(dayCounts).reduce((a, b) => a + b, 0) / 7;

    return {
      totalHabits,
      totalTime: Math.round(totalTime * 10) / 10,
      avgHabitsPerDay: Math.round(avgHabitsPerDay * 10) / 10
    };
  };

  const stats = calculateStats();

  function buildSchedulesFromEdit() {
    switch (scheduleMode) {
      case "all":
        return ALL_DAYS.map((d) => ({ day: d, start: timeRange.start, end: timeRange.end }));
      case "weekdays":
        return WEEKDAYS.map((d) => ({ day: d, start: timeRange.start, end: timeRange.end }));
      case "weekends":
        return WEEKENDS.map((d) => ({ day: d, start: timeRange.start, end: timeRange.end }));
      case "custom":
        return customDays;
      default:
        return [];
    }
  }

  function openDetailModal(habitId) {
    const habit = habits[habitId];
    setSelectedHabitId(habitId);
    setEditIcon(habit.icon ? { name: habit.icon.name, icon: habit.icon } : null);
    setEditDescription(habit.description || "");
    const scheds = habit.schedules || [];

    if (!scheds.length) {
      setScheduleMode("custom");
      setCustomDays([]);
      setTimeRange({ start: "09:00", end: "10:00" });
      return;
    }
    const daysSet = new Set(scheds.map((s) => s.day));
    const uniqueTimes = new Set(scheds.map((s) => s.start + "-" + s.end));
    if (daysSet.size === 7 && uniqueTimes.size === 1) {
      setScheduleMode("all");
      setTimeRange({ start: scheds[0].start, end: scheds[0].end });
      setCustomDays([]);
      return;
    }
    const isWeekdays = WEEKDAYS.every((d) => daysSet.has(d)) && daysSet.size === WEEKDAYS.length;
    if (isWeekdays && uniqueTimes.size === 1) {
      setScheduleMode("weekdays");
      setTimeRange({ start: scheds[0].start, end: scheds[0].end });
      setCustomDays([]);
      return;
    }
    const isWeekends = WEEKENDS.every((d) => daysSet.has(d)) && daysSet.size === WEEKENDS.length;
    if (isWeekends && uniqueTimes.size === 1) {
      setScheduleMode("weekends");
      setTimeRange({ start: scheds[0].start, end: scheds[0].end });
      setCustomDays([]);
      return;
    }
    setScheduleMode("custom");
    setCustomDays(scheds.map((s) => ({ day: s.day, start: s.start, end: s.end })));
  }

  async function saveHabitDetails() {
    if (!selectedHabitId) return;
    const habit = habits[selectedHabitId];
    const updatedHabit = {
      ...habit,
      icon: editIcon ? editIcon.icon : habit.icon,
      description: editDescription,
      schedules: buildSchedulesFromEdit(),
    };
    try {
      const res = await authedFetch(`habits/${selectedHabitId}`, {
        method: "PATCH",
        body: JSON.stringify(updatedHabit),
      });
      if (!res.ok) throw new Error("Failed to update habit");
      const data = await res.json();
      setHabits((prev) => ({ ...prev, [data.id]: { ...data, icon: CheckCircle2 } }));
      setSelectedHabitId(null);
    } catch (err) {
      alert("Error saving habit: " + err.message);
    }
  }

  async function handleRemoveHabit(id) {
    try {
      const res = await authedFetch(`habits/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete habit");
      setHabits((prev) => {
        const copy = { ...prev };
        delete copy[id];
        return copy;
      });
      setSelectedHabitId(null);
    } catch (err) {
      alert("Error deleting habit: " + err.message);
    }
  }

  function updateCustomDay(index, field, value) {
    setCustomDays((prev) => prev.map((d, i) => (i === index ? { ...d, [field]: value } : d)));
  }
  function addCustomDay() {
    const usedDays = new Set(customDays.map((d) => d.day));
    const available = ALL_DAYS.filter((d) => !usedDays.has(d));
    if (available.length === 0) return;
    setCustomDays((prev) => [
      ...prev, { day: available[0], start: "09:00", end: "10:00" },
    ]);
  }
  function removeCustomDay(index) {
    setCustomDays((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSaveHabit(newHabit) {
    try {
      const res = await authedFetch("habits", {
        method: "POST",
        body: JSON.stringify({
          name: newHabit.name,
          description: newHabit.description,
          icon: "CheckCircle2",
          schedules: newHabit.days.map((day) => ({
            day,
            start: "09:00",
            end: "10:00",
          })),
          file: newHabit.file,
        }),
      });
      if (!res.ok) throw new Error("Failed to create habit");
      const data = await res.json();
      setHabits((prev) => ({ ...prev, [data.id]: { ...data, icon: CheckCircle2 } }));
      setModalOpen(false);
    } catch (err) {
      setError("Error creating habit");
    }
  }

  const filteredHabits = Object.values(habits).filter((h) =>
    h.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  function renderHabitCard(habit) {
    const Icon = habit.icon;
    return (
      <div
        key={habit.id}
        className="group p-6 rounded-2xl bg-white/10 border border-white/20 backdrop-blur-md
                   shadow-xl hover:shadow-2xl transition-all duration-300 cursor-pointer transform hover:-translate-y-1"
        onClick={() => openDetailModal(habit.id)}
      >
        <div className="flex items-center gap-4 mb-3">
          <div className="rounded-2xl bg-gradient-to-br from-emerald-400/20 to-blue-400/20 p-3 border border-white/10">
            {Icon && <Icon className="text-emerald-400 w-6 h-6" />}
          </div>
          <div className="flex-1">
            <p className="text-white font-bold text-lg">{habit.name}</p>
            <p className="text-gray-300 text-sm flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {habit.schedules.map((s) => s.day).join(", ")}
            </p>
          </div>
        </div>
        {habit.description && (
          <p className="text-gray-300 text-sm line-clamp-2 mb-3">{habit.description}</p>
        )}
        <div className="flex items-center gap-2 text-gray-400 text-xs">
          <Clock className="w-3 h-3" />
          {habit.schedules.slice(0, 2).map((s, i) => (
            <span key={i} className="bg-white/10 px-2 py-1 rounded-full">
              {s.start} - {s.end}
            </span>
          ))}
          {habit.schedules.length > 2 && (
            <span className="bg-white/10 px-2 py-1 rounded-full">
              +{habit.schedules.length - 2} more
            </span>
          )}
        </div>
      </div>
    );
  }

  return (
    <main className="relative min-h-screen w-full habits-background px-6 py-8">
      {/* Original background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#2312457e] via-[#00ffc030] to-[#0a0a0ab4] opacity-70 pointer-events-none z-0" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(0,255,180,0.11),transparent_70%)] z-0 pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="p-6 rounded-2xl bg-white/10 border border-white/20 backdrop-blur-md shadow-xl">
            <div className="flex items-center gap-4">
              <div className="rounded-xl bg-blue-500/20 p-3">
                <BarChart3 className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats.totalHabits}</p>
                <p className="text-gray-300 text-sm">Total Habits</p>
              </div>
            </div>
          </div>
          
          <div className="p-6 rounded-2xl bg-white/10 border border-white/20 backdrop-blur-md shadow-xl">
            <div className="flex items-center gap-4">
              <div className="rounded-xl bg-emerald-500/20 p-3">
                <Clock className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats.totalTime}h</p>
                <p className="text-gray-300 text-sm">Weekly Time</p>
              </div>
            </div>
          </div>
          
          <div className="p-6 rounded-2xl bg-white/10 border border-white/20 backdrop-blur-md shadow-xl">
            <div className="flex items-center gap-4">
              <div className="rounded-xl bg-purple-500/20 p-3">
                <Target className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats.avgHabitsPerDay}</p>
                <p className="text-gray-300 text-sm">Avg Per Day</p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="p-8 rounded-3xl bg-white/10 border border-white/20 backdrop-blur-xl shadow-2xl">
          <div className="flex items-center justify-between mb-8">
            <h2 className="flex items-center text-3xl font-bold text-white drop-shadow-lg">
              <CheckCircle2 className="w-8 h-8 mr-3 text-sky-400" />
              Daily Habits
            </h2>
            <div className="flex items-center gap-3">
              {error && (
                <div className="text-red-400 text-sm">
                  {error}
                </div>
              )}
              <button
                type="button"
                onClick={() => setModalOpen(true)}
                className="px-6 py-3 rounded-full font-semibold shadow-lg transition-all duration-300 border border-white/10
                           bg-gradient-to-r from-sky-600 to-blue-500 text-white hover:opacity-90 hover:scale-105 flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Add Habit
              </button>
            </div>
          </div>

          {/* Search */}
          <div className="relative mb-8">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search habits..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-xl bg-black/40 border border-white/20 text-white 
                         placeholder-gray-400 focus:ring-2 focus:ring-sky-500 transition-all duration-300"
            />
          </div>

          {/* Habits Grid */}
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-500 mx-auto"></div>
              <p className="text-gray-400 mt-4">Loading habits...</p>
            </div>
          ) : filteredHabits.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredHabits.map((habit) => renderHabitCard(habit))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center">
                <Target className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-400 text-lg">No habits found</p>
              <p className="text-gray-500 text-sm mt-2">
                {searchTerm ? "Try a different search term" : "Create your first habit to get started"}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Add Habit Modal */}
      <AddHabitModal open={modalOpen} onClose={() => setModalOpen(false)} onSave={handleSaveHabit} />

      {/* Edit Modal - Original Version */}
      {selectedHabitId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 backdrop-blur-sm">
          <div
            className="bg-zinc-950 rounded-2xl max-h-[85vh] w-full max-w-2xl flex flex-col shadow-2xl text-white border border-zinc-800 overflow-hidden"
          >
            {/* Header */}
            <div className="flex justify-between items-center px-6 py-4 border-b border-zinc-800 bg-zinc-900/50">
              <h3 className="text-xl font-semibold text-white">Edit Habit</h3>
              <button
                onClick={() => setSelectedHabitId(null)}
                className="text-zinc-400 hover:text-red-400 transition"
                title="Close"
              >
                ✕
              </button>
            </div>

            {/* Scrollable content */}
            <div className="overflow-y-auto flex-1 p-6 space-y-6">
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Name</label>
                <p className="font-medium text-lg text-white">
                  {habits[selectedHabitId].name}
                </p>
              </div>

              <div>
                <label className="block text-sm text-zinc-400 mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full rounded-lg bg-zinc-900 border border-zinc-700 p-2 text-white focus:outline-none focus:ring-1 focus:ring-zinc-500"
                  placeholder="Description (optional)"
                />
              </div>
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Icon</label>
                <IconGrid selected={editIcon} onSelect={setEditIcon} />
              </div>
              <div>
                <label className="block text-sm text-zinc-400 mb-2">Schedules</label>
                <select
                  value={scheduleMode}
                  onChange={(e) => setScheduleMode(e.target.value)}
                  className="rounded-lg bg-zinc-900 border border-zinc-700 px-3 py-2 text-white focus:ring-1 focus:ring-zinc-500"
                >
                  <option value="all">All Week</option>
                  <option value="weekdays">Weekdays (Mon-Fri)</option>
                  <option value="weekends">Weekends (Sat-Sun)</option>
                  <option value="custom">Custom</option>
                </select>
              </div>
              {(scheduleMode === "all" ||
                scheduleMode === "weekdays" ||
                scheduleMode === "weekends") && (
                <div className="flex items-center gap-3">
                  <label className="text-sm text-zinc-400">Start:</label>
                  <input
                    type="time"
                    value={timeRange.start}
                    onChange={(e) =>
                      setTimeRange((prev) => ({
                        ...prev,
                        start: e.target.value,
                      }))
                    }
                    className="rounded-lg bg-zinc-900 border border-zinc-700 p-2 text-white focus:ring-1 focus:ring-zinc-500 w-[110px]"
                  />
                  <label className="text-sm text-zinc-400">End:</label>
                  <input
                    type="time"
                    value={timeRange.end}
                    onChange={(e) =>
                      setTimeRange((prev) => ({
                        ...prev,
                        end: e.target.value,
                      }))
                    }
                    className="rounded-lg bg-zinc-900 border border-zinc-700 p-2 text-white focus:ring-1 focus:ring-zinc-500 w-[110px]"
                  />
                </div>
              )}

              {scheduleMode === "custom" && (
                <div className="space-y-3">
                  {customDays.map((sched, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 flex-wrap bg-zinc-900/60 border border-zinc-800 rounded-xl p-3"
                    >
                      <select
                        value={sched.day}
                        onChange={(e) => updateCustomDay(index, "day", e.target.value)}
                        className="rounded-lg bg-zinc-900 border border-zinc-700 px-2 py-1 text-white"
                      >
                        {ALL_DAYS.map((day) => (
                          <option key={day} value={day}>
                            {day}
                          </option>
                        ))}
                      </select>
                      <input
                        type="time"
                        value={sched.start}
                        onChange={(e) => updateCustomDay(index, "start", e.target.value)}
                        className="rounded-lg bg-zinc-900 border border-zinc-700 px-2 py-1 text-white"
                      />
                      <span className="text-zinc-400">to</span>
                      <input
                        type="time"
                        value={sched.end}
                        onChange={(e) => updateCustomDay(index, "end", e.target.value)}
                        className="rounded-lg bg-zinc-900 border border-zinc-700 px-2 py-1 text-white"
                      />
                      <button
                        onClick={() => removeCustomDay(index)}
                        className="text-red-400 hover:text-red-600 px-2"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={addCustomDay}
                    className="px-3 py-1 rounded-lg bg-emerald-700 text-white hover:bg-emerald-600"
                    disabled={customDays.length >= 7}
                  >
                    + Add Day
                  </button>
                </div>
              )}
            </div>
            {/* Modal Footer */}
            <div className="flex justify-end gap-3 px-6 py-4 border-t border-zinc-800 bg-zinc-900/50">
              <button
                onClick={() => handleRemoveHabit(selectedHabitId)}
                className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 flex gap-2 items-center shadow-md"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => saveHabitDetails()}
                className="px-5 py-2 rounded-lg bg-sky-900/80 hover:bg-sky-900 text-white font-medium transition flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                Save
              </button>
              <button
                onClick={() => setSelectedHabitId(null)}
                className="px-4 py-2 rounded-lg border border-white/20 bg-transparent hover:bg-white/20 text-white transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}