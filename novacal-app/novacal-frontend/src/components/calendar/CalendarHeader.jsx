import React from "react";
import { format, addDays, startOfDay, isEqual } from "date-fns";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";

const VIEW_OPTIONS = [1, 3, 5, 7];

export default function Header({ viewType, setViewType, startDay, setStartDay, openCreateModal }) {
  const first = startDay;
  const last = addDays(startDay, viewType - 1);

  const sameMonth = format(first, "MMM") === format(last, "MMM");
  const rangeLabel = sameMonth
    ? `${format(first, "MMM d")} – ${format(last, "d, yyyy")}`
    : `${format(first, "MMM d")} – ${format(last, "MMM d, yyyy")}`;

  const goPrev = () => setStartDay(addDays(startDay, -viewType));
  const goNext = () => setStartDay(addDays(startDay, viewType));
  const goToday = () => {
    const today = new Date();
    if (viewType === 1) {
      setStartDay(startOfDay(today));
    } else {
      const offset = Math.floor(viewType / 3);
      setStartDay(addDays(startOfDay(today), -offset));
    }
  };

  return (
    <nav className="flex items-center gap-3 w-full h-[64px] px-4 border-b border-slate-700 bg-gray-950 text-gray-100 sticky top-0 z-50">
      <button
        onClick={goPrev}
        className="p-2 rounded-md hover:bg-white/5 focus:outline-none focus:ring-2 focus:ring-sky-400"
        aria-label="Previous"
        type="button"
      >
        <ChevronLeft size={20} />
      </button>
      <button
        onClick={goNext}
        className="p-2 rounded-md hover:bg-white/5 focus:outline-none focus:ring-2 focus:ring-sky-400"
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

      <div className="ml-2 text-sm sm:text-base font-semibold tracking-wide text-slate-200">{rangeLabel}</div>

      <div className="ml-auto flex items-center gap-2">
        <div className="inline-flex rounded-lg bg-slate-800/80 border border-slate-700 overflow-hidden text-xs">
          {VIEW_OPTIONS.map((d) => (
            <button
              key={d}
              onClick={() => setViewType(d)}
              className={`${
                viewType === d ? "bg-sky-600/70 text-white" : "hover:bg-white/5 text-slate-300"
              } px-3 py-1.5 transition-colors`}
              type="button"
              aria-pressed={viewType === d}
            >
              {d} day{d > 1 ? "s" : ""}
            </button>
          ))}
        </div>
        <button
          onClick={openCreateModal}
          className="ml-2 inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-sky-700 hover:bg-sky-800 text-white text-sm shadow duration-200 cursor-pointer"
          type="button"
        >
          <Plus size={16} /> New Task
        </button>
      </div>
    </nav>
  );
}
