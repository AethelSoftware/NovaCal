import React, { useState } from "react";
import { Clock } from "lucide-react";

const weekdays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const weekends = ["Saturday", "Sunday"];
const ALL_DAYS = [...weekdays, ...weekends];

export default function HoursPage() {
  const [hours, setHours] = useState(
    ALL_DAYS.reduce((acc, day) => {
      acc[day] = { start: "09:00", end: "17:00" };
      return acc;
    }, {})
  );

  function handleHoursChange(day, field, value) {
    setHours((prev) => ({
      ...prev,
      [day]: { ...prev[day], [field]: value },
    }));
  }

  function copyHoursToAll(type) {
    const section = type === "weekdays" ? weekdays : weekends;
    const refDay = section[0];
    setHours((prev) => {
      const refHours = prev[refDay];
      const updated = { ...prev };
      section.forEach((day) => {
        updated[day] = { ...refHours };
      });
      return updated;
    });
  }

  return (
    <main className="hours-background w-full min-h-screen p-10">
      <div className="mb-10 p-6 rounded-xl bg-white/10 shadow-lg border border-white/10 backdrop-blur-sm">
        <h2 className="flex items-center text-2xl font-semibold text-white mb-6 drop-shadow-glow">
          <Clock className="w-6 h-6 mr-2 text-emerald-400" />
          Working Hours
        </h2>

        {/* Weekdays */}
        <div className="mb-6">
          <div className="flex items-center mb-3 justify-between">
            <h3 className="text-lg font-semibold text-white">Weekdays</h3>
            <button
              className="px-5 py-3 rounded-lg bg-white/10 hover:bg-white/20 text-white font-medium shadow transition cursor-pointer duration-200 border border-white/20"
              onClick={() => copyHoursToAll("weekdays")}
              type="button"
            >
              Copy to all weekdays
            </button>
          </div>
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
                  onChange={(e) => handleHoursChange(day, "end", e.target.value)}
                  className="rounded-lg p-2 bg-white/5 border border-white/20 text-white"
                />
              </div>
            </div>
          ))}
        </div>

        {/* Weekends */}
        <div>
          <div className="flex items-center mb-3 justify-between">
            <h3 className="text-lg font-semibold text-white">Weekends</h3>
            <button
              className="px-5 py-3 rounded-lg bg-white/10 hover:bg-white/20 text-white font-medium shadow transition cursor-pointer duration-200 border border-white/20"
              onClick={() => copyHoursToAll("weekends")}
              type="button"
            >
              Copy to all weekends
            </button>
          </div>
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
                  onChange={(e) => handleHoursChange(day, "end", e.target.value)}
                  className="rounded-lg p-2 bg-white/5 border border-white/20 text-white"
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
    
  );
}
