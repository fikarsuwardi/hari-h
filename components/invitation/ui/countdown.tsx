"use client";
import { useEffect, useState } from "react";

function diff(target: number) {
  const ms = Math.max(0, target - Date.now());
  return {
    d: Math.floor(ms / 86400000),
    h: Math.floor((ms / 3600000) % 24),
    m: Math.floor((ms / 60000) % 60),
    s: Math.floor((ms / 1000) % 60),
  };
}

export function Countdown({ iso }: { iso: string }) {
  const target = new Date(iso).getTime();
  const [t, setT] = useState(() => diff(target));
  useEffect(() => {
    const id = setInterval(() => setT(diff(target)), 1000);
    return () => clearInterval(id);
  }, [target]);
  const items: [string, number][] = [["Hari", t.d], ["Jam", t.h], ["Menit", t.m], ["Detik", t.s]];
  return (
    <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
      {items.map(([label, v]) => (
        <div key={label} style={{ textAlign: "center", minWidth: 56 }}>
          <div style={{ fontFamily: "var(--font-fraunces)", fontSize: 28 }}>{String(v).padStart(2, "0")}</div>
          <div style={{ fontSize: 11, letterSpacing: ".1em", textTransform: "uppercase", opacity: .7 }}>{label}</div>
        </div>
      ))}
    </div>
  );
}
