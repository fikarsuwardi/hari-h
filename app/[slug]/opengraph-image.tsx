import { ImageResponse } from "next/og";
import { getPublicInvitation } from "@/lib/invitation/get-public";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Undangan Pernikahan";

export default async function OgImage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const view = await getPublicInvitation(slug);
  const groom = view?.data.couple.groom.name ?? "";
  const bride = view?.data.couple.bride.name ?? "";
  const date = view?.data.events[0]?.date
    ? new Date(view.data.events[0].date).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })
    : "";
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%", height: "100%", display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center", background: "#faf6ef", color: "#2b2b2b",
        }}
      >
        <div style={{ fontSize: 28, letterSpacing: 6, color: "#7c8b78", textTransform: "uppercase" }}>The Wedding Of</div>
        <div style={{ fontSize: 92, marginTop: 12 }}>{groom} &amp; {bride}</div>
        {date && <div style={{ fontSize: 34, marginTop: 16, color: "#6b6b6b" }}>{date}</div>}
      </div>
    ),
    { ...size },
  );
}
