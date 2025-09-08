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

const daysOfWeek = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

export default function HoursPage() {
  const [schedule, setSchedule] = useState(
    daysOfWeek.reduce((acc, day) => {
      acc[day] = {
        workingHours: { start: "09:00", end: "17:00" },
        habits: [
          { id: 1, name: "Lunch Break", time: "12:30", icon: UtensilsCrossed },
          { id: 2, name: "Coffee Break", time: "15:00", icon: Coffee },
        ],
        newHabit: "",
      };
      return acc;
    }, {})
  );

  const handleWorkingHoursChange = (day, field, value) => {
    setSchedule((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        workingHours: { ...prev[day].workingHours, [field]: value },
      },
    }));
  };

  const handleAddHabit = (day) => {
    const newHabitText = schedule[day].newHabit.trim();
    if (!newHabitText) return;

    setSchedule((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        habits: [
          ...prev[day].habits,
          { id: Date.now(), name: newHabitText, time: "00:00", icon: CheckCircle2 },
        ],
        newHabit: "",
      },
    }));
  };

  const handleRemoveHabit = (day, id) => {
    setSchedule((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        habits: prev[day].habits.filter((h) => h.id !== id),
      },
    }));
  };

  const handleNewHabitChange = (day, value) => {
    setSchedule((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        newHabit: value,
      },
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
          Today is <span className="font-semibold text-sky-200">{format(new Date(), "EEEE, MMMM d, yyyy")}</span>
        </p>

        {daysOfWeek.map((day) => (
          <div
            key={day}
            className="mb-10 p-6 rounded-xl bg-white/10 shadow-lg border border-white/10"
          >
            <h2 className="text-2xl font-semibold text-white mb-6">{day}</h2>

            {/* Working Hours */}
            <div className="mb-6">
              <h3 className="flex items-center text-lg font-semibold text-white mb-4">
                <Clock className="w-5 h-5 mr-2 text-emerald-400" />
                Working Hours
              </h3>
              <div className="flex flex-col sm:flex-row gap-6">
                <div className="flex flex-col">
                  <label className="text-stone-300 mb-1">Start</label>
                  <input
                    type="time"
                    value={schedule[day].workingHours.start}
                    onChange={(e) => handleWorkingHoursChange(day, "start", e.target.value)}
                    className="rounded-lg p-2 bg-white/5 border border-white/20 text-white"
                  />
                </div>
                <div className="flex flex-col">
                  <label className="text-stone-300 mb-1">End</label>
                  <input
                    type="time"
                    value={schedule[day].workingHours.end}
                    onChange={(e) => handleWorkingHoursChange(day, "end", e.target.value)}
                    className="rounded-lg p-2 bg-white/5 border border-white/20 text-white"
                  />
                </div>
              </div>
            </div>

            {/* Daily Habits */}
            <div>
              <h3 className="flex items-center text-lg font-semibold text-white mb-4">
                <CheckCircle2 className="w-5 h-5 mr-2 text-sky-400" />
                Daily Habits
              </h3>

              <ul className="space-y-3 mb-6">
                {schedule[day].habits.map((habit) => {
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
                  value={schedule[day].newHabit}
                  onChange={(e) => handleNewHabitChange(day, e.target.value)}
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
          </div>
        ))}

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
