"use client";
import React, { useState, useEffect, useRef } from "react";
import {
  CheckCircle2,
  Plus,
  Trash2,
  Search,
  Save,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import AddHabitModal from "./components/habits/HabitsModal";
import IconGrid from "./components/habits/IconGrid";
import { authedFetch } from "./api";

const ALL_DAYS = [
  "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday",
];
const WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const WEEKENDS = ["Saturday", "Sunday"];

function randomColor() {
  const palette = [
    "#93f0ff", "#818cf8", "#f472b6", "#a5b4fc",
    "#7dd3fc", "#c084fc", "#fb7185", "#f9a8d4"
  ];
  return palette[Math.floor(Math.random() * palette.length)];
}

const shapes = ["circle", "rect"];
const NUM_PARTICLES = 26;

function MotionParticlesBg() {
  const canvasRef = useRef(null);
  const particlesRef = useRef([]);

  useEffect(() => {
    const dpr = window.devicePixelRatio || 1;
    const canvas = canvasRef.current;
    if (!canvas) return;

    function resize() {
      if (!canvas) return;
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = window.innerWidth + "px";
      canvas.style.height = window.innerHeight + "px";
    }

    resize();
    window.addEventListener("resize", resize);

    particlesRef.current = Array.from({ length: NUM_PARTICLES }).map(() => ({
      x: Math.random() * window.innerWidth * dpr,
      y: Math.random() * window.innerHeight * dpr,
      r: 18 + Math.random() * 19,
      color: randomColor(),
      shape: shapes[Math.random() > 0.7 ? 1 : 0],
      v: 0.15 + Math.random() * 0.33 + Math.random() * 0.4,
      a: (Math.random() - 0.5) * 0.15,
      o: 0.37 + Math.random() * 0.33,
      t: Math.random() * 360,
    }));

    let animation;

    function draw() {
      const c = canvasRef.current;
      if (!c) return;
      const ctx = c.getContext("2d");
      if (!ctx) return;
      ctx.clearRect(0, 0, c.width, c.height);

      for (const p of particlesRef.current) {
        ctx.save();
        ctx.globalAlpha = p.o;
        ctx.translate(p.x, p.y);
        if (p.shape === "rect") ctx.rotate(((p.t += 0.002) % 360) || 0);
        ctx.fillStyle = p.color;
        if (p.shape === "circle") {
          ctx.beginPath();
          ctx.arc(0, 0, p.r, 0, Math.PI * 2);
          ctx.closePath();
          ctx.fill();
        } else {
          ctx.beginPath();
          ctx.rect(-p.r, -p.r, p.r * 2, p.r * 2);
          ctx.closePath();
          ctx.fill();
        }
        ctx.restore();
        p.y -= p.v;
        p.x += p.a;
        if (p.y + p.r < 0) {
          p.y = c.height + p.r;
          p.x = Math.random() * c.width * 0.98;
        }
        if (p.x < -p.r) p.x = c.width + p.r;
        else if (p.x > c.width + p.r) p.x = -p.r;
      }
      animation = requestAnimationFrame(draw);
    }

    draw();
    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animation);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full -z-20 pointer-events-none transition-opacity duration-700"
      aria-hidden="true"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        zIndex: 0,
        pointerEvents: "none",
        opacity: 0.37,
        transition: "opacity 0.4s",
      }}
    />
  );
}

