import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMode } from "../lib/theme.js";

/** Real brand marks — local assets where provided, simple-icons CDN otherwise. */
const PLATFORMS = [
  { name: "Netflix", slug: "netflix", light: "E50914", dark: "E50914" },
  { name: "JioHotstar", logo: "/platforms/jiohotstar.png" },
  { name: "Prime Video", logo: "/platforms/primevideo.png" },
  { name: "Spotify", slug: "spotify", light: "1DB954", dark: "1ED760" },
  { name: "Steam", slug: "steam", light: "171A21", dark: "66C0F4" },
  { name: "ChatGPT", logo: "/platforms/chatgpt.png" },
  { name: "Gemini", slug: "googlegemini", light: "1C69FF", dark: "8AB4F8" },
];

/** Row of platform chips → /search?searchtext=<name> */
export function PlatformRow({ className = "" }) {
  const navigate = useNavigate();
  const mode = useMode();
  const [failed, setFailed] = useState({});

  return (
    <div className={`plat-row ${className}`}>
      {PLATFORMS.map((p) => {
        const color = mode === "light" ? p.light : p.dark;
        const src = p.logo || `https://cdn.simpleicons.org/${p.slug}/${color}`;
        return (
          <button
            key={p.name}
            className="pl-chip"
            onClick={() => navigate(`/search?searchtext=${encodeURIComponent(p.name)}`)}
            title={`Search ${p.name} splits`}
          >
            {failed[p.name] ? (
              <span className="pl-fb" style={{ background: p.logo ? "#555" : `#${color}` }}>
                {p.name[0]}
              </span>
            ) : (
              <img
                className="pl-logo"
                src={src}
                alt=""
                loading="lazy"
                onError={() => setFailed((f) => ({ ...f, [p.name]: true }))}
              />
            )}
            <span>{p.name}</span>
          </button>
        );
      })}
    </div>
  );
}
