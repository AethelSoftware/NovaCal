import React from "react";
import {
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  TrendingDown,
  Undo2,
} from "lucide-react";
import { format, isToday } from "date-fns";

export default function ProductivitySection({
  activeTab,
  setActiveTab,
  focusSessions,
  completedTasks,
  handleRemoveSession,
  handleUndoCompletion,
  removingSession,
  undoingTask,
}) {
  return (
    <div className="max-w-7xl mx-auto backdrop-blur-sm rounded-lg shadow-lg p-6 h-full border-2 border-white/20 bg-transparent">
      <div className="flex items-center text-white font-semibold text-2xl mb-4">
        <TrendingUp className="mr-3 text-green-400" /> Today's Productivity
      </div>

      <div className="flex border-b border-stone-600 mb-4">
        <button
          className={`py-2 px-4 rounded-t-lg transition-colors text-sm font-medium ${
            activeTab === "sessions"
              ? "bg-white/10 text-white border-b-2 border-emerald-500"
              : "text-stone-400 hover:text-white"
          }`}
          onClick={() => setActiveTab("sessions")}
        >
          Focus Sessions ({focusSessions.length})
        </button>
        <button
          className={`py-2 px-4 rounded-t-lg transition-colors text-sm font-medium ${
            activeTab === "completed"
              ? "bg-white/10 text-white border-b-2 border-emerald-500"
              : "text-stone-400 hover:text-white"
          }`}
          onClick={() => setActiveTab("completed")}
        >
          Completed Tasks ({completedTasks.length})
        </button>
      </div>

      <div className="h-[calc(400px)] overflow-y-auto pr-2 custom-scrollbar">
        {activeTab === "sessions" && (
          <>
            {focusSessions.length > 0 ? (
              <div className="space-y-2">
                {focusSessions.map((session, index) => (
                  <div
                    key={index}
                    className={`flex items-center justify-between p-2 rounded-lg bg-white/5 transition-all duration-300 ${
                      removingSession === session.id
                        ? "opacity-0 transform -translate-x-10 scale-95"
                        : "opacity-100"
                    }`}
                  >
                    <div className="flex-1 min-w-0 pr-4 flex items-center">
                      <span className="text-lg mr-2">
                        {session.task_completed ? (
                          <CheckCircle2 className="text-emerald-400 w-4 h-4" />
                        ) : (
                          <AlertCircle className="text-yellow-400 w-4 h-4" />
                        )}
                      </span>
                      <div>
                        <p className="font-semibold text-white truncate text-sm">
                          {session.task_name}
                        </p>
                        <p className="text-xs text-stone-400">
                          {session.duration} minutes of focus at{" "}
                          {format(new Date(session.start_time), "p")}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveSession(session.id)}
                      className="flex-shrink-0 p-2 text-stone-400 hover:text-white transition-colors"
                      aria-label="Remove session"
                    >
                      <TrendingDown className="w-5 h-5" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col justify-center items-center py-20">
                <div className="relative mb-6">
                  <TrendingUp className="text-gray-400 w-20 h-20" />
                </div>
                <p className="text-lg font-medium text-stone-300 mb-4">
                  No focus sessions yet today
                </p>
                <p className="text-md font-medium text-stone-500 dark:text-stone-400 mb-4">
                  Start a Pomodoro to see your productivity patterns
                </p>
              </div>
            )}
          </>
        )}

        {activeTab === "completed" && (
          <>
            {completedTasks.length > 0 ? (
              <div className="space-y-2">
                {completedTasks.map((task, index) => (
                  <div
                    key={index}
                    className={`flex items-center justify-between p-2 rounded-lg bg-white/5 transition-colors duration-300 ${
                      undoingTask === task.task_id
                        ? "opacity-0 transform translate-x-10 scale-95"
                        : "opacity-100"
                    }`}
                  >
                    <div className="flex items-center">
                      <span className="text-lg mr-2">
                        <CheckCircle2 className="text-emerald-400 w-4 h-4" />
                      </span>
                      <div>
                        <p className="font-semibold text-white truncate text-sm">
                          {task.task_name}
                        </p>
                        <p className="text-xs text-stone-400">
                          Completed at {format(new Date(task.completion_date), "p")}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleUndoCompletion(task.id)}
                      className="flex-shrink-0 p-2 text-stone-400 hover:text-white transition-colors"
                    >
                      <Undo2 className="w-5 h-5" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col justify-center items-center py-20">
                <div className="relative mb-6">
                  <CheckCircle2 className="text-gray-400 w-20 h-20" />
                </div>
                <p className="text-lg font-medium text-stone-300 mb-4">
                  No tasks finished yet today
                </p>
                <p className="text-md font-medium text-stone-500 dark:text-stone-400 mb-4">
                  Check off a task to see it here!
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
