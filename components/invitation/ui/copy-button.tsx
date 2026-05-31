"use client";
import { useState } from "react";

export function CopyButton({ value }: { value: string }) {
  const [done, setDone] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setDone(true);
      setTimeout(() => setDone(false), 1500);
    } catch {}
  }
  return (
    <button onClick={copy} style={{ border: "1px solid #7c8b78", background: "transparent", color: "#7c8b78", borderRadius: 8, padding: "4px 10px", cursor: "pointer", fontSize: 13 }}>
      {done ? "Disalin!" : "Salin"}
    </button>
  );
}
