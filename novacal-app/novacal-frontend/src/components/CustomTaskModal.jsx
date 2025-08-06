import React, { useState, useEffect, useMemo } from "react";
import { format, addMinutes, differenceInMinutes } from "date-fns";
import { X, ZapOff, Zap, AlertTriangle } from "lucide-react"; // Assuming you're using lucide-react icons
import { roundToNearest15 } from "../utils/calendarUtils";
// Main component for creating a custom task modal


export default function CreateTaskModal({ isOpen, onClose, onSubmit }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [links, setLinks] = useState("");
  const [files, setFiles] = useState(null);
  const [start, setStart] = useState(() => format(new Date(), "yyyy-MM-dd'T'HH:mm"));
  const [due, setDue] = useState(() => format(addMinutes(new Date(), 720), "yyyy-MM-dd'T'HH:mm")); // 12hr later
  const [length, setLength] = useState(60); // min
  const [importance, setImportance] = useState(2);

  // Split block state
  const [splitEnabled, setSplitEnabled] = useState(false);
  const [blockDuration, setBlockDuration] = useState(30); // Minutes

  useEffect(() => {
    if (isOpen) {
      const nowRounded = roundToNearest15(new Date());
      const due = roundToNearest15(addMinutes(nowRounded, 24 * 60));
      setStart(format(nowRounded, "yyyy-MM-dd'T'HH:mm"));
      setDue(format(due, "yyyy-MM-dd'T'HH:mm"));
      setName("");
      setDescription("");
      setLinks("");
      setFiles(null);
      setLength(60);
      setImportance(2);
      setSplitEnabled(false);
      setBlockDuration(30);
    }
  }, [isOpen]);


  // Split preview: breaks up the length (not interval from start to due!)
  const timeBlocks = useMemo(() => {
    const blocks = [];
    if (!splitEnabled || length < 1) return blocks;
    try {
      // Compute blocks, starting at `start`
      let total = Number(length);
      let cursor = roundToNearest15(new Date(start));
      let count = 0;
      while (total > 0 && count < 100) {
        let min = Math.min(blockDuration, total);
        let blockEnd = addMinutes(cursor, min);
        blocks.push({
          start: format(cursor, "yyyy-MM-dd'T'HH:mm:ss"), // Use ISO string for backend
          end: format(blockEnd, "yyyy-MM-dd'T'HH:mm:ss"), // Use ISO string for backend
          length: min
        });
        cursor = blockEnd;
        total -= min;
        count++;
      }
    } catch { /* empty for now */}
    return blocks;
  }, [splitEnabled, start, length, blockDuration]);

  // Duration between start & due (display only)
  const startDate = new Date(start);
  const dueDate = new Date(due);
  const durationBetween = isNaN(dueDate - startDate) || dueDate < startDate ? null :
    differenceInMinutes(dueDate, startDate);

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
    // Do not send to backend. Instead, invoke onSubmit with all our info (including preview blocks).
    onSubmit({
      name: name.trim(),
      description: description.trim(),
      links: links.trim(),
      files,
      start, // Pass the ISO string directly
      due,   // Pass the ISO string directly
      length: Number(length),
      importance,
      splitEnabled, // Pass splitEnabled status
      blockDuration: Number(blockDuration), // Pass block duration
      blocks: timeBlocks, // The array of generated blocks for the custom task
    });
    onClose();
  };

  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <form
        onSubmit={handleSubmit}
        className="bg-neutral-900 rounded-2xl max-h-[85vh] w-full max-w-2xl flex flex-col shadow-2xl text-white border border-white/10"
        role="dialog"
        aria-modal="true"
        aria-labelledby="new-task-modal-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <h2 id="new-task-modal-title" className="text-2xl font-semibold text-white tracking-tight">
            New Task
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-red-400 transition duration-300"
            title="Close"
          >
            <X size={22} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto p-6 flex-1 space-y-5 calendar-scrollbar">
          {/* Task Name */}
          <div>
            <label className="block text-sm text-indigo-300 mb-1">Task Name*</label>
            <input
              type="text"
              required
              maxLength={100}
              value={name}
              onChange={e => setName(e.target.value)}
              autoFocus
              className="w-full rounded-md bg-white/5 border border-white/10 p-2 text-white focus:ring-2 focus:ring-violet-500 transition"
            />
          </div>

          {/* Date Range */}
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm text-indigo-300 mb-1">Start</label>
              <input
                type="datetime-local"
                value={start}
                onChange={e => setStart(e.target.value)}
                onBlur={e => {
                  const picked = new Date(e.target.value);
                  if (!isNaN(picked.getTime())) {
                    const rounded = roundToNearest15(picked);
                    setStart(format(rounded, "yyyy-MM-dd'T'HH:mm"));
                  }
                }}
                className="w-full rounded-md bg-white/5 border border-white/10 p-2 text-white focus:ring-2 focus:ring-violet-500 transition"
                required
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm text-indigo-300 mb-1">Due</label>
              <input
                type="datetime-local"
                value={due}
                onChange={e => setDue(e.target.value)}
                onBlur={e => {
                  const picked = new Date(e.target.value);
                  if (!isNaN(picked.getTime())) {
                    const rounded = roundToNearest15(picked);
                    setDue(format(rounded, "yyyy-MM-dd'T'HH:mm"));
                  }
                }}
                className="w-full rounded-md bg-white/5 border border-white/10 p-2 text-white focus:ring-2 focus:ring-violet-500 transition"
                required
              />
            </div>
          </div>

          {/* Task Length */}
          <div>
            <label className="block text-sm text-indigo-300 mb-1">Task Length (minutes)*</label>
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
              className="w-full rounded-md bg-white/5 border border-white/10 p-2 text-white focus:ring-2 focus:ring-violet-500 transition"
              required
            />
          </div>

          {durationBetween !== null && (
            <p className="text-indigo-400 text-sm">
              Available interval: {Math.floor(durationBetween / 60)}h {durationBetween % 60}m
            </p>
          )}

          {/* Description */}
          <div>
            <label className="block text-sm text-indigo-300 mb-1">Description</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={3}
              className="w-full rounded-md bg-white/5 border border-white/10 p-2 text-white resize-y focus:ring-2 focus:ring-violet-500 transition"
            />
          </div>

          {/* Links */}
          <div>
            <label className="block text-sm text-indigo-300 mb-1">Links (comma separated)</label>
            <input
              type="text"
              value={links}
              onChange={e => setLinks(e.target.value)}
              placeholder="https://example.com, https://docs.com"
              className="w-full rounded-md bg-white/5 border border-white/10 p-2 text-white focus:ring-2 focus:ring-violet-500 transition"
            />
          </div>

          {/* Importance */}
          <div>
            <label className="block text-sm text-indigo-300 mb-2">Importance</label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setImportance(1)}
                title="Low"
                className={`p-2 rounded-full flex items-center justify-center transition-all
                  ${importance === 1 ? "bg-sky-600 scale-110" : "bg-zinc-800 hover:bg-zinc-700"}`}
              >
                <ZapOff className={importance === 1 ? "text-white" : "text-sky-300"} size={18} />
              </button>
              <button
                type="button"
                onClick={() => setImportance(2)}
                title="Normal"
                className={`p-2 rounded-full flex items-center justify-center transition-all
                  ${importance === 2 ? "bg-yellow-500 scale-110" : "bg-zinc-800 hover:bg-zinc-700"}`}
              >
                <Zap className={importance === 2 ? "text-white" : "text-yellow-300"} size={18} />
              </button>
              <button
                type="button"
                onClick={() => setImportance(3)}
                title="High"
                className={`p-2 rounded-full flex items-center justify-center transition-all
                  ${importance === 3 ? "bg-red-500 scale-110" : "bg-zinc-800 hover:bg-zinc-700"}`}
              >
                <AlertTriangle className={importance === 3 ? "text-white" : "text-red-300"} size={18} />
              </button>
            </div>
          </div>

          {/* Attach Files */}
          <div>
            <label className="block text-sm text-indigo-300 mb-1">Attach Files</label>
            <input
              type="file"
              multiple
              onChange={e => setFiles(e.target.files)}
              className="w-full cursor-pointer rounded-lg bg-sky-700 hover:bg-sky-600 text-white px-4 py-2 transition"
            />
            {files && files.length > 0 && (
              <p className="mt-1 text-sm text-indigo-300">{files.length} file{files.length > 1 ? "s" : ""} selected</p>
            )}
          </div>

          {/* Split Task Option */}
          <div className="space-y-2">
            <label className="flex gap-2 items-center text-indigo-200">
              <input
                type="checkbox"
                checked={splitEnabled}
                onChange={e => setSplitEnabled(e.target.checked)}
                className="form-checkbox accent-indigo-500"
              />
              Split task into blocks?
            </label>
            {splitEnabled && (
              <div className="pl-6 space-y-2">
                <label className="text-sm text-indigo-200">
                  Block Length (min):
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
                    className="ml-2 w-20 rounded-md bg-white/5 border border-white/10 p-1 text-white"
                  />
                </label>
                {timeBlocks.length > 0 && (
                  <div className="max-h-32 overflow-y-auto border border-white/10 px-3 py-2 rounded text-sm text-white/90 bg-white/5">
                    <div className="mb-2 text-indigo-300 font-medium">Task preview:</div>
                    <ol className="list-decimal list-inside space-y-1">
                      {timeBlocks.map((b, i) => (
                        <li key={i}>{b.start} — {b.end} <span className="text-indigo-400">[{b.length} min]</span></li>
                      ))}
                    </ol>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-4 px-6 py-4 border-t border-white/10">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-zinc-700 text-white hover:bg-zinc-600 transition duration-300 cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-semibold transition duration-300 cursor-pointer"
          >
            Save
          </button>
        </div>
      </form>
    </div>
  );
}