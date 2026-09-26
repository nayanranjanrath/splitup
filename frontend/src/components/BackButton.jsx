import { useLocation, useNavigate } from "react-router-dom";

/** Floating back button for easy navigation (hidden on the landing page). */
export default function BackButton() {
  const navigate = useNavigate();
  const location = useLocation();
  if (location.pathname === "/") return null;
  return (
    <button className="back-fab" onClick={() => navigate(-1)} aria-label="Go back" title="Back">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 12H5M12 19l-7-7 7-7" />
      </svg>
    </button>
  );
}
