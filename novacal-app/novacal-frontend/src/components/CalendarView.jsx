// components/CalendarView.jsx
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

const GRID_SLOT_HEIGHT_PX = 16;
const GRID_MINUTES_PER_SLOT = 15;
const HOURS_IN_DAY = 24;
const VIEW_OPTIONS = [1, 3, 5, 7];

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

function CalendarView({ tasks, onAddTask, viewType: parentViewType }) {
  const [viewType, setViewType] = useState(parentViewType || 3);
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

  function getSnappedSlotDate(yPx, columnDate) {
    const rect = calendarRef.current.getBoundingClientRect();
    const relativeY = yPx - rect.top + calendarRef.current.scrollTop;
    const totalMinutes = (relativeY / GRID_SLOT_HEIGHT_PX) * GRID_MINUTES_PER_SLOT;
    const snapped =
      Math.floor(totalMinutes / GRID_MINUTES_PER_SLOT) * GRID_MINUTES_PER_SLOT;
    const d = new Date(columnDate);
    d.setHours(0, snapped, 0, 0);
    return d;
  }

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

  const handleMouseUp = () => {
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
    const name = prompt(`Task: ${format(start, "p")}–${format(end, "p")}`);
    if (name)
      onAddTask({
        id: Date.now(), // temporary frontend id; backend will override returned id
        name,
        start: start.toISOString(),
        end: end.toISOString(),
      });
    cleanUpDrag();
  };

  const cleanUpDrag = () => {
    setIsDragging(false);
    setDragStartTime(null);
    setDragEndTime(null);
    setHoverTime(null);
  };

  useEffect(() => {
    const el = calendarRef.current;
    el?.addEventListener("mouseup", handleMouseUp);
    el?.addEventListener("mouseleave", cleanUpDrag);
    return () => {
      el?.removeEventListener("mouseup", handleMouseUp);
      el?.removeEventListener("mouseleave", cleanUpDrag);
    };
  }, [isDragging, dragStartTime, dragEndTime]);

  return (
    <>
      {/* Navigation Bar */}
      <nav
        className="flex items-center gap-3 mb-4 font-semibold relative"
        style={{ color: colors.navIcon }}
      >
        <button
          onClick={() => setStartDay(addDays(startDay, -viewType))}
          className="p-2 rounded transition-colors"
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
          className="p-2 rounded transition-colors"
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
          className="ml-auto flex items-center gap-1 p-2 rounded cursor-pointer transition-colors"
          style={{ backgroundColor: "transparent", color: colors.navIcon }}
          onMouseEnter={(e) => (e.currentTarget.style.color = colors.navIconHover)}
          onMouseLeave={(e) => (e.currentTarget.style.color = colors.navIcon)}
          aria-label="Toggle View Settings"
          type="button"
        >
          <Settings size={20} />
          <span className="hidden md:inline select-none">View</span>
        </button>

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

      {/* Calendar Grid */}
      <div
        ref={calendarRef}
        className="grid border rounded-xl overflow-y-auto shadow-inner"
        style={{
          gridTemplateColumns: `64px repeat(${viewType}, 1fr)`,
          height: "calc(100vh - 160px)",
          backgroundColor: colors.background,
          borderColor: colors.border,
        }}
      >
        {/* Time Column */}
        <div
          className="sticky left-0 top-0 z-20 border-r"
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
              className="sticky top-0 z-10 border-b flex flex-col items-center justify-center text-center"
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
              <span className="mt-1 text-lg font-bold text-white">
                {format(date, "MMM d")}
              </span>
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

              {/* Tasks */}
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
                        backgroundImage: colors.taskBg,
                        border: `1.5px solid ${colors.taskBorder}`,
                        boxShadow:
                          "0 2px 6px rgba(127, 90, 240, 0.6), inset 0 0 8px rgba(255,255,255,0.15)",
                        overflow: "hidden",
                        userSelect: "text",
                      }}
                      title={`${task.name}: ${format(start, "p")} – ${format(end, "p")}`}
                    >
                      <div className="truncate">{task.name}</div>
                      <div
                        className="text-[10px] opacity-90"
                        style={{ color: "rgba(255, 255, 255, 0.85)" }}
                      >
                        {format(start, "p")} - {format(end, "p")}
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

export default CalendarView;
