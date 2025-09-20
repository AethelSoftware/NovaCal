"use client";
import React, { useState, useEffect } from "react";
import { Clock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { authedFetch } from "./api"; // <-- use your API helper

const weekdays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const weekends = ["Saturday", "Sunday"];
const ALL_DAYS = [...weekdays, ...weekends];

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.12, delayChildren: 0.2 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.98 },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.4, ease: "easeOut" } },
};

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
    let mounted = true;
    const fetchHours = async () => {
      setLoading(true);
      try {
        const res = await authedFetch("/api/hours");
        if (!res.ok) throw new Error(`Failed to load hours: ${res.statusText}`);
        const json = await res.json();
        if (!mounted) return;
        const incoming = json.reduce
          ? json.reduce((acc, r) => {
              acc[r.day] = { start: r.start, end: r.end };
              return acc;
            }, {})
          : json;
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
      const payload = ALL_DAYS.map((d) => ({
        day: d,
        start: hours[d].start,
        end: hours[d].end,
      }));
      const res = await authedFetch("/api/hours", {
        method: "POST",
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
      <motion.div
        className="mb-10"
        variants={containerVariants}
        initial="hidden"
        animate="show"
      >
        <motion.h3
          variants={itemVariants}
          className="text-xl font-semibold text-white/90 mb-4 drop-shadow-lg"
        >
          {label}
        </motion.h3>
        <motion.div className="space-y-4">
          {section.map((day, index) => (
            <motion.div
              key={day}
              variants={itemVariants}
              className="flex flex-col sm:flex-row justify-between items-center gap-6 p-4 rounded-2xl 
                         bg-white/5 border border-white/10 backdrop-blur-md shadow-md hover:shadow-xl
                         transition duration-200"
            >
              <span className="text-white/80 font-medium w-28">{day}</span>
              <div className="flex flex-col sm:flex-row gap-6 w-full sm:w-auto">
                <motion.div variants={itemVariants} className="flex flex-col">
                  <label className="text-xs text-white/60 mb-1">Start</label>
                  <input
                    type="time"
                    value={hours[day]?.start ?? "09:00"}
                    onChange={(e) =>
                      handleHoursChange(day, "start", e.target.value)
                    }
                    className="rounded-lg px-3 py-2 bg-black/40 border border-white/20 text-white 
                               focus:ring-2 focus:ring-emerald-500 transition"
                  />
                </motion.div>
                <motion.div variants={itemVariants} className="flex flex-col">
                  <label className="text-xs text-white/60 mb-1">End</label>
                  <input
                    type="time"
                    value={hours[day]?.end ?? "17:00"}
                    onChange={(e) =>
                      handleHoursChange(day, "end", e.target.value)
                    }
                    className="rounded-lg px-3 py-2 bg-black/40 border border-white/20 text-white 
                               focus:ring-2 focus:ring-emerald-500 transition"
                  />
                </motion.div>
              </div>
              {index === 0 && (
                <motion.button
                  variants={itemVariants}
                  onClick={() => copyHoursToSection(type)}
                  type="button"
                  className="px-5 py-2 rounded-full bg-gradient-to-r from-emerald-600 to-teal-500 
                             text-white font-semibold shadow-lg border border-white/10 
                             hover:opacity-90 transition"
                >
                  Copy to all {label.toLowerCase()}
                </motion.button>
              )}
            </motion.div>
          ))}
        </motion.div>
      </motion.div>
    );
  }

  return (
    <main className="relative min-h-screen w-full hours-background to-black p-10 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(0,255,180,0.15),transparent_60%)] pointer-events-none"></div>
      <motion.div
        initial={{ opacity: 0, scale: 0.97, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative z-10 max-w-5xl mx-auto p-8 rounded-3xl bg-white/5 border border-white/10 
                      backdrop-blur-lg shadow-2xl"
      >
        <motion.div
          className="flex items-center justify-between mb-10"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <h2 className="flex items-center text-3xl font-bold text-white drop-shadow-lg">
            <Clock className="w-8 h-8 mr-3 text-emerald-400" />
            Working Hours
          </h2>
          <div className="flex items-center gap-3">
            <AnimatePresence>
              {error && (
                <motion.div
                  key="err"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="text-red-400 text-sm"
                >
                  {error}
                </motion.div>
              )}
            </AnimatePresence>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={saveHours}
              disabled={loading || !dirty}
              type="button"
              className={`px-6 py-2 rounded-full font-semibold shadow-md transition border border-white/10 ${
                dirty
                  ? "bg-gradient-to-r from-emerald-600 to-teal-500 text-white hover:opacity-90"
                  : "bg-zinc-800 text-white/60 cursor-not-allowed"
              }`}
            >
              {loading ? "Saving..." : dirty ? "Save Hours" : "Saved"}
            </motion.button>
          </div>
        </motion.div>
        {renderSection(weekdays, "Weekdays", "weekdays")}
        {renderSection(weekends, "Weekends", "weekends")}
      </motion.div>
    </main>
  );
}