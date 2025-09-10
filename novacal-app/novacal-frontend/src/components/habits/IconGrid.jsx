import React from "react";
import {
  CheckCircle2,
  UtensilsCrossed,
  Coffee,
  Heart,
  Dumbbell,
  BookOpen,
  Sun,
  Moon,
  Flame,
  Music,
  Smile,
  Leaf,
  Star,
  Briefcase,
  Pencil,
  Key,
  Cloud,
  Bolt,
  Eye,
  Award,
} from "lucide-react";

export const ICONS = [
  { name: "Check", icon: CheckCircle2 },
  { name: "Coffee", icon: Coffee },
  { name: "Lunch", icon: UtensilsCrossed },
  { name: "Heart", icon: Heart },
  { name: "Workout", icon: Dumbbell },
  { name: "Reading", icon: BookOpen },
  { name: "Sunrise", icon: Sun },
  { name: "Moon", icon: Moon },
  { name: "Fire", icon: Flame },
  { name: "Music", icon: Music },
  { name: "Smile", icon: Smile },
  { name: "Leaf", icon: Leaf },
  { name: "Star", icon: Star },
  { name: "Work", icon: Briefcase },
  { name: "Writing", icon: Pencil },
  { name: "Key", icon: Key },
  { name: "Cloud", icon: Cloud },
  { name: "Bolt", icon: Bolt },
  { name: "Eye", icon: Eye },
  { name: "Award", icon: Award },
];

export default function IconGrid({ selected, onSelect }) {
  return (
    <div className="grid grid-cols-5 gap-3">
      {ICONS.map(({ name, icon: Icon }) => {
        const isActive = selected?.name === name;
        return (
          <button
            key={name}
            type="button"
            onClick={() => onSelect({ name, icon: Icon })}
            className={`group p-3 rounded-xl border transition shadow flex flex-col items-center ${
              isActive
                ? "bg-emerald-500/30 border-emerald-400"
                : "bg-white/5 border-white/10 hover:bg-emerald-500/20"
            }`}
          >
            <Icon
              className={`w-6 h-6 ${
                isActive ? "text-emerald-300" : "text-emerald-400"
              }`}
            />
            <span className="text-xs mt-1 text-gray-200">{name}</span>
          </button>
        );
      })}
    </div>
  );
}
