// TimeGutter.jsx
import React from "react";
import { format, isEqual, startOfDay } from "date-fns";

// Make sure you receive props for dependencies:
export default function TimeGutter({
  now,
  colors,
  HOURS_IN_DAY,
  SLOTS_PER_HOUR,
  GRID_SLOT_HEIGHT_PX,
  HEADER_HEIGHT,
  pxFromMinutes,
  minutesSinceStartOfDay,
  daysToShow,
}) {
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
}
