import React, { useRef, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import IconGrid from "./IconGrid";

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
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
        >
          <motion.div
            ref={modalRef}
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
            className="bg-gray-900 rounded-xl shadow-2xl p-6 border border-white/20 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
          >
            <h3 className="text-xl font-bold text-white mb-4">Add New Habit</h3>

            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Habit name"
              className="w-full rounded-lg p-2 mb-4 bg-white/5 border border-white/20 text-white placeholder-gray-400"
            />

            <textarea
              value={form.description}
              onChange={(e) =>
                setForm((f) => ({ ...f, description: e.target.value }))
              }
              placeholder="Description (optional)"
              className="w-full rounded-lg p-2 mb-4 bg-white/5 border border-white/20 text-white placeholder-gray-400"
              rows={3}
            />

            <p className="text-white font-medium mb-2">Choose an Icon</p>
            <IconGrid
              selected={form.icon}
              onSelect={(icon) => setForm((f) => ({ ...f, icon }))}
            />

            <p className="text-white font-medium mt-6 mb-2">Select Days</p>
            <div className="flex gap-2 mb-4">
              {["all-week", "weekdays", "weekends", "custom"].map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => handleQuickDays(mode)}
                  className={`px-3 py-1 rounded-lg text-sm ${
                    dayMode === mode
                      ? "bg-emerald-600 text-white"
                      : "bg-white/10 text-gray-300 hover:bg-white/20"
                  }`}
                >
                  {mode.replace("-", " ")}
                </button>
              ))}
            </div>
            {dayMode === "custom" && (
              <div className="flex flex-wrap gap-2 mb-4">
                {ALL_DAYS.map((day) => (
                  <button
                    key={day}
                    type="button"
                    onClick={() => toggleDay(day)}
                    className={`px-3 py-1 rounded-lg text-sm ${
                      form.days.includes(day)
                        ? "bg-sky-600 text-white"
                        : "bg-white/10 text-gray-300 hover:bg-white/20"
                    }`}
                  >
                    {day}
                  </button>
                ))}
              </div>
            )}

            <div className="mb-4">
              <label className="block text-white font-medium mb-2">
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
                className="text-white"
              />
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-lg bg-white/10 text-gray-200 hover:bg-white/20"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700"
              >
                Save Habit
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
