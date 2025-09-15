import React, { useState, useEffect } from "react";
import {
  CheckCircle2,
  Plus,
  Trash2,
  Search,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import AddHabitModal from "./components/habits/HabitsModal";
import IconGrid from "./components/habits/IconGrid";

const ALL_DAYS = [
  "Monday", "Tuesday", "Wednesday",
  "Thursday", "Friday", "Saturday", "Sunday",
];

const WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const WEEKENDS = ["Saturday", "Sunday"];

const DUMMY_HABITS = {
  1: {
    id: 1,
    name: "Lunch Break",
    description: "Take a mindful pause",
    icon: CheckCircle2,
    file: null,
    schedules: [
      { day: "Monday", start: "12:00", end: "13:00" }
    ],
  },
  2: {
    id: 2,
    name: "Coffee Break",
    description: "Grab a quick coffee",
    icon: CheckCircle2,
    file: null,
    schedules: [
      { day: "Monday", start: "10:00", end: "10:15" },
      { day: "Wednesday", start: "10:00", end: "10:15" },
    ],
  },
};

export default function HabitsPage() {
  const [habits, setHabits] = useState(DUMMY_HABITS);

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedHabitId, setSelectedHabitId] = useState(null);
  const [editIcon, setEditIcon] = useState(null);
  const [editDescription, setEditDescription] = useState("");
  const [scheduleMode, setScheduleMode] = useState("custom");
  const [timeRange, setTimeRange] = useState({ start: "09:00", end: "10:00" });
  const [customDays, setCustomDays] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");


  useEffect(() => {
    // Load habits from backend or fallback to dummy
    async function fetchHabits() {
      try {
        const res = await fetch("/api/habits");
        if (!res.ok) throw new Error("Failed to load habits");
        const data = await res.json();
        const mapped = {};
        data.forEach(h => {
          mapped[h.id] = {
            ...h,
            icon: CheckCircle2, // Adjust icon mapping as needed
          };
        });
        setHabits(mapped);
      } catch {
        setHabits(DUMMY_HABITS);
      }
    }
    fetchHabits();
  }, []);

  // Schedule building based on mode
  function buildSchedulesFromEdit() {
    switch (scheduleMode) {
      case "all":
        return ALL_DAYS.map((day) => ({
          day,
          start: timeRange.start,
          end: timeRange.end,
        }));
      case "weekdays":
        return WEEKDAYS.map((day) => ({
          day,
          start: timeRange.start,
          end: timeRange.end,
        }));
      case "weekends":
        return WEEKENDS.map((day) => ({
          day,
          start: timeRange.start,
          end: timeRange.end,
        }));
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
    if (
      daysSet.size === 7 &&
      uniqueTimes.size === 1
    ) {
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
    setCustomDays(
      scheds.map((s) => ({ day: s.day, start: s.start, end: s.end }))
    );
  }

  async function saveHabitDetails() {
    if (!selectedHabitId) return;
    const habit = habits[selectedHabitId];
    const updatedHabit = {
      ...habit,
      icon: editIcon ? editIcon.icon : habit.icon,
      description: editDescription,
      schedules: buildSchedulesFromEdit()
    };
    try {
      const res = await fetch(`/api/habits/${selectedHabitId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedHabit),
      });
      if (!res.ok) throw new Error("Failed to update habit");
      const data = await res.json();
      setHabits((prev) => ({
        ...prev,
        [data.id]: { ...data, icon: CheckCircle2 },
      }));
      setSelectedHabitId(null);
    } catch (err) {
      alert("Error saving habit: " + err.message);
    }
  }

  async function handleRemoveHabit(id) {
    try {
      const res = await fetch(`/api/habits/${id}`, { method: "DELETE" });
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
    setCustomDays((prev) =>
      prev.map((d, i) => (i === index ? { ...d, [field]: value } : d))
    );
  }

  function addCustomDay() {
    const usedDays = new Set(customDays.map((d) => d.day));
    const available = ALL_DAYS.filter((d) => !usedDays.has(d));
    if (available.length === 0) return;
    setCustomDays((prev) => [
      ...prev,
      { day: available[0], start: "09:00", end: "10:00" },
    ]);
  }

  function removeCustomDay(index) {
    setCustomDays((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSaveHabit(newHabit) {
    try {
      const res = await fetch("/api/habits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newHabit.name,
          description: newHabit.description,
          icon: "CheckCircle2",
          schedules: newHabit.days.map(day => ({ day, start: "09:00", end: "10:00" })),
          file: newHabit.file,
        }),
      });
      if (!res.ok) throw new Error("Failed to create habit");
      const data = await res.json();
      setHabits((prev) => ({
        ...prev,
        [data.id]: { ...data, icon: CheckCircle2 },
      }));
      setModalOpen(false);
    } catch (err) {
      alert("Error creating habit: " + err.message);
    }
  }

  const filteredHabits = Object.values(habits).filter((habit) =>
    habit.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <main className="habits-background p-10 w-full min-h-screen">
      <div className="mb-10 p-6 rounded-xl bg-white/10 shadow-lg border border-white/10 backdrop-blur-sm min-h-screen">
        <div className="flex items-center justify-between mb-6">
          <h2 className="flex items-center text-2xl font-semibold text-white drop-shadow-glow">
            <CheckCircle2 className="w-6 h-6 mr-2 text-sky-400" />
            Daily Habits
          </h2>
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/20 hover:bg-white/30 text-white font-semibold cursor-pointer duration-200"
          >
            <Plus className="w-5 h-5" />
            Add Habit
          </button>
        </div>

        <div className="relative mb-6 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search habits..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-3 py-2 rounded-lg bg-white/5 border border-white/20 text-white placeholder-gray-400 focus:outline-none"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {filteredHabits.length > 0 ? (
            filteredHabits.map((habit) => {
              const Icon = habit.icon;
              return (
                <motion.div
                  key={habit.id}
                  whileHover={{ scale: 1.03 }}
                  className="cursor-pointer relative rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all shadow-md p-4 flex flex-col"
                  onClick={() => openDetailModal(habit.id)}
                >
                  <div className="flex items-center gap-3">
                    <span className="rounded-full bg-emerald-400/30 flex items-center justify-center px-2 py-2">
                      {Icon && <Icon className="text-emerald-400 w-6 h-6" />}
                    </span>
                    <div>
                      <p className="text-white font-medium text-lg">{habit.name}</p>
                      <p className="text-gray-400 text-sm">
                        {habit.schedules.map((s) => s.day).join(", ")}
                      </p>
                    </div>
                  </div>
                  {habit.description && (
                    <p className="text-gray-300 text-sm mt-2 line-clamp-2">
                      {habit.description}
                    </p>
                  )}
                </motion.div>
              );
            })
          ) : (
            <p className="text-gray-400 col-span-full text-center">
              No habits found.
            </p>
          )}
        </div>
      </div>

      <AddHabitModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSaveHabit}
      />

      <AnimatePresence>
        {selectedHabitId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          >
            <motion.div
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 40, opacity: 0 }}
              className="bg-gray-900 w-full max-w-2xl rounded-xl shadow-2xl p-6 relative border border-white/20 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-2xl font-bold text-white">Edit Habit</h3>
                <button
                  onClick={() => setSelectedHabitId(null)}
                  className="text-gray-400 hover:text-white"
                >
                  ✕
                </button>
              </div>

              <label className="block text-white font-semibold mb-2">Name</label>
              <p className="mb-4 text-white font-medium text-lg">
                {habits[selectedHabitId].name}
              </p>

              <label className="block text-white font-semibold mb-2">
                Description
              </label>
              <textarea
                rows={3}
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                className="w-full rounded-lg p-2 mb-4 bg-white/5 border border-white/20 text-white placeholder-gray-400"
                placeholder="Description (optional)"
              />

              <label className="block text-white font-semibold mb-2">Icon</label>
              <IconGrid selected={editIcon} onSelect={setEditIcon} />

              <label className="block text-white font-semibold mb-4 mt-6">
                Schedules
              </label>

              <select
                value={scheduleMode}
                onChange={(e) => setScheduleMode(e.target.value)}
                className="rounded-lg p-2 mb-4 bg-white/5 border border-white/20 text-white max-w-max"
              >
                <option value="all">All Week</option>
                <option value="weekdays">Weekdays (Mon-Fri)</option>
                <option value="weekends">Weekends (Sat-Sun)</option>
                <option value="custom">Custom</option>
              </select>

              {(scheduleMode === "all" || scheduleMode === "weekdays" || scheduleMode === "weekends") && (
                <div className="flex items-center gap-3 mb-4 flex-wrap max-w-sm">
                  <label className="text-white whitespace-nowrap">Start:</label>
                  <input
                    type="time"
                    value={timeRange.start}
                    onChange={(e) =>
                      setTimeRange((prev) => ({ ...prev, start: e.target.value }))
                    }
                    className="rounded-lg p-1 bg-white/5 border border-white/20 text-white max-w-[100px]"
                  />
                  <label className="text-white whitespace-nowrap">End:</label>
                  <input
                    type="time"
                    value={timeRange.end}
                    onChange={(e) =>
                      setTimeRange((prev) => ({ ...prev, end: e.target.value }))
                    }
                    className="rounded-lg p-1 bg-white/5 border border-white/20 text-white max-w-[100px]"
                  />
                </div>
              )}

              {scheduleMode === "custom" && (
                <>
                  {customDays.map((sched, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 mb-3 flex-wrap max-w-full"
                    >
                      <select
                        value={sched.day}
                        onChange={(e) =>
                          updateCustomDay(index, "day", e.target.value)
                        }
                        className="rounded-lg p-1 bg-white/5 border border-white/20 text-white max-w-[140px]"
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
                        onChange={(e) =>
                          updateCustomDay(index, "start", e.target.value)
                        }
                        className="rounded-lg p-1 bg-white/5 border border-white/20 text-white max-w-[100px]"
                      />
                      <span className="text-white whitespace-nowrap">to</span>
                      <input
                        type="time"
                        value={sched.end}
                        onChange={(e) =>
                          updateCustomDay(index, "end", e.target.value)
                        }
                        className="rounded-lg p-1 bg-white/5 border border-white/20 text-white max-w-[100px]"
                      />
                      <button
                        onClick={() => removeCustomDay(index)}
                        className="text-red-400 hover:text-red-600 px-2"
                        aria-label="Remove schedule"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={addCustomDay}
                    className="px-3 py-1 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 mb-4"
                    disabled={customDays.length >= 7}
                  >
                    + Add Day
                  </button>
                </>
              )}

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => handleRemoveHabit(selectedHabitId)}
                  className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 flex gap-2 items-center"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
                <button
                  onClick={() => saveHabitDetails()}
                  className="px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700"
                >
                  Save Changes
                </button>
                <button
                  onClick={() => setSelectedHabitId(null)}
                  className="px-4 py-2 rounded-lg bg-white/10 text-gray-200 hover:bg-white/20"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
