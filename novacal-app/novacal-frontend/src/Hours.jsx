import React, { useState } from "react";
import {
  Clock,
  CheckCircle2,
  Coffee,
  UtensilsCrossed,
  Plus,
  Trash2,
} from "lucide-react";
import { format } from "date-fns";

export default function HoursPage() {
  const [workingHours, setWorkingHours] = useState({
    start: "09:00",
    end: "17:00",
  });

  const [habits, setHabits] = useState([
    { id: 1, name: "Lunch Break", time: "12:30", icon: UtensilsCrossed },
    { id: 2, name: "Coffee Break", time: "15:00", icon: Coffee },
  ]);

  const [newHabit, setNewHabit] = useState("");

  const handleAddHabit = () => {
    if (!newHabit.trim()) return;
    setHabits((prev) => [
      ...prev,
      { id: Date.now(), name: newHabit.trim(), time: "00:00", icon: CheckCircle2 },
    ]);
    setNewHabit("");
  };

  const handleRemoveHabit = (id) => {
    setHabits((prev) => prev.filter((h) => h.id !== id));
  };

  return (
    <div className="w-full h-full hours-background p-6">
      <div className="max-w-5xl mx-auto backdrop-blur-sm rounded-lg shadow-lg border-2 border-white/20 p-6 bg-transparent">
        <h1 className="text-3xl font-bold text-white mb-6">
          Customize Your Hours & Habits
        </h1>
        <p className="text-stone-400 mb-8">
          Define when you work, when you rest, and the habits that shape your day.
          Today is {format(new Date(), "EEEE, MMMM d, yyyy")}.
        </p>

        {/* Working Hours Section */}
        <div className="mb-10 p-6 rounded-xl bg-white/10 shadow-lg">
          <h2 className="flex items-center text-xl font-semibold text-white mb-4">
            <Clock className="w-6 h-6 mr-2 text-emerald-400" />
            Working Hours
          </h2>
          <div className="flex flex-col sm:flex-row gap-6">
            <div className="flex flex-col">
              <label className="text-stone-300 mb-1">Start</label>
              <input
                type="time"
                value={workingHours.start}
                onChange={(e) =>
                  setWorkingHours((prev) => ({ ...prev, start: e.target.value }))
                }
                className="rounded-lg p-2 bg-white/5 border border-white/20 text-white"
              />
            </div>
            <div className="flex flex-col">
              <label className="text-stone-300 mb-1">End</label>
              <input
                type="time"
                value={workingHours.end}
                onChange={(e) =>
                  setWorkingHours((prev) => ({ ...prev, end: e.target.value }))
                }
                className="rounded-lg p-2 bg-white/5 border border-white/20 text-white"
              />
            </div>
          </div>
        </div>

        {/* Daily Habits Section */}
        <div className="mb-10 p-6 rounded-xl bg-white/10 shadow-lg">
          <h2 className="flex items-center text-xl font-semibold text-white mb-4">
            <CheckCircle2 className="w-6 h-6 mr-2 text-sky-400" />
            Daily Habits
          </h2>

          <ul className="space-y-3 mb-6">
            {habits.map((habit) => {
              const Icon = habit.icon;
              return (
                <li
                  key={habit.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-all duration-200"
                >
                  <div className="flex items-center gap-3">
                    <Icon className="text-emerald-400 w-5 h-5 flex-shrink-0" />
                    <div>
                      <p className="text-white font-medium">{habit.name}</p>
                      <p className="text-stone-400 text-sm">at {habit.time}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemoveHabit(habit.id)}
                    className="p-2 rounded-lg hover:bg-white/10 transition text-red-400 hover:text-white"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </li>
              );
            })}
          </ul>

          <div className="flex items-center gap-3">
            <input
              type="text"
              value={newHabit}
              onChange={(e) => setNewHabit(e.target.value)}
              placeholder="Add new habit..."
              className="flex-1 rounded-lg p-2 bg-white/5 border border-white/20 text-white placeholder-stone-500"
            />
            <button
              onClick={handleAddHabit}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white transition"
            >
              <Plus className="w-4 h-4" />
              Add
            </button>
          </div>
        </div>

        {/* Save Section */}
        <div className="text-right">
          <button className="px-6 py-2 rounded-lg bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-semibold shadow-md">
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
