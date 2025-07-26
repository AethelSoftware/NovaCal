"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  format,
  addDays,
  startOfWeek,
  addMinutes,
  isBefore,
  isAfter,
  isEqual,
  startOfDay,
  getHours,
  getMinutes,
} from "date-fns";
import { ChevronLeft, ChevronRight, Settings, X } from "lucide-react";

const GRID_SLOT_HEIGHT_PX = 16;
const GRID_MINUTES_PER_SLOT = 15;
const HOURS_IN_DAY = 24;
const VIEW_OPTIONS = [1, 3, 5, 7];

// Color palette inspired by Reclaim's vibrant pastel yet dark friendly palette
const colors = {
  background: "#121217",
  border: "#2a2a40",
  timeLabel: "#8a8ec6",
  hoveredSlot: "rgba(121, 134, 203, 0.25)", // soft indigo
  selectedSlot: "rgba(75, 172, 198, 0.5)", // bright cyan
  taskBg: "linear-gradient(135deg, #623CEA 0%, #7F5AF0 100%)", // purple gradient
  taskBorder: "#7F5AF0",
  headerBg: "#1E1E2F",
  dayLabel: "#a3a3f7",
  navIcon: "#7F7FEB",
  navIconHover: "#b3b3fc",
  settingsBg: "#1c1c30",
  settingsBorder: "#444478",
  settingsOptionActive: "#7f5af0",
  settingsOptionHover: "#2a2a40",
};

function Modal({ isOpen, onClose, onSubmit, initialName, initialStart, initialEnd }) {
  const [name, setName] = useState(initialName || "");
  const [description, setDescription] = useState("");
  const [links, setLinks] = useState("");
  const [files, setFiles] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setName(initialName || "");
      setDescription("");
      setLinks("");
      setFiles(null);
    }
  }, [isOpen, initialName]);

  const handleFileChange = (e) => {
    setFiles(e.target.files);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      name: name.trim(),
      description: description.trim(),
      links: links.trim(),
      files,
      start: initialStart.toISOString(),
      end: initialEnd.toISOString(),
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-opacity-70 p-4">
      <form
        onSubmit={handleSubmit}
        className="bg-zinc-900 rounded-lg p-6 max-w-lg w-full space-y-4 shadow-lg text-white border-1 border-gray-400 shadow-xl shadow-black"
        aria-modal="true"
        role="dialog"
        aria-labelledby="modal-title"
      >
        <div className="w-full flex items-center justify-between mt-3">
          <h2 id="modal-title" className="text-3xl font-bold text-gray-300">
            Add Task/Event
          </h2>
          <X className="text-white hover:text-red-400 duration-300 cursor-pointer" onClick={onClose}/>
        </div>     

        <label className="block">
          <span className="text-indigo-200">Task Name</span>
          <input
            type="text"
            required
            maxLength={100}
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 block w-full rounded-md bg-zinc-800 border border-zinc-700 p-2 text-white"
            autoFocus
          />
        </label>

        <label className="block">
          <span className="text-indigo-200">Description</span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="mt-1 block w-full rounded-md bg-zinc-800 border border-zinc-700 p-2 text-white resize-y"
            placeholder="Add a description (optional)"
          />
        </label>

        <label className="block">
          <span className="text-indigo-200">Links (comma separated URLs)</span>
          <input
            type="text"
            value={links}
            onChange={(e) => setLinks(e.target.value)}
            className="mt-1 block w-full rounded-md bg-zinc-800 border border-zinc-700 p-2 text-white"
            placeholder="https://example.com, https://docs.com"
          />
        </label>

        <label className="block">
          <input
            type="file"
            multiple
            onChange={handleFileChange}
            className="mt-1 block bg-orange-700 p-3 rounded-xl hover:bg-orange-600 duration-300 cursor-pointer"
          />
          {files && files.length > 0 && (
            <p className="mt-1 text-sm text-indigo-300">
              {files.length} file{files.length > 1 ? "s" : ""} selected
            </p>
          )}
        </label>

        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-transparent border-1 border-gray-200 hover:bg-zinc-600 transition cursor-pointer duration-300"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 transition font-semibold cursor-pointer duration-300"
          >
            Save
          </button>
        </div>
      </form>
    </div>
  );
}

