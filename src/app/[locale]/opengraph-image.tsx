import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Andrea Ghidara — sviluppatore web";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#F5F1E8",
          color: "#14120F",
          padding: 72,
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", fontSize: 26, letterSpacing: 6, color: "#6E6759" }}>
          ANDREA GHIDARA
        </div>
        <div style={{ display: "flex", fontSize: 78, fontWeight: 800, lineHeight: 1.05, maxWidth: 900 }}>
          Costruisco siti, e-commerce e piattaforme su misura.
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div style={{ width: 26, height: 26, borderRadius: 999, background: "#E4572E" }} />
          <div style={{ fontSize: 28, color: "#6E6759" }}>a-ghidara-dev.vercel.app</div>
        </div>
      </div>
    ),
    size,
  );
}
