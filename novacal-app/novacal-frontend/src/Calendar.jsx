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

import CreateTaskModal from "./components/calendar/CustomTaskModal";
import Modal from "./components/calendar/SimpleModal";
import CalendarSidebar from "./components/calendar/CalendarSidebar";
import Header from "./components/calendar/CalendarHeader";
import TimeGutter from "./components/calendar/TimeGutter";
import DayColumn from "./components/calendar/DayColumn";

// ===== Constants =====
const GRID_SLOT_HEIGHT_PX = 16;
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
  const [dragActive, setDragActive] = useState(false);

  const [resizingTaskId, setResizingTaskId] = useState(null);
  const [resizeEdge, setResizeEdge] = useState(null); // "top" | "bottom"
  const [resizeStartY, setResizeStartY] = useState(0);
  const [resizeOriginalStart, setResizeOriginalStart] = useState(null);
  const [resizeOriginalEnd, setResizeOriginalEnd] = useState(null);
  const [resizeActive, setResizeActive] = useState(false);

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

  useEffect(() => {
    const onPointerMove = (e) => {
      if (draggingTaskId != null) {
        const deltaY = e.clientY - dragStartY;
        if (!dragActive && Math.abs(deltaY) > 6) {
          setDragActive(true);
          dragMovedRef.current = true;
        }
        if (dragActive) {
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
      }
      if (resizingTaskId != null) {
        const deltaY = e.clientY - resizeStartY;
        if (!resizeActive && Math.abs(deltaY) > 6) {
          setResizeActive(true);
        }
        if (resizeActive) {
          let ns = new Date(resizeOriginalStart);
          let ne = new Date(resizeOriginalEnd);
          if (resizeEdge === "bottom") {
            ne = addMinutes(resizeOriginalEnd, slotsToMinutes(Math.round(deltaY / GRID_SLOT_HEIGHT_PX)));
            if (!isEqual(startOfDay(ne), startOfDay(resizeOriginalStart))) return;
            ne = ceilTo15(ne);
          } else {
            ns = addMinutes(resizeOriginalStart, slotsToMinutes(Math.round(deltaY / GRID_SLOT_HEIGHT_PX)));
            if (!isEqual(startOfDay(ns), startOfDay(resizeOriginalStart))) return;
            ns = floorTo15(ns);
          }
          if (differenceInMinutes(ne, ns) < 15) return;
          updateTaskTimes(resizingTaskId, ns, ne);
        }
      }
    };
    const onPointerUp = () => {
      setDraggingTaskId(null);
      setDragActive(false);
      setResizingTaskId(null);
      setResizeEdge(null);
      setResizeActive(false);
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
    dragActive,
    resizingTaskId,
    resizeEdge,
    resizeStartY,
    resizeOriginalEnd,
    resizeOriginalStart,
    resizeActive,
  ]);

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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-900 to-black text-gray-100 overflow-x-hidden calendar-scrollbar">
      <Header
        viewType={viewType}
        setViewType={setViewType}
        startDay={startDay}
        setStartDay={setStartDay}
        openCreateModal={() => setCreateModalOpen(true)}
      />
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
            boxSizing: "border-box",
          }}
        >
          <TimeGutter
            now={now}
            colors={colors}
            HOURS_IN_DAY={HOURS_IN_DAY}
            SLOTS_PER_HOUR={SLOTS_PER_HOUR}
            GRID_SLOT_HEIGHT_PX={GRID_SLOT_HEIGHT_PX}
            HEADER_HEIGHT={HEADER_HEIGHT}
            pxFromMinutes={pxFromMinutes}
            minutesSinceStartOfDay={minutesSinceStartOfDay}
            daysToShow={daysToShow}
          />
          {daysToShow.map((date) => (
            <DayColumn
              date={date}
              now={now}
              tasksByDay={tasksByDay}
              layoutEventsForDay={layoutEventsForDay}
              isSelecting={isSelecting}
              selectStart={selectStart}
              selectEnd={selectEnd}
              hoverTime={hoverTime}
              hoverPos={hoverPos}
              calendarRef={calendarRef}
              setIsSelecting={setIsSelecting}
              setSelectStart={setSelectStart}
              setSelectEnd={setSelectEnd}
              setHoverTime={setHoverTime}
              setHoverPos={setHoverPos}
              setDraggingTaskId={setDraggingTaskId}
              setDragStartY={setDragStartY}
              setDragOriginalStart={setDragOriginalStart}
              setDragOriginalEnd={setDragOriginalEnd}
              setDragActive={setDragActive}
              dragMovedRef={dragMovedRef}
              dragActive={dragActive}
              setSelectedTask={setSelectedTask}
              setSidebarInitialTab={setSidebarInitialTab}
              setSidebarOpen={setSidebarOpen}
              setResizingTaskId={setResizingTaskId}
              setResizeEdge={setResizeEdge}
              setResizeStartY={setResizeStartY}
              setResizeOriginalStart={setResizeOriginalStart}
              setResizeOriginalEnd={setResizeOriginalEnd}
              setResizeActive={setResizeActive}
              HOURS_IN_DAY={HOURS_IN_DAY}
              SLOTS_PER_HOUR={SLOTS_PER_HOUR}
              GRID_SLOT_HEIGHT_PX={GRID_SLOT_HEIGHT_PX}
              HEADER_HEIGHT={HEADER_HEIGHT}
              colors={colors}
              pxFromMinutes={pxFromMinutes}
              minutesSinceStartOfDay={minutesSinceStartOfDay}
              clamp={clamp}
              getSnappedSlotDate={getSnappedSlotDate}
              GRID_MINUTES_PER_SLOT={GRID_MINUTES_PER_SLOT}
            />
          ))}
        </div>
      </main>
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
          await addNewCustomTask(data);
          setCreateModalOpen(false);
        }}
      />
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
