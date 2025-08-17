import React, { useState, useEffect } from "react";
import { 
  toLocalISOString, 
  floorTo15, 
  ceilTo15, 
  isMultiple15, 
  roundToNearest15 } 
from "../utils/calendarUtils";
import { 
  format, 
  isAfter, 
  isEqual, 
  startOfDay } from "date-fns";
import { PanelLeftClose } from "lucide-react";

export default function CalendarSidebar({ isOpen, onClose, selectedTask: externalSelectedTask, onUpdateTask, tasks, initialTab = "upcoming" }) {
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
                  style={{ background: "#185952" }}
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
                      backgroundColor: "#185952",
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
                  <span className="block text-sm text-indigo-300 mb-1">Task Name</span>
                  <input
                    type="text"
                    maxLength={100}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-md bg-white/5 border border-white/10 p-2 text-white focus:ring-2 focus:ring-violet-500 transition"
                    required
                  />
                </label>
                <label className="block">
                  <span className="block text-sm text-indigo-300 mb-1">Description</span>
                  <textarea
                    rows={4}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full rounded-md bg-white/5 border border-white/10 p-2 text-white resize-y focus:ring-2 focus:ring-violet-500 transition"
                    placeholder="Add a description (optional)"
                  />
                </label>
                <label className="block">
                  <span className="block text-sm text-indigo-300 mb-1">Links (comma separated URLs)</span>
                  <input
                    type="text"
                    value={links}
                    onChange={(e) => setLinks(e.target.value)}
                    className="w-full rounded-md bg-white/5 border border-white/10 p-2 text-white focus:ring-2 focus:ring-violet-500 transition"
                    placeholder="https://example.com, https://docs.com"
                  />
                </label>

                {/* Start and end time inputs */}
                <label className="block">
                  <span className="block text-sm text-indigo-300 mb-1">Start Time</span>
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
                    className="w-full rounded-md bg-white/5 border border-white/10 p-2 text-white focus:ring-2 focus:ring-violet-500 transition"
                    required
                  />
                </label>
                <label className="block">
                  <span className="block text-sm text-indigo-300 mb-1">End Time</span>
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
                    className="w-full rounded-md bg-white/5 border border-white/10 p-2 text-white focus:ring-2 focus:ring-violet-500 transition"
                    required
                  />
                </label>

                <label className="block">
                  <span className="block text-sm text-indigo-300 mb-1">Attach Files</span>
                  <input
                    type="file"
                    multiple
                    onChange={handleFileChange}
                    className="w-full cursor-pointer rounded-lg bg-violet-800 hover:bg-violet-900 text-white px-4 py-2 transition"
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