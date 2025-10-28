import React from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function SessionExpiredModal({ isOpen, onFinish, onContinue }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="bg-stone-900 text-white rounded-2xl p-8 w-[90%] max-w-md shadow-xl"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
          >
            <h2 className="text-2xl font-bold mb-4">Session Ended</h2>
            <p className="mb-6 text-stone-300">
              Your focus session has ended. Would you like to continue working or finish?
            </p>
            <div className="flex justify-end gap-4">
              <button
                onClick={onFinish}
                className="bg-red-500 px-4 py-2 rounded text-white"
              >
                Finish
              </button>
              <button
                onClick={onContinue}
                className="bg-emerald-500 px-4 py-2 rounded text-white"
              >
                Continue (+5 min)
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
