import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Clock,
  Target,
  TrendingUp,
  Play,
  CheckCircle2,
  AlertCircle,
  Timer,
  Square,
  TrendingDown,
  Circle,
  Undo2,
} from "lucide-react";
import { format, isToday, startOfDay, endOfDay } from "date-fns";

// Local storage keys
const LS_TIME_KEY = "focusTimerTimeLeft";
const LS_RUNNING_KEY = "focusTimerIsRunning";
const LS_TASK_KEY = "focusTimerSelectedTask";
const LS_END_TS_KEY = "focusTimerEndTimestamp";

const API_BASE = "http://127.0.0.1:5000/api";
const INITIAL_TIME = 45 * 60; // 45 minutes in seconds

export default function Dashboard() {
  // Data & UI state
  const [timeLeft, setTimeLeft] = useState(INITIAL_TIME);
  const [isRunning, setIsRunning] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);

  const [tasks, setTasks] = useState([]);
  const [completedTasks, setCompletedTasks] = useState([]);
  const [focusSessions, setFocusSessions] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [activeTab, setActiveTab] = useState("sessions");
  const [undoingTask, setUndoingTask] = useState(null);
  const [animatingTask, setAnimatingTask] = useState(null);
  const [removingSession, setRemovingSession] = useState(null);

  // Timer refs
  const timerRef = useRef(null); // holds the interval id
  const endTsRef = useRef(null); // holds the end timestamp (ms) while running

  // Restore persisted state on mount
  useEffect(() => {
    try {
      const savedTime = localStorage.getItem(LS_TIME_KEY);
      const savedRunning = localStorage.getItem(LS_RUNNING_KEY);
      const savedTask = localStorage.getItem(LS_TASK_KEY);
      const savedEndTs = localStorage.getItem(LS_END_TS_KEY);

      if (savedTask) setSelectedTask(JSON.parse(savedTask));
      if (savedTime) setTimeLeft(parseInt(savedTime, 10));
      if (savedRunning === "true" && savedEndTs) {
        const parsedEnd = parseInt(savedEndTs, 10);
        // If end timestamp is still in the future, resume with computed timeLeft
        const remaining = Math.max(0, Math.ceil((parsedEnd - Date.now()) / 1000));
        if (remaining > 0) {
          endTsRef.current = parsedEnd;
          setTimeLeft(remaining);
          setIsRunning(true);
        } else {
          // expired while offline/in background
          localStorage.removeItem(LS_END_TS_KEY);
          localStorage.setItem(LS_RUNNING_KEY, "false");
          setTimeLeft(INITIAL_TIME);
          setIsRunning(false);
        }
      }
    } catch (e) {
      console.error("Error restoring timer state:", e);
    }
  }, []);

  // Persist timeLeft, isRunning, selectedTask, endTimestamp
  useEffect(() => {
    try {
      localStorage.setItem(LS_TIME_KEY, String(timeLeft));
      localStorage.setItem(LS_RUNNING_KEY, String(isRunning));
      if (selectedTask) localStorage.setItem(LS_TASK_KEY, JSON.stringify(selectedTask));
      else localStorage.removeItem(LS_TASK_KEY);

      if (endTsRef.current) localStorage.setItem(LS_END_TS_KEY, String(endTsRef.current));
      else localStorage.removeItem(LS_END_TS_KEY);
    } catch (e) {
      console.error("Failed to persist timer state:", e);
    }
  }, [timeLeft, isRunning, selectedTask]);

  // Robust timer: compute remaining from endTimestamp (Date.now()) each tick.
  useEffect(() => {
    // clear any existing interval to avoid duplicates
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (isRunning) {
      // ensure endTsRef is set (if starting from paused state)
      if (!endTsRef.current) {
        endTsRef.current = Date.now() + timeLeft * 1000;
        localStorage.setItem(LS_END_TS_KEY, String(endTsRef.current));
      }

      const tick = () => {
        const remaining = Math.max(0, Math.ceil((endTsRef.current - Date.now()) / 1000));
        setTimeLeft(remaining);
        if (remaining <= 0) {
          // stop & complete
          clearInterval(timerRef.current);
          timerRef.current = null;
          endTsRef.current = null;
          localStorage.removeItem(LS_END_TS_KEY);
          setIsRunning(false);
          // mark session complete (false => not marked completed by user)
          // call after state updates (no await required here)
          handleCompleteFocus(false);
        }
      };

      // update regularly (500ms gives snappy display without hogging CPU)
      timerRef.current = setInterval(tick, 500);
      // run immediate tick to avoid 1st-second lag
      tick();
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRunning]); // only re-run when isRunning changes

  // Fetch tasks/sessions/completed tasks (today)
  useEffect(() => {
    const controller = new AbortController();
    const signal = controller.signal;

    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        const [tasksRes, sessionsRes, completedRes] = await Promise.all([
          fetch(`${API_BASE}/tasks`, { signal }),
          fetch(`${API_BASE}/focus_sessions`, { signal }),
          fetch(`${API_BASE}/completed_tasks`, { signal }),
        ]);

        if (!tasksRes.ok) throw new Error(`Tasks HTTP ${tasksRes.status}`);
        if (!sessionsRes.ok) throw new Error(`Sessions HTTP ${sessionsRes.status}`);
        if (!completedRes.ok) throw new Error(`Completed Tasks HTTP ${completedRes.status}`);

        const tasksData = await tasksRes.json();
        const sessionsData = await sessionsRes.json();
        const completedData = await completedRes.json();

        const todayStart = startOfDay(new Date());
        const todayEnd = endOfDay(new Date());

        const todayTasks = (tasksData || [])
          .map(t => ({ ...t }))
          .filter(task => {
            const s = new Date(task.start);
            return s >= todayStart && s <= todayEnd;
          })
          .sort((a, b) => new Date(a.start) - new Date(b.start));

        const todaySessions = (sessionsData || []).filter(s => isToday(new Date(s.start_time)));
        const todayCompleted = (completedData || []).filter(c => isToday(new Date(c.completion_date)));

        // Filter out tasks already completed today
        const filteredTasks = todayTasks.filter(task => !todayCompleted.some(c => c.task_id === task.id));

        setTasks(filteredTasks);
        setFocusSessions(todaySessions);
        setCompletedTasks(todayCompleted);

        // If persisted selectedTask is not in today's tasks, clear it
        const savedTaskStr = localStorage.getItem(LS_TASK_KEY);
        if (savedTaskStr) {
          const parsed = JSON.parse(savedTaskStr);
          const found = filteredTasks.find(t => t.id === parsed.id);
          if (!found) {
            setSelectedTask(null);
            localStorage.removeItem(LS_TASK_KEY);
          } else {
            setSelectedTask(found);
          }
        }
      } catch (e) {
        if (e.name !== "AbortError") {
          console.error("Failed to fetch data:", e);
          setError("Failed to load data.");
        }
      } finally {
        setLoading(false);
      }
    }

    fetchData();
    return () => controller.abort();
  }, []);

  // ---- Actions ----
  const handleSelectTask = (task) => {
    setSelectedTask(task);
    localStorage.setItem(LS_TASK_KEY, JSON.stringify(task));
  };

  const handleStartFocus = () => {
    if (!selectedTask) return;
    // If starting from paused, set endTimestamp based on current timeLeft
    endTsRef.current = Date.now() + timeLeft * 1000;
    localStorage.setItem(LS_END_TS_KEY, String(endTsRef.current));
    setIsRunning(true);
  };

  const handlePause = () => {
    // on pause, compute current timeLeft and clear end timestamp
    if (endTsRef.current) {
      const remaining = Math.max(0, Math.ceil((endTsRef.current - Date.now()) / 1000));
      setTimeLeft(remaining);
      endTsRef.current = null;
      localStorage.removeItem(LS_END_TS_KEY);
    }
    setIsRunning(false);
  };

  const handleCompleteFocus = useCallback(
    async (isTaskCompleted) => {
      // Stop timer & clear persisted end timestamp right away
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      endTsRef.current = null;
      localStorage.removeItem(LS_END_TS_KEY);
      setIsRunning(false);

      const elapsedSeconds = INITIAL_TIME - timeLeft;
      const durationInMinutes = Math.max(0, Math.floor(elapsedSeconds / 60));

      if (!selectedTask) {
        setTimeLeft(INITIAL_TIME);
        return;
      }

      try {
        const res = await fetch(`${API_BASE}/focus_sessions`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            task_id: selectedTask.id,
            duration: durationInMinutes,
            task_completed: isTaskCompleted,
          }),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const newSession = await res.json();
        setFocusSessions(prev => [...prev, newSession]);

        if (isTaskCompleted) {
          // move to completed
          handleMoveToCompleted(selectedTask.id);
        }

        setSelectedTask(null);
        localStorage.removeItem(LS_TASK_KEY);
        setTimeLeft(INITIAL_TIME);
      } catch (e) {
        console.error("Failed to save focus session:", e);
        // still reset UI
        setSelectedTask(null);
        localStorage.removeItem(LS_TASK_KEY);
        setTimeLeft(INITIAL_TIME);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [timeLeft, selectedTask]
  );

  const handleMoveToCompleted = async (taskId) => {
    setAnimatingTask(taskId);
    setTimeout(async () => {
      const taskToMove = tasks.find(t => t.id === taskId);
      if (!taskToMove) {
        setAnimatingTask(null);
        return;
      }
      try {
        const res = await fetch(`${API_BASE}/completed_tasks`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ task_id: taskId, completion_date: new Date().toISOString() }),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const newCompleted = await res.json();
        setCompletedTasks(prev => [...prev, newCompleted]);
        setTasks(prev => prev.filter(t => t.id !== taskId));
        if (selectedTask?.id === taskId) {
          setSelectedTask(null);
          localStorage.removeItem(LS_TASK_KEY);
        }
      } catch (e) {
        console.error("Failed to move task to completed:", e);
      } finally {
        setAnimatingTask(null);
      }
    }, 500);
  };

  const handleUndoCompletion = async (completedTaskId) => {
    const completed = completedTasks.find(c => c.id === completedTaskId);
    if (!completed) return;
    setUndoingTask(completed.task_id);
    try {
      const res = await fetch(`${API_BASE}/completed_tasks/${completed.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      // fetch tasks to restore undone item (could optimize to GET single task endpoint)
      const allTasksRes = await fetch(`${API_BASE}/tasks`);
      if (!allTasksRes.ok) throw new Error(`HTTP ${allTasksRes.status}`);
      const allTasks = await allTasksRes.json();
      const undone = allTasks.find(t => t.id === completed.task_id);
      if (undone) {
        setTasks(prev => [...prev, undone].sort((a, b) => new Date(a.start) - new Date(b.start)));
        setCompletedTasks(prev => prev.filter(c => c.id !== completedTaskId));
      }
    } catch (e) {
      console.error("Failed to undo completion:", e);
    } finally {
      setUndoingTask(null);
    }
  };

  const handleRemoveSession = async (sessionId) => {
    setRemovingSession(sessionId);
    setTimeout(async () => {
      try {
        const res = await fetch(`${API_BASE}/focus_sessions/${sessionId}`, { method: "DELETE" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        setFocusSessions(prev => prev.filter(s => s.id !== sessionId));
      } catch (e) {
        console.error("Failed to remove session:", e);
      } finally {
        setRemovingSession(null);
      }
    }, 300);
  };

  // ---- Helpers & stats ----
  const formatTime = (secs) => {
    const minutes = Math.floor(secs / 60).toString().padStart(2, "0");
    const seconds = (secs % 60).toString().padStart(2, "0");
    return `${minutes}:${seconds}`;
  };

  const circumference = 2 * Math.PI * 54;
  const progress = ((INITIAL_TIME - timeLeft) / INITIAL_TIME) * circumference;
  const dashOffset = circumference - progress;

  const totalFocusedMinutesToday = focusSessions.reduce((acc, s) => {
    const dt = new Date(s.start_time);
    if (isToday(dt)) return acc + s.duration;
    return acc;
  }, 0);
  const totalHours = Math.floor(totalFocusedMinutesToday / 60);
  const totalMinutes = totalFocusedMinutesToday % 60;
  const totalHoursFormatted = `${totalHours}h ${totalMinutes}m`;

  const now = new Date();
  const weekAgo = new Date(now);
  weekAgo.setDate(now.getDate() - 6);

  const sessionsThisWeek = focusSessions.filter(s => {
    const dt = new Date(s.start_time);
    return dt >= weekAgo && dt <= now;
  }).length;

  const completedThisWeek = completedTasks.filter(c => {
    const dt = new Date(c.completion_date);
    return dt >= weekAgo && dt <= now;
  }).length;

  const tasksThisWeek = tasks.length + completedThisWeek > 0 ? tasks.length + completedThisWeek : 1;
  const completionPercent = Math.round((completedThisWeek / tasksThisWeek) * 100);

  // Simple Card component (kept visually similar to original)
  const Card = ({ icon: Icon, title, value, description, color }) => (
    <div className={`flex-1 min-w-0 p-6 bg-white/10 rounded-2xl shadow-lg backdrop-blur-md transition-transform hover:scale-[1.025] group relative overflow-hidden`}>
      <svg
        className={`absolute -top-5 -left-5 w-32 h-32 z-0 ${color} opacity-20 pointer-events-none select-none`}
        viewBox="0 0 100 100"
        fill="none"
      >
        <path d="M0 0 H100 A100 100 0 0 1 0 100 V0 Z" fill="currentColor" />
      </svg>
      <div className="flex items-center justify-between mb-4 relative z-10">
        <div className="flex items-center">
          <span className={`inline-flex items-center justify-center w-12 h-12 rounded-full ${color} bg-white/20 shadow-inner mr-3`}>
            <Icon className="w-6 h-6 text-white drop-shadow" />
          </span>
        </div>
        <TrendingUp className="w-5 h-5 text-green-400/80" aria-hidden />
      </div>
      <div className="relative z-10">
        <h3 className="text-base text-stone-200 font-semibold mb-1 tracking-tight">{title}</h3>
        <p className="text-4xl font-extrabold text-white mb-1">{value}</p>
        <p className="text-xs text-stone-400">{description}</p>
      </div>
    </div>
  );

  // ---- UI render ----
  return (
    <div className="min-h-screen dashboard-background p-6">
      <div className="max-w-7xl mx-auto backdrop-blur-sm rounded-lg shadow-lg border-2 border-white/20 p-6 h-full bg-transparent">
        <div className="mb-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-white">
                Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 18 ? 'Afternoon' : 'Evening'}
              </h1>
              <p className="text-stone-400 mt-2 text-lg">{format(new Date(), "EEEE, MMMM d, yyyy")}</p>
            </div>
            <div className="flex gap-3">
              <button className="flex items-center rounded-lg px-4 py-2 text-sm font-medium text-white transition-all duration-200 border-2 border-stone-600 hover:bg-white/10 hover:border-white/30 shadow-md">
                <Target className="w-4 h-4 mr-2" />
                Prioritize
              </button>
              <button
                className="flex items-center rounded-lg px-4 py-2 text-sm font-medium text-white transition duration-200 shadow-md bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700"
                onClick={handleStartFocus}
                disabled={!selectedTask}
              >
                <Timer className="w-4 h-4 mr-2" />
                Start Focus
              </button>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
            <Card icon={Clock} title="Total Focused Time" value={totalHoursFormatted} description="Today" color="text-sky-400" />
            <Card icon={Target} title="Focus Sessions" value={sessionsThisWeek} description="This week" color="text-purple-400" />
            <Card icon={CheckCircle2} title="Tasks Completed" value={`${completionPercent}%`} description="This week" color="text-emerald-400" />
          </div>
        </div>

        {/* Tasks & Timer Section */}
        <div className="grid lg:grid-cols-3 gap-8 mb-8">
          <div className="lg:col-span-2 space-y-8">
            <div className="flex-1 min-w-0 p-8 rounded-2xl shadow-lg backdrop-blur-md transition-transform group relative overflow-hidden bg-white/10 h-[450px]">
              <div className="flex justify-between items-center mb-8">
                <h2 className="flex items-center text-2xl font-semibold text-stone-900 dark:text-white">
                  <Clock className="mr-3 w-7 h-7 text-stone-700 dark:text-white" />
                  Today's Tasks
                </h2>
              </div>

              {loading ? (
                <div className="flex justify-center items-center h-40 text-stone-400">Loading tasks...</div>
              ) : error ? (
                <div className="flex justify-center items-center h-40 text-red-400">{error}</div>
              ) : tasks.length > 0 ? (
                <div className="h-[calc(450px-8rem)] overflow-y-auto pr-2 custom-scrollbar">
                  <ul className="space-y-2">
                    {tasks.map((task) => (
                      <li
                        key={task.id}
                        className={`flex items-center justify-between p-2 rounded-lg transition-all duration-300 cursor-pointer text-sm border-2
                          ${selectedTask?.id === task.id ? "bg-emerald-500/20 border-emerald-500/50" : "bg-transparent border-white/20 hover:bg-white/10"}
                          ${animatingTask === task.id ? "opacity-0 transform -translate-x-10 scale-95" : "opacity-100"}`}
                        onClick={() => handleSelectTask(task)}
                      >
                        <div className="flex-1 min-w-0 pr-4">
                          <p className="font-semibold text-white truncate text-sm">{task.name}</p>
                          <p className="text-xs text-stone-400">
                            {format(new Date(task.start), "p")} - {format(new Date(task.end), "p")}
                          </p>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMoveToCompleted(task.id);
                          }}
                          className="flex-shrink-0 p-2 text-white transition-transform duration-300"
                        >
                          {animatingTask === task.id ? (
                            <CheckCircle2 className="w-5 h-5 text-emerald-400 animate-pulse" />
                          ) : (
                            <Circle className="w-5 h-5 text-stone-400" />
                          )}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <div className="flex flex-col justify-center items-center py-20">
                  <div className="relative mb-6">
                    <span className="absolute inset-0 rounded-full animate-pulse bg-gradient-to-tr from-emerald-300/30 via-indigo-400/20 to-sky-300/40 blur-2xl"></span>
                    <span className="absolute inset-2 rounded-full bg-gradient-to-tr from-white/60 to-transparent shadow-inner"></span>
                    <span className="block w-20 h-20 border-4 border-stone-200 dark:border-stone-600 rounded-full bg-white/15 backdrop-blur-md" />
                    <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-gradient-to-br from-emerald-300 via-white to-sky-300 rounded-full opacity-40 blur-[2px]" />
                  </div>
                  <p className="text-lg font-medium text-stone-300 mb-4">No tasks scheduled for today</p>
                  <a href="/calendar">
                    <button className="mt-1 px-6 py-2 rounded-lg border border-stone-300 dark:border-stone-600 bg-white/90 dark:bg-stone-900/30 shadow-sm text-stone-900 dark:text-white font-semibold text-base transition hover:bg-white hover:dark:bg-stone-900/50">Plan Your Day</button>
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Focus Timer Section */}
          <div className="flex flex-col items-center p-8 bg-white/10 rounded-2xl shadow-lg backdrop-blur-md">
            <div className="flex items-center w-full mb-6">
              <Timer className="w-6 h-6 mr-3 text-stone-700 dark:text-white" />
              <h2 className="text-2xl font-semibold text-stone-900 dark:text-white">Focus Session</h2>
            </div>
            <div className="relative w-40 h-40 flex items-center justify-center mx-auto mb-6">
              <svg className="w-full h-full" viewBox="0 0 120 120">
                {/* Background ring */}
                <circle cx="60" cy="60" r="54" fill="none" stroke="#e5e7eb" strokeWidth="10" />
                {/* Progress ring */}
                <circle
                  cx="60"
                  cy="60"
                  r="54"
                  fill="none"
                  stroke="#14b789"
                  strokeWidth="10"
                  strokeDasharray={circumference}
                  strokeDashoffset={dashOffset}
                  strokeLinecap="round"
                  style={{ transition: "stroke-dashoffset 0.3s linear" }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span
                  className="text-3xl font-extrabold text-stone-900 dark:text-white"
                  aria-live="polite"
                  aria-atomic="true"
                >
                  {formatTime(timeLeft)}
                </span>
              </div>
            </div>
            <div className="mb-3 text-center">
              <div className="text-lg font-semibold text-stone-700 dark:text-white">{selectedTask ? selectedTask.name : "Focus Time"}</div>
              <div className="text-sm text-stone-500 dark:text-stone-300">{selectedTask ? "45 minutes of deep work" : "Select a task to begin"}</div>
            </div>
            <div className="flex justify-center gap-4 mt-2 mb-3">
              {!isRunning && timeLeft === INITIAL_TIME ? (
                <button
                  onClick={handleStartFocus}
                  className="bg-emerald-500 hover:bg-emerald-600 text-white p-4 rounded-lg shadow-md focus:outline-none"
                  aria-label="Start timer"
                  disabled={!selectedTask}
                >
                  <Play className="w-6 h-6" />
                </button>
              ) : isRunning ? (
                <button
                  onClick={handlePause}
                  className="bg-yellow-500 hover:bg-yellow-600 text-white p-4 rounded-lg shadow-md focus:outline-none"
                  aria-label="Pause timer"
                >
                  <Square className="w-6 h-6" />
                </button>
              ) : (
                <>
                  <button
                    onClick={() => {
                      // resume by setting endTsRef and setting isRunning true
                      endTsRef.current = Date.now() + timeLeft * 1000;
                      localStorage.setItem(LS_END_TS_KEY, String(endTsRef.current));
                      setIsRunning(true);
                    }}
                    className="bg-emerald-500 hover:bg-emerald-600 text-white p-4 rounded-lg shadow-md focus:outline-none"
                    aria-label="Resume timer"
                  >
                    <Play className="w-6 h-6" />
                  </button>
                  <button
                    onClick={() => handleCompleteFocus(false)}
                    className="bg-white border border-stone-300 dark:bg-stone-900/30 dark:border-stone-600 text-stone-600 dark:text-white p-4 rounded-lg shadow-md focus:outline-none"
                    aria-label="End session without completion"
                  >
                    <AlertCircle className="w-6 h-6" />
                  </button>
                  <button
                    onClick={() => handleCompleteFocus(true)}
                    className="bg-white border border-stone-300 dark:bg-stone-900/30 dark:border-stone-600 text-stone-600 dark:text-white p-4 rounded-lg shadow-md focus:outline-none"
                    aria-label="Complete task"
                  >
                    <CheckCircle2 className="w-6 h-6" />
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Productivity Section */}
        <div className="max-w-7xl mx-auto backdrop-blur-sm rounded-lg shadow-lg p-6 h-full border-2 border-white/20 bg-transparent">
          <div className="flex items-center text-white font-semibold text-2xl mb-4">
            <TrendingUp className="mr-3 text-green-400" /> Today's Productivity
          </div>

          <div className="flex border-b border-stone-600 mb-4">
            <button
              className={`py-2 px-4 rounded-t-lg transition-colors text-sm font-medium ${
                activeTab === "sessions" ? "bg-white/10 text-white border-b-2 border-emerald-500" : "text-stone-400 hover:text-white"
              }`}
              onClick={() => setActiveTab("sessions")}
            >
              Focus Sessions ({focusSessions.length})
            </button>
            <button
              className={`py-2 px-4 rounded-t-lg transition-colors text-sm font-medium ${
                activeTab === "completed" ? "bg-white/10 text-white border-b-2 border-emerald-500" : "text-stone-400 hover:text-white"
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
                          removingSession === session.id ? "opacity-0 transform -translate-x-10 scale-95" : "opacity-100"
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
                            <p className="font-semibold text-white truncate text-sm">{session.task_name}</p>
                            <p className="text-xs text-stone-400">
                              {session.duration} minutes of focus at {format(new Date(session.start_time), "p")}
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
                    <p className="text-lg font-medium text-stone-300 mb-4">No focus sessions yet today</p>
                    <p className="text-md font-medium text-stone-500 dark:text-stone-400 mb-4">Start a Pomodoro to see your productivity patterns</p>
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
                          undoingTask === task.task_id ? "opacity-0 transform translate-x-10 scale-95" : "opacity-100"
                        }`}
                      >
                        <div className="flex items-center">
                          <span className="text-lg mr-2">
                            <CheckCircle2 className="text-emerald-400 w-4 h-4" />
                          </span>
                          <div>
                            <p className="font-semibold text-white truncate text-sm">{task.task_name}</p>
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
                    <p className="text-lg font-medium text-stone-300 mb-4">No tasks finished yet today</p>
                    <p className="text-md font-medium text-stone-500 dark:text-stone-400 mb-4">Check off a task to see it here!</p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

