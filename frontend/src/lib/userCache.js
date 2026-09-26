import { apiFetch, getUserProfile, normalizeProfile } from "./api.js";

/**
 * Profile (profilename + avatar) is fetched once per session and shared
 * across pages — no repeated /getuseravatar calls on navigation.
 */
let promise = null;

export function getCachedProfile(quiet = false) {
  if (!promise) {
    promise = getUserProfile(quiet)
      .then((d) => normalizeProfile(d))
      .catch((err) => {
        promise = null; // allow retry later
        throw err;
      });
  }
  return promise;
}

export function clearProfileCache() {
  promise = null;
}

/* ── other users' profiles (chat senders, member chips) ────────────
 * Chat history arrives with bare sender ids; resolve each id once per
 * session via /showprofile/:userid and cache the result.
 */
const byId = new Map(); // userid -> Promise<{id, profilename, avatar}>

export function getProfileById(id) {
  if (!id) return Promise.resolve(null);
  if (!byId.has(id)) {
    byId.set(
      id,
      apiFetch(`/showprofile/${encodeURIComponent(id)}`, { quiet: true })
        .then((d) => {
          const u = d?.user || d;
          return {
            id,
            profilename: u?.profilename || "",
            avatar: u?.avatar || "",
          };
        })
        .catch(() => {
          byId.delete(id); // allow a retry later
          return { id, profilename: "", avatar: "" };
        })
    );
  }
  return byId.get(id);
}
