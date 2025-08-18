import React, { useState, useEffect, useMemo } from "react";
import { format, addMinutes, differenceInMinutes } from "date-fns";
import { X, ZapOff, Zap, AlertTriangle, ArrowRight } from "lucide-react";
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
    <div className="fixed inset-0 z-50 flex items-center backdrop-blur-sm justify-center px-4">
      <form
        onSubmit={handleSubmit}
        className="bg-black rounded-xl max-h-[85vh] w-full max-w-2xl flex flex-col shadow-2xl text-white border border-gray-800"
        role="dialog"
        aria-modal="true"
        aria-labelledby="new-task-modal-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
          {/* Title */}
          <h2
            id="new-task-modal-title"
            className="text-2xl font-semibold text-white"
          >
            New Task
          </h2>

          {/* Importance buttons */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setImportance(1)}
              title="Low"
              className={`p-2 rounded-full flex items-center justify-center transition-all
                ${importance === 1 ? "bg-sky-600 scale-110" : "bg-zinc-800 hover:bg-zinc-700"}`}
            >
              <ZapOff
                className={importance === 1 ? "text-white" : "text-sky-300"}
                size={18}
              />
            </button>
            <button
              type="button"
              onClick={() => setImportance(2)}
              title="Normal"
              className={`p-2 rounded-full flex items-center justify-center transition-all
                ${importance === 2 ? "bg-yellow-500 scale-110" : "bg-zinc-800 hover:bg-zinc-700"}`}
            >
              <Zap
                className={importance === 2 ? "text-white" : "text-yellow-300"}
                size={18}
              />
            </button>
            <button
              type="button"
              onClick={() => setImportance(3)}
              title="High"
              className={`p-2 rounded-full flex items-center justify-center transition-all
                ${importance === 3 ? "bg-red-500 scale-110" : "bg-zinc-800 hover:bg-zinc-700"}`}
            >
              <AlertTriangle
                className={importance === 3 ? "text-white" : "text-red-300"}
                size={18}
              />
            </button>
          </div>

          {/* Close button */}
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
            <label className="block text-sm text-stone-300 mb-1">Task Name</label>
            <input
              type="text"
              required
              maxLength={100}
              value={name}
              onChange={e => setName(e.target.value)}
              autoFocus
              className="w-full rounded-md bg-white/5 border border-white/10 p-2 text-white transition"
            />
          </div>

          {/* Date Range */}
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm text-stone-300 mb-1">Start</label>
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
                className="w-full rounded-md bg-white/5 border border-white/10 p-2 text-white transition"
                required
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm text-stone-300 mb-1">Due</label>
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
                className="w-full rounded-md bg-white/5 border border-white/10 p-2 text-white transition"
                required
              />
            </div>
          </div>

          {/* Task Length */}
          <div>
            <label className="block text-sm text-stone-300 mb-1">Task Length (minutes)</label>
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
              className="w-full rounded-md bg-white/5 border border-white/10 p-2 text-white focus:ring-2 transition"
              required
            />
          </div>

          {durationBetween !== null && (
            <p className="text-stone-400 text-sm">
              Available interval: {Math.floor(durationBetween / 60)}h {durationBetween % 60}m
            </p>
          )}

          {/* Description */}
          <div>
            <label className="block text-sm text-stone-300 mb-1">Description</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={3}
              className="w-full rounded-md bg-white/5 border border-white/10 p-2 text-white resize-y focus:ring-2 transition"
            />
          </div>

          {/* Links */}
          <div>
            <label className="block text-sm text-stone-300 mb-1">Links (comma separated)</label>
            <input
              type="text"
              value={links}
              onChange={e => setLinks(e.target.value)}
              placeholder="https://example.com, https://docs.com"
              className="w-full rounded-md bg-white/5 border border-white/10 p-2 text-white focus:ring-2 transition"
            />
          </div>

          {/* Importance */}
          

          {/* Attach Files */}
          <div>
            <div
              className="w-full h-24 rounded-xl border-2 border-dashed border-sky-700 flex items-center justify-center flex-col gap-2 bg-slate-900 cursor-pointer hover:border-sky-800 transition"
              onClick={() => document.getElementById('file-upload-input').click()}
              tabIndex={0}
              role="button"
              aria-label="Select files"
              onKeyDown={e => {
                if (e.key === " " || e.key === "Enter") document.getElementById('file-upload-input').click();
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="text-stone-300" width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 16v2a2 2 0 01-2 2H6a2 2 0 01-2-2V8a2 2 0 012-2h2M8 8V6m0 0a2 2 0 114 0v2m0 0H8"></path></svg>
              <span className="text-stone-200 text-sm">Drag or click to select files</span>
              <input
                type="file"
                id="file-upload-input"
                multiple
                style={{ display: "none" }}
                onChange={e => setFiles(e.target.files)}
                accept="*"
              />
            </div>
            {files && files.length > 0 && (
              <p className="mt-1 text-sm text-stone-300">
                {files.length} file{files.length > 1 ? "s" : ""} selected
              </p>
            )}
          </div>


          {/* Split Task Option */}
          <div className="space-y-4">
            {/* Split Toggle */}
            <div className="flex items-center justify-between bg-white/10 p-4 rounded-xl border border-white/20">
              <span className="text-stone-200 font-medium">Split task into blocks?</span>
              <input
                type="checkbox"
                checked={splitEnabled}
                onChange={(e) => setSplitEnabled(e.target.checked)}
                className="form-checkbox h-5 w-5 accent-cyan-500"
              />
            </div>

            {/* Split Options */}
            {splitEnabled && (
              <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-4">
                
                {/* Block Duration Input */}
                <div className="flex items-center gap-3">
                  <label className="text-stone-200 font-medium">Block Length (min):</label>
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
                    className="w-20 rounded-md bg-white/5 border border-white/10 p-2 text-white focus:ring-1 focus:ring-sky-400"
                  />
                </div>

                {/* Task Preview */}
                {timeBlocks.length > 0 && (
                  <div className="max-h-40 overflow-y-auto bg-white/5 border border-white/10 rounded-xl p-3 text-white/90">
                    <div className="text-stone-300 font-semibold mb-2">Task Preview:</div>
                    <ol className="list-decimal list-inside space-y-2">
                      {timeBlocks.map((b, i) => (
                        <li
                          key={i}
                          className="flex items-center justify-between bg-white/10 px-3 py-2 rounded-lg text-sm"
                        >
                          <div className="flex items-center gap-2">
                            <span>{format(new Date(b.start), "M/d/yy - HH:mm")}</span>
                            <ArrowRight className="w-4 h-4 text-stone-400" />
                            <span>{format(new Date(b.end), "M/d/yy - HH:mm")}</span>
                          </div>
                          <span className="text-stone-400 font-mono">{b.length} min</span>
                        </li>
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