"use client";
import { useEffect, useRef, useState } from "react";

export function MusicToggle({ src }: { src: string }) {
  const ref = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  useEffect(() => {
    const a = ref.current;
    if (!a) return;
    a.volume = 0.6;
  }, []);
  function toggle() {
    const a = ref.current;
    if (!a) return;
    if (playing) { a.pause(); setPlaying(false); }
    else { a.play().then(() => setPlaying(true)).catch(() => {}); }
  }
  return (
    <>
      <audio ref={ref} src={src} loop />
      <button
        onClick={toggle}
        aria-label="Putar musik"
        style={{
          position: "fixed", right: 16, bottom: 16, width: 44, height: 44,
          borderRadius: 999, border: "none", background: "#7c8b78", color: "#fff",
          cursor: "pointer", zIndex: 50,
        }}
      >
        {playing ? "♪" : "▶"}
      </button>
    </>
  );
}
