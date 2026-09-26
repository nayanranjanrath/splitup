import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { avatarSrc } from "../lib/api.js";
import { getCachedProfile } from "../lib/userCache.js";

export function DefaultAvatar() {
  return <img className="user-avatar" src="/default-avatar.png" alt="" aria-hidden="true" />;
}

/**
 * Avatar + profile-name chip (top-right). Works with httpOnly cookies:
 * instead of reading document.cookie it asks /getuseravatar (the server
 * reads the cookie). `quiet` skips the 403→login redirect (auth pages).
 */
export default function UserChip({ quiet = false }) {
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    let alive = true;
    getCachedProfile(quiet)
      .then((p) => alive && setProfile(p))
      .catch(() => alive && setProfile(null));
    return () => {
      alive = false;
    };
  }, [quiet]);

  if (!profile || (!profile.id && !profile.profilename)) return null;

  const src = profile ? avatarSrc(profile.avatar) : "";
  const name = profile?.profilename || "";
  const id = profile?.id;

  const inner = (
    <>
      {src ? <img className="user-avatar" src={src} alt={name || "Your avatar"} /> : <DefaultAvatar />}
      <span className="user-name">{name || "you"}</span>
    </>
  );

  return id ? (
    <Link to={`/profile/${id}`} className="user-chip" title="Your profile">
      {inner}
    </Link>
  ) : (
    <div className="user-chip" title={name || "You"}>
      {inner}
    </div>
  );
}
