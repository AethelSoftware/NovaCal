import React, { useMemo } from "react";
import { format, isEqual, startOfDay, isAfter, addMinutes, differenceInMinutes } from "date-fns";

// All dependencies must be passed via props, including derived state and setter functions.
export default function DayColumn({
  date,
  now,
  tasksByDay,
  layoutEventsForDay,
  isSelecting,
  selectStart,
  selectEnd,
  hoverTime,
  hoverPos,
  calendarRef,
  setIsSelecting,
  setSelectStart,
  setSelectEnd,
  setHoverTime,
  setHoverPos,
  setDraggingTaskId,
  setDragStartY,
  setDragOriginalStart,
  setDragOriginalEnd,
  setDragActive,
  dragMovedRef,
  dragActive,
  setSelectedTask,
  setSidebarInitialTab,
  setSidebarOpen,
  setResizingTaskId,
  setResizeEdge,
  setResizeStartY,
  setResizeOriginalStart,
  setResizeOriginalEnd,
  setResizeActive,
  HOURS_IN_DAY,
  SLOTS_PER_HOUR,
  GRID_SLOT_HEIGHT_PX,
  HEADER_HEIGHT,
  colors,
  pxFromMinutes,
  minutesSinceStartOfDay,
  clamp,
  getSnappedSlotDate,
  GRID_MINUTES_PER_SLOT
}) {
  const dayKey = +startOfDay(date);
  const dayTasks = tasksByDay.get(dayKey) || [];

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
        {isToday && (
          <div
            className="absolute left-0 right-0 z-30 pointer-events-none"
            style={{ top: nowTop }}
          >
            <div className="h-0.5" style={{ background: colors.now }} />
          </div>
        )}
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

          return (
            <div
              key={task.id}
              className="absolute z-20 rounded-md text-white p-1.5 shadow-lg cursor-pointer bg-sky-900/60 border border-white/20 border-dashed"
              style={{
                top,
                height,
                left,
                width,
                boxShadow: "0 8px 24px rgba(0,0,0,0.35)",
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
                gap: 2,
                userSelect: "none",
              }}
              title={`${task.name}: ${format(start, "p")} – ${format(end, "p")}`}
              onMouseDown={(e) => {
                if (e.button !== 0) return;
                e.stopPropagation();
                dragMovedRef.current = false;
                setDraggingTaskId(task.id);
                setDragStartY(e.clientY);
                setDragOriginalStart(start);
                setDragOriginalEnd(end);
                setDragActive(false);
              }}
              onClick={(e) => {
                e.stopPropagation();
                if (!dragMovedRef.current && !dragActive) {
                  setSelectedTask(task);
                  setSidebarInitialTab("tasks");
                  setSidebarOpen(true);
                }
              }}
              onContextMenu={(e) => {
                e.preventDefault();
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
              <div
                className="absolute left-0 right-0 h-1.5 cursor-ns-resize opacity-70"
                style={{ top: -1, background: "transparent" }}
                onMouseDown={(e) => {
                  setResizingTaskId(task.id);
                  setResizeEdge("top");
                  setResizeStartY(e.clientY);
                  setResizeOriginalStart(start);
                  setResizeOriginalEnd(end);
                  setResizeActive(false);
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
                  setResizeActive(false);
                }}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
