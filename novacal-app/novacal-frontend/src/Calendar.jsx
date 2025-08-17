"use client";

import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import {
  format,
  addDays,
  startOfWeek,
  addMinutes,
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
  PanelRightClose,
  PanelLeftClose,
  Plus,
} from "lucide-react";

import {
  roundToNearest15,
  floorTo15,
  ceilTo15,
  toLocalISOString,
} from "./utils/calendarUtils";

import CreateTaskModal from "./components/CustomTaskModal";
import Modal from "./components/SimpleModal";
import CalendarSidebar from "./components/CalendarSidebar";

// ===== Constants =====
const GRID_SLOT_HEIGHT_PX = 16; // 1 slot = 15 minutes
const GRID_MINUTES_PER_SLOT = 15;
const SLOTS_PER_HOUR = 60 / GRID_MINUTES_PER_SLOT; // 4
const HOURS_IN_DAY = 24;
const VIEW_OPTIONS = [1, 3, 5, 7];
const HEADER_HEIGHT = 64; // column header height in px

// Color palette
const colors = {
  background: "#0f1117",
  border: "#2b2f42",
  timeLabel: "#97a0c3",
  hoveredSlot: "rgba(121, 134, 203, 0.22)",
  selectedSlot: "rgba(127, 90, 240, 0.35)",
  taskBg: "linear-gradient(135deg, #623CEA 0%, #7F5AF0 100%)",
  taskBorder: "#7F5AF0",
  headerBg: "#171a25",
  dayLabel: "#c3c8ff",
  now: "#ff3b30",
  pastTint: "rgba(255,255,255,0.02)",
};

// ===== Helpers =====
const minutesSinceStartOfDay = (d) => getHours(d) * 60 + getMinutes(d);
const pxFromMinutes = (mins) => (mins / GRID_MINUTES_PER_SLOT) * GRID_SLOT_HEIGHT_PX;
const clamp = (val, min, max) => Math.max(min, Math.min(max, val));

// Overlap layout algorithm (per-day)
function layoutEventsForDay(events) {
  const evts = [...events].sort((a, b) => {
    const diff = a.start - b.start;
    if (diff !== 0) return diff;
    return (b.end - b.start) - (a.end - a.start);
  });

  const layouts = new Map();
  let cluster = [];
  let clusterEnd = null;

  const flushCluster = (items) => {
    if (!items.length) return;
    const active = [];
    let maxCol = 0;
    for (const evt of items) {
      for (let i = active.length - 1; i >= 0; i--) {
        if (active[i].end <= evt.start) active.splice(i, 1);
      }
      const used = new Set(active.map((a) => a.col));
      let col = 0;
      while (used.has(col)) col++;
      maxCol = Math.max(maxCol, col);
      active.push({ evt, col, end: evt.end });
      layouts.set(evt.id, { col });
    }
    const totalCols = maxCol + 1;
    const widthPct = 100 / totalCols;
    for (const evt of items) {
      const { col } = layouts.get(evt.id);
      const leftPct = col * widthPct;
      layouts.set(evt.id, {
        col,
        colsInGroup: totalCols,
        leftPct,
        widthPct,
      });
    }
  };

  for (const e of evts) {
    if (!cluster.length) {
      cluster = [e];
      clusterEnd = e.end;
      continue;
    }
    if (e.start < clusterEnd) {
      cluster.push(e);
      if (e.end > clusterEnd) clusterEnd = e.end;
    } else {
      flushCluster(cluster);
      cluster = [e];
      clusterEnd = e.end;
    }
  }
  flushCluster(cluster);

  return layouts;
}

