import React, { useState, useEffect } from "react";
import { 
  toLocalISOString, 
  floorTo15, 
  ceilTo15, 
  isMultiple15, 
  roundToNearest15 
} from "../utils/calendarUtils";
import { format, isAfter, isEqual, startOfDay } from "date-fns";
import { PanelLeftClose } from "lucide-react";

export default function CalendarSidebar({
  isOpen,
  onClose,
  selectedTask: externalSelectedTask,
  onUpdateTask,
  tasks,
  initialTab = "upcoming",
}) {
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

      const toTimeString = (date) =>
        `${date.getHours().toString().padStart(2, "0")}:${date
          .getMinutes()
          .toString()
          .padStart(2, "0")}`;

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

    const toTimeString = (date) =>
      `${date.getHours().toString().padStart(2, "0")}:${date
        .getMinutes()
        .toString()
        .padStart(2, "0")}`;

    setStartTimeStr(toTimeString(start));
    setEndTimeStr(toTimeString(end));
  };

  const handleDelete = async () => {
    if (!selectedTask) return;
    if (!window.confirm("Delete this task permanently?")) return;
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
    `px-4 py-2 font-semibold border-b-2 transition-colors ${
      active
        ? "border-sky-500 text-white"
        : "border-transparent text-gray-500 hover:text-white hover:border-gray-700"
    }`;

  return (
    <div
      className="fixed top-0 right-0 h-full w-[400px] bg-black shadow-2xl z-50 border-l border-neutral-800 transition-transform duration-300"
      style={{ transform: isOpen ? "translateX(0)" : "translateX(100%)" }}
    >
      {/* Header */}
      <div className="flex justify-between items-center p-4 border-b border-neutral-800">
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
          className="text-gray-400 hover:text-red-500 transition p-2"
        >
          <PanelLeftClose size={22} />
        </button>
      </div>

      {/* Upcoming */}
      {activeTab === "upcoming" && (
        <div className="overflow-y-auto h-[calc(100%-56px)] p-6 space-y-4">
          {upcomingTasks.length === 0 ? (
            <p className="text-center text-gray-500 mt-8">No upcoming tasks</p>
          ) : (
            upcomingTasks.map((task) => {
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
                  className="w-full text-left rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 shadow-sm transition p-4"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-base truncate max-w-[70%]">
                      {task.name.length > 28 ? task.name.slice(0, 28) + "…" : task.name}
                    </span>
                    <span className="ml-auto rounded-md px-2 py-0.5 text-xs bg-neutral-800 text-gray-400 font-mono">
                      {format(start, "MM/dd")}
                    </span>
                  </div>
                  {task.description && (
                    <div className="text-sm text-gray-400 truncate max-w-full mt-1" title={task.description}>
                      {task.description.length > 48 ? task.description.slice(0, 48) + "…" : task.description}
                    </div>
                  )}
                  <div className="text-xs text-gray-500 mt-2 font-mono">
                    {format(start, "EEE h:mmaaa")} – {format(end, "h:mmaaa")}
                  </div>
                </button>
              );
            })
          )}
        </div>
      )}

      {/* Tasks */}
      {activeTab === "tasks" && (
        <div className="flex h-[calc(100%-56px)]">
          {/* Sidebar Task List */}
          <nav className="w-1/3 border-r border-neutral-800 overflow-y-auto p-2">
            {upcomingTasks.length === 0 ? (
              <p className="text-gray-500 text-center mt-4">No tasks</p>
            ) : (
              upcomingTasks.map((task) => {
                const isSelected = selectedTask?.id === task.id;
                return (
                  <button
                    key={task.id}
                    onClick={() => setSelectedTask(task)}
                    type="button"
                    className={`block w-full text-left mb-1 p-2 rounded-md transition ${
                      isSelected
                        ? "bg-sky-600 text-white font-bold"
                        : "bg-neutral-900 hover:bg-neutral-800 text-gray-200"
                    }`}
                  >
                    {task.name}
                  </button>
                );
              })
            )}
          </nav>

          {/* Task Editor */}
          <div className="flex-grow overflow-y-auto p-4 space-y-4">
            {selectedTask ? (
              <>
                <label className="block">
                  <span className="block text-sm text-gray-400 mb-1">Task Name</span>
                  <input
                    type="text"
                    maxLength={100}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-lg bg-neutral-900 border border-neutral-700 p-2 text-white focus:ring-2 focus:ring-sky-500"
                    required
                  />
                </label>

                <label className="block">
                  <span className="block text-sm text-gray-400 mb-1">Description</span>
                  <textarea
                    rows={4}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full rounded-lg bg-neutral-900 border border-neutral-700 p-2 text-white resize-y focus:ring-2 focus:ring-sky-500"
                    placeholder="Add details..."
                  />
                </label>

                <label className="block">
                  <span className="block text-sm text-gray-400 mb-1">Links</span>
                  <input
                    type="text"
                    value={links}
                    onChange={(e) => setLinks(e.target.value)}
                    className="w-full rounded-lg bg-neutral-900 border border-neutral-700 p-2 text-white focus:ring-2 focus:ring-sky-500"
                    placeholder="https://example.com, https://docs.com"
                  />
                </label>

                {/* Time Inputs */}
                <label className="block">
                  <span className="block text-sm text-gray-400 mb-1">Start Time</span>
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
                    className="w-full rounded-lg bg-neutral-900 border border-neutral-700 p-2 text-white focus:ring-2 focus:ring-sky-500"
                    required
                  />
                </label>

                <label className="block">
                  <span className="block text-sm text-gray-400 mb-1">End Time</span>
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
                    className="w-full rounded-lg bg-neutral-900 border border-neutral-700 p-2 text-white focus:ring-2 focus:ring-sky-500"
                    required
                  />
                </label>

                <label className="flex items-center rounded-lg px-4 py-2 text-sm font-medium text-white transition-all duration-200 border-2 border-stone-600 hover:bg-white/10 hover:border-white/30 shadow-md w-[240px]">
                  <span className="block text-sm text-gray-400 mb-1">Attach Files</span>
                  <input
                    type="file"
                    multiple
                    onChange={handleFileChange}
                    className="w-full text-sm cursor-pointer text-gray-300"
                  />
                  {files && files.length > 0 && (
                    <p className="mt-1 text-sm text-gray-500">{files.length} file(s) selected</p>
                  )}
                </label>

                {/* Actions */}
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="px-4 py-2 rounded-lg bg-neutral-800 text-gray-300 hover:bg-neutral-700 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleDelete}
                    className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition"
                  >
                    Delete
                  </button>
                  <button
                    type="button"
                    onClick={handleSave}
                    className="px-4 py-2 rounded-lg bg-sky-600 text-white font-semibold hover:bg-sky-700 transition"
                  >
                    Save
                  </button>
                </div>
              </>
            ) : (
              <p className="text-gray-500 mt-6">Select a task to edit</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
