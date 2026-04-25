"use client";

import { useState, useEffect, useRef } from "react";

export default function Clock() {
  const [date, setDate] = useState<Date | null>(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setDate(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  if (!date) return null;

  const time = date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  const dateStr = date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="flex flex-col items-center gap-2">
      <span className="text-5xl md:text-7xl font-light text-white/90 tabular-nums tracking-tight drop-shadow-[0_0_20px_rgba(255,255,255,0.25)]">
        {time}
      </span>
      <span className="text-lg md:text-xl text-white/50 font-medium tracking-wide">
        {dateStr}
      </span>
    </div>
  );
}
