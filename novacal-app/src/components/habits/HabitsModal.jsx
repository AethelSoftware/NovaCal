import React, { useRef, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import IconGrid from "./IconGrid";
import { Save } from "lucide-react";

const weekdays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const weekends = ["Saturday", "Sunday"];
export const ALL_DAYS = [...weekdays, ...weekends];

export default function AddHabitModal({ open, onClose, onSave }) {
  const modalRef = useRef(null);
  const [form, setForm] = useState({
    name: "",
    description: "",
    icon: null,
    days: [],
    file: null,
  });
  const [dayMode, setDayMode] = useState("all-week");

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
    if (mode === "all-week") setForm((f) => ({ ...f, days: ALL_DAYS }));
    if (mode === "weekdays") setForm((f) => ({ ...f, days: weekdays }));
    if (mode === "weekends") setForm((f) => ({ ...f, days: weekends }));
    if (mode === "custom") setForm((f) => ({ ...f, days: [] }));
  }

  function toggleDay(day) {
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
    setForm({ name: "", description: "", icon: null, days: [], file: null });
    setDayMode("all-week");
    onClose();
  }

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
            className="bg-zinc-950 rounded-2xl max-h-[85vh] w-full max-w-2xl flex flex-col shadow-2xl text-white border border-zinc-800 overflow-hidden custom-scrollbar"
          >
            {/* Header */}
            <div className="flex justify-between items-center px-6 py-4 border-b border-zinc-800 bg-zinc-900/50">
              <h3 className="text-xl font-semibold text-white">
                Add New Habit
              </h3>
              <button
                onClick={onClose}
                className="text-zinc-400 hover:text-red-400 transition"
                title="Close"
              >
                ✕
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="overflow-y-auto flex-1 p-6 space-y-6">
              {/* Name */}
              <div>
                <label className="block text-sm text-zinc-400 mb-1">
                  Habit Name
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, name: e.target.value }))
                  }
                  placeholder="Habit name"
                  className="w-full rounded-lg bg-zinc-900 border border-zinc-700 p-2 text-white placeholder-zinc-500 focus:ring-1 focus:ring-zinc-500"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm text-zinc-400 mb-1">
                  Description
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, description: e.target.value }))
                  }
                  placeholder="Description (optional)"
                  rows={3}
                  className="w-full rounded-lg bg-zinc-900 border border-zinc-700 p-2 text-white placeholder-zinc-500 focus:ring-1 focus:ring-zinc-500"
                />
              </div>

              {/* Icon Select */}
              <div>
                <p className="text-sm text-zinc-400 mb-2">Choose an Icon</p>
                <IconGrid
                  selected={form.icon}
                  onSelect={(icon) => setForm((f) => ({ ...f, icon }))}
                />
              </div>

              {/* Days */}
              <div>
                <p className="text-sm text-zinc-400 mb-2">Select Days</p>
                <div className="flex flex-wrap gap-2 mb-3">
                  {["all-week", "weekdays", "weekends", "custom"].map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => handleQuickDays(mode)}
                      className={`px-3 py-1 rounded-lg text-sm font-medium transition ${
                        dayMode === mode
                          ? "bg-sky-700 text-white"
                          : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                      }`}
                    >
                      {mode.replace("-", " ")}
                    </button>
                  ))}
                </div>
                {dayMode === "custom" && (
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
                )}
              </div>

              {/* File Upload */}
              <div>
                <label className="block text-sm text-zinc-400 mb-1">
                  Attach File (optional)
                </label>
                <input
                  type="file"
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      file: e.target.files ? e.target.files[0] : null,
                    }))
                  }
                  className="block w-full text-sm text-zinc-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-sky-900/80 file:text-white hover:file:bg-sky-900"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-3 px-6 py-4 border-t border-zinc-800 bg-zinc-900/50">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-lg border border-white/20 bg-transparent hover:bg-white/20 text-white transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 rounded-lg bg-sky-900/80 hover:bg-sky-900 text-white font-medium transition"
              >
                <Save />
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
