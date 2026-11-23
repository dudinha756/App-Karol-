import { ImageResponse } from "next/og";

/** Rendered PNG icon for iOS, Android and browser shortcuts. */
export function brandIcon(size: number): ImageResponse {
  return new ImageResponse(
    <div style={{
      width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center",
      overflow: "hidden", borderRadius: Math.round(size * .23),
      background: "linear-gradient(135deg, #ff79c7 0%, #d73ce7 28%, #842bea 54%, #6258f4 74%, #55c8f9 100%)",
      position: "relative"
    }}>
      <div style={{
        position: "absolute", width: "115%", height: "100%", left: "-22%", bottom: "-51%",
        borderRadius: "55%", transform: "rotate(-28deg)",
        background: "linear-gradient(180deg, rgba(255,255,255,.05),rgba(205,141,255,.3),rgba(116,193,255,.12))"
      }} />
      <div style={{
        position: "absolute", width: "95%", height: "46%", top: "-23%", left: "-18%",
        borderRadius: "50%", transform: "rotate(-25deg)", background: "rgba(255,255,255,.17)"
      }} />
      <svg viewBox="0 0 512 512" width="76%" height="76%" xmlns="http://www.w3.org/2000/svg">
        <path d="M159 379 C179 294 183 221 224 176 C262 132 319 124 412 123 C400 175 372 193 317 193 L274 193 C217 193 190 226 175 270 C206 231 236 230 292 230 L366 230 C353 274 324 296 268 296 L232 296 C190 296 177 326 159 379 Z" fill="#ffffff"/>
      </svg>
    </div>,
    { width: size, height: size }
  );
}
