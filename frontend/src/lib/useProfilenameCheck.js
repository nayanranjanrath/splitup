import { useEffect, useState } from "react";
import { availableProfilename } from "./api.js";

/**
 * Debounced profile-name availability check.
 * Waits until the user stops typing (~600ms), then asks the backend.
 * status: idle | checking | available | taken | error
 */
export function useProfilenameCheck() {
  const [value, setValue] = useState("");
  const [state, setState] = useState({ status: "idle", message: "" });

  useEffect(() => {
    const name = value.trim();
    if (!name) {
      setState({ status: "idle", message: "" });
      return;
    }
    setState({ status: "checking", message: "" });
    let cancelled = false;
    const t = setTimeout(async () => {
      try {
        const r = await availableProfilename(name);
        if (!cancelled) {
          setState({ status: r.available ? "available" : "taken", message: r.message });
        }
      } catch {
        if (!cancelled) setState({ status: "error", message: "" });
      }
    }, 600);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [value]);

  return { value, setValue, state };
}
