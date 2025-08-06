"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
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
  differenceInMinutes,
} from "date-fns";
import {
  ChevronLeft,
  ChevronRight,
  Settings,
  X,
  PanelLeftClose,
  PanelRightClose,
  Plus,
  ZapOff,
  Zap,
  AlertTriangle,
} from "lucide-react";
import {
  roundToNearest15,
  floorTo15,
  ceilTo15,
  isMultiple15,
  toLocalISOString
} from "./utils/calendarUtils";

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

  const taskColors = [
    "#15803d", // green-600 (original #16a34a was green-700)
    "#059669", // emerald-600 (original was emerald-600)
    "#0d9488", // teal-700 (original was teal-700)
    "#2563eb", // blue-700 (original was blue-700)
    "#0284c7", // sky-700 (original was sky-700)
    "#4f46e5", // indigo-700 (original was indigo-700)
    "#047857", // emerald-700
    "#115e59", // teal-800
    "#1d4ed8", // blue-800
    "#0369a1", // sky-800
    "#4338ca", // indigo-800
    "#b91c1c", // red-700
    "#991b1b", // red-800
    "#c2410c", // orange-700
    "#9a3412", // orange-800
    "#be123c", // rose-700
    "#9f1239", // rose-800
  ];

  function getTaskColor(id) {
    let hash = 0;
    if (typeof id !== "string") id = String(id);
    for (let i = 0; i < id.length; i++) {
      hash = id.charCodeAt(i) + ((hash << 5) - hash);
    }
    return taskColors[Math.abs(hash) % taskColors.length];
  }

  import Modal from "./components/SimpleModal";