export default function App() {
  const [viewType, setViewType] = useState(7); // You can change this as needed
  const [tasks, setTasks] = useState([]);

  const [startDay, setStartDay] = useState(() =>
    startOfWeek(new Date(), { weekStartsOn: 1 })
  );
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartTime, setDragStartTime] = useState(null);
  const [dragEndTime, setDragEndTime] = useState(null);
  const [hoverTime, setHoverTime] = useState(null);
  const calendarRef = useRef(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [pendingTaskData, setPendingTaskData] = useState(null);

  // Fetch tasks on mount
  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const res = await fetch("http://127.0.0.1:5000/api/tasks");
        if (!res.ok) throw new Error("Failed to fetch tasks");
        const data = await res.json();
        setTasks(data);
      } catch (err) {
        console.error("Error loading tasks:", err);
      }
    };

    fetchTasks();
  }, []);

  // Add a new task to backend and state
  const addNewTask = async (task) => {
    try {
      const res = await fetch("http://127.0.0.1:5000/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(task), // expects { name, start, end, description? }
      });

      if (!res.ok) throw new Error("Failed to add task");
      const newTask = await res.json();
      setTasks((prev) => [...prev, newTask]);
    } catch (err) {
      console.error("Error adding task:", err);
    }
  };

  const daysToShow = Array.from({ length: viewType }).map((_, i) =>
    addDays(startDay, i)
  );

  const getSnappedSlotDate = (yPx, columnDate) => {
    if (!calendarRef.current) return new Date(columnDate);
    const rect = calendarRef.current.getBoundingClientRect();
    const relativeY = yPx - rect.top + calendarRef.current.scrollTop;
    const totalMinutes = (relativeY / GRID_SLOT_HEIGHT_PX) * GRID_MINUTES_PER_SLOT;
    const snapped =
      Math.floor(totalMinutes / GRID_MINUTES_PER_SLOT) * GRID_MINUTES_PER_SLOT;
    const d = new Date(columnDate);
    d.setHours(0, snapped, 0, 0);
    return d;
  };

  const handleMouseDown = (e, slotDate) => {
    if (e.button !== 0) return;
    setIsDragging(true);
    setDragStartTime(slotDate);
    setDragEndTime(slotDate);
  };

  const handleMouseMove = (e, columnDate) => {
    const snappedDate = getSnappedSlotDate(e.clientY, columnDate);
    setHoverTime(snappedDate);
    if (isDragging) setDragEndTime(snappedDate);
  };

  const cleanUpDrag = useCallback(() => {
    setIsDragging(false);
    setDragStartTime(null);
    setDragEndTime(null);
    setHoverTime(null);
  }, []);

  const handleMouseUp = useCallback(() => {
    if (!dragStartTime || !dragEndTime) return cleanUpDrag();
    setIsDragging(false);

    let start = dragStartTime;
    let end = dragEndTime;
    if (isAfter(start, end)) [start, end] = [end, start];
    end = addMinutes(end, GRID_MINUTES_PER_SLOT);

    if (!isEqual(startOfDay(start), startOfDay(end))) {
      alert("Tasks must stay on the same day.");
      return cleanUpDrag();
    }

    setPendingTaskData({ start, end, name: "" });
    setModalOpen(true);
    cleanUpDrag();
  }, [dragStartTime, dragEndTime, cleanUpDrag]);

  const handleModalSubmit = (taskDetails) => {
    if (!taskDetails.name) {
      alert("Task name is required.");
      return;
    }
    addNewTask(taskDetails);
    setModalOpen(false);
    setPendingTaskData(null);
  };

  useEffect(() => {
    if (!calendarRef.current) return;

    const el = calendarRef.current;
    el.addEventListener("mouseup", handleMouseUp);
    el.addEventListener("mouseleave", cleanUpDrag);
    return () => {
      el.removeEventListener("mouseup", handleMouseUp);
      el.removeEventListener("mouseleave", cleanUpDrag);
    };
  }, [handleMouseUp, cleanUpDrag]);

  const taskColors = [
    "#ea580c", // orange-600
    "#16a34a", // green-600
    "#059669", // emerald-600
    "#0d9488", // teal-600
    "#2563eb", // blue-600
    "#0284c7", // sky-600
    "#4f46e5", // indigo-600
    "#dc2626", // red-600
    "#c2410c", // orange-700
    "#15803d", // green-700
    "#047857", // emerald-700
    "#115e59", // teal-700
    "#1d4ed8", // blue-700
    "#0369a1", // sky-700
    "#4338ca", // indigo-700
    "#b91c1c", // red-700
  ];

  function getTaskColor(id) {
    let hash = 0;
    if (typeof id !== "string") id = String(id);
    for (let i = 0; i < id.length; i++) {
      hash = id.charCodeAt(i) + ((hash << 5) - hash);
    }
    const color = taskColors[Math.abs(hash) % taskColors.length];
    return color;
  }



  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 to-black text-gray-100 font-sans">
      <nav
        className="flex items-center gap-3 mb-4 w-full h-[64px] mx-auto font-semibold relative p-5 border-b-2 border-gray-400"
        style={{ color: colors.navIcon }}
      >
        <button
          onClick={() => setStartDay(addDays(startDay, -viewType))}
          className="p-2 rounded transition-colors"
          style={{ backgroundColor: "transparent" }}
          onMouseEnter={(e) => (e.currentTarget.style.color = colors.navIconHover)}
          onMouseLeave={(e) => (e.currentTarget.style.color = colors.navIcon)}
          aria-label="Previous"
          type="button"
        >
          <ChevronLeft size={20} />
        </button>

        <button
          onClick={() => setStartDay(addDays(startDay, viewType))}
          className="p-2 rounded transition-colors"
          style={{ backgroundColor: "transparent" }}
          onMouseEnter={(e) => (e.currentTarget.style.color = colors.navIconHover)}
          onMouseLeave={(e) => (e.currentTarget.style.color = colors.navIcon)}
          aria-label="Next"
          type="button"
        >
          <ChevronRight size={20} />
        </button>

        <button
          onClick={() => setSettingsOpen(!settingsOpen)}
          className="ml-auto flex items-center gap-1 p-2 rounded cursor-pointer transition-colors"
          style={{ backgroundColor: "transparent", color: colors.navIcon }}
          onMouseEnter={(e) => (e.currentTarget.style.color = colors.navIconHover)}
          onMouseLeave={(e) => (e.currentTarget.style.color = colors.navIcon)}
          aria-label="Toggle View Settings"
          type="button"
        >
          <Settings size={20} />
          <span className="hidden md:inline select-none">View</span>
        </button>

        {settingsOpen && (
          <div
            className="absolute top-full right-0 p-3 rounded shadow-xl z-50"
            style={{
              backgroundColor: colors.settingsBg,
              border: `1px solid ${colors.settingsBorder}`,
              width: 160,
            }}
          >
            <p className="mb-2 font-semibold" style={{ color: colors.settingsOptionActive }}>
              Days to View
            </p>
            {VIEW_OPTIONS.map((d) => (
              <button
                key={d}
                onClick={() => {
                  setViewType(d);
                  setStartDay(startOfWeek(new Date(), { weekStartsOn: 1 }));
                  setSettingsOpen(false);
                }}
                className="w-full text-left px-3 py-1 rounded mb-1 text-sm transition-colors"
                style={{
                  color: viewType === d ? "#fff" : colors.timeLabel,
                  backgroundColor: viewType === d ? colors.settingsOptionActive : "transparent",
                }}
                onMouseEnter={(e) => {
                  if (viewType !== d) e.currentTarget.style.backgroundColor = colors.settingsOptionHover;
                  e.currentTarget.style.color = "#fff";
                }}
                onMouseLeave={(e) => {
                  if (viewType !== d) e.currentTarget.style.backgroundColor = "transparent";
                  e.currentTarget.style.color = viewType === d ? "#fff" : colors.timeLabel;
                }}
                type="button"
              >
                {d} day{d > 1 ? "s" : ""}
              </button>
            ))}
          </div>
        )}
      </nav>

      {/* Calendar */}
      <main className="w-full mx-auto rounded-3xl shadow-xl">
        <div
          ref={calendarRef}
          className="grid border rounded-xl overflow-y-auto shadow-inner relative calendar-scrollbar"
          style={{
            gridTemplateColumns: `64px repeat(${viewType}, 1fr)`,
            height: "calc(100vh - 64px)",
            backgroundColor: colors.background,
            borderColor: colors.border,
          }}
        >
          {/* Time Column */}
          <div
            className="sticky left-0 top-0 z-20 border-r bg-zinc-900"
            style={{
              backgroundColor: colors.headerBg,
              borderColor: colors.border,
              boxShadow: "2px 0 6px rgba(0,0,0,0.8)",
              userSelect: "none",
            }}
          >
            <div
              className="h-16 flex items-center justify-center text-xs font-semibold"
              style={{ color: colors.timeLabel, borderBottom: `1px solid ${colors.border}` }}
            >
              Time
            </div>
            {Array.from({ length: HOURS_IN_DAY }).map((_, hour) => (
              <div
                key={hour}
                className="relative border-t flex items-center justify-center"
                style={{
                  height: GRID_SLOT_HEIGHT_PX * 4,
                  borderColor: colors.border,
                  color: colors.timeLabel,
                  fontSize: 10,
                  fontWeight: 600,
                  userSelect: "none",
                }}
                aria-hidden="true"
              >
                <span className="absolute -top-1" style={{ color: colors.timeLabel }}>
                  {format(new Date().setHours(hour, 0, 0, 0), "ha")}
                </span>
              </div>
            ))}
          </div>

          {/* Days Columns */}
          {daysToShow.map((date, idx) => (
            <div
              key={idx}
              className="calendar-column relative flex flex-col border-r"
              onMouseLeave={() => setHoverTime(null)}
              style={{ backgroundColor: colors.background, borderColor: colors.border }}
            >
              {/* Header */}
              <div
                className="sticky top-0 z-10 border-b flex flex-col items-center justify-center text-center bg-zinc-900"
                style={{
                  height: 64,
                  backgroundColor: colors.headerBg,
                  borderColor: colors.border,
                  userSelect: "none",
                  color: colors.dayLabel,
                  fontWeight: 600,
                }}
              >
                <span className="uppercase text-xs">{format(date, "EEE")}</span>
                <span className="mt-1 text-lg font-bold text-white">{format(date, "MMM d")}</span>
              </div>

              {/* Time Slots */}
              <div className="relative flex-grow select-none">
                {Array.from({ length: HOURS_IN_DAY * 4 }).map((_, i) => {
                  const slotDate = new Date(date);
                  slotDate.setHours(0, i * GRID_MINUTES_PER_SLOT, 0, 0);

                  const isHovered = hoverTime && isEqual(slotDate, hoverTime);

                  const isSelected = (() => {
                    if (!isDragging || !dragStartTime || !dragEndTime) return false;
                    let [start, end] = [dragStartTime, dragEndTime];
                    if (isAfter(start, end)) [start, end] = [end, start];
                    return (
                      !isBefore(slotDate, start) &&
                      isBefore(slotDate, addMinutes(end, GRID_MINUTES_PER_SLOT))
                    );
                  })();

                  return (
                    <div
                      key={i}
                      onMouseDown={(e) => handleMouseDown(e, slotDate)}
                      onMouseMove={(e) => handleMouseMove(e, date)}
                      className="border-t cursor-pointer transition-colors"
                      style={{
                        height: GRID_SLOT_HEIGHT_PX,
                        borderColor: colors.border,
                        backgroundColor: isSelected
                          ? colors.selectedSlot
                          : isHovered
                          ? colors.hoveredSlot
                          : "transparent",
                        transition: "background-color 0.15s ease",
                      }}
                      aria-label={`Time slot ${format(slotDate, "p")}`}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleMouseDown(e, slotDate);
                      }}
                    />
                  );
                })}

                {/* Task Blocks */}
                {tasks
                  .filter((t) =>
                    isEqual(startOfDay(new Date(t.start)), startOfDay(date))
                  )
                  .map((task) => {
                    const start = new Date(task.start);
                    const end = new Date(task.end);
                    const top =
                      ((getHours(start) * 60 + getMinutes(start)) / GRID_MINUTES_PER_SLOT) *
                      GRID_SLOT_HEIGHT_PX;
                    const height =
                      ((end - start) / 60000 / GRID_MINUTES_PER_SLOT) * GRID_SLOT_HEIGHT_PX;

                    return (
                      <div
                        key={task.id}
                        className="absolute left-1 right-1 z-20 rounded-md text-white p-1 font-semibold shadow-lg cursor-pointer select-text"
                        style={{
                          top,
                          height,
                          background: getTaskColor(task.id),
                          border: `1.5px solid ${getTaskColor(task.id)}`,
                          boxShadow:
                            "0 2px 6px rgba(0,0,0,0.3), inset 0 0 8px rgba(255,255,255,0.10)",
                          overflow: "hidden",
                          userSelect: "text",
                        }}
                        title={`${task.name}: ${format(start, "p")} – ${format(end, "p")}`}
                      >
                        <div className="truncate">{task.name}</div>
                        {task.description && (
                          <div
                            className="text-[10px] opacity-80 italic truncate"
                            style={{ color: "rgba(255, 255, 255, 0.75)" }}
                            title={task.description}
                          >
                            {task.description}
                          </div>
                        )}
                        <div
                          className="text-[10px] opacity-90"
                          style={{ color: "rgba(255, 255, 255, 0.85)" }}
                        >
                          {format(start, "p")} - {format(end, "p")}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Task Details Entry Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setPendingTaskData(null);
        }}
        onSubmit={handleModalSubmit}
        initialName={pendingTaskData?.name}
        initialStart={pendingTaskData?.start}
        initialEnd={pendingTaskData?.end}
      />

      {/* Debug Panel */}
      <section className="mt-12 max-w-[1200px] mx-auto bg-slate-800 border border-slate-700 text-slate-300 rounded-2xl p-6 font-mono text-sm overflow-x-auto px-6 sm:px-0">
        <h2 className="mb-4 text-lg font-semibold border-b border-slate-600 pb-2">
          🐛 Debug: Current Tasks
        </h2>
        <pre>{JSON.stringify(tasks, null, 2)}</pre>
      </section>
    </div>
  );
}
