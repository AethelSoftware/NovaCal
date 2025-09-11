import React, { useState } from "react";
import {
  CheckCircle2,
  Plus,
  Trash2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import AddHabitModal from "./components/habits/HabitsModal";
import IconGrid from "./components/habits/IconGrid";
import { ALL_DAYS } from "./components/habits/HabitsModal";

export default function HabitsPage() {
  // Habits is an object with habitId as keys for uniqueness, each value stores:
  // { id, name, description, icon, file, schedules: [{ day, start, end }] }
  // Default two habits with schedules for example
  const [habits, setHabits] = useState({
    1: {
      id: 1,
      name: "Lunch Break",
      description: "Take a mindful pause",
      icon: CheckCircle2,
      file: null,
      schedules: [{ day: "Monday", start: "12:00", end: "13:00" }],
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
  });

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedHabitId, setSelectedHabitId] = useState(null);
  const [editIcon, setEditIcon] = useState(null);
  const [editDescription, setEditDescription] = useState("");
  const [editSchedules, setEditSchedules] = useState([]);

  // Open modal and load habit details for editing
  function openDetailModal(habitId) {
    const habit = habits[habitId];
    setSelectedHabitId(habitId);
    setEditIcon(habit.icon ? { name: habit.icon.name, icon: habit.icon } : null);
    setEditDescription(habit.description || "");
    setEditSchedules(habit.schedules || []);
  }

  // Save changes to icon, description, schedules
  function saveHabitDetails() {
    if (!selectedHabitId) return;
    setHabits((prev) => {
      const habit = prev[selectedHabitId];
      if (!habit) return prev;
      return {
        ...prev,
        [selectedHabitId]: {
          ...habit,
          icon: editIcon ? editIcon.icon : habit.icon,
          description: editDescription,
          schedules: editSchedules,
        },
      };
    });
    setSelectedHabitId(null);
  }

  // Remove a habit completely
  function handleRemoveHabit(id) {
    setHabits((prev) => {
      const copy = { ...prev };
      delete copy[id];
      return copy;
    });
    setSelectedHabitId(null);
  }

  // Handle schedule change (day, start, end)
  function updateSchedule(index, field, value) {
    setEditSchedules((prev) =>
      prev.map((sched, i) =>
        i === index ? { ...sched, [field]: value } : sched
      )
    );
  }

  // Handle adding a new schedule entry
  function addSchedule() {
    setEditSchedules((prev) => [...prev, { day: ALL_DAYS[0], start: "09:00", end: "10:00" }]);
  }

  // Handle removing a schedule entry
  function removeSchedule(index) {
    setEditSchedules((prev) => prev.filter((_, i) => i !== index));
  }

  // Adding new habit from modal
  function handleSaveHabit(newHabit) {
    // Create new unique id
    const newId = Date.now() + Math.random();
    setHabits((prev) => ({
      ...prev,
      [newId]: {
        id: newId,
        name: newHabit.name,
        description: newHabit.description,
        icon: newHabit.icon.icon,
        file: newHabit.file,
        schedules: newHabit.days.map((day) => ({
          day,
          start: "09:00",
          end: "10:00",
        })),
      },
    }));
  }

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
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-700 text-white font-semibold"
          >
            <Plus className="w-5 h-5" />
            Add Habit
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {Object.values(habits).map((habit) => {
            const Icon = habit.icon;
            return (
              <motion.div
                key={habit.id}
                whileHover={{ scale: 1.03 }}
                className="cursor-pointer relative rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all shadow-md p-4 flex flex-col"
                onClick={() => openDetailModal(habit.id)}
              >
                <div className="flex items-center gap-3">
                  <span className="rounded-full bg-emerald-400/30 flex items-center justify-center w-10 h-10">
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
          })}
        </div>
      </div>

      {/* Add Habit Modal */}
      <AddHabitModal open={modalOpen} onClose={() => setModalOpen(false)} onSave={handleSaveHabit} />

      {/* Detail/Edit Modal */}
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
                <button onClick={() => setSelectedHabitId(null)} className="text-gray-400 hover:text-white">
                  ✕
                </button>
              </div>

              <label className="block text-white font-semibold mb-2">Name</label>
              <p className="mb-4 text-white font-medium text-lg">{habits[selectedHabitId].name}</p>

              <label className="block text-white font-semibold mb-2">Description</label>
              <textarea
                rows={3}
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                className="w-full rounded-lg p-2 mb-4 bg-white/5 border border-white/20 text-white placeholder-gray-400"
                placeholder="Description (optional)"
              />

              <label className="block text-white font-semibold mb-2">Icon</label>
              <IconGrid selected={editIcon} onSelect={setEditIcon} />

              <label className="block text-white font-semibold mb-4 mt-6">Schedules</label>
              {editSchedules.map((sched, index) => (
                <div key={index} className="flex items-center gap-2 mb-3 flex-wrap">
                  <select
                    value={sched.day}
                    onChange={(e) => updateSchedule(index, "day", e.target.value)}
                    className="rounded-lg p-1 bg-white/5 border border-white/20 text-white"
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
                    onChange={(e) => updateSchedule(index, "start", e.target.value)}
                    className="rounded-lg p-1 bg-white/5 border border-white/20 text-white max-w-[100px]"
                  />
                  <span className="text-white">to</span>
                  <input
                    type="time"
                    value={sched.end}
                    onChange={(e) => updateSchedule(index, "end", e.target.value)}
                    className="rounded-lg p-1 bg-white/5 border border-white/20 text-white max-w-[100px]"
                  />
                  <button
                    onClick={() => removeSchedule(index)}
                    className="text-red-400 hover:text-red-600 px-2"
                    aria-label="Remove schedule"
                  >
                    ✕
                  </button>
                </div>
              ))}
              <button
                onClick={addSchedule}
                className="px-3 py-1 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 mb-4"
              >
                + Add Schedule
              </button>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => handleRemoveHabit(selectedHabitId)}
                  className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 flex gap-2 items-center"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
                <button
                  onClick={() => {
                    saveHabitDetails();
                    setSelectedHabitId(null);
                  }}
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
