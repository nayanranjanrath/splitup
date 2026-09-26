import { useEffect, useState } from "react";
import AppFrame from "../components/AppFrame.jsx";
import UserLink from "../components/UserLink.jsx";
import { getNotifications, parseNotifications } from "../lib/api.js";
import Reveal from "../components/Reveal.jsx";

function Stub({ eyebrow, title, desc, icon }) {
  return (
    <>
      <Reveal>
        <span className="eyebrow">{eyebrow}</span>
        <h1 className="home-hello">{title}</h1>
      </Reveal>
      <Reveal variant="blur" delay={140}>
        <p className="home-sub">{desc}</p>
      </Reveal>
      <Reveal variant="zoom" delay={220} className="home-card stub-card">
        <div className="icon">{icon}</div>
        <h3>Wiring next</h3>
        <p>
          This section lights up as soon as the backend routes arrive — the navigation, theme and
          layout are ready for it.
        </p>
        <span className="soon">coming with your next api batch</span>
      </Reveal>
    </>
  );
}

export function CreateSplitPage() {
  return (
    <AppFrame>
      <Stub
        eyebrow="Primary action"
        title="Create a split"
        desc="Publish a subscription plan, set the price, slots and validity — and let others join your split."
        icon={
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round">
            <path d="M12 5v14M5 12h14" />
          </svg>
        }
      />
    </AppFrame>
  );
}

export function DiscussSplitPage() {
  return (
    <AppFrame>
      <Stub
        eyebrow="Group chat"
        title="Discuss splits"
        desc="Talk it through with your group — renewals, seats, payments — without leaving SplitUp."
        icon={
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 12a8 8 0 0 1-8 8H5.5L3 22V12a8 8 0 0 1 8-8h2a8 8 0 0 1 8 8Z" />
          </svg>
        }
      />
    </AppFrame>
  );
}

export function MyGroupsPage() {
  return (
    <AppFrame>
      <Stub
        eyebrow="Your circles"
        title="My groups"
        desc="Every group you share with — members, seats and payment shares at a glance."
        icon={
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
            <circle cx="9" cy="8.5" r="3.5" />
            <path d="M2.5 20c.8-3.4 3.4-5 6.5-5s5.7 1.6 6.5 5" />
            <path d="M16 5.5a3 3 0 0 1 0 6M18.5 15.5c1.7.8 2.7 2.2 3 4.5" />
          </svg>
        }
      />
    </AppFrame>
  );
}

export function PaymentsPage() {
  return (
    <AppFrame>
      <Stub
        eyebrow="Money matters"
        title="Payments"
        desc="Every share, tracked and transparent — see who paid, who's due, and when the next cycle lands."
        icon={
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
            <rect x="2.5" y="5.5" width="19" height="13" rx="2.5" />
            <path d="M2.5 10h19M6 14.5h4" />
          </svg>
        }
      />
    </AppFrame>
  );
}

export function NotificationsPage() {
  const [notifs, setNotifs] = useState(null);
  useEffect(() => {
    let alive = true;
    getNotifications()
      .then((d) => {
        if (alive) setNotifs(parseNotifications(d));
        window.dispatchEvent(new Event("splitup:notif-changed"));
      })
      .catch(() => alive && setNotifs([]));
    return () => {
      alive = false;
    };
  }, []);

  return (
    <AppFrame>
      <Reveal>
        <span className="eyebrow">Inbox</span>
        <h1 className="home-hello">Notifications</h1>
      </Reveal>
      <div className="review-list" style={{ marginTop: 24, maxWidth: 640 }}>
        {notifs === null ? (
          <p className="notif-empty">Loading…</p>
        ) : notifs.length === 0 ? (
          <p className="notif-empty">You're all caught up ✨</p>
        ) : (
          notifs.map((n, i) => (
            <Reveal key={i} variant="zoom" delay={(i % 4) * 60} className="review-card">
              <div className="review-top">
                <UserLink user={n?.sender || n?.user} name={n?.sender?.profilename || "SplitUp"} />
                <span className="notif-time">{n?.createdAt ? new Date(n.createdAt).toLocaleString() : ""}</span>
              </div>
              <p className="review-text">{n?.message || n?.text || ""}</p>
            </Reveal>
          ))
        )}
      </div>
    </AppFrame>
  );
}