function CreateTaskModal({ isOpen, onClose, onSubmit }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [links, setLinks] = useState("");
  const [files, setFiles] = useState(null);
  const [start, setStart] = useState(() => format(new Date(), "yyyy-MM-dd'T'HH:mm"));
  const [due, setDue] = useState(() => format(addMinutes(new Date(), 720), "yyyy-MM-dd'T'HH:mm")); // 12hr later
  const [length, setLength] = useState(60); // min
  const [importance, setImportance] = useState(2);

  // Split block state
  const [splitEnabled, setSplitEnabled] = useState(false);
  const [blockDuration, setBlockDuration] = useState(30); // Minutes

  useEffect(() => {
    if (isOpen) {
      const nowRounded = roundToNearest15(new Date());
      const due = roundToNearest15(addMinutes(nowRounded, 24 * 60));
      setStart(format(nowRounded, "yyyy-MM-dd'T'HH:mm"));
      setDue(format(due, "yyyy-MM-dd'T'HH:mm"));
      setName("");
      setDescription("");
      setLinks("");
      setFiles(null);
      setLength(60);
      setImportance(2);
      setSplitEnabled(false);
      setBlockDuration(30);
    }
  }, [isOpen]);


  // Split preview: breaks up the length (not interval from start to due!)
  const timeBlocks = useMemo(() => {
    const blocks = [];
    if (!splitEnabled || length < 1) return blocks;
    try {
      // Compute blocks, starting at `start`
      let total = Number(length);
      let cursor = roundToNearest15(new Date(start));
      let count = 0;
      while (total > 0 && count < 100) {
        let min = Math.min(blockDuration, total);
        let blockEnd = addMinutes(cursor, min);
        blocks.push({
          start: format(cursor, "yyyy-MM-dd'T'HH:mm:ss"), // Use ISO string for backend
          end: format(blockEnd, "yyyy-MM-dd'T'HH:mm:ss"), // Use ISO string for backend
          length: min
        });
        cursor = blockEnd;
        total -= min;
        count++;
      }
    } catch { /* empty for now */}
    return blocks;
  }, [splitEnabled, start, length, blockDuration]);

  // Duration between start & due (display only)
  const startDate = new Date(start);
  const dueDate = new Date(due);
  const durationBetween = isNaN(dueDate - startDate) || dueDate < startDate ? null :
    differenceInMinutes(dueDate, startDate);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      alert("Task name is required.");
      return;
    }
    if (!start || !due || isNaN(startDate) || isNaN(dueDate) || dueDate < startDate) {
      alert("Please provide a valid chronological start and due date.");
      return;
    }
    if (!length || isNaN(Number(length)) || Number(length) <= 0) {
      alert("Please enter a valid length in minutes.");
      return;
    }
    // Do not send to backend. Instead, invoke onSubmit with all our info (including preview blocks).
    onSubmit({
      name: name.trim(),
      description: description.trim(),
      links: links.trim(),
      files,
      start, // Pass the ISO string directly
      due,   // Pass the ISO string directly
      length: Number(length),
      importance,
      splitEnabled, // Pass splitEnabled status
      blockDuration: Number(blockDuration), // Pass block duration
      blocks: timeBlocks, // The array of generated blocks for the custom task
    });
    onClose();
  };

  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <form
        onSubmit={handleSubmit}
        className="bg-zinc-900 rounded-lg max-h-[80vh] w-full max-w-xl flex flex-col shadow-lg text-white border border-gray-400"
        role="dialog"
        aria-modal="true"
        aria-labelledby="new-task-modal-title"
      >
        <div className="flex items-center justify-between p-4 border-b border-zinc-800">
          <h2 id="new-task-modal-title" className="text-3xl font-bold text-gray-300">
            New Task
          </h2>
          <X className="text-white hover:text-red-400 duration-300 cursor-pointer" onClick={onClose} />
        </div>
        {/* MODAL SCROLLABLE CONTENT */}
        <div className="overflow-y-auto p-4 flex-1 calendar-scrollbar">
          <label className="block mb-3">
            <span className="text-indigo-200">Task Name*</span>
            <input
              type="text"
              required
              maxLength={100}
              value={name}
              onChange={e => setName(e.target.value)}
              autoFocus
              className="mt-1 block w-full rounded-md bg-zinc-800 border border-zinc-700 p-2 text-white"
            />
          </label>
          <div className="flex gap-4 mb-3">
            <label className="flex-1 block">
              <span className="text-indigo-200">Start</span>
              <input
                type="datetime-local"
                value={start}
                onChange={e => setStart(e.target.value)}
                onBlur={e => {
                  const picked = new Date(e.target.value);
                  if (!isNaN(picked.getTime())) {
                    const rounded = roundToNearest15(picked);
                    setStart(format(rounded, "yyyy-MM-dd'T'HH:mm"));
                    // also recalc due if you want, as above
                  }
                }}
                className="mt-1 block w-full rounded-md bg-zinc-800 border border-zinc-700 p-2 text-white"
                required
              />
            </label>
            <label className="flex-1 block">
              <span className="text-indigo-200">Due</span>
              <input
                type="datetime-local"
                value={due}
                onChange={e => setDue(e.target.value)}
                onBlur={e => {
                  const picked = new Date(e.target.value);
                  if (!isNaN(picked.getTime())) {
                    const rounded = roundToNearest15(picked);
                    setDue(format(rounded, "yyyy-MM-dd'T'HH:mm"));
                  }
                }}
                className="mt-1 block w-full rounded-md bg-zinc-800 border border-zinc-700 p-2 text-white"
                required
              />
            </label>
          </div>
          <label className="block mb-3">
            <span className="text-indigo-200">Task Length (minutes)*</span>
            <input
              type="number"
              min={15}
              step={15}
              value={length}
              onChange={(e) => setLength(Number(e.target.value))}
              onBlur={() => {
                if (length % 15 !== 0) {
                  setLength(Math.round(length / 15) * 15);
                }
              }}
              className="mt-1 block w-full rounded-md bg-zinc-800 border border-zinc-700 p-2 text-white"
              required
            />
          </label>
          {/* Duration between start and due (info only) */}
          {durationBetween !== null && (
            <div className="mb-3 text-indigo-400 text-sm">
              <span>Available interval: {Math.floor(durationBetween/60)}h {durationBetween%60}m</span>
            </div>
          )}
          {/* Additional fields */}
          <label className="block mb-3">
            <span className="text-indigo-200">Description</span>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={3}
              className="mt-1 block w-full rounded-md bg-zinc-800 border border-zinc-700 p-2 text-white resize-y"
            />
          </label>
          <label className="block mb-3">
            <span className="text-indigo-200">Links (comma separated URLs)</span>
            <input
              type="text"
              value={links}
              onChange={e => setLinks(e.target.value)}
              className="mt-1 block w-full rounded-md bg-zinc-800 border border-zinc-700 p-2 text-white"
              placeholder="https://example.com, https://docs.com"
            />
          </label>
          {/* Importance */}
          <label className="block mb-3">
            <span className="text-indigo-200">Importance</span>
            <div className="flex gap-3 mt-2">
              <button type="button"
                onClick={() => setImportance(1)}
                className={`p-2 rounded-full flex items-center justify-center
                  ${importance === 1 ? "bg-sky-600 scale-110" : "bg-zinc-800 hover:bg-zinc-700"} transition`}
                title="Low Importance"
              >
                <ZapOff size={19} className={importance === 1 ? "text-white" : "text-indigo-300"} />
              </button>
              <button type="button"
                onClick={() => setImportance(2)}
                className={`p-2 rounded-full flex items-center justify-center
                  ${importance === 2 ? "bg-yellow-500 scale-110" : "bg-zinc-800 hover:bg-zinc-700"} transition`}
                title="Normal Importance"
              >
                <Zap size={20} className={importance === 2 ? "text-white" : "text-yellow-400"} />
              </button>
              <button type="button"
                onClick={() => setImportance(3)}
                className={`p-2 rounded-full flex items-center justify-center
                  ${importance === 3 ? "bg-red-500 scale-110" : "bg-zinc-800 hover:bg-zinc-700"} transition`}
                title="High Importance"
              >
                <AlertTriangle size={20} className={importance === 3 ? "text-white" : "text-red-300"} />
              </button>
            </div>
          </label>
          {/* Attach Files */}
          <label className="block mb-3">
            <span className="text-indigo-200">Attach Files</span>
            <input
              type="file"
              multiple
              onChange={e => setFiles(e.target.files)}
              className="mt-1 block bg-sky-700 p-3 rounded-xl hover:bg-sky-600 duration-300 cursor-pointer"
            />
            {files && files.length > 0 && (
              <p className="mt-1 text-sm text-indigo-300">
                {files.length} file{files.length > 1 ? "s" : ""} selected
              </p>
            )}
          </label>
          {/* Split Blocks Option */}
          <div className="block mb-3">
            <label className="flex gap-2 items-center cursor-pointer mb-1">
              <input
                type="checkbox"
                checked={splitEnabled}
                onChange={e => setSplitEnabled(e.target.checked)}
                className="form-checkbox accent-indigo-500"
              />
              <span className="text-indigo-200">Split this task into blocks?</span>
            </label>
            {splitEnabled && (
              <div className="pl-6">
                <label className="block mb-2">
                  <span className="text-indigo-200">Block length (minutes):</span>
                  <input
                    type="number"
                    min={15}
                    max={300}
                    step={15}
                    value={blockDuration}
                    onChange={(e) => setBlockDuration(Number(e.target.value))}
                    onBlur={() => {
                      if (blockDuration % 15 !== 0) {
                        // Snap blockDuration to nearest multiple of 15
                        setBlockDuration(Math.round(blockDuration / 15) * 15);
                      }
                    }}
                    className="ml-2 w-16 rounded-md bg-zinc-800 border border-zinc-700 p-1 text-white inline-block"
                  />
                </label>
                {/* Preview blocks */}
                {timeBlocks.length > 0 && (
                  <div className="max-h-32 overflow-y-auto border border-zinc-800 px-2 py-1 rounded mb-2 mt-1 text-xs">
                    <div className="mb-1 font-semibold text-indigo-300">Task preview:</div>
                    <ol className="list-decimal list-inside text-gray-100 space-y-1">
                      {timeBlocks.map((b, i) => (
                        <li key={i}>
                          {b.start} — {b.end} <span className="text-indigo-400">[{b.length} min]</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                )}
              </div>
            )}
          </div>

        </div>
        {/* ACTION BUTTONS */}
        <div className="flex justify-end space-x-4 p-4 border-t border-zinc-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-transparent border border-gray-200 hover:bg-zinc-600 transition cursor-pointer duration-300"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 rounded-xl bg-green-600 hover:bg-green-700 transition font-semibold cursor-pointer duration-300"
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
    .filter(task => new Date(task.end) > now)
    .sort((a, b) => new Date(a.start) - new Date(b.start));
  const handleFileChange = (e) => setFiles(e.target.files);

  const getDateFromTimeString = (timeStr, referenceDate) => {
    const [hours, minutes] = timeStr.split(":").map(Number);
    if (isNaN(hours) || isNaN(minutes)) return null;
    const d = new Date(referenceDate);
    d.setHours(hours, minutes, 0, 0);
    return d;
  };

  const handleSave = () => {
    if (!selectedTask) return;
    if (!name.trim()) {
      alert("Task name is required.");
      return;
    }

    let startDate = getDateFromTimeString(startTimeStr, new Date(selectedTask.start));
    let endDate = getDateFromTimeString(endTimeStr, new Date(selectedTask.end));

    startDate = floorTo15(startDate);
    endDate = ceilTo15(endDate);

    if (!isMultiple15(startDate) || !isMultiple15(endDate)) {
      alert("Start and end time must be on a 15-minute boundary.");
      return;
    }

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
      start: toLocalISOString(startDate),
      end: toLocalISOString(endDate),
    };

    onUpdateTask(updatedTask);
  };

  const handleCancel = () => {
    if (!selectedTask) return;
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
  };

  const handleDelete = async () => {
    if (!selectedTask) return;
    if (!window.confirm("Are you sure you want to delete this task? This action cannot be undone.")) return;
    try {
      const res = await fetch(`http://127.0.0.1:5000/api/tasks/${selectedTask.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete task");
      onUpdateTask(null, selectedTask.id);
      alert("Task successfully deleted!");
      setSelectedTask(null);
      onClose();
    } catch (error) {
      console.error(error);
      alert("Error deleting task");
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
        <div className="overflow-y-auto h-[calc(100%-56px)] p-6 space-y-4 calendar-scrollbar">
          {upcomingTasks.length === 0 ? (
            <p className="text-center text-gray-400 select-none mt-8">No upcoming tasks</p>
          ) : (
            upcomingTasks.map(task => {
              const previewBgColor = getTaskColor(task.id);
              const start = new Date(task.start);
              const end = new Date(task.end);

              return (
                <button
                  key={task.id}
                  onClick={() => {
                    setSelectedTask(task);
                    setActiveTab("tasks");
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
              upcomingTasks.map(task => {
                const bgColor = getTaskColor(task.id);
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

          <div className="flex-grow overflow-y-auto p-4 space-y-4 calendar-scrollbar">
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
                    onBlur={(e) => {
                      const picked = getDateFromTimeString(e.target.value, new Date(selectedTask.start));
                      if (picked) {
                        const rounded = roundToNearest15(picked);
                        if (rounded) {
                          const h = rounded.getHours().toString().padStart(2, "0");
                          const m = rounded.getMinutes().toString().padStart(2, "0");
                          setStartTimeStr(`${h}:${m}`);
                        }
                      }
                    }}
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
                    onBlur={(e) => {
                      const picked = getDateFromTimeString(e.target.value, new Date(selectedTask.end));
                      if (picked) {
                        const rounded = roundToNearest15(picked);
                        if (rounded) {
                          const h = rounded.getHours().toString().padStart(2, "0");
                          const m = rounded.getMinutes().toString().padStart(2, "0");
                          setEndTimeStr(`${h}:${m}`);
                        }
                      }
                    }}
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
                    onClick={handleDelete}
                    className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 transition font-semibold cursor-pointer duration-300"
                  >
                    Delete
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


export default function CalendarPage() {
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

  const [createModalOpen, setCreateModalOpen] = useState(false); // NEW

  // For dragging/resizing task behavior
  const [draggingTask, setDraggingTask] = useState(null);
  const [dragStartY, setDragStartY] = useState(0);
  const [draggedOffsetSlots, setDraggedOffsetSlots] = useState(0);
  const [resizingTask, setResizingTask] = useState(null);
  const [resizeStartY, setResizeStartY] = useState(0);
  const [resizeOffsetSlots, setResizeOffsetSlots] = useState(0);

  const dragMovedRef = useRef(false); // To distinguish clicks from drags

  // Helper: slots to minutes
  const slotsToMinutes = (slots) => slots * GRID_MINUTES_PER_SLOT;

  // Helper: update a task's time and call onUpdateTask
  const updateTaskTimes = (taskId, newStart, newEnd) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;
    const updated = {
      ...task,
      start: toLocalISOString(newStart),
      end: toLocalISOString(newEnd),
    };
    onUpdateTask(updated);
  };

  const onTaskMouseDown = (e, task) => {
    if (e.button !== 0) return; // only left click to drag
    e.stopPropagation();
    dragMovedRef.current = false;
    setDraggingTask(task);
    setDragStartY(e.clientY);
    setDraggedOffsetSlots(0);
  };

  const onResizeHandleMouseDown = (e, task) => {
    e.stopPropagation();
    e.preventDefault();
    setResizingTask(task);
    setResizeStartY(e.clientY);
    setResizeOffsetSlots(0);
  };

  const onMouseMove = (e) => {
    if (draggingTask) {
      const deltaY = e.clientY - dragStartY;
      const slotsMoved = Math.round(deltaY / GRID_SLOT_HEIGHT_PX);
      setDraggedOffsetSlots(slotsMoved);
    }
    if (resizingTask) {
      const deltaY = e.clientY - resizeStartY;
      const slotsMoved = Math.round(deltaY / GRID_SLOT_HEIGHT_PX);
      setResizeOffsetSlots(slotsMoved);
    }
  };

  const onMouseUp = () => {
  // Handle dragging move end
  if (draggingTask) {
    const oldStart = new Date(draggingTask.start);
    const oldEnd = new Date(draggingTask.end);
    const durationMs = oldEnd - oldStart;

    let newStart = addMinutes(oldStart, slotsToMinutes(draggedOffsetSlots));

    // Clamp newStart between startOfDay and last allowed start time (so task doesn't overflow the day)
    if (newStart.getDate() !== oldStart.getDate()) {
      // Drag moved task to a different day - cancel move
      setDraggingTask(null);
      setDraggedOffsetSlots(0);
      return;
    }
    if (newStart < startOfDay(newStart)) newStart = startOfDay(newStart);
    if (newStart > addMinutes(startOfDay(newStart), 24 * 60 - durationMs / 60000)) {
      newStart = addMinutes(startOfDay(newStart), 24 * 60 - durationMs / 60000);
    }

    const newEnd = new Date(newStart.getTime() + durationMs);

    // Snap start and end times to nearest 15 minutes
    const roundedStart = floorTo15(newStart);
    const roundedEnd = floorTo15(newEnd);

    // Update task times using your updater
    updateTaskTimes(draggingTask.id, roundedStart, roundedEnd);

    // Clear dragging state
    setDraggingTask(null);
    setDraggedOffsetSlots(0);
  }

  // Handle resizing end
  if (resizingTask) {
    const oldStart = new Date(resizingTask.start);
    const oldEnd = new Date(resizingTask.end);

    // Calculate new duration based on resize offset slots
    const newDurationMs =
      oldEnd.getTime() - oldStart.getTime() + slotsToMinutes(resizeOffsetSlots) * 60000;

    // Enforce minimum duration 15 minutes
    if (newDurationMs < 15 * 60 * 1000) {
      setResizingTask(null);
      setResizeOffsetSlots(0);
      return;
    }

    const newEnd = addMinutes(oldStart, Math.floor(newDurationMs / 60000));

    // Prevent task from crossing over to next day
    if (newEnd.getDate() !== oldStart.getDate()) {
      setResizingTask(null);
      setResizeOffsetSlots(0);
      return;
    }

    // Snap end time up to nearest 15 minutes
    const roundedEnd = ceilTo15(newEnd);

    // Update task times
    updateTaskTimes(resizingTask.id, oldStart, roundedEnd);

    // Clear resizing state
    setResizingTask(null);
    setResizeOffsetSlots(0);
  }
};



  // Attach window listeners for mousemove and mouseup
  useEffect(() => {
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [draggingTask, dragStartY, draggedOffsetSlots, resizingTask, resizeStartY, resizeOffsetSlots]);



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
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to add task");
      }
      const newTask = await res.json();
      setTasks((prev) => [...prev, newTask]);
    } catch (err) {
      console.error("Error adding task:", err);
      alert(`Error adding task: ${err.message}`);
    }
  };

  const addNewCustomTask = async (task) => {
    try {
      // Corrected: Post custom tasks to the /api/custom_tasks endpoint
      const res = await fetch("http://127.0.0.1:5000/api/custom_tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(task),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to add custom task");
      }      // For custom tasks, you might want to fetch all tasks again to see the blocks
      // or selectively add the blocks and the custom task entry
      // For simplicity, we can refetch all tasks to get the newly created blocks too
      const updatedTasksRes = await fetch("http://127.0.0.1:5000/api/tasks");
      if (!updatedTasksRes.ok) throw new Error("Failed to refetch tasks after custom task creation");
      const updatedTasks = await updatedTasksRes.json();
      setTasks(updatedTasks);
      alert("Custom task and its blocks created successfully!");
    } catch (err) {
      console.error("Error adding custom task:", err);
      alert(`Error adding custom task: ${err.message}`);
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

  const onUpdateTask = async (updatedTask) => {
  try {
    // Optimistically update local state immediately
    setTasks(prevTasks => prevTasks.map(t => t.id === updatedTask.id ? updatedTask : t));

    // Update backend
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

    if (!res.ok) {
      throw new Error("Failed to update task");
    }

    const freshTask = await res.json();

    // Sync with backend response (optional, in case backend modifies it)
    setTasks(prevTasks => prevTasks.map(t => t.id === freshTask.id ? freshTask : t));

  } catch (error) {
    console.error("Error updating task:", error);
    alert("Error updating task: " + error.message);
  }
};



  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 to-black text-gray-100 font-sans">
      <nav
        className="flex items-center gap-3 mb-[16px] w-full h-[64px] mx-auto font-semibold relative p-5 border-b-2 border-gray-400"
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
          onClick={() => setCreateModalOpen(true)}
          className="ml-2 flex items-center gap-1 p-3 rounded cursor-pointer transition-colors shadow-md shadow-black"
          style={{ backgroundColor: "transparent", color: colors.navIcon }}
          aria-label="Create New Task"
          type="button"
        >
          <Plus size={18} />
          <span className="hidden md:inline select-none">New Task</span>
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
            height: "calc(100vh - 82px)",
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

                    // Live positions/heights for dragging/resizing
                    let liveTop = top;
                    let liveHeight = height;

                    if (draggingTask && draggingTask.id === task.id) {
                      liveTop = top + draggedOffsetSlots * GRID_SLOT_HEIGHT_PX;
                    }
                    if (resizingTask && resizingTask.id === task.id) {
                      liveHeight = Math.max(
                        height + resizeOffsetSlots * GRID_SLOT_HEIGHT_PX,
                        GRID_SLOT_HEIGHT_PX
                      );
                    }

                    // Thresholds for showing time and description
                    const timeDisplayThreshold = 40; // only show time if this tall or taller
                    const descriptionDisplayThreshold = 60; // show description only if this tall or taller

                    const showTime = liveHeight >= timeDisplayThreshold;
                    const showDescription = liveHeight >= descriptionDisplayThreshold;

                    // Font sizes adjusted based on height (you can tweak these)
                    let nameFontSize = "0.9rem";
                    if (liveHeight < 24) nameFontSize = "0.7rem";
                    else if (liveHeight < 36) nameFontSize = "0.8rem";

                    let timeFontSize = "0.75rem";
                    if (liveHeight < 48) timeFontSize = "0.6rem";

                    return (
                      <div
                        key={task.id}
                        className="absolute left-1 right-1 z-20 rounded-md text-white p-1 font-semibold shadow-lg cursor-pointer select-text"
                        style={{
                          top: liveTop,
                          height: liveHeight,
                          background: getTaskColor(task.id),
                          border: `1.5px solid ${getTaskColor(task.id)}`,
                          boxShadow:
                            "0 2px 6px rgba(0,0,0,0.3), inset 0 0 8px rgba(255,255,255,0.10)",
                          overflow: "hidden",
                          userSelect: "text",
                          touchAction: "none",
                          display: "flex",
                          flexDirection: "column",
                          gap: showDescription ? "0.15rem" : "0.1rem",
                          whiteSpace: "nowrap",
                        }}
                        title={`${task.name}: ${format(start, "p")} – ${format(end, "p")}`}
                        onClick={() => {
                          if (!dragMovedRef.current) {
                            setSelectedTask(task);
                            setSidebarInitialTab("tasks");
                            setSidebarOpen(true);
                          }
                        }}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            setSelectedTask(task);
                            setSidebarOpen(true);
                          }
                        }}
                        onMouseDown={(e) => onTaskMouseDown(e, task)}
                      >
                        {/* Task name always shown, truncated if needed */}
                        <div
                          className="truncate"
                          style={{
                            fontWeight: "bold",
                            fontSize: nameFontSize,
                            userSelect: "text",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {task.name}
                        </div>

                        {/* Show start-end time - smaller and only if enough space */}
                        {showTime && (
                          <div
                            style={{
                              fontSize: timeFontSize,
                              opacity: 0.8,
                              userSelect: "none",
                              fontVariantNumeric: "tabular-nums",
                            }}
                          >
                            {format(start, "p")} – {format(end, "p")}
                          </div>
                        )}

                        {/* Show description if enough space */}
                        {showDescription && task.description && (
                          <div
                            className="text-[10px] italic truncate"
                            style={{ color: "rgba(255, 255, 255, 0.75)" }}
                            title={task.description}
                          >
                            {task.description}
                          </div>
                        )}

                        {/* Resize Handle */}
                        <div
                          onMouseDown={(e) => onResizeHandleMouseDown(e, task)}
                          style={{
                            position: "absolute",
                            bottom: 0,
                            left: 0,
                            right: 0,
                            height: 6,
                            cursor: "ns-resize",
                            background: "rgba(255, 255, 255, 0.3)",
                            borderBottomLeftRadius: 8,
                            borderBottomRightRadius: 8,
                            userSelect: "none",
                          }}
                          aria-label="Resize task"
                          role="button"
                          tabIndex={-1}
                        />
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
        initialStart={roundToNearest15(pendingTaskData?.start)}
        initialEnd={roundToNearest15(pendingTaskData?.end)}
      />

      <CreateTaskModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSubmit={async (data) => {
          // files not handled in demo; if needed send with FormData
          await addNewCustomTask(data); // This now calls the dedicated custom task handler
          setCreateModalOpen(false);
        }}
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
        onUpdateTask={async (updatedTask, deletedTaskId = null) => {
          if (deletedTaskId) {
            setTasks((prev) => prev.filter((t) => t.id !== deletedTaskId));
            return;
          }
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
            if (!res.ok) {
              const errorData = await res.json();
              throw new Error(errorData.error || "Failed to update task");
            }
            const updated = await res.json();
            setTasks((tasks) => tasks.map((t) => (t.id === updated.id ? updated : t)));
            setSelectedTask(updated);
            alert("Task successfully updated!");
          } catch (error) {
            console.error(error);
            alert(`Error updating task: ${error.message}`);
          }
        }}
        tasks={tasks}
        initialTab={sidebarInitialTab}
      />
    </div>
  );
}