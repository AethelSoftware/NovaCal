import React, { useState, useRef } from "react";
import {
  CheckCircle2,
  UtensilsCrossed,
  Coffee,
  Trash2,
  Plus,
  Heart,
  Dumbbell,
  BookOpen,
  Sun,
  Moon,
  Flame,
  Music,
  Smile,
  Leaf,
  Star,
  Briefcase,
  Pencil,
  Key,
  Cloud,
  Bolt,
  Eye,
  Award,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import IconGrid from "./components/habits/IconGrid";
import AddHabitModal from "./components/habits/HabitsModal";

// ----------------- Constants -----------------
const weekdays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const weekends = ["Saturday", "Sunday"];
const ALL_DAYS = [...weekdays, ...weekends];

const ICONS = [
  { name: "Check", icon: CheckCircle2 },
  { name: "Coffee", icon: Coffee },
  { name: "Lunch", icon: UtensilsCrossed },
  { name: "Heart", icon: Heart },
  { name: "Workout", icon: Dumbbell },
  { name: "Reading", icon: BookOpen },
  { name: "Sunrise", icon: Sun },
  { name: "Moon", icon: Moon },
  { name: "Fire", icon: Flame },
  { name: "Music", icon: Music },
  { name: "Smile", icon: Smile },
  { name: "Leaf", icon: Leaf },
  { name: "Star", icon: Star },
  { name: "Work", icon: Briefcase },
  { name: "Writing", icon: Pencil },
  { name: "Key", icon: Key },
  { name: "Cloud", icon: Cloud },
  { name: "Bolt", icon: Bolt },
  { name: "Eye", icon: Eye },
  { name: "Award", icon: Award },
];

export default function HabitsPage() {
  const [habits, setHabits] = useState(
    ALL_DAYS.reduce((acc, day) => {
      acc[day] = [
        {
          id: 1,
          name: "Lunch Break",
          description: "Take a mindful pause",
          icon: UtensilsCrossed,
        },
        {
          id: 2,
          name: "Coffee Break",
          description: "Grab a quick coffee",
          icon: Coffee,
        },
      ];
      return acc;
    }, {})
  );

  const [modalOpen, setModalOpen] = useState(false);

  function handleSaveHabit(newHabit) {
    newHabit.days.forEach((day) => {
      setHabits((prev) => ({
        ...prev,
        [day]: [
          ...prev[day],
          {
            id: Date.now() + Math.random(),
            name: newHabit.name,
            description: newHabit.description,
            icon: newHabit.icon.icon,
          },
        ],
      }));
    });
  }

  function handleRemoveHabit(day, id) {
    setHabits((prev) => ({
      ...prev,
      [day]: prev[day].filter((h) => h.id !== id),
    }));
  }

  return (
    <main className="habits-background p-10 w-full min-h-screen">
      <div className="mb-10 p-6 rounded-xl bg-white/10 shadow-lg border border-white/10 backdrop-blur-sm">
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

        {ALL_DAYS.map((day) => (
          <div key={day} className="mb-8">
            <h3 className="text-lg font-semibold text-white mb-3">{day}</h3>
            <ul className="space-y-3">
              {habits[day].map((habit) => {
                const Icon = habit.icon;
                return (
                  <li
                    key={habit.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <span className="rounded-full bg-emerald-400/30 flex items-center justify-center w-9 h-9">
                        {Icon && <Icon className="text-emerald-400 w-5 h-5" />}
                      </span>
                      <div>
                        <p className="text-white font-medium">{habit.name}</p>
                        {habit.description && (
                          <p className="text-gray-400 text-sm">
                            {habit.description}
                          </p>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveHabit(day, habit.id)}
                      className="p-2 rounded-lg hover:bg-white/10 transition text-red-400 hover:text-white"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>

      <AddHabitModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSaveHabit}
      />
    </main>
  );
}
