import React from "react";
import { TrendingUp } from "lucide-react";

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

export default Card;
