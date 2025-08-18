import React, { useState, useEffect } from "react";
import { toLocalISOString } from "../utils/calendarUtils";
import { X } from "lucide-react";

function Modal({ isOpen, onClose, onSubmit, initialName, initialStart, initialEnd }) {
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

  const handleFileChange = (e) => {
    setFiles(e.target.files);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      name: name.trim(),
      description: description.trim(),
      links: links.trim(),
      files,
      start: toLocalISOString(initialStart), // Use local ISO string here
      end: toLocalISOString(initialEnd),
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <form
        onSubmit={handleSubmit}
        className="bg-black rounded-2xl max-h-[85vh] w-full max-w-2xl flex flex-col shadow-2xl text-white border border-gray-800"
        aria-modal="true"
        role="dialog"
        aria-labelledby="modal-title"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
          <h2 id="modal-title" className="text-2xl font-semibold text-white">
            Add Task/Event
          </h2>
          <X className="text-gray-400 hover:text-red-400 transition duration-300" onClick={onClose} />
        </div>

        <div className="p-6 flex-1 space-y-5">
          <label className="block">
            <span className="block text-sm text-indigo-300 mb-1">Task Name</span>
            <input
              type="text"
              required
              maxLength={100}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-md bg-white/5 border border-white/10 p-2 text-white focus:ring-2 focus:ring-violet-500 transition"
              autoFocus
            />
          </label>

          <label className="block">
            <span className="block text-sm text-indigo-300 mb-1">Description</span>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full rounded-md bg-white/5 border border-white/10 p-2 text-white focus:ring-2 focus:ring-violet-500 transition"
              placeholder="Add a description (optional)"
            />
          </label>

          <label className="block">
            <span className="block text-sm text-indigo-300 mb-1">Links (comma separated URLs)</span>
            <input
              type="text"
              value={links}
              onChange={(e) => setLinks(e.target.value)}
              className="w-full rounded-md bg-white/5 border border-white/10 p-2 text-white focus:ring-2 focus:ring-violet-500 transition"
              placeholder="https://example.com, https://docs.com"
            />
          </label>

          <label className="block">
            <input
              type="file"
              multiple
              onChange={handleFileChange}
              className="w-full cursor-pointer rounded-lg bg-violet-800 hover:bg-violet-900 text-white px-4 py-2 transition"
            />
            {files && files.length > 0 && (
              <p className="mt-1 text-sm text-indigo-300">
                {files.length} file{files.length > 1 ? "s" : ""} selected
              </p>
            )}
          </label>
        </div>
        

        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-transparent border-1 border-gray-200 hover:bg-zinc-600 transition cursor-pointer duration-300"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 rounded-xl bg-sky-700 hover:bg-sky-800 transition font-semibold cursor-pointer duration-300"
          >
            Save
          </button>
        </div>
      </form>
    </div>
  );
}

export default Modal;