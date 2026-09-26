import { Link } from "react-router-dom";
import { avatarSrc } from "../lib/api.js";
import { DefaultAvatar } from "./UserChip.jsx";

/**
 * Anywhere a user's avatar/name is shown, this makes it clickable →
 * /profile/:userid (falls back to a plain chip when there's no id).
 */
export default function UserLink({ user, name, className = "member-chip" }) {
  const id = user?._id || user?.id;
  const label = name || user?.profilename || "member";
  const ava = user?.avatar ? <img src={avatarSrc(user.avatar)} alt="" /> : <DefaultAvatar />;
  if (!id) return <span className={className}>{ava}<span>{label}</span></span>;
  return (
    <Link to={`/profile/${id}`} className={className} title={`View ${label}'s profile`}>
      {ava}
      <span>{label}</span>
    </Link>
  );
}
