"use client";
import { useEffect, useState } from "react";

function parts(remaining: number) {
  const ms = Math.max(0, remaining);
  return {
    d: Math.floor(ms / 86400000),
    h: Math.floor((ms / 3600000) % 24),
    m: Math.floor((ms / 60000) % 60),
    s: Math.floor((ms / 1000) % 60),
  };
}

export function Countdown({ iso }: { iso: string }) {
  const target = new Date(iso).getTime();
  // `now` stays null on the server and the first client render (stable zeros)
  // to avoid hydration mismatch; it's set after mount via rAF + interval, so
  // setState never runs synchronously inside the effect body.
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    const tick = () => setNow(Date.now());
    const raf = requestAnimationFrame(tick);
    const id = setInterval(tick, 1000);
    return () => {
      cancelAnimationFrame(raf);
      clearInterval(id);
    };
  }, []);

  const shown = parts(now === null ? 0 : target - now);
  const items: [string, number][] = [
    ["Hari", shown.d],
    ["Jam", shown.h],
    ["Menit", shown.m],
    ["Detik", shown.s],
  ];
  return (
    <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
      {items.map(([label, v]) => (
        <div key={label} style={{ textAlign: "center", minWidth: 56 }}>
          <div style={{ fontFamily: "var(--font-fraunces)", fontSize: 28 }}>{String(v).padStart(2, "0")}</div>
          <div style={{ fontSize: 11, letterSpacing: ".1em", textTransform: "uppercase", opacity: 0.7 }}>{label}</div>
        </div>
      ))}
    </div>
  );
}
