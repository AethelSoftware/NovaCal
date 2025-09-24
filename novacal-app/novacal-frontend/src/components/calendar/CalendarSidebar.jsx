import React, { useState, useEffect } from "react";
import {
  toLocalISOString,
  floorTo15,
  ceilTo15,
  isMultiple15,
  roundToNearest15,
} from "../../utils/calendarUtils";
import { format, isAfter, isEqual, startOfDay } from "date-fns";
import {
  PanelLeftClose,
  Ban,
  Trash2,
  Save,
} from "lucide-react";
import { authedFetch } from "../../api";

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

    let startDate = getDateFromTimeString(
      startTimeStr,
      new Date(selectedTask.start)
    );
    let endDate = getDateFromTimeString(
      endTimeStr,
      new Date(selectedTask.end)
    );

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
    try {
      const res = await authedFetch(
        `/api/tasks/${selectedTask.id}`,
        { method: "DELETE" }
      );
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
        : "border-transparent text-zinc-500 hover:text-white hover:border-zinc-700"
    }`;

  return (
    <div
      className="fixed top-0 right-0 h-full w-[420px] bg-zinc-950 shadow-2xl z-50 border-l border-zinc-800 flex flex-col"
      role="complementary"
      aria-label="Calendar Sidebar"
    >
      {/* Header */}
      <div className="flex justify-between items-center px-6 py-4 border-b border-zinc-800 bg-zinc-900/50">
        <div className="flex space-x-2">
          <button
            className={tabStyle(activeTab === "upcoming")}
            onClick={() => setActiveTab("upcoming")}
          >
            Upcoming
          </button>
          <button
            className={tabStyle(activeTab === "tasks")}
            onClick={() => setActiveTab("tasks")}
          >
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
          className="text-zinc-400 hover:text-red-400 transition"
        >
          <PanelLeftClose size={22} />
        </button>
      </div>

      {/* Upcoming */}
      {activeTab === "upcoming" && (
        <div className="overflow-y-auto p-6 flex-1 space-y-4 custom-scrollbar">
          {upcomingTasks.length === 0 ? (
            <p className="text-center text-zinc-500 mt-8">No upcoming tasks</p>
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
                  className="w-full text-left rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 shadow-sm transition p-4"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-white text-base truncate max-w-[70%]">
                      {task.name.length > 28
                        ? task.name.slice(0, 28) + "…"
                        : task.name}
                    </span>
                    <span className="ml-auto rounded-md px-2 py-0.5 text-xs bg-zinc-800 text-zinc-400 font-mono">
                      {format(start, "MM/dd")}
                    </span>
                  </div>
                  {task.description && (
                    <div
                      className="text-sm text-zinc-400 truncate mt-1"
                      title={task.description}
                    >
                      {task.description.length > 48
                        ? task.description.slice(0, 48) + "…"
                        : task.description}
                    </div>
                  )}
                  <div className="text-xs text-zinc-500 mt-2 font-mono">
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
        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar Task List */}
          <nav className="w-1/3 border-r border-zinc-800 overflow-y-auto p-2 custom-scrollbar">
            {upcomingTasks.length === 0 ? (
              <p className="text-zinc-500 text-center mt-4">No tasks</p>
            ) : (
              upcomingTasks.map((task) => {
                const isSelected = selectedTask?.id === task.id;
                return (
                  <button
                    key={task.id}
                    onClick={() => setSelectedTask(task)}
                    type="button"
                    className={`block w-full text-left mb-1 p-2 rounded-lg transition ${
                      isSelected
                        ? "bg-sky-600 text-white font-semibold"
                        : "bg-zinc-900 hover:bg-zinc-800 text-zinc-200"
                    }`}
                  >
                    {task.name}
                  </button>
                );
              })
            )}
          </nav>

          {/* Task Editor */}
          <div className="flex-grow overflow-y-auto p-6 space-y-6 custom-scrollbar">
            {selectedTask ? (
              <>
                {/* Name */}
                <div>
                  <label className="block text-sm text-zinc-400 mb-1">
                    Task Name
                  </label>
                  <input
                    type="text"
                    maxLength={100}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-lg bg-zinc-900 border border-zinc-700 p-2 text-white focus:outline-none focus:ring-1 focus:ring-sky-500"
                    required
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm text-zinc-400 mb-1">
                    Description
                  </label>
                  <textarea
                    rows={4}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full rounded-lg bg-zinc-900 border border-zinc-700 p-2 text-white resize-y focus:outline-none focus:ring-1 focus:ring-sky-500"
                    placeholder="Add details..."
                  />
                </div>

                {/* Links */}
                <div>
                  <label className="block text-sm text-zinc-400 mb-1">
                    Links
                  </label>
                  <input
                    type="text"
                    value={links}
                    onChange={(e) => setLinks(e.target.value)}
                    className="w-full rounded-lg bg-zinc-900 border border-zinc-700 p-2 text-white focus:outline-none focus:ring-1 focus:ring-sky-500"
                    placeholder="https://example.com, https://docs.com"
                  />
                </div>

                {/* Start Time */}
                <div>
                  <label className="block text-sm text-zinc-400 mb-1">
                    Start Time
                  </label>
                  <input
                    type="time"
                    value={startTimeStr}
                    onChange={(e) => setStartTimeStr(e.target.value)}
                    onBlur={(e) => {
                      const picked = getDateFromTimeString(
                        e.target.value,
                        new Date(selectedTask.start)
                      );
                      if (picked) {
                        const rounded = roundToNearest15(picked);
                        if (rounded) {
                          const h = rounded.getHours()
                            .toString()
                            .padStart(2, "0");
                          const m = rounded
                            .getMinutes()
                            .toString()
                            .padStart(2, "0");
                          setStartTimeStr(`${h}:${m}`);
                        }
                      }
                    }}
                    className="w-full rounded-lg bg-zinc-900 border border-zinc-700 p-2 text-white focus:outline-none focus:ring-1 focus:ring-sky-500"
                    required
                  />
                </div>

                {/* End Time */}
                <div>
                  <label className="block text-sm text-zinc-400 mb-1">
                    End Time
                  </label>
                  <input
                    type="time"
                    value={endTimeStr}
                    onChange={(e) => setEndTimeStr(e.target.value)}
                    onBlur={(e) => {
                      const picked = getDateFromTimeString(
                        e.target.value,
                        new Date(selectedTask.end)
                      );
                      if (picked) {
                        const rounded = roundToNearest15(picked);
                        if (rounded) {
                          const h = rounded.getHours()
                            .toString()
                            .padStart(2, "0");
                          const m = rounded
                            .getMinutes()
                            .toString()
                            .padStart(2, "0");
                          setEndTimeStr(`${h}:${m}`);
                        }
                      }
                    }}
                    className="w-full rounded-lg bg-zinc-900 border border-zinc-700 p-2 text-white focus:outline-none focus:ring-1 focus:ring-sky-500"
                    required
                  />
                </div>

                {/* Files - will be developed in future 
                <div>
                  <label className="block text-sm text-zinc-400 mb-2">
                    Attach Files
                  </label>
                  <div
                    className="w-full h-24 rounded-xl border-2 border-dashed border-zinc-600 flex items-center justify-center flex-col gap-2 bg-zinc-900/50 cursor-pointer hover:border-zinc-500 transition"
                    onClick={() =>
                      document.getElementById("sidebar-file-upload").click()
                    }
                    tabIndex={0}
                    role="button"
                    aria-label="Select files"
                    onKeyDown={(e) => {
                      if (e.key === " " || e.key === "Enter")
                        document.getElementById("sidebar-file-upload").click();
                    }}
                  >
                    <span className="text-zinc-400 text-sm">
                      Drag or click to select files
                    </span>
                    <input
                      type="file"
                      id="sidebar-file-upload"
                      multiple
                      style={{ display: "none" }}
                      onChange={handleFileChange}
                      accept="*"
                    />
                  </div>
                  {files && files.length > 0 && (
                    <p className="mt-1 text-sm text-zinc-400">
                      {files.length} file
                      {files.length > 1 ? "s" : ""} selected
                    </p>
                  )}
                </div>
                */}

                {/* Footer Actions */}
                <div className="flex justify-end space-x-3 pt-4 border-t border-zinc-800">
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white transition duration-200"
                  >
                    <Ban size={18} />
                  </button>
                  <button
                    type="button"
                    onClick={handleDelete}
                    className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white transition"
                  >
                    <Trash2 size={18} />
                  </button>
                  <button
                    type="button"
                    onClick={handleSave}
                    className="px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-700 text-white font-medium transition"
                  >
                    <Save size={18} />
                  </button>
                </div>
              </>
            ) : (
              <p className="text-zinc-500 mt-6">Select a task to edit</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}