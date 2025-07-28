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
import {
  ChevronLeft,
  ChevronRight,
  Settings,
  X,
  PanelLeftClose,
  PanelRightClose,
} from "lucide-react";

const GRID_SLOT_HEIGHT_PX = 16;
const GRID_MINUTES_PER_SLOT = 15;
const HOURS_IN_DAY = 24;
const VIEW_OPTIONS = [1, 3, 5, 7];

// Color palette (unchanged)
const colors = {
  background: "#121217",
  border: "#2a2a40",
  timeLabel: "#8a8ec6",
  hoveredSlot: "rgba(121, 134, 203, 0.25)",
  selectedSlot: "rgba(75, 172, 198, 0.5)",
  taskBg: "linear-gradient(135deg, #623CEA 0%, #7F5AF0 100%)",
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

// Helper function to return ISO string in local time (no 'Z' suffix, no UTC conversion)
function toLocalISOString(date) {
  const pad = (num) => num.toString().padStart(2, "0");
  return (
    date.getFullYear() +
    "-" +
    pad(date.getMonth() + 1) +
    "-" +
    pad(date.getDate()) +
    "T" +
    pad(date.getHours()) +
    ":" +
    pad(date.getMinutes()) +
    ":00"
  );
}

// Modal unchanged - no time editing here
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
      start: toLocalISOString(initialStart), // Use local ISO string here
      end: toLocalISOString(initialEnd),
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
          <X className="text-white hover:text-red-400 duration-300 cursor-pointer" onClick={onClose} />
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

// Sidebar updated with start and end time inputs, sending local ISO strings on save
function Sidebar({ isOpen, onClose, selectedTask: externalSelectedTask, onUpdateTask, tasks, initialTab = "upcoming" }) {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [selectedTask, setSelectedTask] = useState(externalSelectedTask || null);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [links, setLinks] = useState("");
  const [files, setFiles] = useState(null);
  const [startTimeStr, setStartTimeStr] = useState("");
  const [endTimeStr, setEndTimeStr] = useState("");

  useEffect(() => {
    if (isOpen) setActiveTab(initialTab);
  }, [isOpen, initialTab]);

  useEffect(() => {
    if (externalSelectedTask) {
      setActiveTab("tasks");
      setSelectedTask(externalSelectedTask);
    }
  }, [externalSelectedTask]);

  useEffect(() => {
    if (selectedTask) {
      setName(selectedTask.name || "");
      setDescription(selectedTask.description || "");
      setLinks(selectedTask.links || "");
      setFiles(null);

      const start = new Date(selectedTask.start);
      const end = new Date(selectedTask.end);

      function toTimeString(date) {
        const h = date.getHours().toString().padStart(2, "0");
        const m = date.getMinutes().toString().padStart(2, "0");
        return `${h}:${m}`;
      }
      setStartTimeStr(toTimeString(start));
      setEndTimeStr(toTimeString(end));
    } else {
      setName("");
      setDescription("");
      setLinks("");
      setFiles(null);
      setStartTimeStr("");
      setEndTimeStr("");
    }
  }, [selectedTask]);

  if (!isOpen) return null;

  const now = new Date();
  const upcomingTasks = tasks
    .filter((task) => new Date(task.end) > now)
    .sort((a, b) => new Date(a.start) - new Date(b.start));

  const binderTabColors = [
    "#7c3aed",
    "#dc2626",
    "#16a34a",
    "#eab308",
    "#2563eb",
    "#d97706",
    "#0d9488",
    "#4f46e5",
    "#db2777",
    "#059669",
    "#b91c1c",
    "#9333ea",
    "#047857",
    "#0369a1",
    "#ca8a04",
  ];

  const handleFileChange = (e) => setFiles(e.target.files);

  // Parse "HH:mm" and apply to a date reference
  const getDateFromTimeString = (timeStr, referenceDate) => {
    const [hours, minutes] = timeStr.split(":").map(Number);
    if (isNaN(hours) || isNaN(minutes)) return null;
    const d = new Date(referenceDate);
    d.setHours(hours, minutes, 0, 0);
    return d;
  };

  const handleSave = () => {
    if (!selectedTask) return;
    if (!name.trim()) return alert("Task name is required.");

    const startDate = getDateFromTimeString(startTimeStr, new Date(selectedTask.start));
    const endDate = getDateFromTimeString(endTimeStr, new Date(selectedTask.end));

    if (!startDate || !endDate) {
      alert("Please enter valid start and end times.");
      return;
    }
    if (isAfter(startDate, endDate) || isEqual(startDate, endDate)) {
      alert("End time must be after start time.");
      return;
    }
    if (!isEqual(startOfDay(startDate), startOfDay(endDate))) {
      alert("Start and end times must be on the same day.");
      return;
    }

    const updatedTask = {
      ...selectedTask,
      name: name.trim(),
      description: description.trim(),
      links: links.trim(),
      files,
      start: toLocalISOString(startDate), // Use local ISO string here
      end: toLocalISOString(endDate),
    };

    onUpdateTask(updatedTask);
  };

  const handleCancel = () => {
    if (selectedTask) {
      setName(selectedTask.name || "");
      setDescription(selectedTask.description || "");
      setLinks(selectedTask.links || "");
      setFiles(null);

      const start = new Date(selectedTask.start);
      const end = new Date(selectedTask.end);
      function toTimeString(date) {
        const h = date.getHours().toString().padStart(2, "0");
        const m = date.getMinutes().toString().padStart(2, "0");
        return `${h}:${m}`;
      }
      setStartTimeStr(toTimeString(start));
      setEndTimeStr(toTimeString(end));
    }
  };

  const tabStyle = (active) =>
    `px-4 py-2 font-semibold border-b-2 ${
      active
        ? "border-sky-600 text-white"
        : "border-transparent text-gray-400 hover:text-white hover:border-gray-600"
    } cursor-pointer select-none transition-colors`;

  return (
    <div
      className="fixed top-0 right-0 h-full w-[400px] bg-[#18182b] shadow-xl z-50 border-l border-[#444478] transition-transform duration-300"
      style={{ transform: isOpen ? "translateX(0)" : "translateX(100%)", backdropFilter: "blur(8px)" }}
    >
      <div className="flex justify-between items-center p-4 border-b border-[#444478]">
        <div className="flex space-x-2">
          <button className={tabStyle(activeTab === "upcoming")} onClick={() => setActiveTab("upcoming")}>
            Upcoming
          </button>
          <button className={tabStyle(activeTab === "tasks")} onClick={() => setActiveTab("tasks")}>
            Tasks
          </button>
        </div>
        <button
          onClick={() => {
            onClose();
            setSelectedTask(null);
            setFiles(null);
            setActiveTab("upcoming");
          }}
          aria-label="Close Sidebar"
          type="button"
          className="text-white hover:text-red-400 transition p-2 duration-300 cursor-pointer"
        >
          <PanelLeftClose size={24} />
        </button>
      </div>

      {activeTab === "upcoming" && (
        <div className="overflow-y-auto h-[calc(100%-56px)] p-6 space-y-4">
          {upcomingTasks.length === 0 ? (
            <p className="text-center text-gray-400 select-none mt-8">No upcoming tasks</p>
          ) : (
            upcomingTasks.map((task) => {
              const hash =
                typeof task.id === "string"
                  ? task.id.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0)
                  : Number(task.id);
              const colorIdx = Math.abs(hash) % binderTabColors.length;
              const previewBgColor = binderTabColors[colorIdx];
              const start = new Date(task.start);
              const end = new Date(task.end);
              return (
                <button
                  key={task.id}
                  onClick={() => {
                    setActiveTab("tasks");
                    setSelectedTask(task);
                  }}
                  type="button"
                  className="w-full text-left rounded-xl hover:brightness-110 border border-[#363678] shadow-sm transition flex flex-col gap-1 px-5 py-4"
                  style={{ background: previewBgColor }}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-base truncate max-w-[70%]">
                      {task.name.length > 28 ? task.name.slice(0, 28) + "…" : task.name}
                    </span>
                    <span className="ml-auto rounded-full px-2 py-0.5 text-xs bg-[#1d1d36] text-indigo-200 font-mono">
                      {format(start, "MM/dd")}
                    </span>
                  </div>
                  {task.description && (
                    <div className="text-sm italic text-[#a0a0c0] truncate max-w-full" title={task.description}>
                      {task.description.length > 48 ? task.description.slice(0, 48) + "…" : task.description}
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-xs text-indigo-200 mt-1">
                    <span>
                      {format(start, "EEE h:mmaaa")} – {format(end, "h:mmaaa")}
                    </span>
                  </div>
                </button>
              );
            })
          )}
        </div>
      )}

      {activeTab === "tasks" && (
        <div className="flex h-[calc(100%-56px)]">
          <nav className="w-1/3 border-r border-[#444478] overflow-y-auto p-2">
            {upcomingTasks.length === 0 ? (
              <p className="text-gray-400 text-center mt-4">No tasks available</p>
            ) : (
              upcomingTasks.map((task) => {
                const hash =
                  typeof task.id === "string"
                    ? task.id.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0)
                    : Number(task.id);
                const colorIndex = Math.abs(hash) % binderTabColors.length;
                const bgColor = binderTabColors[colorIndex];

                const isSelected = selectedTask?.id === task.id;

                return (
                  <button
                    key={task.id}
                    onClick={() => setSelectedTask(task)}
                    type="button"
                    className={`block w-full text-left mb-1 p-2 rounded truncate font-semibold shadow-md transition-transform duration-150 focus:outline-none ${
                      isSelected ? "scale-105" : "hover:scale-105 hover:shadow-lg"
                    }`}
                    style={{
                      backgroundColor: bgColor,
                      color: "white",
                      border: isSelected ? "2px solid white" : "none",
                    }}
                  >
                    {task.name}
                  </button>
                );
              })
            )}
          </nav>

          <div className="flex-grow overflow-y-auto p-4 space-y-4">
            {selectedTask ? (
              <>
                <label className="block">
                  <span className="text-indigo-200 font-semibold">Task Name*</span>
                  <input
                    type="text"
                    maxLength={100}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="mt-1 block w-full rounded-md bg-zinc-800 border border-zinc-700 p-2 text-white focus:outline-none focus:border-sky-500"
                    required
                  />
                </label>
                <label className="block">
                  <span className="text-indigo-200 font-semibold">Description</span>
                  <textarea
                    rows={4}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="mt-1 block w-full rounded-md bg-zinc-800 border border-zinc-700 p-2 text-white resize-y focus:outline-none focus:border-sky-500"
                    placeholder="Add a description (optional)"
                  />
                </label>
                <label className="block">
                  <span className="text-indigo-200 font-semibold">Links (comma separated URLs)</span>
                  <input
                    type="text"
                    value={links}
                    onChange={(e) => setLinks(e.target.value)}
                    className="mt-1 block w-full rounded-md bg-zinc-800 border border-zinc-700 p-2 text-white focus:outline-none focus:border-sky-500"
                    placeholder="https://example.com, https://docs.com"
                  />
                </label>

                {/* Start and end time inputs */}
                <label className="block">
                  <span className="text-indigo-200 font-semibold">Start Time (HH:mm)*</span>
                  <input
                    type="time"
                    value={startTimeStr}
                    onChange={(e) => setStartTimeStr(e.target.value)}
                    className="mt-1 block w-full rounded-md bg-zinc-800 border border-zinc-700 p-2 text-white focus:outline-none focus:border-sky-500"
                    required
                  />
                </label>
                <label className="block">
                  <span className="text-indigo-200 font-semibold">End Time (HH:mm)*</span>
                  <input
                    type="time"
                    value={endTimeStr}
                    onChange={(e) => setEndTimeStr(e.target.value)}
                    className="mt-1 block w-full rounded-md bg-zinc-800 border border-zinc-700 p-2 text-white focus:outline-none focus:border-sky-500"
                    required
                  />
                </label>

                <label className="block">
                  <span className="text-indigo-200 font-semibold">Attach Files</span>
                  <input
                    type="file"
                    multiple
                    onChange={handleFileChange}
                    className="mt-1 w-full block bg-orange-700 p-2 rounded-xl hover:bg-orange-600 duration-300 cursor-pointer"
                  />
                  {files && files.length > 0 && (
                    <p className="mt-1 text-sm text-indigo-300">
                      {files.length} file{files.length > 1 ? "s" : ""} selected
                    </p>
                  )}
                </label>
                <div className="flex justify-end space-x-4 mt-4">
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="px-4 py-2 rounded-xl bg-transparent border border-gray-500 hover:bg-zinc-600 transition cursor-pointer duration-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSave}
                    className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 transition font-semibold cursor-pointer duration-300"
                  >
                    Save
                  </button>
                </div>
              </>
            ) : (
              <p className="text-gray-400 select-none mt-6">Select a task from the list to edit</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function App() {
  const [viewType, setViewType] = useState(7);
  const [tasks, setTasks] = useState([]);

  const [startDay, setStartDay] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartTime, setDragStartTime] = useState(null);
  const [dragEndTime, setDragEndTime] = useState(null);
  const [hoverTime, setHoverTime] = useState(null);
  const calendarRef = useRef(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [pendingTaskData, setPendingTaskData] = useState(null);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarInitialTab, setSidebarInitialTab] = useState("upcoming");
  const [selectedTask, setSelectedTask] = useState(null);

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

  const addNewTask = async (task) => {
    try {
      const res = await fetch("http://127.0.0.1:5000/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(task),
      });
      if (!res.ok) throw new Error("Failed to add task");
      const newTask = await res.json();
      setTasks((prev) => [...prev, newTask]);
    } catch (err) {
      console.error("Error adding task:", err);
    }
  };

  const daysToShow = Array.from({ length: viewType }).map((_, i) => addDays(startDay, i));

  const getSnappedSlotDate = (yPx, columnDate) => {
    if (!calendarRef.current) return new Date(columnDate);
    const rect = calendarRef.current.getBoundingClientRect();
    const relativeY = yPx - rect.top + calendarRef.current.scrollTop;
    const totalMinutes = (relativeY / GRID_SLOT_HEIGHT_PX) * GRID_MINUTES_PER_SLOT;
    const snapped = Math.floor(totalMinutes / GRID_MINUTES_PER_SLOT) * GRID_MINUTES_PER_SLOT;
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
    "#16a34a",
    "#059669",
    "#0d9488",
    "#2563eb",
    "#0284c7",
    "#4f46e5",
    "#15803d",
    "#047857",
    "#115e59",
    "#1d4ed8",
    "#0369a1",
    "#4338ca",
    "#b91c1c",
  ];

  function getTaskColor(id) {
    let hash = 0;
    if (typeof id !== "string") id = String(id);
    for (let i = 0; i < id.length; i++) {
      hash = id.charCodeAt(i) + ((hash << 5) - hash);
    }
    return taskColors[Math.abs(hash) % taskColors.length];
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 to-black text-gray-100 font-sans">
      <nav
        className="flex items-center gap-3 mb-4 w-full h-[64px] mx-auto font-semibold relative p-5 border-b-2 border-gray-400"
        style={{ color: colors.navIcon }}
      >
        <button
          onClick={() => setStartDay(addDays(startDay, -viewType))}
          className="p-2 rounded transition-colors shadow-md shadow-black cursor-pointer"
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
          className="p-2 rounded transition-colors shadow-md shadow-black cursor-pointer"
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
          className="ml-auto flex items-center gap-1 p-3 rounded cursor-pointer transition-colors shadow-md shadow-black"
          style={{ backgroundColor: "transparent", color: colors.navIcon }}
          onMouseEnter={(e) => (e.currentTarget.style.color = colors.navIconHover)}
          onMouseLeave={(e) => (e.currentTarget.style.color = colors.navIcon)}
          aria-label="Toggle View Settings"
          type="button"
        >
          <Settings size={20} />
          <span className="hidden md:inline select-none">View</span>
        </button>

        {!sidebarOpen && (
          <button
            onClick={() => setSidebarOpen(true)}
            aria-label="Open Sidebar"
            type="button"
            className="text-white hover:text-green-400 transition p-2 cursor-pointer duration-300"
          >
            <PanelRightClose size={24} />
          </button>
        )}

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
            marginRight: sidebarOpen ? 385 : 0,
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
                  .filter((t) => isEqual(startOfDay(new Date(t.start)), startOfDay(date)))
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
                        onClick={() => {
                          setSelectedTask(task);
                          setSidebarInitialTab("tasks");
                          setSidebarOpen(true);
                        }}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            setSelectedTask(task);
                            setSidebarOpen(true);
                          }
                        }}
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
                        <div className="text-[10px] opacity-90" style={{ color: "rgba(255, 255, 255, 0.85)" }}>
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

      {/* Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => {
          setSidebarOpen(false);
          setSelectedTask(null);
          setSidebarInitialTab("upcoming");
        }}
        selectedTask={selectedTask}
        onUpdateTask={async (updatedTask) => {
          try {
            const res = await fetch(`http://127.0.0.1:5000/api/tasks/${updatedTask.id}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                name: updatedTask.name,
                description: updatedTask.description,
                links: updatedTask.links,
                start: updatedTask.start,
                end: updatedTask.end,
              }),
            });
            if (!res.ok) throw new Error("Failed to update task");
            const updated = await res.json();
            setTasks((tasks) => tasks.map((t) => (t.id === updated.id ? updated : t)));
            setSelectedTask(updated);
            alert("Task successfully updated!");
          } catch (error) {
            console.error(error);
            alert("Error updating task");
          }
        }}
        tasks={tasks}
        initialTab={sidebarInitialTab}
      />

      {/* Debug Panel */}
      <section className="mt-12 max-w-[1200px] mx-auto bg-slate-800 border border-slate-700 text-slate-300 rounded-2xl p-6 font-mono text-sm overflow-x-auto px-6 sm:px-0">
        <h2 className="mb-4 text-lg font-semibold border-b border-slate-600 pb-2">🐛 Debug: Current Tasks</h2>
        <pre>{JSON.stringify(tasks, null, 2)}</pre>
      </section>
    </div>
  );
}
