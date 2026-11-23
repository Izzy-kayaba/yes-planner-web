"use client";

import { useEffect, useState } from "react";

type CountdownValues = { days: number; hours: number; minutes: number; seconds: number };

export function PublicWeddingCountdown({ weddingDate }: { weddingDate: string }) {
  const [remaining, setRemaining] = useState<CountdownValues | null>(null);

  useEffect(() => {
    setRemaining(getRemaining(weddingDate));
    const timer = window.setInterval(() => setRemaining(getRemaining(weddingDate)), 1000);
    return () => window.clearInterval(timer);
  }, [weddingDate]);

  const parts = [
    [remaining?.days ?? 0, "days"],
    [remaining?.hours ?? 0, "hours"],
    [remaining?.minutes ?? 0, "minutes"],
    [remaining?.seconds ?? 0, "seconds"],
  ] as const;

  return (
    <div className="public-wedding-countdown" aria-label="Countdown to the wedding">
      <span className="public-wedding-countdown-kicker">Until we celebrate</span>
      <div className="public-wedding-countdown-grid">
        {parts.map(([amount, label]) => (
          <div className="public-wedding-countdown-unit" key={label}>
            <strong>{String(amount).padStart(2, "0")}</strong>
            <small>{label}</small>
          </div>
        ))}
      </div>
    </div>
  );
}

function getRemaining(value: string): CountdownValues {
  const target = new Date(`${value}T12:00:00`).getTime();
  const difference = Number.isFinite(target) ? Math.max(0, target - Date.now()) : 0;
  const totalSeconds = Math.floor(difference / 1000);
  return {
    days: Math.floor(totalSeconds / 86_400),
    hours: Math.floor((totalSeconds % 86_400) / 3_600),
    minutes: Math.floor((totalSeconds % 3_600) / 60),
    seconds: totalSeconds % 60,
  };
}
