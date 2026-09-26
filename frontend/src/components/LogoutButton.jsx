import { useNavigate } from "react-router-dom";
import { logoutUser, clearTokens } from "../lib/api.js";
import { clearProfileCache } from "../lib/userCache.js";

export default function LogoutButton() {
  const navigate = useNavigate();

  async function go() {
    try {
      await logoutUser();
    } catch {
      /* even if the backend call fails, clear locally */
    }
    clearTokens();
    clearProfileCache();
    navigate("/");
  }

  return (
    <button className="logout-btn" onClick={go} title="Logout" aria-label="Logout">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
        <path d="M16 17l5-5-5-5M21 12H9" />
      </svg>
    </button>
  );
}
