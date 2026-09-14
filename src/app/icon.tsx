import { ImageResponse } from "next/og";

export const size = {
  width: 192,
  height: 192,
};
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 80,
          background: "linear-gradient(135deg, #0284c7 0%, #0369a1 100%)",
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "white",
          borderRadius: 40,
          fontWeight: 900,
          boxShadow: "0 10px 25px rgba(0,0,0,0.2)",
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
