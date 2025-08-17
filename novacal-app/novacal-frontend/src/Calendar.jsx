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
  Plus,
  ZapOff,
  Zap,
  AlertTriangle,
} from "lucide-react";
import {
  roundToNearest15,
  floorTo15,
  ceilTo15,
  toLocalISOString
} from "./utils/calendarUtils";

import CreateTaskModal from "./components/CustomTaskModal";



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

  import Modal from "./components/SimpleModal";
  import CalendarSidebar from "./components/CalendarSidebar";


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
    <div className="min-h-screen bg-gradient-to-br from-slate-800 to-slate-900 to-black  border border-slate-700 text-gray-100 font-sans">
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
            className="absolute top-full right-0 p-3 rounded shadow-xl z-100"
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
                className="sticky top-0 z-50 border-b flex flex-col items-center justify-center text-center bg-zinc-900"
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
                          background: "#185952",
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
      <CalendarSidebar
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