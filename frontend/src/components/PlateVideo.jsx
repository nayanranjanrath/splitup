import { VIDEO_SRC } from "../lib/video.js";

/** Dark-mode cinematic hero video (same-origin via dev proxy). */
export default function PlateVideo({ videoStyle }) {
  return (
    <video
      className="plate-video"
      style={videoStyle}
      autoPlay
      muted
      loop
      playsInline
      preload="auto"
      aria-hidden="true"
    >
      <source src={VIDEO_SRC} type="video/mp4" />
    </video>
  );
}
