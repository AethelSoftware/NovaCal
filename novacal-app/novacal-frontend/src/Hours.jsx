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

const weekdays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const weekends = ["Saturday", "Sunday"];

export default function HoursPage() {
  const [hours, setHours] = useState(
    [...weekdays, ...weekends].reduce((acc, day) => {
      acc[day] = { start: "09:00", end: "17:00" };
      return acc;
    }, {})
  );

  const [habits, setHabits] = useState(
    [...weekdays, ...weekends].reduce((acc, day) => {
      acc[day] = [
        { id: 1, name: "Lunch Break", time: "12:30", icon: UtensilsCrossed },
        { id: 2, name: "Coffee Break", time: "15:00", icon: Coffee },
      ];
      return acc;
    }, {})
  );

  const [newHabit, setNewHabit] = useState(
    [...weekdays, ...weekends].reduce((acc, day) => {
      acc[day] = "";
      return acc;
    }, {})
  );

  const handleHoursChange = (day, field, value) => {
    setHours((prev) => ({
      ...prev,
      [day]: { ...prev[day], [field]: value },
    }));
  };

  const handleAddHabit = (day) => {
    const text = newHabit[day].trim();
    if (!text) return;
    setHabits((prev) => ({
      ...prev,
      [day]: [
        ...prev[day],
        { id: Date.now(), name: text, time: "00:00", icon: CheckCircle2 },
      ],
    }));
    setNewHabit((prev) => ({ ...prev, [day]: "" }));
  };

  const handleRemoveHabit = (day, id) => {
    setHabits((prev) => ({
      ...prev,
      [day]: prev[day].filter((h) => h.id !== id),
    }));
  };

  return (
    <div className="w-full h-full hours-background p-6 overflow-y-auto">
      <div className="max-w-7xl mx-auto backdrop-blur-sm rounded-lg shadow-lg border-2 border-white/20 p-6 bg-transparent">
        <h1 className="text-4xl font-bold text-white mb-6">
          Customize Your Weekly Hours & Habits
        </h1>
        <p className="text-stone-400 mb-2">
          Define working hours and habits for each day of the week.
        </p>
        <p className="text-stone-400 mb-8">
          Today is{" "}
          <span className="font-semibold text-sky-200">
            {format(new Date(), "EEEE, MMMM d, yyyy")}
          </span>
        </p>

        {/* Hours Section */}
        <div className="mb-10 p-6 rounded-xl bg-white/10 shadow-lg border border-white/10">
          <h2 className="flex items-center text-2xl font-semibold text-white mb-6">
            <Clock className="w-6 h-6 mr-2 text-emerald-400" />
            Working Hours
          </h2>

          {/* Weekdays */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-white mb-3">Weekdays</h3>
            {weekdays.map((day) => (
              <div
                key={day}
                className="flex flex-col sm:flex-row gap-6 mb-4 p-3 rounded-lg bg-white/5"
              >
                <span className="text-stone-300 w-24">{day}</span>
                <div className="flex flex-col">
                  <label className="text-stone-300 mb-1">Start</label>
                  <input
                    type="time"
                    value={hours[day].start}
                    onChange={(e) =>
                      handleHoursChange(day, "start", e.target.value)
                    }
                    className="rounded-lg p-2 bg-white/5 border border-white/20 text-white"
                  />
                </div>
                <div className="flex flex-col">
                  <label className="text-stone-300 mb-1">End</label>
                  <input
                    type="time"
                    value={hours[day].end}
                    onChange={(e) =>
                      handleHoursChange(day, "end", e.target.value)
                    }
                    className="rounded-lg p-2 bg-white/5 border border-white/20 text-white"
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Weekends */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-3">Weekends</h3>
            {weekends.map((day) => (
              <div
                key={day}
                className="flex flex-col sm:flex-row gap-6 mb-4 p-3 rounded-lg bg-white/5"
              >
                <span className="text-stone-300 w-24">{day}</span>
                <div className="flex flex-col">
                  <label className="text-stone-300 mb-1">Start</label>
                  <input
                    type="time"
                    value={hours[day].start}
                    onChange={(e) =>
                      handleHoursChange(day, "start", e.target.value)
                    }
                    className="rounded-lg p-2 bg-white/5 border border-white/20 text-white"
                  />
                </div>
                <div className="flex flex-col">
                  <label className="text-stone-300 mb-1">End</label>
                  <input
                    type="time"
                    value={hours[day].end}
                    onChange={(e) =>
                      handleHoursChange(day, "end", e.target.value)
                    }
                    className="rounded-lg p-2 bg-white/5 border border-white/20 text-white"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Habits Section */}
        <div className="mb-10 p-6 rounded-xl bg-white/10 shadow-lg border border-white/10">
          <h2 className="flex items-center text-2xl font-semibold text-white mb-6">
            <CheckCircle2 className="w-6 h-6 mr-2 text-sky-400" />
            Daily Habits
          </h2>

          {[...weekdays, ...weekends].map((day) => (
            <div key={day} className="mb-8">
              <h3 className="text-lg font-semibold text-white mb-3">{day}</h3>

              <ul className="space-y-3 mb-4">
                {habits[day].map((habit) => {
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
                        onClick={() => handleRemoveHabit(day, habit.id)}
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
                  value={newHabit[day]}
                  onChange={(e) =>
                    setNewHabit((prev) => ({ ...prev, [day]: e.target.value }))
                  }
                  placeholder="Add new habit..."
                  className="flex-1 rounded-lg p-2 bg-white/5 border border-white/20 text-white placeholder-stone-500"
                />
                <button
                  onClick={() => handleAddHabit(day)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white transition"
                >
                  <Plus className="w-4 h-4" />
                  Add
                </button>
              </div>
            </div>
          ))}
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
