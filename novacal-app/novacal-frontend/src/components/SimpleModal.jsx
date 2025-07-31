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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-opacity-70 p-4">
      <form
        onSubmit={handleSubmit}
        className="bg-zinc-900 rounded-lg p-6 max-w-lg w-full space-y-4 shadow-lg text-white border-1 border-gray-400 shadow-xl shadow-black"
        aria-modal="true"
        role="dialog"
        aria-labelledby="modal-title"
      >
        <div className="w-full flex items-center justify-between mt-3">
          <h2 id="modal-title" className="text-3xl font-bold text-gray-300">
            Add Task/Event
          </h2>
          <X className="text-white hover:text-red-400 duration-300 cursor-pointer" onClick={onClose} />
        </div>

        <label className="block">
          <span className="text-indigo-200">Task Name</span>
          <input
            type="text"
            required
            maxLength={100}
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 block w-full rounded-md bg-zinc-800 border border-zinc-700 p-2 text-white"
            autoFocus
          />
        </label>

        <label className="block">
          <span className="text-indigo-200">Description</span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="mt-1 block w-full rounded-md bg-zinc-800 border border-zinc-700 p-2 text-white resize-y"
            placeholder="Add a description (optional)"
          />
        </label>

        <label className="block">
          <span className="text-indigo-200">Links (comma separated URLs)</span>
          <input
            type="text"
            value={links}
            onChange={(e) => setLinks(e.target.value)}
            className="mt-1 block w-full rounded-md bg-zinc-800 border border-zinc-700 p-2 text-white"
            placeholder="https://example.com, https://docs.com"
          />
        </label>

        <label className="block">
          <input
            type="file"
            multiple
            onChange={handleFileChange}
            className="mt-1 block bg-orange-700 p-3 rounded-xl hover:bg-orange-600 duration-300 cursor-pointer"
          />
          {files && files.length > 0 && (
            <p className="mt-1 text-sm text-indigo-300">
              {files.length} file{files.length > 1 ? "s" : ""} selected
            </p>
          )}
        </label>

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
            className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 transition font-semibold cursor-pointer duration-300"
          >
            Save
          </button>
        </div>
      </form>
    </div>
  );
}

export default Modal;