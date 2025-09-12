import React, { useState, useEffect } from "react";
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
  const [loading, setLoading] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // load saved hours from backend
    let mounted = true;
    const fetchHours = async () => {
      setLoading(true);
      try {
        const res = await fetch("http://127.0.0.1:5000/api/hours");
        if (!res.ok) throw new Error(`Failed to load hours: ${res.statusText}`);
        const json = await res.json();
        if (!mounted) return;
        // backend returns array of { day, start, end } or mapping
        const incoming = json.reduce
          ? json.reduce((acc, r) => {
              acc[r.day] = { start: r.start, end: r.end };
              return acc;
            }, {})
          : json;
        // merge with defaults (so we always have keys)
        const merged = { ...hours };
        ALL_DAYS.forEach((d) => {
          if (incoming && incoming[d]) merged[d] = { ...incoming[d] };
        });
        setHours(merged);
        setError(null);
      } catch (err) {
        console.error(err);
        setError(err.message || "Error loading hours");
      } finally {
        setLoading(false);
      }
    };
    fetchHours();
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleHoursChange(day, field, value) {
    setHours((prev) => {
      const next = { ...prev, [day]: { ...prev[day], [field]: value } };
      setDirty(true);
      return next;
    });
  }

  async function saveHours() {
    setLoading(true);
    try {
      const payload = ALL_DAYS.map((d) => ({ day: d, start: hours[d].start, end: hours[d].end }));
      const res = await fetch("/api/hours", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hours: payload }),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Failed to save hours");
      }
      setDirty(false);
      setError(null);
    } catch (err) {
      console.error(err);
      setError(err.message || "Error saving hours");
    } finally {
      setLoading(false);
    }
  }

  function copyHoursToSection(type) {
    const section = type === "weekdays" ? weekdays : weekends;
    const refDay = section[0];
    setHours((prev) => {
      const refHours = prev[refDay];
      const updated = { ...prev };
      section.forEach((day) => {
        updated[day] = { ...refHours };
      });
      setDirty(true);
      return updated;
    });
  }

  function renderSection(section, label, type) {
    return (
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-white mb-3">{label}</h3>
        {section.map((day, index) => (
          <div
            key={day}
            className="flex flex-col sm:flex-row justify-between mb-4 p-3 rounded-lg bg-white/5 sm:items-center"
          >
            <div className="flex flex-col sm:flex-row gap-6">
            <span className="text-stone-300 w-24">{day}</span>
              <div className="flex flex-col">
                <label className="text-stone-300 mb-1">Start</label>
                <input
                  type="time"
                  value={hours[day]?.start ?? "09:00"}
                  onChange={(e) => handleHoursChange(day, "start", e.target.value)}
                  className="rounded-lg p-2 bg-white/5 border border-white/20 text-white"
                />
              </div>
              <div className="flex flex-col">
                <label className="text-stone-300 mb-1">End</label>
                <input
                  type="time"
                  value={hours[day]?.end ?? "17:00"}
                  onChange={(e) => handleHoursChange(day, "end", e.target.value)}
                  className="rounded-lg p-2 bg-white/5 border border-white/20 text-white"
                />
              </div>
            </div>

            {/* Copy button only for first row */}
            {index === 0 && (
              <button
                className="mt-3 sm:mt-0 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white font-medium shadow transition cursor-pointer duration-200 border border-white/20"
                onClick={() => copyHoursToSection(type)}
                type="button"
              >
                Copy to all {label.toLowerCase()}
              </button>
            )}
          </div>
        ))}
      </div>
    );
  }

  return (
    <main className="hours-background w-full min-h-screen p-10">
      <div className="mb-10 p-6 rounded-xl bg-white/10 shadow-lg border border-white/10 backdrop-blur-sm">
        <div className="flex items-center justify-between mb-6">
          <h2 className="flex items-center text-2xl font-semibold text-white drop-shadow-glow">
            <Clock className="w-6 h-6 mr-2 text-emerald-400" />
            Working Hours
          </h2>
          <div className="flex items-center gap-3">
            {error && <div className="text-red-400 text-sm">{error}</div>}
            <button
              onClick={saveHours}
              disabled={loading || !dirty}
              className={`px-4 py-2 rounded-lg border border-white/20 ${
                dirty ? "bg-emerald-600 hover:bg-emerald-700" : "bg-zinc-800"
              } text-white font-medium transition`}
              type="button"
            >
              {loading ? "Saving..." : dirty ? "Save Hours" : "Saved"}
            </button>
          </div>
        </div>

        {renderSection(weekdays, "Weekdays", "weekdays")}
        {renderSection(weekends, "Weekends", "weekends")}
      </div>
    </main>
  );
}