// --- Main Page Start ---
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
      <motion.div
        key={habit.id}
        initial={{ opacity: 0, scale: 0.88, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 10 }}
        transition={{ duration: 0.33, type: "spring", bounce: 0.29 }}
        whileHover={{
          scale: 1.04,
          boxShadow: "0 0 0px 4px #0ffb,0 0 36px 12px #38bdf8cc",
        }}
        className="p-5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md
                   shadow-md hover:shadow-xl transition duration-200 cursor-pointer"
        onClick={() => openDetailModal(habit.id)}
      >
        <div className="flex items-center gap-3 mb-2">
          <span className="rounded-full bg-emerald-400/20 flex items-center justify-center p-2">
            {Icon && <Icon className="text-emerald-400 w-6 h-6" />}
          </span>
          <div>
            <p className="text-white font-semibold text-lg">{habit.name}</p>
            <p className="text-gray-400 text-sm">{habit.schedules.map((s) => s.day).join(", ")}</p>
          </div>
        </div>
        {habit.description && (
          <p className="text-gray-300 text-sm line-clamp-2">{habit.description}</p>
        )}
      </motion.div>
    );
  }

  return (
    <main className="relative min-h-screen w-full habits-background px-10 p-14">
      <MotionParticlesBg />
      {/* gradient glass glow overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#2312457e] via-[#00ffc030] to-[#0a0a0ab4] opacity-70 pointer-events-none z-0" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(0,255,180,0.11),transparent_70%)] z-0 pointer-events-none" />

      <motion.div
        className="relative z-10 max-w-6xl mx-auto p-8 rounded-3xl bg-white/10 border border-white/10 
        backdrop-blur-xl shadow-2xl"
        initial={{ opacity: 0, y: 44 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.08, delay: 0.25 }}
      >
        <div className="flex items-center justify-between mb-10">
          <motion.h2
            className="flex items-center text-3xl font-bold text-white drop-shadow-lg"
            initial={{ opacity: 0, x: -32 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.23, duration: 0.7, type: "spring", stiffness: 155 }}
          >
            <CheckCircle2 className="w-8 h-8 mr-3 text-sky-400" />
            Daily Habits
          </motion.h2>
          <div className="flex items-center gap-3">
            {error && (
              <motion.div className="text-red-400 text-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                {error}
              </motion.div>
            )}
            <motion.button
              type="button"
              onClick={() => setModalOpen(true)}
              className="px-6 py-2 rounded-full font-semibold shadow-md transition border border-white/10
                         bg-gradient-to-r from-sky-600 to-blue-500 text-white hover:opacity-90"
              whileHover={{ scale: 1.07, boxShadow: "0 6px 46px 0 #38bdf866" }}
              transition={{ type: "spring", stiffness: 250, damping: 16 }}
            >
              <Plus className="inline w-5 h-5 mr-1" />
              Add Habit
            </motion.button>
          </div>
        </div>

        <motion.div
          className="relative mb-10"
          initial={{ opacity: 0, y: -18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.18, duration: 0.5 }}
        >
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <motion.input
            type="text"
            placeholder="Search habits..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-3 py-2 rounded-lg bg-black/40 border border-white/20 text-white 
                       placeholder-gray-400 focus:ring-2 focus:ring-sky-500 transition"
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: "100%" }}
            transition={{ delay: 0.35, duration: 0.5 }}
          />
        </motion.div>

        {/* Habit Cards animated mount */}
        <AnimatePresence>
          {loading ? (
            <motion.p
              className="text-gray-400 text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              Loading habits...
            </motion.p>
          ) : filteredHabits.length > 0 ? (
            <motion.div
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
              initial="hidden"
              animate="visible"
              variants={{
                hidden: {},
                visible: {
                  transition: {
                    staggerChildren: 0.09,
                    delayChildren: 0.1,
                  },
                },
              }}
            >
              {filteredHabits.map((habit) => renderHabitCard(habit))}
            </motion.div>
          ) : (
            <motion.p
              className="text-gray-400 text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              No habits found.
            </motion.p>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Modal for adding */}
      <AddHabitModal open={modalOpen} onClose={() => setModalOpen(false)} onSave={handleSaveHabit} />

      {/* --- EDIT MODAL --- */}
      <AnimatePresence>
        {selectedHabitId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center px-4 backdrop-blur-sm"
          >
            <motion.div
              initial={{ y: 44, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 44, opacity: 0 }}
              className="bg-zinc-950 rounded-2xl max-h-[85vh] w-full max-w-2xl flex flex-col shadow-2xl text-white border border-zinc-800 overflow-hidden custom-scrollbar"
              transition={{ duration: 0.41, type: "spring", bounce: 0.16 }}
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
                  className="px-5 py-2 rounded-lg bg-sky-900/80 hover:bg-sky-900 text-white font-medium transition"
                >
                  <Save className="inline-block" />
                </button>
                <button
                  onClick={() => setSelectedHabitId(null)}
                  className="px-4 py-2 rounded-lg border border-white/20 bg-transparent hover:bg-white/20 text-white transition"
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