import { ImageResponse } from "next/og";

export const size = {
  width: 180,
  height: 180,
};
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 76,
          background: "linear-gradient(135deg, #0284c7 0%, #0369a1 100%)",
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "white",
          borderRadius: 38,
          fontWeight: 900,
        }}
      >
        🔧
      </div>
    ),
    {
      ...size,
    }
  );
}
