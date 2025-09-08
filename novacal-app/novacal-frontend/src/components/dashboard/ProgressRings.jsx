import React from "react";

export default function ProgressRings({ mode, sessionDuration, timeLeft, stopwatchElapsed }) {
  if (mode === "timer") {
    const radius = 54;
    const circumference = 2 * Math.PI * radius;
    const progress =
      sessionDuration > 0 ? ((sessionDuration - timeLeft) / sessionDuration) * circumference : 0;
    const dashOffset = circumference - progress;

    return (
      <>
        <circle cx="60" cy="60" r={radius} fill="none" stroke="#e5e7eb" strokeWidth={10} />
        <circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          stroke="#14b789"
          strokeWidth={10}
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 0.3s linear" }}
        />
      </>
    );
  } else {
    const elapsed = stopwatchElapsed;
    const completedHours = Math.floor(elapsed / 3600);
    const rings = Math.max(1, completedHours + 1);
    const baseRadius = 54;
    const gap = 8;
    const ringsToRender = [];

    for (let i = 0; i < rings; i++) {
      const radius = baseRadius - i * gap;
      if (radius <= 8) continue;
      const circumference = 2 * Math.PI * radius;

      if (i < rings - 1) {
        ringsToRender.push(
          <g key={i}>
            <circle cx="60" cy="60" r={radius} fill="none" stroke="#e5e7eb" strokeWidth={8} />
            <circle
              cx="60"
              cy="60"
              r={radius}
              fill="none"
              stroke="#14b789"
              strokeWidth={8}
              strokeDasharray={circumference}
              strokeDashoffset={0}
              strokeLinecap="round"
            />
          </g>
        );
      } else {
        const activeSeconds = elapsed % 3600;
        const progress = (activeSeconds / 3600) * circumference;
        const dashOffset = circumference - progress;

        ringsToRender.push(
          <g key={i}>
            <circle cx="60" cy="60" r={radius} fill="none" stroke="#e5e7eb" strokeWidth={8} />
            <circle
              cx="60"
              cy="60"
              r={radius}
              fill="none"
              stroke="#14b789"
              strokeWidth={8}
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              strokeLinecap="round"
              style={{ transition: "stroke-dashoffset 0.3s linear" }}
            />
          </g>
        );
      }
    }

    return <>{ringsToRender}</>;
  }
}
