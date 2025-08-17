import { useState, useRef, useEffect } from "react";
import { 
  Clock, 
  Target, 
  TrendingUp, 
  Calendar,
  Play,
  CheckCircle2,
  AlertCircle,
  Timer,
  Plus,
  Square
} from "lucide-react";
import { format, isToday, startOfDay, endOfDay } from "date-fns";

export default function Dashboard() {
  const initialTime = 25 * 60;
  const [timeLeft, setTimeLeft] = useState(initialTime);
  const [isRunning, setIsRunning] = useState(false);
  const timerRef = useRef(null);

  const Card = ({ icon: Icon, title, value, description, color }) => (
    <div className="flex-1 min-w-0 p-6 bg-white/10 rounded-2xl shadow-lg backdrop-blur-md transition-transform hover:scale-[1.025] group relative overflow-hidden">
      <svg
        className={`absolute -top-5 -left-5 w-32 h-32 z-0 ${color} opacity-20 pointer-events-none select-none`}
        viewBox="0 0 100 100"
        fill="none"
      >
        <path
          d="M0 0 H100 A100 100 0 0 1 0 100 V0 Z"
          fill="currentColor"
        />
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

  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setTimeLeft((t) => {
          if (t <= 1) {
            clearInterval(timerRef.current);
            setIsRunning(false);
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    } else if (!isRunning && timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [isRunning]);

  const formatTime = (secs) => {
    const minutes = Math.floor(secs / 60)
      .toString()
      .padStart(2, "0");
    const seconds = (secs % 60).toString().padStart(2, "0");
    return `${minutes}:${seconds}`;
  };

  const circumference = 2 * Math.PI * 54; // 2πr with r=54
  const progress = ((initialTime - timeLeft) / initialTime) * circumference;
  const dashOffset = circumference - progress;



  return (
    <div className="min-h-screen dashboard-background p-6">
      <div className="max-w-7xl mx-auto bg-white/20 backdrop-blur-sm rounded-lg shadow-lg p-6 h-full">
        <div className="mb-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-white">
                Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 18 ? 'Afternoon' : 'Evening'}
              </h1>
              <p className="text-stone-400 mt-2 text-lg">
                {format(new Date(), "EEEE, MMMM d, yyyy")}
              </p>
            </div>
            <div className="flex gap-3">
              <button className="flex items-center rounded-lg px-4 py-2 text-sm font-medium text-white transition-all duration-200 border-2 border-stone-600 hover:bg-white/10 hover:border-white/30 shadow-md">
                <Target className="w-4 h-4 mr-2" />
                Prioritize
              </button>
              <button className="flex items-center rounded-lg px-4 py-2 text-sm font-medium text-white transition duration-200 shadow-md bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700">
                <Timer className="w-4 h-4 mr-2" />
                Start Focus
              </button>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
              <Card 
                icon={Clock} 
                title="Total Hours" 
                value="12h 45m" 
                description="Since last week" 
                color="text-sky-400"
              />
              <Card 
                icon={Target} 
                title="Focus Sessions" 
                value="24" 
                description="This month"
                color="text-purple-400"
              />
              <Card 
                icon={CheckCircle2} 
                title="Tasks Completed" 
                value="89%" 
                description="This quarter"
                color="text-emerald-400"
              />
            </div>
        </div>
        <div className="grid lg:grid-cols-3 gap-8 p-4">
      {/* Today's Tasks */}
      <div className="lg:col-span-2 space-y-8">
        <div className="flex-1 min-w-0 p-8 rounded-2xl shadow-lg backdrop-blur-md transition-transform group relative overflow-hidden bg-white/10">
          <div className="flex justify-between items-center mb-8">
            <h2 className="flex items-center text-2xl font-semibold text-stone-900 dark:text-white">
              <Clock className="mr-3 w-7 h-7 text-stone-700 dark:text-white" />
              Today's Tasks
            </h2>
            <button className="flex items-center gap-2 px-5 py-2 border border-stone-300 dark:border-stone-600 rounded-lg text-stone-900 dark:text-white font-medium shadow-sm bg-white/80 dark:bg-stone-900/20 transition hover:bg-white/100 hover:dark:bg-stone-900/40">
              <span className="text-xl leading-4">+</span>
              Add Task
            </button>
          </div>

          {/* Empty state UI */}
          <div className="flex flex-col justify-center items-center py-20">
            <div className="relative mb-6">
              <span className="absolute inset-0 rounded-full animate-pulse bg-gradient-to-tr from-emerald-300/30 via-indigo-400/20 to-sky-300/40 blur-2xl"></span>
              <span className="absolute inset-2 rounded-full bg-gradient-to-tr from-white/60 to-transparent shadow-inner"></span>
              <span className="block w-20 h-20 border-4 border-stone-200 dark:border-stone-600 rounded-full bg-white/15 backdrop-blur-md" />
              <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-gradient-to-br from-emerald-300 via-white to-sky-300 rounded-full opacity-40 blur-[2px]" />
            </div>
            <p className="text-lg font-medium text-stone-500 dark:text-stone-400 mb-4">
              No tasks scheduled for today
            </p>
            <button className="mt-1 px-6 py-2 rounded-lg border border-stone-300 dark:border-stone-600 bg-white/90 dark:bg-stone-900/30 shadow-sm text-stone-900 dark:text-white font-semibold text-base transition hover:bg-white hover:dark:bg-stone-900/50">
              Plan Your Day
            </button>
          </div>
        </div>
      </div>

      {/* Quick Pomodoro Timer */}
      <div className="flex flex-col items-center p-8 bg-white/10 rounded-2xl shadow-lg backdrop-blur-md">
        <div className="flex items-center w-full mb-6">
          <Timer className="w-6 h-6 mr-3 text-stone-700 dark:text-white" />
          <h2 className="text-2xl font-semibold text-stone-900 dark:text-white">
            Focus Session
          </h2>
        </div>
        <div className="relative w-40 h-40 flex items-center justify-center mx-auto mb-6">
          <svg className="w-full h-full" viewBox="0 0 120 120">
            {/* Background ring */}
            <circle
              cx="60"
              cy="60"
              r="54"
              fill="none"
              stroke="#e5e7eb"
              strokeWidth="10"
            />
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
            <span className="text-3xl font-extrabold text-stone-900 dark:text-white">{formatTime(timeLeft)}</span>
          </div>
        </div>
        <div className="mb-3 text-center">
          <div className="text-lg font-semibold text-stone-700 dark:text-white">
            Focus Time
          </div>
          <div className="text-sm text-stone-500 dark:text-stone-300">
            45 minutes of deep work
          </div>
        </div>
        <div className="flex justify-center gap-4 mt-2 mb-3">
          {!isRunning ? (
            <button
              onClick={() => setIsRunning(true)}
              className="bg-emerald-500 hover:bg-emerald-600 text-white p-4 rounded-lg shadow-md focus:outline-none"
              aria-label="Start timer"
            >
              <Play className="w-6 h-6" />
            </button>
          ) : (
            <button
              onClick={() => {
                setIsRunning(false);
                setTimeLeft(initialTime);
              }}
              className="bg-white border border-stone-300 dark:bg-stone-900/30 dark:border-stone-600 text-stone-600 dark:text-white p-4 rounded-lg shadow-md focus:outline-none"
              aria-label="Stop and reset timer"
            >
              <Square className="w-6 h-6" />
            </button>
          )}
        </div>
        <div
          className="text-base font-medium text-stone-800 dark:text-white mt-2 cursor-pointer hover:underline"
          role="button"
          tabIndex={0}
          onClick={() => alert("Open full timer")}
          onKeyDown={(e) => e.key === "Enter" && alert("Open full timer")}
        >
          Open Full Timer
        </div>
      </div>
    </div>
      </div>
    </div>
  );
}