import React, { useState, useEffect, useMemo } from "react";
import { format, addMinutes, differenceInMinutes, setHours, setMinutes, isAfter } from "date-fns";
import { X, ZapOff, Zap, AlertTriangle, ArrowRight } from "lucide-react";
import { roundToNearest15 } from "../../utils/calendarUtils";

export default function CreateTaskModal({ isOpen, onClose, onSubmit }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [links, setLinks] = useState("");
  const [files, setFiles] = useState(null);
  const [start, setStart] = useState(() => format(new Date(), "yyyy-MM-dd'T'HH:mm"));
  const [due, setDue] = useState(() => format(addMinutes(new Date(), 720), "yyyy-MM-dd'T'HH:mm"));
  const [length, setLength] = useState(60);
  const [importance, setImportance] = useState(2);

  const [splitEnabled, setSplitEnabled] = useState(false);
  const [blockDuration, setBlockDuration] = useState(30);

  const [workingHours, setWorkingHours] = useState(null);
  const [loadingHours, setLoadingHours] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // reset basics
      setName("");
      setDescription("");
      setLinks("");
      setFiles(null);
      setLength(60);
      setImportance(2);
      setSplitEnabled(false);
      setBlockDuration(30);

      // fetch working hours then initialize start/due suggestion
      const initWithHours = async () => {
        setLoadingHours(true);
        try {
          const res = await fetch("/api/hours");
          if (!res.ok) throw new Error("Failed to fetch hours");
          const data = await res.json(); // array [{day, start, end}, ...]
          const map = (data || []).reduce((acc, r) => {
            acc[r.day] = { start: r.start, end: r.end };
            return acc;
          }, {});
          setWorkingHours(map);

          const now = new Date();
          const weekdayName = now.toLocaleDateString(undefined, { weekday: "long" });
          const todayHours = map[weekdayName];

          if (todayHours) {
            const roundedNow = roundToNearest15(now);
            const [hEnd, mEnd] = todayHours.end.split(":").map(Number);
            const windowEnd = setMinutes(setHours(new Date(), hEnd), mEnd);

            // always start at rounded now
            const suggestedStart = roundedNow;

            // due = end of window if valid, otherwise +12h
            let suggestedDue = isAfter(windowEnd, suggestedStart)
              ? windowEnd
              : addMinutes(suggestedStart, 720);

            setStart(format(suggestedStart, "yyyy-MM-dd'T'HH:mm"));
            setDue(format(roundToNearest15(suggestedDue), "yyyy-MM-dd'T'HH:mm"));
          } else {
            const nowRounded = roundToNearest15(new Date());
            setStart(format(nowRounded, "yyyy-MM-dd'T'HH:mm"));
            setDue(format(roundToNearest15(addMinutes(nowRounded, 720)), "yyyy-MM-dd'T'HH:mm"));
          }
        } catch (err) {
          console.error("Could not fetch working hours:", err);
          const nowRounded = roundToNearest15(new Date());
          setStart(format(nowRounded, "yyyy-MM-dd'T'HH:mm"));
          setDue(format(roundToNearest15(addMinutes(nowRounded, 720)), "yyyy-MM-dd'T'HH:mm"));
        } finally {
          setLoadingHours(false);
        }
      };

      initWithHours();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const timeBlocks = useMemo(() => {
    const blocks = [];
    if (!splitEnabled || length < 1) return blocks;
    try {
      let total = Number(length);
      let cursor = roundToNearest15(new Date(start));
      let count = 0;
      while (total > 0 && count < 100) {
        let min = Math.min(blockDuration, total);
        let blockEnd = addMinutes(cursor, min);
        blocks.push({
          start: format(cursor, "yyyy-MM-dd'T'HH:mm:ss"),
          end: format(blockEnd, "yyyy-MM-dd'T'HH:mm:ss"),
          length: min,
        });
        cursor = blockEnd;
        total -= min;
        count++;
      }
    } catch {}
    return blocks;
  }, [splitEnabled, start, length, blockDuration]);

  const startDate = new Date(start);
  const dueDate = new Date(due);
  const durationBetween =
    isNaN(dueDate - startDate) || dueDate < startDate
      ? null
      : differenceInMinutes(dueDate, startDate);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      alert("Task name is required.");
      return;
    }
    if (!start || !due || isNaN(startDate) || isNaN(dueDate) || dueDate < startDate) {
      alert("Please provide a valid chronological start and due date.");
      return;
    }
    if (!length || isNaN(Number(length)) || Number(length) <= 0) {
      alert("Please enter a valid length in minutes.");
      return;
    }
    onSubmit({
      name: name.trim(),
      description: description.trim(),
      links: links.trim(),
      files,
      start,
      due,
      length: Number(length),
      importance,
      splitEnabled,
      blockDuration: Number(blockDuration),
      blocks: timeBlocks,
    });
    onClose();
  };

  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 backdrop-blur-sm">
      <form
        onSubmit={handleSubmit}
        className="bg-zinc-950 rounded-2xl max-h-[85vh] w-full max-w-2xl flex flex-col shadow-2xl text-white border border-zinc-800 overflow-hidden custom-scrollbar"
        role="dialog"
        aria-modal="true"
        aria-labelledby="new-task-modal-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-900/50">
          <h2 id="new-task-modal-title" className="text-xl font-semibold tracking-tight">
            Create New Task
          </h2>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setImportance(1)}
              title="Low Priority"
              className={`p-2 rounded-full transition-colors ${importance === 1 ? "bg-sky-600" : "bg-zinc-800 hover:bg-zinc-700"}`}
            >
              <ZapOff className={importance === 1 ? "text-white" : "text-sky-300"} size={18} />
            </button>
            <button
              type="button"
              onClick={() => setImportance(2)}
              title="Normal Priority"
              className={`p-2 rounded-full transition-colors ${importance === 2 ? "bg-yellow-500" : "bg-zinc-800 hover:bg-zinc-700"}`}
            >
              <Zap className={importance === 2 ? "text-white" : "text-yellow-300"} size={18} />
            </button>
            <button
              type="button"
              onClick={() => setImportance(3)}
              title="High Priority"
              className={`p-2 rounded-full transition-colors ${importance === 3 ? "bg-red-500" : "bg-zinc-800 hover:bg-zinc-700"}`}
            >
              <AlertTriangle className={importance === 3 ? "text-white" : "text-red-300"} size={18} />
            </button>
          </div>

          <button type="button" onClick={onClose} className="text-zinc-400 hover:text-red-400 transition" title="Close">
            <X size={22} />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="overflow-y-auto p-6 flex-1 space-y-6">
          {/* Task Name */}
          <div>
            <label className="block text-sm text-zinc-400 mb-1">Task Name</label>
            <input
              type="text"
              required
              maxLength={100}
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
              className="w-full rounded-lg bg-zinc-900 border border-zinc-700 p-2 text-white focus:outline-none focus:ring-1 focus:ring-zinc-500"
            />
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-zinc-400 mb-1">Start</label>
              <input
                type="datetime-local"
                value={start}
                onChange={(e) => setStart(e.target.value)}
                onBlur={(e) => {
                  const picked = new Date(e.target.value);
                  if (!isNaN(picked.getTime())) {
                    const rounded = roundToNearest15(picked);
                    setStart(format(rounded, "yyyy-MM-dd'T'HH:mm"));
                  }
                }}
                className="w-full rounded-lg bg-zinc-900 border border-zinc-700 p-2 text-white focus:outline-none focus:ring-1 focus:ring-zinc-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-zinc-400 mb-1">Due</label>
              <input
                type="datetime-local"
                value={due}
                onChange={(e) => setDue(e.target.value)}
                onBlur={(e) => {
                  const picked = new Date(e.target.value);
                  if (!isNaN(picked.getTime())) {
                    const rounded = roundToNearest15(picked);
                    setDue(format(rounded, "yyyy-MM-dd'T'HH:mm"));
                  }
                }}
                className="w-full rounded-lg bg-zinc-900 border border-zinc-700 p-2 text-white focus:outline-none focus:ring-1 focus:ring-zinc-500"
                required
              />
            </div>
          </div>

          {/* Task Length */}
          <div>
            <label className="block text-sm text-zinc-400 mb-1">Task Length (minutes)</label>
            <input
              type="number"
              min={15}
              step={15}
              value={length}
              onChange={(e) => setLength(Number(e.target.value))}
              onBlur={() => {
                if (length % 15 !== 0) {
                  setLength(Math.round(length / 15) * 15);
                }
              }}
              className="w-full rounded-lg bg-zinc-900 border border-zinc-700 p-2 text-white focus:outline-none focus:ring-1 focus:ring-zinc-500"
              required
            />
            {durationBetween !== null && (
              <p className="mt-1 text-sm text-zinc-500">
                Available interval: {Math.floor(durationBetween / 60)}h {durationBetween % 60}m
              </p>
            )}
            {loadingHours && <p className="text-sm text-zinc-500 mt-1">Loading working hours suggestion...</p>}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm text-zinc-400 mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full rounded-lg bg-zinc-900 border border-zinc-700 p-2 text-white focus:outline-none focus:ring-1 focus:ring-zinc-500"
            />
          </div>

          {/* Links */}
          <div>
            <label className="block text-sm text-zinc-400 mb-1">Links (comma separated)</label>
            <input
              type="text"
              value={links}
              onChange={(e) => setLinks(e.target.value)}
              placeholder="https://example.com, https://docs.com"
              className="w-full rounded-lg bg-zinc-900 border border-zinc-700 p-2 text-white focus:outline-none focus:ring-1 focus:ring-zinc-500"
            />
          </div>

          {/* Files */}
          <div>
            <div
              className="w-full h-28 rounded-xl border-2 border-dashed border-zinc-600 flex items-center justify-center flex-col gap-2 bg-zinc-900/50 cursor-pointer hover:border-zinc-500 transition"
              onClick={() => document.getElementById("file-upload-input").click()}
              tabIndex={0}
              role="button"
              aria-label="Select files"
              onKeyDown={(e) => {
                if (e.key === " " || e.key === "Enter") document.getElementById("file-upload-input").click();
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="text-zinc-400" width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 16v2a2 2 0 01-2 2H6a2 2 0 01-2-2V8a2 2 0 012-2h2M8 8V6m0 0a2 2 0 114 0v2m0 0H8" />
              </svg>
              <span className="text-zinc-400 text-sm">Drag or click to select files</span>
              <input type="file" id="file-upload-input" multiple style={{ display: "none" }} onChange={(e) => setFiles(e.target.files)} accept="*" />
            </div>
            {files && files.length > 0 && <p className="mt-1 text-sm text-zinc-400">{files.length} file{files.length > 1 ? "s" : ""} selected</p>}
          </div>

          {/* Split Task Option */}
          <div className="space-y-4">
            <div className="flex items-center justify-between bg-zinc-900/50 p-4 rounded-xl border border-zinc-700">
              <span className="text-zinc-200 font-medium">Split task into blocks?</span>
              <input type="checkbox" checked={splitEnabled} onChange={(e) => setSplitEnabled(e.target.checked)} className="h-5 w-5 accent-violet-500" />
            </div>

            {splitEnabled && (
              <div className="bg-zinc-900/50 border border-zinc-700 rounded-xl p-4 space-y-4">
                <div className="flex items-center gap-3">
                  <label className="text-zinc-200 font-medium">Block Length (min):</label>
                  <input
                    type="number"
                    min={15}
                    max={300}
                    step={15}
                    value={blockDuration}
                    onChange={(e) => setBlockDuration(Number(e.target.value))}
                    onBlur={() => {
                      if (blockDuration % 15 !== 0) {
                        setBlockDuration(Math.round(blockDuration / 15) * 15);
                      }
                    }}
                    className="w-20 rounded-lg bg-zinc-900 border border-zinc-700 p-2 text-white focus:outline-none focus:ring-1 focus:ring-zinc-500"
                  />
                </div>

                {timeBlocks.length > 0 && (
                  <div className="max-h-40 overflow-y-auto bg-zinc-950/40 border border-zinc-800 rounded-xl p-3 text-white/90">
                    <div className="text-zinc-400 font-semibold mb-2">Task Preview</div>
                    <ol className="list-decimal list-inside space-y-2">
                      {timeBlocks.map((b, i) => (
                        <li key={i} className="flex items-center justify-between bg-zinc-900/70 px-3 py-2 rounded-lg text-sm">
                          <div className="flex items-center gap-2">
                            <span>{format(new Date(b.start), "HH:mm")}</span>
                            <ArrowRight className="w-4 h-4 text-zinc-500" />
                            <span>{format(new Date(b.end), "HH:mm")}</span>
                          </div>
                          <span className="text-zinc-400 font-mono">{b.length} min</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end space-x-3 px-6 py-4 border-t border-zinc-800 bg-zinc-900/50">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white transition">Cancel</button>
          <button type="submit" className="px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-700 text-white font-medium transition">Save Task</button>
        </div>
      </form>
    </div>
  );
}
