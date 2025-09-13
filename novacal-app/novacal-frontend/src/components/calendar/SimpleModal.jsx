import React, { useState, useEffect } from "react";
import { toLocalISOString } from "../../utils/calendarUtils";
import { X } from "lucide-react";

export default function Modal({
  isOpen,
  onClose,
  onSubmit,
  initialName,
  initialStart,
  initialEnd,
}) {
  const [name, setName] = useState(initialName || "");
  const [description, setDescription] = useState("");
  const [links, setLinks] = useState("");
  const [files, setFiles] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setName(initialName || "");
      setDescription("");
      setLinks("");
      setFiles(null);
    }
  }, [isOpen, initialName]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      alert("Task name is required.");
      return;
    }
    onSubmit({
      name: name.trim(),
      description: description.trim(),
      links: links.trim(),
      files,
      start: toLocalISOString(initialStart),
      end: toLocalISOString(initialEnd),
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
        aria-labelledby="modal-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-900/50">
          <h2 id="modal-title" className="text-xl font-semibold tracking-tight">
            Add Task/Event
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-zinc-400 hover:text-red-400 transition"
            title="Close"
          >
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

          {/* Description */}
          <div>
            <label className="block text-sm text-zinc-400 mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Add a description (optional)"
              className="w-full rounded-lg bg-zinc-900 border border-zinc-700 p-2 text-white focus:outline-none focus:ring-1 focus:ring-zinc-500"
            />
          </div>

          {/* Links */}
          <div>
            <label className="block text-sm text-zinc-400 mb-1">
              Links (comma separated)
            </label>
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
              onClick={() =>
                document.getElementById("modal-file-upload").click()
              }
              tabIndex={0}
              role="button"
              aria-label="Select files"
              onKeyDown={(e) => {
                if (e.key === " " || e.key === "Enter")
                  document.getElementById("modal-file-upload").click();
              }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="text-zinc-400"
                width="28"
                height="28"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 16v2a2 2 0 01-2 2H6a2 2 0 01-2-2V8a2 2 0 012-2h2M8 8V6m0 0a2 2 0 114 0v2m0 0H8"
                ></path>
              </svg>
              <span className="text-zinc-400 text-sm">
                Drag or click to select files
              </span>
              <input
                type="file"
                id="modal-file-upload"
                multiple
                style={{ display: "none" }}
                onChange={(e) => setFiles(e.target.files)}
                accept="*"
              />
            </div>
            {files && files.length > 0 && (
              <p className="mt-1 text-sm text-zinc-400">
                {files.length} file{files.length > 1 ? "s" : ""} selected
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end space-x-3 px-6 py-4 border-t border-zinc-800 bg-zinc-900/50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-700 text-white font-medium transition"
          >
            Save Task
          </button>
        </div>
      </form>
    </div>
  );
}
