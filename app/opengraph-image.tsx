import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Hari-H — Undangan Pernikahan Digital";

export default function Og() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#fbf8f1", color: "#1b3a2f" }}>
        <div style={{ display: "flex", fontSize: 80, fontWeight: 700 }}>Hari-H</div>
        <div style={{ display: "flex", fontSize: 34, marginTop: 12, color: "#46544c" }}>Undangan Pernikahan Digital</div>
      </div>
    ),
    { ...size },
  );
}
