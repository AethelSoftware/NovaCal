// novacal-app/frontend/src/components/CalendarView.jsx
import React, { useState, useRef, useEffect } from "react";
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

import { ChevronLeft, ChevronRight, Settings } from "lucide-react";

// Constants
const GRID_SLOT_HEIGHT_PX = 15; // 15 minutes = 15px height (4 per hour)
const GRID_MINUTES_PER_SLOT = 15;
const HOURS_IN_DAY = 24;
const VIEW_OPTIONS = [1, 3, 5, 7];

function CalendarView({ tasks, onAddTask }) {
  const [viewType, setViewType] = useState(3);
  const [startDay, setStartDay] = useState(() =>
    startOfWeek(new Date(), { weekStartsOn: 1 })
  );

  const [settingsOpen, setSettingsOpen] = useState(false);

  const [isDragging, setIsDragging] = useState(false);
  const [dragStartTime, setDragStartTime] = useState(null);
  const [dragEndTime, setDragEndTime] = useState(null);
  const [hoverTime, setHoverTime] = useState(null);
  const calendarRef = useRef(null);

  const daysToShow = Array.from({ length: viewType }).map((_, i) =>
    addDays(startDay, i)
  );

  // Calculate snapped date from Y coordinate considering scroll offset
  function getSnappedSlotDate(yPx, columnDate) {
    const calendarRect = calendarRef.current.getBoundingClientRect();
    const scrollTop = calendarRef.current.scrollTop;
    const relativeY = yPx - calendarRect.top + scrollTop;

    const totalMinutesFromMidnight =
      (relativeY / GRID_SLOT_HEIGHT_PX) * GRID_MINUTES_PER_SLOT;
    const snappedMinutes =
      Math.floor(totalMinutesFromMidnight / GRID_MINUTES_PER_SLOT) *
      GRID_MINUTES_PER_SLOT;

    const snappedDate = new Date(columnDate);
    snappedDate.setHours(0, 0, 0, 0);
    snappedDate.setMinutes(snappedMinutes);
    return snappedDate;
  }

  function isSlotHovered(slotDate) {
    return hoverTime && isEqual(slotDate, hoverTime);
  }

  function isSlotSelected(slotDate) {
    if (!isDragging || !dragStartTime || !dragEndTime) return false;
    let start = dragStartTime,
      end = dragEndTime;
    if (isAfter(start, end)) [start, end] = [end, start];

    const rangeEnd = addMinutes(end, GRID_MINUTES_PER_SLOT);
    return !isBefore(slotDate, start) && isBefore(slotDate, rangeEnd);
  }

  const handleMouseDown = (e, slotDate) => {
    if (e.button !== 0) return;
    setIsDragging(true);
    setDragStartTime(slotDate);
    setDragEndTime(slotDate);
  };

  const cleanUpDrag = () => {
    setIsDragging(false);
    setDragStartTime(null);
    setDragEndTime(null);
    setHoverTime(null);
  };

  const handleMouseUp = () => {
    if (!isDragging || !dragStartTime || !dragEndTime) {
      cleanUpDrag();
      return;
    }
    setIsDragging(false);

    let start = dragStartTime,
      end = dragEndTime;
    if (isAfter(start, end)) [start, end] = [end, start];
    end = addMinutes(end, GRID_MINUTES_PER_SLOT);

    if (isEqual(start, end)) {
      end = addMinutes(start, GRID_MINUTES_PER_SLOT);
    }

    if (!isEqual(startOfDay(start), startOfDay(end))) {
      alert("Tasks must start and end on the same day.");
      cleanUpDrag();
      return;
    }

    const taskName = prompt(
      `New Task: ${format(start, "h:mm a")} – ${format(end, "h:mm a")}\nName:`
    );
    if (taskName) {
      onAddTask({
        id: Date.now(),
        name: taskName,
        start: start.toISOString(),
        end: end.toISOString(),
        duration: (end.getTime() - start.getTime()) / 60000,
      });
    }
    cleanUpDrag();
  };

  const handleMouseMove = (e, columnDate) => {
    if (!calendarRef.current) return;
    const snappedDate = getSnappedSlotDate(e.clientY, columnDate);
    setHoverTime(snappedDate);
    if (isDragging) setDragEndTime(snappedDate);
  };

  const handleMouseLeaveColumn = () => {
    setHoverTime(null);
  };

  useEffect(() => {
    const calendarElement = calendarRef.current;
    if (!calendarElement) return;

    calendarElement.addEventListener("mouseup", handleMouseUp);
    calendarElement.addEventListener("mouseleave", cleanUpDrag);
    return () => {
      calendarElement.removeEventListener("mouseup", handleMouseUp);
      calendarElement.removeEventListener("mouseleave", cleanUpDrag);
    };
  }, [isDragging, dragStartTime, dragEndTime]);

  // Navigation handlers
  const goPrevious = () => {
    setStartDay((prev) => addDays(prev, -viewType));
  };
  const goNext = () => {
    setStartDay((prev) => addDays(prev, viewType));
  };
  const toggleSettings = () => {
    setSettingsOpen((prev) => !prev);
  };
  const changeViewDays = (days) => {
    setViewType(days);
    setStartDay(startOfWeek(new Date(), { weekStartsOn: 1 }));
    setSettingsOpen(false);
  };

  return (
    <>
      {/* Navigation bar */}
      <div className="flex items-center space-x-2 mb-4 select-none relative">
        <button
          onClick={goPrevious}
          aria-label="Previous days"
          className="p-2 rounded hover:bg-gray-200 transition"
          title={`Previous ${viewType} day${viewType > 1 ? "s" : ""}`}
          type="button"
        >
          <ChevronLeft size={22} />
        </button>

        <button
          onClick={goNext}
          aria-label="Next days"
          className="p-2 rounded hover:bg-gray-200 transition"
          title={`Next ${viewType} day${viewType > 1 ? "s" : ""}`}
          type="button"
        >
          <ChevronRight size={22} />
        </button>

        <button
          onClick={toggleSettings}
          aria-label="Calendar view settings"
          className="ml-auto p-2 rounded hover:bg-gray-200 transition relative"
          title="Change visible days"
          type="button"
        >
          <Settings size={22} />
        </button>

        {settingsOpen && (
          <div className="absolute top-full right-0 mt-2 bg-white border border-gray-300 rounded shadow-md p-3 w-40 z-40">
            <div className="mb-2 font-semibold text-gray-700">Days to view</div>
            {VIEW_OPTIONS.map((days) => (
              <button
                key={days}
                type="button"
                onClick={() => changeViewDays(days)}
                className={`block w-full text-left px-3 py-2 rounded hover:bg-blue-100 transition ${
                  viewType === days
                    ? "font-bold text-blue-700 bg-blue-50"
                    : "text-gray-700"
                }`}
              >
                {days} day{days > 1 ? "s" : ""}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Calendar Grid */}
      <div
        ref={calendarRef}
        className="relative grid border border-gray-300 rounded-lg overflow-hidden max-h-[calc(100vh-150px)] overflow-y-auto select-none"
        style={{ gridTemplateColumns: `auto repeat(${viewType}, 1fr)` }}
      >
        {/* Time Column */}
        <div className="flex flex-col border-r border-gray-300 bg-gray-50 sticky left-0 top-0 z-20 shadow-md">
          <div className="h-16 flex items-center justify-center text-sm font-semibold text-gray-600 border-b border-gray-300">
            Time
          </div>
          {Array.from({ length: HOURS_IN_DAY }).map((_, hour) => (
            <div
              key={hour}
              className="relative border-t border-gray-400"
              style={{ height: GRID_SLOT_HEIGHT_PX * 4 }}
            >
              <span className="absolute -top-1 left-1/2 transform -translate-x-1/2 text-xs text-gray-500 pointer-events-none select-none">
                {format(new Date().setHours(hour, 0, 0, 0), "h a")}
              </span>
            </div>
          ))}
        </div>

        {/* Day Columns */}
        {daysToShow.map((date, idx) => (
          <div
            key={idx}
            className="calendar-column flex flex-col border-r border-gray-300"
            data-date={date.toISOString()}
          >
            {/* Day Header */}
            <div className="h-16 flex flex-col items-center justify-center text-sm font-semibold text-gray-800 border-b border-gray-300 bg-blue-50 sticky top-0 z-10 shadow-sm select-none">
              <span>{format(date, "EEE")}</span>
              <span className="text-xl font-bold">{format(date, "MMM d")}</span>
            </div>

            {/* Time Slots */}
            <div className="relative flex-grow">
              {Array.from({ length: HOURS_IN_DAY }).map((_, hour) =>
                Array.from({ length: 4 }).map((_, quarter) => {
                  const slotDate = new Date(date);
                  slotDate.setHours(hour, quarter * GRID_MINUTES_PER_SLOT, 0, 0);

                  return (
                    <div
                      key={`${hour}-${quarter}`}
                      onMouseDown={(e) => handleMouseDown(e, slotDate)}
                      onMouseMove={(e) => handleMouseMove(e, date)}
                      onMouseEnter={() => setHoverTime(slotDate)}
                      onMouseLeave={handleMouseLeaveColumn}
                      className={`border-b border-gray-200 cursor-pointer transition-colors duration-150
                        ${
                          isSlotSelected(slotDate)
                            ? "bg-blue-200 opacity-90"
                            : isSlotHovered(slotDate)
                            ? "bg-gray-100 opacity-80"
                            : ""
                        }`}
                      style={{ height: GRID_SLOT_HEIGHT_PX }}
                      role="button"
                      tabIndex={-1}
                      aria-label={`Time slot starting at ${format(
                        slotDate,
                        "h:mm a"
                      )} on ${format(slotDate, "MMM d, yyyy")}`}
                    />
                  );
                })
              )}

              {/* Hour Horizontal Lines */}
              {Array.from({ length: HOURS_IN_DAY }).map((_, hour) => (
                <div
                  key={`line-${hour}`}
                  className="absolute left-0 right-0 border-t border-gray-400 pointer-events-none"
                  style={{ top: hour * GRID_SLOT_HEIGHT_PX * 4 }}
                  aria-hidden="true"
                />
              ))}

              {/* Existing Tasks */}
              {tasks
                .filter((task) =>
                  isEqual(startOfDay(new Date(task.start)), startOfDay(date))
                )
                .map((task) => {
                  const taskStart = new Date(task.start);
                  const taskEnd = new Date(task.end);
                  const startMinutes =
                    getHours(taskStart) * 60 + getMinutes(taskStart);
                  const durationMinutes =
                    (taskEnd.getTime() - taskStart.getTime()) / 60000;

                  const top = (startMinutes / GRID_MINUTES_PER_SLOT) * GRID_SLOT_HEIGHT_PX;
                  const height = (durationMinutes / GRID_MINUTES_PER_SLOT) * GRID_SLOT_HEIGHT_PX;

                  return (
                    <div
                      key={task.id}
                      className="absolute inset-x-1 bg-purple-600 text-white text-xs p-1 rounded-md overflow-hidden shadow-sm z-20 flex flex-col justify-center"
                      style={{ top: top, height: height }}
                      aria-label={`${task.name} from ${format(
                        taskStart,
                        "h:mm a"
                      )} to ${format(taskEnd, "h:mm a")}`}
                      role="group"
                    >
                      <span className="font-semibold truncate">{task.name}</span>
                      <span className="opacity-80 text-[0.6rem] truncate">
                        {format(taskStart, "h:mm a")} - {format(taskEnd, "h:mm a")}
                      </span>
                    </div>
                  );
                })}

              {/* Drag Preview Block */}
              {isDragging &&
                dragStartTime &&
                dragEndTime &&
                isEqual(startOfDay(dragStartTime), startOfDay(date)) && (
                  (() => {
                    let start = dragStartTime,
                      end = dragEndTime;
                    if (isAfter(start, end)) [start, end] = [end, start];
                    end = addMinutes(end, GRID_MINUTES_PER_SLOT);

                    const startMinutes =
                      getHours(start) * 60 + getMinutes(start);
                    const duration =
                      (end.getTime() - start.getTime()) / 60000;

                    const top = (startMinutes / GRID_MINUTES_PER_SLOT) * GRID_SLOT_HEIGHT_PX;
                    const height = (duration / GRID_MINUTES_PER_SLOT) * GRID_SLOT_HEIGHT_PX;

                    return (
                      <div
                        className="absolute inset-x-1 bg-blue-600/90 text-white text-[11px] p-1 rounded-md border-2 border-blue-700 border-dashed z-30 pointer-events-none flex flex-col justify-center"
                        style={{ top: top, height: height }}
                        aria-hidden="true"
                      >
                        <span className="font-semibold">
                          {format(start, "h:mm a")} – {format(end, "h:mm a")}
                        </span>
                      </div>
                    );
                  })()
                )}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

export default CalendarView;
