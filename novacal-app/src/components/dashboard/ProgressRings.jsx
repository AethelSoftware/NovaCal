import React, { useMemo } from "react";
import { motion } from "framer-motion";

export default function ProgressRings({ mode, sessionDuration, timeLeft, stopwatchElapsed }) {
  if (mode === "timer") {
    const radius = 54;
    const strokeWidth = 10;
    const circumference = 2 * Math.PI * radius;
    const progress =
      sessionDuration > 0
        ? ((sessionDuration - timeLeft) / sessionDuration) * circumference
        : 0;
    const dashOffset = circumference - progress;

    return (
      <g>
        <circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth={strokeWidth}
        />
        <motion.circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          stroke="#14b789"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
          animate={{ strokeDashoffset: dashOffset }}
          transition={{ ease: "linear", duration: 0.3 }}
        />
      </g>
    );
  }

  // === STOPWATCH MODE ===
  const elapsed = stopwatchElapsed;
  const completedHours = Math.floor(elapsed / 3600);
  const ringsCount = Math.max(1, completedHours + 1);
  const baseRadius = 54;
  const gap = 8;

  const ringsToRender = useMemo(() => {
    const rings = [];
    for (let i = 0; i < ringsCount; i++) {
      const radius = baseRadius - i * gap;
      if (radius <= 8) continue;

      const circumference = 2 * Math.PI * radius;
      const isActive = i === ringsCount - 1;
      const activeSeconds = elapsed % 3600;
      const progress = isActive ? (activeSeconds / 3600) * circumference : circumference;
      const dashOffset = circumference - progress;

      const opacity = isActive ? 1 : 0.5 - i * 0.05;

      rings.push(
        <motion.g
          key={i}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity, scale: 1 }}
          transition={{ duration: 0.4, delay: i * 0.1 }}
        >
          <circle
            cx="60"
            cy="60"
            r={radius}
            fill="none"
            stroke="#e5e7eb"
            strokeWidth={8}
            opacity={0.3}
          />
          <motion.circle
            cx="60"
            cy="60"
            r={radius}
            fill="none"
            stroke="#14b789"
            strokeWidth={8}
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            strokeLinecap="round"
            animate={{ strokeDashoffset: dashOffset }}
            transition={{ ease: "linear", duration: 0.3 }}
          />
        </motion.g>
      );
    }
    return rings;
  }, [ringsCount, elapsed]);

  return <g>{ringsToRender}</g>;
}
