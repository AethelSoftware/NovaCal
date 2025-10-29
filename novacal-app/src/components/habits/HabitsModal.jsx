import React, { useRef, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import IconGrid from "./IconGrid";
import { Save } from "lucide-react";

const weekdays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const weekends = ["Saturday", "Sunday"];
export const ALL_DAYS = [...weekdays, ...weekends];

function roundToNearest15(time) {
  if (!time) return "";
  const [hours, minutes] = time.split(":").map(Number);
  const totalMinutes = hours * 60 + minutes;
  const roundedMinutes = Math.round(totalMinutes / 15) * 15;
  const newHours = Math.floor(roundedMinutes / 60) % 24;
  const newMinutes = roundedMinutes % 60;
  return `${String(newHours).padStart(2, "0")}:${String(newMinutes).padStart(2, "0")}`;
}

export default function AddHabitModal({ open, onClose, onSave }) {
  const modalRef = useRef(null);
  const [form, setForm] = useState({
    name: "",
    description: "",
    icon: null,
    days: ALL_DAYS,
    file: null,
    startTime: "09:00",
    endTime: "10:00",
  });
  const [dayMode, setDayMode] = useState("all days");

  useEffect(() => {
    function handleClickOutside(e) {
      if (modalRef.current && !modalRef.current.contains(e.target)) {
        onClose();
      }
    }
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open, onClose]);

  function handleQuickDays(mode) {
    setDayMode(mode);
    if (mode === "all days") setForm((f) => ({ ...f, days: ALL_DAYS }));
    else if (mode === "weekdays") setForm((f) => ({ ...f, days: weekdays }));
    else if (mode === "weekends") setForm((f) => ({ ...f, days: weekends }));
    else if (mode === "custom") setForm((f) => ({ ...f, days: [] }));
  }

  function toggleDay(day) {
    setDayMode("custom");
    setForm((f) => {
      const days = f.days.includes(day)
        ? f.days.filter((d) => d !== day)
        : [...f.days, day];
      return { ...f, days };
    });
  }

  function handleSave() {
    if (!form.name.trim() || !form.icon || form.days.length === 0) {
      alert("Please complete all required fields (name, icon, days).");
      return;
    }
    onSave(form);
    setForm({ name: "", description: "", icon: null, days: [], file: null, startTime: "09:00", endTime: "10:00" });
    setDayMode("all days");
  }

  const handleTimeChange = (field, value) => {
    setForm(f => ({ ...f, [field]: value }));
  };

  const handleTimeBlur = (field) => {
    const originalTime = form[field];
    const roundedTime = roundToNearest15(originalTime);
    if (originalTime !== roundedTime) {
      setForm(f => ({ ...f, [field]: roundedTime }));
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center px-4 backdrop-blur-sm"
        >
          <motion.div
            ref={modalRef}
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
            transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
            className="bg-zinc-950 rounded-2xl max-h-[85vh] w-full max-w-2xl flex flex-col shadow-2xl text-white border border-zinc-800 overflow-hidden custom-scrollbar"
          >
            <div className="flex justify-between items-center px-6 py-4 border-b border-zinc-800 bg-zinc-900/50">
              <h3 className="text-xl font-semibold text-white">Add New Habit</h3>
              <button onClick={onClose} className="text-zinc-400 hover:text-red-400 transition" title="Close">✕</button>
            </div>

            <div className="overflow-y-auto flex-1 p-6 space-y-6">
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Habit Name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="E.g., Morning Run"
                  className="w-full rounded-lg bg-zinc-900 border border-zinc-700 p-2 text-white placeholder-zinc-500 focus:ring-1 focus:ring-zinc-500"
                />
              </div>

              <div>
                <p className="text-sm text-zinc-400 mb-2">Choose an Icon</p>
                <IconGrid selected={form.icon} onSelect={(icon) => setForm((f) => ({ ...f, icon }))} />
              </div>

              <div>
                <p className="text-sm text-zinc-400 mb-2">Select Days</p>
                <div className="flex flex-wrap gap-2 mb-3">
                  {["all days", "weekdays", "weekends", "custom"].map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => handleQuickDays(mode)}
                      className={`capitalize px-3 py-1 rounded-lg text-sm font-medium transition ${
                        dayMode === mode
                          ? "bg-sky-700 text-white"
                          : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                      }`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
                <div className="flex flex-wrap gap-2">
                  {ALL_DAYS.map((day) => (
                    <button
                      key={day}
                      type="button"
                      onClick={() => toggleDay(day)}
                      className={`px-3 py-1 rounded-lg text-sm font-medium transition ${
                        form.days.includes(day)
                          ? "bg-emerald-600 text-white"
                          : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                      }`}
                    >
                      {day}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div>
                  <label className="block text-sm text-zinc-400 mb-1">Start Time</label>
                  <input
                    type="time"
                    value={form.startTime}
                    onChange={e => handleTimeChange('startTime', e.target.value)}
                    onBlur={() => handleTimeBlur('startTime')}
                    className="rounded-lg bg-zinc-900 border border-zinc-700 p-2 text-white focus:ring-1 focus:ring-zinc-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-zinc-400 mb-1">End Time</label>
                  <input
                    type="time"
                    value={form.endTime}
                    onChange={e => handleTimeChange('endTime', e.target.value)}
                    onBlur={() => handleTimeBlur('endTime')}
                    className="rounded-lg bg-zinc-900 border border-zinc-700 p-2 text-white focus:ring-1 focus:ring-zinc-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-zinc-400 mb-1">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="Description (optional)"
                  rows={2}
                  className="w-full rounded-lg bg-zinc-900 border border-zinc-700 p-2 text-white placeholder-zinc-500 focus:ring-1 focus:ring-zinc-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 px-6 py-4 border-t border-zinc-800 bg-zinc-900/50">
              <button onClick={onClose} className="px-4 py-2 rounded-lg border border-white/20 bg-transparent hover:bg-white/20 text-white transition">
                Cancel
              </button>
              <motion.button
                onClick={handleSave}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-5 py-2 rounded-lg bg-sky-600 hover:bg-sky-700 text-white font-medium transition-colors flex items-center gap-2"
              >
                <Save className="w-4 h-4" /> Save Habit
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