export default function CalendarPage() {
  // ===== State =====
  const [viewType, setViewType] = useState(7);
  const [tasks, setTasks] = useState([]);
  const [startDay, setStartDay] = useState(() =>
    startOfWeek(new Date(), { weekStartsOn: 1 })
  );

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarInitialTab, setSidebarInitialTab] = useState("upcoming");
  const [selectedTask, setSelectedTask] = useState(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [pendingTaskData, setPendingTaskData] = useState(null);

  const [createModalOpen, setCreateModalOpen] = useState(false);

  const [isSelecting, setIsSelecting] = useState(false);
  const [selectStart, setSelectStart] = useState(null);
  const [selectEnd, setSelectEnd] = useState(null);
  const [hoverTime, setHoverTime] = useState(null);
  const [hoverPos, setHoverPos] = useState({ x: 0, y: 0 });

  const [draggingTaskId, setDraggingTaskId] = useState(null);
  const [dragStartY, setDragStartY] = useState(0);
  const [dragOriginalStart, setDragOriginalStart] = useState(null);
  const [dragOriginalEnd, setDragOriginalEnd] = useState(null);

  const [resizingTaskId, setResizingTaskId] = useState(null);
  const [resizeEdge, setResizeEdge] = useState(null); // "top" | "bottom"
  const [resizeStartY, setResizeStartY] = useState(0);
  const [resizeOriginalStart, setResizeOriginalStart] = useState(null);
  const [resizeOriginalEnd, setResizeOriginalEnd] = useState(null);

  const dragMovedRef = useRef(false);

  // Refs & now-line
  const calendarRef = useRef(null);
  const [now, setNow] = useState(new Date());

  // Update "now" every minute for the live now-line
  useEffect(() => {
    const tick = () => setNow(new Date());
    const id = setInterval(tick, 60 * 1000);
    return () => clearInterval(id);
  }, []);

  // Scroll to "now" when mounting or when changing to a range that includes today
  useEffect(() => {
    const today = startOfDay(new Date());
    const days = Array.from({ length: viewType }, (_, i) =>
      addDays(startDay, i)
    );
    const includesToday = days.some((d) => isEqual(startOfDay(d), today));
    if (!calendarRef.current || !includesToday) return;
    const minutes = minutesSinceStartOfDay(now);
    const y = pxFromMinutes(minutes) - 200;
    calendarRef.current.scrollTo({
      top: clamp(y, 0, 99999),
      behavior: "smooth",
    });
  }, [startDay, viewType, now]);

  // ===== Data fetching =====
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
      const res = await fetch("http://127.0.0.1:5000/api/custom_tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(task),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to add custom task");
      }
      const updatedTasksRes = await fetch("http://127.0.0.1:5000/api/tasks");
      if (!updatedTasksRes.ok)
        throw new Error("Failed to refetch tasks after custom task creation");
      const updatedTasks = await updatedTasksRes.json();
      setTasks(updatedTasks);
      alert("Custom task and its blocks created successfully!");
    } catch (err) {
      console.error("Error adding custom task:", err);
      alert(`Error adding custom task: ${err.message}`);
    }
  };

  const onUpdateTask = async (updatedTask) => {
    try {
      setTasks((prev) =>
        prev.map((t) => (t.id === updatedTask.id ? updatedTask : t))
      );
      const res = await fetch(
        `http://127.0.0.1:5000/api/tasks/${updatedTask.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: updatedTask.name,
            description: updatedTask.description,
            links: updatedTask.links,
            start: updatedTask.start,
            end: updatedTask.end,
          }),
        }
      );
      if (!res.ok) throw new Error("Failed to update task");
      const fresh = await res.json();
      setTasks((prev) =>
        prev.map((t) => (t.id === fresh.id ? fresh : t))
      );
    } catch (err) {
      console.error("Error updating task:", err);
      alert("Error updating task: " + err.message);
    }
  };

  // ===== Derived =====
  const daysToShow = useMemo(
    () => Array.from({ length: viewType }, (_, i) => addDays(startDay, i)),
    [viewType, startDay]
  );

  const tasksByDay = useMemo(() => {
    const map = new Map();
    for (const d of daysToShow) {
      map.set(+startOfDay(d), []);
    }
    for (const t of tasks) {
      const key = +startOfDay(new Date(t.start));
      if (map.has(key)) map.get(key).push(t);
    }
    for (const [, arr] of map) {
      arr.sort((a, b) => new Date(a.start) - new Date(b.start));
    }
    return map;
  }, [tasks, daysToShow]);

  // ===== Interaction helpers =====
  const slotsToMinutes = (slots) => slots * GRID_MINUTES_PER_SLOT;

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

  const getSnappedSlotDate = (yPx, scrollEl, columnDate) => {
    if (!scrollEl) return new Date(columnDate);
    const rect = scrollEl.getBoundingClientRect();
    let relativeY = yPx - rect.top + scrollEl.scrollTop - HEADER_HEIGHT;
    if (relativeY < 0) relativeY = 0;
    const totalMinutes =
      (relativeY / GRID_SLOT_HEIGHT_PX) * GRID_MINUTES_PER_SLOT;
    const snapped =
      Math.floor(totalMinutes / GRID_MINUTES_PER_SLOT) * GRID_MINUTES_PER_SLOT;
    const d = new Date(columnDate);
    d.setHours(0, snapped, 0, 0);
    return d;
  };

  // Global pointer handlers for dragging/resizing
  useEffect(() => {
    const onPointerMove = (e) => {
      if (draggingTaskId != null) {
        dragMovedRef.current = true;
        const deltaY = e.clientY - dragStartY;
        const slotsMoved = Math.round(deltaY / GRID_SLOT_HEIGHT_PX);
        const newStart = addMinutes(dragOriginalStart, slotsToMinutes(slotsMoved));
        const duration = differenceInMinutes(dragOriginalEnd, dragOriginalStart);
        let ns = new Date(newStart);
        let ne = addMinutes(ns, duration);
        if (!isEqual(startOfDay(ns), startOfDay(dragOriginalStart))) return;
        const snappedStart = floorTo15(ns);
        const snappedEnd = floorTo15(ne);
        updateTaskTimes(draggingTaskId, snappedStart, snappedEnd);
      }
      if (resizingTaskId != null) {
        const deltaY = e.clientY - resizeStartY;
        const slotsMoved = Math.round(deltaY / GRID_SLOT_HEIGHT_PX);
        let ns = new Date(resizeOriginalStart);
        let ne = new Date(resizeOriginalEnd);
        if (resizeEdge === "bottom") {
          ne = addMinutes(resizeOriginalEnd, slotsToMinutes(slotsMoved));
          if (!isEqual(startOfDay(ne), startOfDay(resizeOriginalStart))) return;
          ne = ceilTo15(ne);
        } else {
          ns = addMinutes(resizeOriginalStart, slotsToMinutes(slotsMoved));
          if (!isEqual(startOfDay(ns), startOfDay(resizeOriginalStart))) return;
          ns = floorTo15(ns);
        }
        if (differenceInMinutes(ne, ns) < 15) return;
        updateTaskTimes(resizingTaskId, ns, ne);
      }
    };
    const onPointerUp = () => {
      setDraggingTaskId(null);
      setResizingTaskId(null);
      setResizeEdge(null);
    };
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    };
    // eslint-disable-next-line
  }, [
    draggingTaskId,
    dragStartY,
    dragOriginalStart,
    dragOriginalEnd,
    resizeStartY,
    resizeOriginalEnd,
    resizeOriginalStart,
    resizeEdge,
  ]);

  // ===== UI pieces =====
  const Header = () => {
    const first = daysToShow[0];
    const last = daysToShow[daysToShow.length - 1];
    const sameMonth = format(first, "MMM") === format(last, "MMM");
    const rangeLabel = sameMonth
      ? `${format(first, "MMM d")} – ${format(last, "d, yyyy")}`
      : `${format(first, "MMM d")} – ${format(last, "MMM d, yyyy")}`;

    const goPrev = () => setStartDay(addDays(startDay, -viewType));
    const goNext = () => setStartDay(addDays(startDay, viewType));
    // Fix for today: should always set startDay so that today is visible and first column is today if 1-day, else week containing today
    const goToday = () => {
      const today = new Date();
      if (viewType === 1) {
        setStartDay(startOfDay(today));
      } else {
        // Calculate offset so today is in the center of the view
        const offset = Math.floor(viewType / 3);
        setStartDay(addDays(startOfDay(today), -offset));
      }
    };

    return (
      <nav className="flex items-center gap-3 w-full h-[64px] px-4 border-b border-slate-700 bg-gradient-to-b from-slate-900/80 to-slate-900 text-gray-100 sticky top-0 z-50">
        <button
          onClick={goPrev}
          className="p-2 rounded-md hover:bg-white/5 focus:outline-none focus:ring-2 focus:ring-indigo-400"
          aria-label="Previous"
          type="button"
        >
          <ChevronLeft size={20} />
        </button>
        <button
          onClick={goNext}
          className="p-2 rounded-md hover:bg-white/5 focus:outline-none focus:ring-2 focus:ring-indigo-400"
          aria-label="Next"
          type="button"
        >
          <ChevronRight size={20} />
        </button>
        <button
          onClick={goToday}
          className="px-3 py-1.5 rounded-md border border-slate-600 hover:bg-white/5 text-sm"
          type="button"
        >
          Today
        </button>
        <div className="ml-2 text-sm sm:text-base font-semibold tracking-wide text-slate-200">
          {rangeLabel}
        </div>
        <div className="ml-auto flex items-center gap-2">
          <div className="inline-flex rounded-lg bg-slate-800/80 border border-slate-700 overflow-hidden text-xs">
            {VIEW_OPTIONS.map((d) => (
              <button
                key={d}
                onClick={() => setViewType(d)}
                className={`${
                  viewType === d
                    ? "bg-indigo-600/70 text-white"
                    : "hover:bg-white/5 text-slate-300"
                } px-3 py-1.5 transition-colors`}
                type="button"
                aria-pressed={viewType === d}
              >
                {d} day{d > 1 ? "s" : ""}
              </button>
            ))}
          </div>
          <button
            onClick={() => setCreateModalOpen(true)}
            className="ml-2 inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white text-sm shadow"
            type="button"
          >
            <Plus size={16} /> New Task
          </button>
        </div>
      </nav>
    );
  };

  const TimeGutter = () => {
    const minutes = minutesSinceStartOfDay(now);
    const nowTop = pxFromMinutes(minutes);
    return (
      <div
        className="sticky left-0 top-0 z-30 border-r bg-slate-950"
        style={{
          borderColor: colors.border,
          gridRow: "1 / -1",
        }}
      >
        <div
          className="h-16 flex items-center justify-center text-[10px] font-semibold border-b"
          style={{ color: colors.timeLabel, borderColor: colors.border }}
        >
          Time
        </div>
        {/* Hours */}
        {Array.from({ length: HOURS_IN_DAY }).map((_, hour) => (
          <div
            key={hour}
            className="relative border-t flex items-start justify-center select-none"
            style={{
              height: GRID_SLOT_HEIGHT_PX * SLOTS_PER_HOUR,
              borderColor: colors.border,
            }}
          >
            <span
              className="absolute -top-1 text-[10px] font-semibold"
              style={{ color: colors.timeLabel }}
            >
              {format(new Date().setHours(hour, 0, 0, 0), "ha")}
            </span>
          </div>
        ))}
        {/* Now dot in gutter when today visible */}
        {daysToShow.some((d) => isEqual(startOfDay(d), startOfDay(now))) && (
          <div
            className="absolute left-0 right-0 pointer-events-none"
            style={{ top: HEADER_HEIGHT + nowTop }}
          >
            <div className="flex items-center gap-2 pl-2">
              <span
                className="inline-block w-2 h-2 rounded-full"
                style={{ background: colors.now }}
              />
            </div>
          </div>
        )}
      </div>
    );
  };

  function DayColumn({ date }) {
    const dayKey = +startOfDay(date);
    const dayTasks = tasksByDay.get(dayKey) || [];

    // Convert tasks to Date objects
    const prepared = useMemo(
      () =>
        dayTasks.map((t) => ({
          ...t,
          start: new Date(t.start),
          end: new Date(t.end),
        })),
      [dayTasks]
    );

    const layouts = useMemo(() => layoutEventsForDay(prepared), [prepared]);

    // Hover time indicator within this column
    const onMouseMove = (e) => {
      const snapped = getSnappedSlotDate(e.clientY, calendarRef.current, date);
      setHoverTime(snapped);
      const rect = calendarRef.current?.getBoundingClientRect();
      setHoverPos({ x: e.clientX - (rect?.left || 0), y: e.clientY - (rect?.top || 0) });
      if (isSelecting) setSelectEnd(snapped);
    };

    const onMouseDown = (e) => {
      if (e.button !== 0) return;
      const snapped = getSnappedSlotDate(e.clientY, calendarRef.current, date);
      setIsSelecting(true);
      setSelectStart(snapped);
      setSelectEnd(snapped);
    };

    const onMouseLeave = () => setHoverTime(null);

    // Compute "now" visuals if today
    const isToday = isEqual(startOfDay(date), startOfDay(now));
    const nowTop = pxFromMinutes(minutesSinceStartOfDay(now));

    return (
      <div
        className="calendar-day relative flex flex-col border-r"
        style={{ backgroundColor: colors.background, borderColor: colors.border }}
        onMouseMove={onMouseMove}
        onMouseDown={onMouseDown}
        onMouseLeave={onMouseLeave}
      >
        {/* Header */}
        <div
          className="sticky top-0 z-40 border-b flex flex-col items-center justify-center text-center"
          style={{
            height: HEADER_HEIGHT,
            backgroundColor: colors.headerBg,
            borderColor: colors.border,
            color: colors.dayLabel,
            userSelect: "none",
          }}
        >
          <span className="uppercase text-xs tracking-wider">
            {format(date, "EEE")}
          </span>
          <span className={`mt-1 text-lg font-bold ${isToday ? "text-white" : "text-slate-100"}`}>
            {format(date, "MMM d")}
          </span>
        </div>
        {/* Grid */}
        <div className="relative flex-grow select-none">
          {Array.from({ length: HOURS_IN_DAY * SLOTS_PER_HOUR }).map((_, i) => (
            <div
              key={i}
              className="border-t"
              style={{ height: GRID_SLOT_HEIGHT_PX, borderColor: colors.border }}
            />
          ))}
          {/* Past tint for today */}
          {isToday && (
            <div
              className="absolute left-0 right-0 pointer-events-none"
              style={{
                top: 0,
                height: nowTop,
                background: colors.pastTint,
              }}
            />
          )}
          {/* Now line across today */}
          {isToday && (
            <div
              className="absolute left-0 right-0 z-30 pointer-events-none"
              style={{ top: nowTop }}
            >
              <div className="h-0.5" style={{ background: colors.now }} />
            </div>
          )}
          {/* Hover slot highlight */}
          {hoverTime && isEqual(startOfDay(hoverTime), startOfDay(date)) && (
            <div
              className="absolute left-0 right-0 z-10"
              style={{
                top: pxFromMinutes(minutesSinceStartOfDay(hoverTime)),
                height: GRID_SLOT_HEIGHT_PX,
                background: colors.hoveredSlot,
                pointerEvents: "none",
              }}
            />
          )}
          {/* Hover time bubble */}
          {hoverTime && (
            <div
              className="absolute z-40 px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 border border-slate-600 shadow"
              style={{
                left: clamp(hoverPos.x + 8, 0, 9999),
                top: clamp(hoverPos.y - 12, 0, 9999),
              }}
            >
              {format(hoverTime, "p")}
            </div>
          )}
          {/* Selection highlight */}
          {isSelecting &&
            selectStart &&
            selectEnd &&
            isEqual(startOfDay(selectStart), startOfDay(date)) &&
            (() => {
              const [s, e] = isAfter(selectStart, selectEnd)
                ? [selectEnd, selectStart]
                : [selectStart, selectEnd];
              const top = pxFromMinutes(minutesSinceStartOfDay(s));
              const height = pxFromMinutes(
                differenceInMinutes(addMinutes(e, GRID_MINUTES_PER_SLOT), s)
              );
              return (
                <div
                  className="absolute left-1 right-1 rounded-md"
                  style={{
                    top,
                    height,
                    background: colors.selectedSlot,
                    outline: `1px dashed ${colors.taskBorder}`,
                  }}
                />
              );
            })()}
          {/* Task blocks */}
          {prepared.map((task) => {
            const start = task.start;
            const end = task.end;
            const top = pxFromMinutes(minutesSinceStartOfDay(start));
            const height = pxFromMinutes(differenceInMinutes(end, start));
            const lay = layouts.get(task.id) || { leftPct: 0, widthPct: 100 };
            const left = `calc(${lay.leftPct}% + 2px)`;
            const width = `calc(${lay.widthPct}% - 4px)`;
            const showTime = height >= 40;
            const showDescription = height >= 64;
            const isPastTask = isToday && end <= now;

            // Click sidebar fix: open sidebar with the task only if not resizing/moving
            return (
              <div
                key={task.id}
                className="absolute z-20 rounded-md text-white p-1.5 shadow-lg cursor-pointer"
                style={{
                  top,
                  height,
                  left,
                  width,
                  background: colors.taskBg,
                  border: `1px solid ${colors.taskBorder}`,
                  boxShadow: "0 8px 24px rgba(0,0,0,0.35)",
                  overflow: "hidden",
                  display: "flex",
                  flexDirection: "column",
                  gap: 2,
                  userSelect: "none",
                }}
                title={`${task.name}: ${format(start, "p")} – ${format(
                  end,
                  "p"
                )}`}
                onMouseDown={(e) => {
                  if (e.button !== 0) return;
                  e.stopPropagation();
                  dragMovedRef.current = false;
                  setDraggingTaskId(task.id);
                  setDragStartY(e.clientY);
                  setDragOriginalStart(start);
                  setDragOriginalEnd(end);
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  if (dragMovedRef.current) return; // ignore if it was actually a drag
                  setSelectedTask(task);
                  setSidebarInitialTab("tasks");
                  setSidebarOpen(true);
                }}

              >
                {isPastTask && (
                  <div className="absolute inset-0 bg-black/30 pointer-events-none" />
                )}
                <div className="truncate font-bold leading-tight text-[12px] relative z-10">
                  {task.name}
                </div>
                {showTime && (
                  <div className="text-[11px] opacity-90 font-medium relative z-10">
                    {format(start, "p")} – {format(end, "p")}
                  </div>
                )}
                {showDescription && task.description && (
                  <div className="text-[10px] italic opacity-80 truncate relative z-10">
                    {task.description}
                  </div>
                )}
                {/* Resize handles */}
                <div
                  className="absolute left-0 right-0 h-1.5 cursor-ns-resize opacity-70"
                  style={{ top: -1, background: "transparent" }}
                  onMouseDown={(e) => {
                    setResizingTaskId(task.id);
                    setResizeEdge("top");
                    setResizeStartY(e.clientY);
                    setResizeOriginalStart(start);
                    setResizeOriginalEnd(end);
                  }}
                  
                />
                <div
                  className="absolute left-0 right-0 h-2 cursor-ns-resize opacity-70"
                  style={{ bottom: -1, background: "transparent" }}
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    setResizingTaskId(task.id);
                    setResizeEdge("bottom");
                    setResizeStartY(e.clientY);
                    setResizeOriginalStart(start);
                    setResizeOriginalEnd(end);
                  }}
                />
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Finish selection -> create modal
  const finishSelection = useCallback(() => {
    if (!isSelecting || !selectStart || !selectEnd) return;
    let [start, end] = isAfter(selectStart, selectEnd)
      ? [selectEnd, selectStart]
      : [selectStart, selectEnd];
    end = addMinutes(end, GRID_MINUTES_PER_SLOT);
    if (!isEqual(startOfDay(start), startOfDay(end))) {
      alert("Tasks must stay on the same day.");
    } else {
      setPendingTaskData({ start, end, name: "" });
      setModalOpen(true);
    }
    setIsSelecting(false);
    setSelectStart(null);
    setSelectEnd(null);
    setHoverTime(null);
  }, [isSelecting, selectStart, selectEnd]);

  useEffect(() => {
    const el = calendarRef.current;
    if (!el) return;
    const up = () => finishSelection();
    const leave = () => {
      setIsSelecting(false);
      setSelectStart(null);
      setSelectEnd(null);
      setHoverTime(null);
    };
    el.addEventListener("mouseup", up);
    el.addEventListener("mouseleave", leave);
    return () => {
      el.removeEventListener("mouseup", up);
      el.removeEventListener("mouseleave", leave);
    };
  }, [finishSelection]);

  const handleModalSubmit = (taskDetails) => {
    if (!taskDetails.name) {
      alert("Task name is required.");
      return;
    }
    addNewTask(taskDetails);
    setModalOpen(false);
    setPendingTaskData(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-900 to-black text-gray-100 overflow-x-hidden">
      <Header />
      {/* Main grid */}
      <main className="mx-auto">
        <div
          ref={calendarRef}
          className="grid border rounded-xl overflow-y-auto shadow-inner relative"
          style={{
            gridTemplateColumns: `64px repeat(${viewType}, 1fr)`,
            height: "calc(100vh - 64px)",
            backgroundColor: colors.background,
            borderColor: colors.border,
            margin: "0 auto",
            overflowX: "hidden",
            // Remove any accidental right margin; force fitscreen
            boxSizing: "border-box",
          }}
        >
          <TimeGutter />
          {daysToShow.map((date) => (
            <DayColumn key={+date} date={date} />
          ))}
        </div>
      </main>
      {/* Create from drag selection */}
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
      {/* Quick "New Task" composer */}
      <CreateTaskModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSubmit={async (data) => {
          await addNewCustomTask(data);
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
            const res = await fetch(
              `http://127.0.0.1:5000/api/tasks/${updatedTask.id}`,
              {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  name: updatedTask.name,
                  description: updatedTask.description,
                  links: updatedTask.links,
                  start: updatedTask.start,
                  end: updatedTask.end,
                }),
              }
            );
            if (!res.ok) {
              const errorData = await res.json();
              throw new Error(errorData.error || "Failed to update task");
            }
            const updated = await res.json();
            setTasks((prev) =>
              prev.map((t) => (t.id === updated.id ? updated : t))
            );
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
      {/* Sidebar toggle floater */}
      <button
        onClick={() => setSidebarOpen((s) => !s)}
        className="fixed bottom-4 right-4 rounded-full border border-slate-700 bg-slate-900/90 backdrop-blur px-3 py-2 shadow hover:bg-slate-800"
        aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
        type="button"
      >
        {sidebarOpen ? <PanelLeftClose size={18} /> : <PanelRightClose size={18} />}
      </button>
    </div>
  );
}
