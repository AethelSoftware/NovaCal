import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Clock,
  Target,
  Play,
  CheckCircle2,
  AlertCircle,
  Timer,
  Square,
  Circle,
  Settings,
} from "lucide-react";
import { format, isToday, startOfDay, endOfDay } from "date-fns";
import Card from "./components/dashboard/DashboardCard";
import ProgressRings from "./components/dashboard/ProgressRings";
import ProductivitySection from "./components/dashboard/TodayProductivity";
import SessionExpiredModal from "./components/dashboard/SessionExpired";

const LS_TIME_KEY = "focusTimerTimeLeft";
const LS_RUNNING_KEY = "focusTimerIsRunning";
const LS_TASK_KEY = "focusTimerSelectedTask";
const LS_END_TS_KEY = "focusTimerEndTimestamp";
const LS_DURATION_KEY = "focusTimerDuration";
const LS_MODE_KEY = "focusTimerMode";
const LS_STOPWATCH_START_TS_KEY = "focusTimerStopwatchStart";
const DEFAULT_DURATION_MIN = 45;
const DEFAULT_DURATION_SECONDS = DEFAULT_DURATION_MIN * 60;
const API_BASE = "http://127.0.0.1:5000/api";

export default function Dashboard() {
  const [mode, setMode] = useState("timer");
  const [showSettings, setShowSettings] = useState(false);
  const [sessionDuration, setSessionDuration] = useState(DEFAULT_DURATION_SECONDS);
  const [activeSessionDuration, setActiveSessionDuration] = useState(sessionDuration);

  // Timer state
  const [timeLeft, setTimeLeft] = useState(sessionDuration);
  const [stopwatchElapsed, setStopwatchElapsed] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);

  // Data lists
  const [tasks, setTasks] = useState([]);
  const [completedTasks, setCompletedTasks] = useState([]);
  const [focusSessions, setFocusSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("sessions");
  const [undoingTask, setUndoingTask] = useState(null);
  const [animatingTask, setAnimatingTask] = useState(null);
  const [removingSession, setRemovingSession] = useState(null);

  const [tempMinutes, setTempMinutes] = useState(DEFAULT_DURATION_MIN);

  const [sessionExpired, setSessionExpired] = useState(false);
  const [elapsedBeforeExpire, setElapsedBeforeExpire] = useState(0);


  const timerRef = useRef(null);
  const endTsRef = useRef(null);
  const stopwatchStartTsRef = useRef(null);

  useEffect(() => {
    try {
      const savedTime = localStorage.getItem(LS_TIME_KEY);
      const savedRunning = localStorage.getItem(LS_RUNNING_KEY);
      const savedTask = localStorage.getItem(LS_TASK_KEY);
      const savedEndTs = localStorage.getItem(LS_END_TS_KEY);
      const savedDuration = localStorage.getItem(LS_DURATION_KEY);
      const savedMode = localStorage.getItem(LS_MODE_KEY);
      const savedStopwatchStart = localStorage.getItem(LS_STOPWATCH_START_TS_KEY);

      if (savedMode === "stopwatch") {
        setMode("stopwatch");
      
        // When in stopwatch mode
        if (savedRunning === "true" && savedStopwatchStart) {
          const parsedStart = parseInt(savedStopwatchStart, 10);
          if (!Number.isNaN(parsedStart)) {
            stopwatchStartTsRef.current = parsedStart;
            setIsRunning(true);
            setStopwatchElapsed(Math.max(0, Math.floor((Date.now() - parsedStart) / 1000)));
          }
        } else {
          setIsRunning(false);
          setStopwatchElapsed(0);
        }
      } else {
        // default: timer logic
        let dur = DEFAULT_DURATION_SECONDS;
        if (savedDuration) {
          const parsedDur = parseInt(savedDuration, 10);
          if (!Number.isNaN(parsedDur) && parsedDur > 0) {
            dur = parsedDur;
          }
        }
        setSessionDuration(dur);
        setTempMinutes(Math.max(1, Math.round(dur / 60)));
      
        if (savedTask) setSelectedTask(JSON.parse(savedTask));
        if (savedTime) setTimeLeft(parseInt(savedTime, 10));
        else setTimeLeft(dur);
      
        if (savedRunning === "true" && savedEndTs) {
          const parsedEnd = parseInt(savedEndTs, 10);
          const remaining = Math.max(0, Math.ceil((parsedEnd - Date.now()) / 1000));
          if (remaining > 0) {
            endTsRef.current = parsedEnd;
            setTimeLeft(remaining);
            setIsRunning(true);
            setMode("timer");
          } else {
            localStorage.removeItem(LS_END_TS_KEY);
            localStorage.setItem(LS_RUNNING_KEY, "false");
            setTimeLeft(dur);
            setIsRunning(false);
          }
        }
      }
      
      // Select task after mode, for SSR safety
      if (savedTask) setSelectedTask(JSON.parse(savedTask));
      
    } catch (e) {
      console.error("Error restoring timer state:", e);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(LS_TIME_KEY, String(timeLeft));
      localStorage.setItem(LS_RUNNING_KEY, String(isRunning));
      if (selectedTask) localStorage.setItem(LS_TASK_KEY, JSON.stringify(selectedTask));
      else localStorage.removeItem(LS_TASK_KEY);

      if (endTsRef.current) localStorage.setItem(LS_END_TS_KEY, String(endTsRef.current));
      else localStorage.removeItem(LS_END_TS_KEY);

      localStorage.setItem(LS_DURATION_KEY, String(sessionDuration));
      localStorage.setItem(LS_MODE_KEY, mode);

      if (stopwatchStartTsRef.current) localStorage.setItem(LS_STOPWATCH_START_TS_KEY, String(stopwatchStartTsRef.current));
      else localStorage.removeItem(LS_STOPWATCH_START_TS_KEY);
    } catch (e) {
      console.error("Failed to persist timer state:", e);
    }
  }, [timeLeft, isRunning, selectedTask, sessionDuration, mode, stopwatchStartTsRef.current]);

  useEffect(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  
    if (isRunning) {
      if (mode === "timer") {
        if (!endTsRef.current) {
          endTsRef.current = Date.now() + timeLeft * 1000;
          localStorage.setItem(LS_END_TS_KEY, String(endTsRef.current));
        }
  
        const tick = () => {
          const remaining = Math.max(0, Math.ceil((endTsRef.current - Date.now()) / 1000));
          setTimeLeft(remaining);
  
          if (remaining <= 0) {
            clearInterval(timerRef.current);
            timerRef.current = null;
  
            // Session expired instead of immediate completion
            const elapsed = activeSessionDuration; 
            setElapsedBeforeExpire(elapsed); 
            setTimeLeft(0);
            setIsRunning(false);
            setSessionExpired(true);
  
            // Optional browser notification
            if ("Notification" in window && Notification.permission === "granted") {
              new Notification("Focus session ended!", {
                body: "Your focus session has ended. Come back to finish or continue working.",
              });
            }
          }
        };
  
        timerRef.current = setInterval(tick, 500);
        tick();
      } else {
        // Stopwatch mode
        if (!stopwatchStartTsRef.current) {
          stopwatchStartTsRef.current = Date.now() - stopwatchElapsed * 1000;
          localStorage.setItem(LS_STOPWATCH_START_TS_KEY, String(stopwatchStartTsRef.current));
        }
  
        const tick = () => {
          const elapsed = Math.max(0, Math.floor((Date.now() - stopwatchStartTsRef.current) / 1000));
          setStopwatchElapsed(elapsed);
        };
  
        timerRef.current = setInterval(tick, 500);
        tick();
      }
    }
  
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isRunning, mode]);
  

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
          .map((t) => ({ ...t }))
          .filter((task) => {
            const s = new Date(task.start);
            return s >= todayStart && s <= todayEnd;
          })
          .sort((a, b) => new Date(a.start) - new Date(b.start));

        const todaySessions = (sessionsData || []).filter((s) => isToday(new Date(s.start_time)));
        const todayCompleted = (completedData || []).filter((c) => isToday(new Date(c.completion_date)));

        const filteredTasks = todayTasks.filter((task) => !todayCompleted.some((c) => c.task_id === task.id));

        setTasks(filteredTasks);
        setFocusSessions(todaySessions);
        setCompletedTasks(todayCompleted);

        const savedTaskStr = localStorage.getItem(LS_TASK_KEY);
        if (savedTaskStr) {
          const parsed = JSON.parse(savedTaskStr);
          const found = filteredTasks.find((t) => t.id === parsed.id);
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

  useEffect(() => {
    if ("Notification" in window && Notification.permission !== "granted") {
      Notification.requestPermission();
    }
  }, []);
  

  const handleSelectTask = (task) => {
    setSelectedTask(task);
    localStorage.setItem(LS_TASK_KEY, JSON.stringify(task));
  };

  const handleStartFocus = () => {
    setActiveSessionDuration(sessionDuration); // <-- Only here, not in resume
    if (!selectedTask) return;
    if (mode === "timer") {
      endTsRef.current = Date.now() + timeLeft * 1000;
      localStorage.setItem(LS_END_TS_KEY, String(endTsRef.current));
      setIsRunning(true);
    } else {
      stopwatchStartTsRef.current = Date.now() - stopwatchElapsed * 1000;
      localStorage.setItem(LS_STOPWATCH_START_TS_KEY, String(stopwatchStartTsRef.current));
      setIsRunning(true);
    }
  };

  const resume = () => {
    // Don't change activeSessionDuration here!
    if (mode === "timer") {
      endTsRef.current = Date.now() + timeLeft * 1000;
      localStorage.setItem(LS_END_TS_KEY, String(endTsRef.current));
      setIsRunning(true);
    } else {
      stopwatchStartTsRef.current = Date.now() - stopwatchElapsed * 1000;
      localStorage.setItem(LS_STOPWATCH_START_TS_KEY, String(stopwatchStartTsRef.current));
      setIsRunning(true);
    }
  };

  const handlePause = () => {
    if (mode === "timer") {
      if (endTsRef.current) {
        const remaining = Math.max(0, Math.ceil((endTsRef.current - Date.now()) / 1000));
        setTimeLeft(remaining);
        endTsRef.current = null;
        localStorage.removeItem(LS_END_TS_KEY);
      }
    } else {
      if (stopwatchStartTsRef.current) {
        const elapsed = Math.max(0, Math.floor((Date.now() - stopwatchStartTsRef.current) / 1000));
        setStopwatchElapsed(elapsed);
        stopwatchStartTsRef.current = null;
        localStorage.removeItem(LS_STOPWATCH_START_TS_KEY);
      }
    }
    setIsRunning(false);
  };

  const handleCompleteFocus = useCallback(
    async (isTaskCompleted) => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      endTsRef.current = null;
      stopwatchStartTsRef.current = null;
      localStorage.removeItem(LS_END_TS_KEY);
      localStorage.removeItem(LS_STOPWATCH_START_TS_KEY);
      setIsRunning(false);
      setSessionExpired(false);
  
      let elapsedSeconds = 0;
      if (sessionExpired) {
        elapsedSeconds = elapsedBeforeExpire;
      } else if (mode === "timer") {
        elapsedSeconds = activeSessionDuration - timeLeft;
      } else {
        elapsedSeconds = stopwatchElapsed;
      }
  
      if (!selectedTask) {
        setTimeLeft(sessionDuration);
        setStopwatchElapsed(0);
        setActiveSessionDuration(sessionDuration);
        return;
      }
  
      const durationInMinutes = Math.max(0, Math.floor(elapsedSeconds / 60));
  
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
  
        setFocusSessions((prev) => [...prev, newSession]);
  
        if (isTaskCompleted) {
          handleMoveToCompleted(selectedTask.id);
        }
  
        setSelectedTask(null);
        localStorage.removeItem(LS_TASK_KEY);
        setTimeLeft(sessionDuration);
        setStopwatchElapsed(0);
        setActiveSessionDuration(sessionDuration);
      } catch (e) {
        console.error("Failed to save focus session:", e);
        setSelectedTask(null);
        localStorage.removeItem(LS_TASK_KEY);
        setTimeLeft(sessionDuration);
        setStopwatchElapsed(0);
        setActiveSessionDuration(sessionDuration);
      }
    },
    [timeLeft, selectedTask, sessionDuration, mode, stopwatchElapsed, activeSessionDuration, sessionExpired, elapsedBeforeExpire]
  );
  

  const handleMoveToCompleted = async (taskId) => {
    setAnimatingTask(taskId);
    setTimeout(async () => {
      const taskToMove = tasks.find((t) => t.id === taskId);
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
        setCompletedTasks((prev) => [...prev, newCompleted]);
        setTasks((prev) => prev.filter((t) => t.id !== taskId));
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
    const completed = completedTasks.find((c) => c.id === completedTaskId);
    if (!completed) return;
    setUndoingTask(completed.task_id);
    try {
      const res = await fetch(`${API_BASE}/completed_tasks/${completed.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      // fetch tasks to restore undone item (could optimize to GET single task endpoint)
      const allTasksRes = await fetch(`${API_BASE}/tasks`);
      if (!allTasksRes.ok) throw new Error(`HTTP ${allTasksRes.status}`);
      const allTasks = await allTasksRes.json();
      const undone = allTasks.find((t) => t.id === completed.task_id);
      if (undone) {
        setTasks((prev) => [...prev, undone].sort((a, b) => new Date(a.start) - new Date(b.start)));
        setCompletedTasks((prev) => prev.filter((c) => c.id !== completedTaskId));
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
        setFocusSessions((prev) => prev.filter((s) => s.id !== sessionId));
      } catch (e) {
        console.error("Failed to remove session:", e);
      } finally {
        setRemovingSession(null);
      }
    }, 300);
  };

  const formatTime = (secs) => {
    if (secs >= 3600) {
      const h = Math.floor(secs / 3600);
      const m = Math.floor((secs % 3600) / 60)
        .toString()
        .padStart(2, "0");
      const s = Math.floor(secs % 60)
        .toString()
        .padStart(2, "0");
      return `${h}:${m}:${s}`;
    } else {
      const minutes = Math.floor(secs / 60)
        .toString()
        .padStart(2, "0");
      const seconds = (secs % 60).toString().padStart(2, "0");
      return `${minutes}:${seconds}`;
    }
  };

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

  const sessionsThisWeek = focusSessions.filter((s) => {
    const dt = new Date(s.start_time);
    return dt >= weekAgo && dt <= now;
  }).length;

  const completedThisWeek = completedTasks.filter((c) => {
    const dt = new Date(c.completion_date);
    return dt >= weekAgo && dt <= now;
  }).length;

  const tasksThisWeek = tasks.length + completedThisWeek > 0 ? tasks.length + completedThisWeek : 1;
  const completionPercent = Math.round((completedThisWeek / tasksThisWeek) * 100);


  const roundToNearest5 = (mins) => {
    const n = Number(mins) || 0;
    const rounded = Math.max(5, Math.round(n / 5) * 5);
    return rounded;
  };

  const applyDurationFromSettings = () => {
    const mins = roundToNearest5(tempMinutes);
    const secs = mins * 60;
    setSessionDuration(secs);
    if (!isRunning) setTimeLeft(secs);
    setTempMinutes(mins);
    localStorage.setItem(LS_DURATION_KEY, String(secs));
    setMode("timer");
    setShowSettings(false);
  };

  const incSettingsMinutes = () => {
    setTempMinutes((p) => roundToNearest5(p + 5));
  };
  const decSettingsMinutes = () => {
    setTempMinutes((p) => roundToNearest5(Math.max(5, p - 5)));
  };

  return (
    <div className="min-h-screen dashboard-background p-6">
      <div className="max-w-7xl mx-auto backdrop-blur-sm rounded-lg shadow-lg border-2 border-white/20 p-6 h-full bg-transparent">
        <div className="mb-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-white">
                Good {new Date().getHours() < 12 ? "Morning" : new Date().getHours() < 18 ? "Afternoon" : "Evening"}
              </h1>
              <p className="text-stone-400 mt-2 text-lg">{format(new Date(), "EEEE, MMMM d, yyyy")}</p>
            </div>
            <div className="flex gap-3 items-center relative">
              <button className="flex items-center rounded-lg px-4 py-2 text-sm font-medium text-white transition-all duration-200 border-2 border-stone-600 hover:bg-white/10 hover:border-white/30 shadow-md">
                <Target className="w-4 h-4 mr-2" />
                Prioritize
              </button>

              <button
                className="flex items-center rounded-lg px-4 py-2 text-sm font-medium text-white transition duration-200 shadow-md bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700"
                onClick={() => handleStartFocus()}
                disabled={!selectedTask}
              >
                <Timer className="w-4 h-4 mr-2" />
                Focus Session
              </button>


              {showSettings && (
                <div className="absolute top-80 right-20 mt-12 w-80 z-40 bg-black border border-white/20 rounded-lg p-4 shadow-lg text-stone-200">
                  <div className="mb-3">
                    <h3 className="text-sm font-semibold text-white mb-2">Timer duration</h3>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={decSettingsMinutes}
                        className="px-2 py-1 rounded-md bg-white/10 hover:bg-white/20"
                        aria-label="Decrease minutes"
                      >
                        -
                      </button>
                      <input
                        className="w-20 text-center rounded-md p-2 bg-white/5 text-white"
                        value={tempMinutes}
                        onChange={(e) => setTempMinutes(e.target.value)}
                        onBlur={(e) => setTempMinutes(roundToNearest5(e.target.value))}
                        inputMode="numeric"
                      />
                      <button
                        onClick={incSettingsMinutes}
                        className="px-2 py-1 rounded-md bg-white/10 hover:bg-white/20"
                        aria-label="Increase minutes"
                      >
                        +
                      </button>
                      <div className="text-sm text-stone-300 ml-2">{roundToNearest5(tempMinutes)} min (rounded)</div>
                    </div>
                    <div className="flex gap-2 mt-3">
                      <button onClick={applyDurationFromSettings} className="px-3 py-1 rounded-md bg-emerald-500 text-white">
                        Apply
                      </button>
                      <button
                        onClick={() => {
                          setTempMinutes(Math.round(sessionDuration / 60));
                        }}
                        className="px-3 py-1 rounded-md bg-white/10"
                      >
                        Reset
                      </button>
                    </div>
                  </div>

                  <div className="border-t border-white/5 pt-3">
                    <h3 className="text-sm font-semibold text-white mb-2">Mode</h3>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setMode("stopwatch");
                        }}
                        className={`px-3 py-1 rounded-md ${mode === "stopwatch" ? "bg-emerald-500 text-white" : "bg-white/10"}`}
                      >
                        Stopwatch
                      </button>
                      <button
                        onClick={() => {
                          setMode("timer");
                        }}
                        className={`px-3 py-1 rounded-md ${mode === "timer" ? "bg-emerald-500 text-white" : "bg-white/10"}`}
                      >
                        Timer
                      </button>
                    </div>
                    <p className="text-xs text-stone-300 mt-2">Stopwatch adds a ring every completed hour; timer uses the duration above.</p>
                  </div>
                </div>
              )}
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
            <div className="flex items-center justify-between w-full mb-6">
              <Timer className="w-6 h-6 mr-3 text-stone-700 dark:text-white" />
              <h2 className="text-2xl font-semibold text-stone-900 dark:text-white">Focus Sess</h2>
              <button
                onClick={() => setShowSettings((s) => !s)}
                aria-label="Timer settings"
                title="Timer settings"
                className="ml-2 p-2 rounded-lg bg-white/10 hover:bg-white/20 transition"
              >
                <Settings className="w-5 h-5 text-white" />
              </button>
            </div>
            <div className="relative w-40 h-40 flex items-center justify-center mx-auto mb-6">
            <svg className="w-full h-full" viewBox="0 0 120 120" aria-hidden>
              <ProgressRings
                mode={mode}
                sessionDuration={sessionDuration}
                timeLeft={timeLeft}
                stopwatchElapsed={stopwatchElapsed}
              />
            </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-extrabold text-stone-900 dark:text-white" aria-live="polite" aria-atomic="true">
                  {mode === "timer" ? formatTime(timeLeft) : formatTime(stopwatchElapsed)}
                </span>
              </div>
            </div>
            <div className="mb-3 text-center">
              <div className="text-lg font-semibold text-stone-700 dark:text-white">{selectedTask ? selectedTask.name : mode === "stopwatch" ? "Stopwatch" : "Focus Time"}</div>
              <div className="text-sm text-stone-500 dark:text-stone-300">
                {selectedTask
                  ? mode === "timer"
                    ? `${Math.round(sessionDuration / 60)} minutes of deep work`
                    : `Stopwatch — ${stopwatchElapsed >= 3600 ? `${Math.floor(stopwatchElapsed / 3600)}h ` : ""}${formatTime(stopwatchElapsed)}`
                  : "Select a task to begin"}
              </div>
            </div>

            <div className="flex justify-center gap-4 mt-2 mb-3">
              {mode === "timer" ? (
                // Timer buttons (behavior adapted to sessionDuration)
                !isRunning && timeLeft === sessionDuration ? (
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
                      onClick={resume}
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
                )
              ) : (
                // Stopwatch buttons
                !isRunning && stopwatchElapsed === 0 ? (
                  <button
                    onClick={handleStartFocus}
                    className="bg-emerald-500 hover:bg-emerald-600 text-white p-4 rounded-lg shadow-md focus:outline-none"
                    aria-label="Start stopwatch"
                    disabled={!selectedTask}
                  >
                    <Play className="w-6 h-6" />
                  </button>
                ) : isRunning ? (
                  <button
                    onClick={handlePause}
                    className="bg-yellow-500 hover:bg-yellow-600 text-white p-4 rounded-lg shadow-md focus:outline-none"
                    aria-label="Pause stopwatch"
                  >
                    <Square className="w-6 h-6" />
                  </button>
                ) : (
                  <>
                    <button
                      onClick={resume}
                      className="bg-emerald-500 hover:bg-emerald-600 text-white p-4 rounded-lg shadow-md focus:outline-none"
                      aria-label="Resume stopwatch"
                    >
                      <Play className="w-6 h-6" />
                    </button>
                    <button
                      onClick={() => handleCompleteFocus(false)}
                      className="bg-white border border-stone-300 dark:bg-stone-900/30 dark:border-stone-600 text-stone-600 dark:text-white p-4 rounded-lg shadow-md focus:outline-none"
                      aria-label="End stopwatch without completion"
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
                )
              )}
            </div>
          </div>
        </div>

        {/* Productivity Section */}
        <ProductivitySection
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          focusSessions={focusSessions}
          completedTasks={completedTasks}
          removingSession={removingSession}
          undoingTask={undoingTask}
          handleRemoveSession={handleRemoveSession}
          handleUndoCompletion={handleUndoCompletion}
        />

        <SessionExpiredModal
          isOpen={sessionExpired}
          onFinish={() => handleCompleteFocus(true)}
          onContinue={() => {
            setMode("stopwatch");
            setStopwatchElapsed(elapsedBeforeExpire);
            stopwatchStartTsRef.current = Date.now() - elapsedBeforeExpire * 1000;
            setIsRunning(true);
            setSessionExpired(false);
          }}
        />


      </div>
    </div>
  );
}
