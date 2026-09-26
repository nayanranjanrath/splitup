import { NavLink } from "react-router-dom";
import { ExploreIcon, CreateIcon, MessageCircleIcon, GroupIcon } from "./icons.jsx";

/**
 * Floating vertical navigation rail (left side).
 * Desktop: slim icon-only rail; hovering an item opens a small glass
 * flyout window with its label + hint (the rail itself never expands).
 * Mobile: compact bottom bar with icon + label.
 * No Home (the logo is home), no Notifications (bell stays top-right).
 */
const ITEMS = [
  {
    to: "/search",
    label: "Explore",
    desc: "Find plans & open seats",
    icon: <ExploreIcon size={23} strokeWidth={1.7} />,
  },
  {
    to: "/create",
    label: "Create Split",
    desc: "Publish a new split",
    primary: true,
    icon: <CreateIcon size={23} strokeWidth={1.9} />,
  },
  {
    to: "/discuss",
    label: "Discuss Split",
    desc: "Chat with your group",
    icon: <MessageCircleIcon size={23} strokeWidth={1.8} />,
  },
  {
    to: "/groups",
    label: "My Groups",
    desc: "Your shared circles",
    icon: <GroupIcon size={23} strokeWidth={1.7} />,
  },
];

export default function NavRail() {
  return (
    <nav className="nrail" aria-label="SplitUp sections">
      {ITEMS.map((it) => (
        <NavLink
          key={it.to}
          to={it.to}
          className={({ isActive }) =>
            `nrail-item ${it.primary ? "primary" : ""} ${isActive ? "active" : ""}`
          }
        >
          <span className="nrail-ico">{it.icon}</span>
          {/* label: hidden on desktop until hover, always on mobile bar */}
          <span className="nrail-label">{it.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
