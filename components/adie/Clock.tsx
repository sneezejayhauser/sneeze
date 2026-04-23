"use client";

import { useSyncExternalStore } from "react";

function subscribe(callback: () => void) {
  const interval = setInterval(callback, 1000);
  return () => clearInterval(interval);
}

function getServerSnapshot() {
  return null;
}

function getSnapshot() {
  return new Date();
}

export default function Clock() {
  const date = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

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
