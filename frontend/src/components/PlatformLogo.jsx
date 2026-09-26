import { useEffect, useState } from "react";
import { showPlatformImageJson } from "../lib/api.js";

/**
 * Platform logo via GET /showplatformimage/:platformid
 * (route returns JSON: { platform: { platformimage } }) with a graceful
 * fallback to the default platform tile. Cached per platform id.
 */
const cache = new Map(); // pid -> url | "" (none)

export default function PlatformLogo({ pid, name, size = 46, className = "" }) {
  const [src, setSrc] = useState(cache.has(pid) ? cache.get(pid) : null);

  useEffect(() => {
    if (!pid || cache.has(pid)) return;
    let alive = true;
    showPlatformImageJson(pid)
      .then((d) => {
        const img = d?.platform?.platformimage;
        const url = typeof img === "string" ? img : img?.url || "";
        if (alive) {
          cache.set(pid, url);
          setSrc(url);
        }
      })
      .catch(() => {
        if (alive) {
          cache.set(pid, "");
          setSrc("");
        }
      });
    return () => {
      alive = false;
    };
  }, [pid]);

  return (
    <img
      className={`req-logo ${className}`}
      style={{ width: size, height: size }}
      src={src || "/default-platform.png"}
      onError={(e) => {
        if (e.target.src !== window.location.origin + "/default-platform.png")
          e.target.src = "/default-platform.png";
      }}
      alt={name || "platform"}
    />
  );
}
