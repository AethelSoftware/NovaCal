import React from "react";
import { 
  Clock, 
  Target, 
  TrendingUp, 
  Calendar,
  Play,
  CheckCircle2,
  AlertCircle,
  Timer,
  Plus
} from "lucide-react";
import { format, isToday, startOfDay, endOfDay } from "date-fns";

export default function Dashboard() {
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
      </div>
    </div>
  );
}