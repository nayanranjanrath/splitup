import { useEffect, useState } from "react";

const KEY = "splitup-mode";

export function getMode() {
  try {
    return localStorage.getItem(KEY) || "dark";
  } catch {
    return "dark";
  }
}

export function applyMode(mode) {
  document.documentElement.setAttribute("data-mode", mode);
  try {
    localStorage.setItem(KEY, mode);
  } catch {
    /* private mode */
  }
  window.dispatchEvent(new CustomEvent("splitup:mode", { detail: mode }));
}

export function toggleMode() {
  const next = getMode() === "dark" ? "light" : "dark";
  applyMode(next);
  return next;
}

/** React hook that tracks the current mode. */
export function useMode() {
  const [mode, setMode] = useState(getMode());
  useEffect(() => {
    const onMode = (e) => setMode(e.detail);
    window.addEventListener("splitup:mode", onMode);
    return () => window.removeEventListener("splitup:mode", onMode);
  }, []);
  return mode;
}
