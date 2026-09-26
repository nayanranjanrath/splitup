import { Link } from "react-router-dom";
import { LogoMark, Wordmark } from "./Logo.jsx";
import ThemeToggle from "./ThemeToggle.jsx";
import UserChip from "./UserChip.jsx";
import Atmosphere from "./Atmosphere.jsx";
import ParticleDrift from "./ParticleDrift.jsx";
import NavRail from "./NavRail.jsx";
import { useMode } from "../lib/theme.js";

/** Shared chrome for the newer app pages (create / discuss / groups). */
export default function AppFrame({ children }) {
  const mode = useMode();
  return (
    <div className="home">
      <Atmosphere />
      <ParticleDrift
        baseColor={mode === "light" ? "#8f86e8" : "#9ba3b0"}
        accentColor={mode === "light" ? "#6c5ce7" : "#f0b23e"}
      />
      <NavRail />

      <header className="home-top">
        <Link to="/home" className="home-brand" aria-label="SplitUp home">
          <LogoMark className="mark" />
          <Wordmark />
        </Link>
        <div className="home-right">
          <ThemeToggle />
          <UserChip />
        </div>
      </header>

      <main className="home-main" style={{ paddingTop: 120 }}>
        {children}
      </main>
    </div>
  );
}
