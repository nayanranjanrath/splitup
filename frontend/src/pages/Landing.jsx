import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { LogoMark, Wordmark } from "../components/Logo.jsx";
import Reveal from "../components/Reveal.jsx";
import Words from "../components/Words.jsx";
import Atmosphere from "../components/Atmosphere.jsx";
import ThemeToggle from "../components/ThemeToggle.jsx";
import PlateVideo from "../components/PlateVideo.jsx";
import { useMode } from "../lib/theme.js";
import { LIGHT_VIDEO_SRC } from "../lib/video.js";
import { hasAccessToken, hasRefreshToken, API_URL } from "../lib/api.js";

const NAV = [
  { label: "About", href: "#about" },
  { label: "Features", href: "#features" },
  { label: "FAQ", href: "#faq" },
  { label: "Contact", href: "#contact" },
];

const FEATURES = [
  {
    title: "Discover plans",
    desc: "Browse available plans and find the perfect split for the services you already use.",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
        <circle cx="10.5" cy="10.5" r="6.5" />
        <path d="M15.5 15.5 21 21" />
      </svg>
    ),
  },
  {
    title: "Create or join groups",
    desc: "Start your own group, or join an existing one that fits the plan you want.",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
        <circle cx="9" cy="8.5" r="3.5" />
        <path d="M2.5 20c.8-3.4 3.4-5 6.5-5s5.7 1.6 6.5 5" />
        <path d="M16 5.5a3 3 0 0 1 0 6M18.5 15.5c1.7.8 2.7 2.2 3 4.5" />
      </svg>
    ),
  },
  {
    title: "Manage members",
    desc: "Invite people, assign seats and roles, and keep your group organized as it changes.",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
        <path d="M4 6h16M4 12h16M4 18h10" />
        <circle cx="19" cy="18" r="2.2" />
      </svg>
    ),
  },
  {
    title: "Track payments",
    desc: "See every member's share at a glance — clear, fair and transparent, every cycle.",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
        <rect x="2.5" y="5.5" width="19" height="13" rx="2.5" />
        <path d="M2.5 10h19M6 14.5h4" />
      </svg>
    ),
  },
  {
    title: "Group chat",
    desc: "Coordinate renewals, seats and decisions with your group — all from one place.",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
        <path d="M21 12a8 8 0 0 1-8 8H5.5L3 22V12a8 8 0 0 1 8-8h2a8 8 0 0 1 8 8Z" />
      </svg>
    ),
  },
  {
    title: "Built on trust",
    desc: "Secure accounts, private groups and honest rules — sharing without the awkwardness.",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2.5 20 6v6c0 5-3.4 8.3-8 9.5C7.4 20.3 4 17 4 12V6l8-3.5Z" />
        <path d="m8.8 12 2.2 2.2 4.4-4.4" />
      </svg>
    ),
  },
];

const STEPS = [
  {
    num: "01",
    title: "Discover",
    desc: "Explore available plans and see what sharing a subscription could save you.",
    variant: "left",
  },
  {
    num: "02",
    title: "Create or join",
    desc: "Start a group with friends, or join an existing group with an open seat.",
    variant: "",
  },
  {
    num: "03",
    title: "Split & enjoy",
    desc: "Manage members, track payments and chat with your group — everyone pays less.",
    variant: "right",
  },
];

const FAQS = [
  {
    q: "What is SplitUp?",
    a: "SplitUp is a platform that makes subscription sharing simple and organized. You can discover available plans, create or join groups, manage members and payments, and communicate with your group — all from one place.",
  },
  {
    q: "How do I join a group?",
    a: "Browse available groups from the plans page, request to join one with an open seat, and the group admin approves your request. You can also create your own group and invite friends directly.",
  },
  {
    q: "How are payments managed?",
    a: "Every member's share is calculated and tracked for each billing cycle, with a clear, transparent payment history so nobody has to do the math or chase anyone down.",
  },
  {
    q: "What happens if a member leaves?",
    a: "Their seat opens up and the group admin can invite a new member. The group's history stays intact, and shares are recalculated automatically.",
  },
  {
    q: "Is SplitUp free to use?",
    a: "Yes — creating an account, joining groups and managing your subscriptions is free. Premium features may be introduced later, but the core experience stays simple.",
  },
];

export default function Landing() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [faqOpen, setFaqOpen] = useState(0);
  const mode = useMode();
  const location = useLocation();
  const navigate = useNavigate();

  // Session-aware entry:
  //  - accesstoken  → straight to /home
  //  - refreshtoken only → /login
  //  - neither → landing (with a silent probe in case cookies are httpOnly)
  useEffect(() => {
    if (hasAccessToken()) return navigate("/home", { replace: true });
    if (hasRefreshToken()) return navigate("/login", { replace: true });
    let cancelled = false;
    fetch(API_URL + "/getnotificationcount", { credentials: "include" })
      .then((r) => {
        if (r.ok && !cancelled) navigate("/home", { replace: true });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const [toast, setToast] = useState(
    location.state?.authError
      ? { type: "error", msg: location.state.authError }
      : location.state?.authSuccess
        ? { type: "success", msg: location.state.authSuccess }
        : null
  );

  useEffect(() => {
    // clear the navigation state so refresh doesn't re-show the toast
    if (location.state) window.history.replaceState({}, "");
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 7000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    const onResize = () => {
      if (window.innerWidth / window.innerHeight > 1.1) setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return (
    <div className={open ? "is-open" : ""}>
      {/* Living background — drifts + gradually shifts color per section */}
      <Atmosphere />

      {toast && (
        <div className={`toast ${toast.type}`} role="status">
          <span>{toast.msg}</span>
          <button className="toast-x" onClick={() => setToast(null)} aria-label="Dismiss">
            ×
          </button>
        </div>
      )}

      {/* ── Header ─────────────────────────────────────────────── */}
      <header className={`topbar ${scrolled ? "scrolled" : ""}`}>
        <Link to="/" className="brand" aria-label="SplitUp home">
          <LogoMark className="mark" />
          <Wordmark />
        </Link>

        <nav className="links" aria-label="Primary">
          {NAV.map((n) => (
            <a key={n.href} href={n.href}>
              {n.label}
            </a>
          ))}
        </nav>

        <div className="auth-cluster">
          <ThemeToggle />
          <Link to="/login" className="login-ghost">
            Log in
          </Link>
          <Link to="/register" className="pill pill-nav">
            <span>Register</span>
          </Link>
        </div>

        <button
          className="burger"
          aria-expanded={open}
          aria-controls="menu"
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((v) => !v)}
        >
          <i />
          <i />
        </button>
      </header>

      {/* ── Mobile menu ────────────────────────────────────────── */}
      <nav className="menu" id="menu" aria-hidden={!open} aria-label="Menu">
        <div className="menu-inner">
          <p className="menu-eyebrow stagger">Menu</p>
          <ul className="menu-list">
            {NAV.map((n) => (
              <li key={n.href} className="stagger">
                <a href={n.href} onClick={() => setOpen(false)}>
                  {n.label}
                </a>
              </li>
            ))}
          </ul>
          <div className="menu-foot stagger">
            <Link to="/register" className="pill" onClick={() => setOpen(false)}>
              <span>Register</span>
            </Link>
            <Link to="/login" className="ghost-btn" onClick={() => setOpen(false)}>
              Log in
            </Link>
            <ThemeToggle className="menu-toggle" />
          </div>
        </div>
      </nav>

      {/* ── Hero ───────────────────────────────────────────────── */}
      <section className="hero-stage" id="top" data-theme="hero">
        <div className="plate">
          <PlateVideo />
          <video
            className="plate-video-light anim-fade"
            src={LIGHT_VIDEO_SRC}
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
            aria-hidden="true"
          />
        </div>

        <main className="hero">
          <h1 className="headline">
            <span>Split the cost.</span>
            <span>Share with ease.</span>
          </h1>

          <p className="sub">
            <span>SplitUp makes subscription sharing simple and organized.</span>
            <span>Discover plans, join groups, and pay less — together.</span>
          </p>

          <div className="actions">
            <Link to="/register" className="pill pill-cta">
              <span>Get Started</span>
            </Link>
            <a href="#about" className="ghost-cta">
              How it works
            </a>
          </div>
        </main>

        <div className="scroll-hint">Scroll</div>
      </section>

      {/* ── About ─────────────────────────────────────────────── */}
      <section className="section" data-section data-theme="about" id="about">
        <div className="section-inner">
          <Reveal>
            <span className="eyebrow">About SplitUp</span>
          </Reveal>
          <Words className="h2" lines={["Split the cost of subscriptions", "with ease."]} />
          <Reveal variant="blur" delay={200}>
            <p className="lede" style={{ marginTop: 26 }}>
              SplitUp is a platform designed to make subscription sharing simple and organized.
              Discover available plans, create or join groups, manage members and payments, and
              communicate with your group — all from one place.
            </p>
          </Reveal>

          <div style={{ marginTop: "clamp(56px, 9vh, 96px)" }}>
            <Reveal variant="left">
              <p className="stat-line">
                Less cost<span className="dim">.</span>
              </p>
            </Reveal>
            <Reveal variant="left" delay={130}>
              <p className="stat-line">
                Less hassle<span className="dim">.</span>
              </p>
            </Reveal>
            <Reveal variant="left" delay={260}>
              <p className="stat-line">
                More sharing<span className="dim">.</span>
              </p>
            </Reveal>
          </div>
        </div>
      </section>

      <Reveal as="div" variant="draw" className="divider" />

      {/* ── Features ───────────────────────────────────────────── */}
      <section className="section" data-section data-theme="features" id="features">
        <div className="section-inner">
          <Reveal>
            <span className="eyebrow">Features</span>
          </Reveal>
          <Reveal variant="blur" delay={80}>
            <h2 className="h2">Everything sharing needs, in one place.</h2>
          </Reveal>

          <div className="feature-grid" style={{ marginTop: "clamp(40px, 6vh, 64px)" }}>
            {FEATURES.map((f, i) => (
              <Reveal key={f.title} variant="zoom" className="feature" delay={(i % 3) * 110 + Math.floor(i / 3) * 70}>
                <div className="icon">{f.icon}</div>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <Reveal as="div" variant="draw" className="divider" />

      {/* ── How it works ───────────────────────────────────────── */}
      <section className="section" data-section data-theme="how" id="how">
        <div className="section-inner">
          <Reveal>
            <span className="eyebrow">How it works</span>
          </Reveal>
          <Words className="h2" text="Three steps to paying less." />

          <div className="steps" style={{ marginTop: "clamp(44px, 7vh, 72px)" }}>
            {STEPS.map((s, i) => (
              <Reveal key={s.num} variant={s.variant} className="step" delay={i * 140}>
                <div className="num">{s.num}</div>
                <h3>{s.title}</h3>
                <p>{s.desc}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Banner CTA ─────────────────────────────────────────── */}
      <section className="banner" data-theme="banner">
        <h2 className="big">
          <Words as="span" text="Less cost. Less hassle." delay={0} />
          <Words as="span" className="accent" text="More sharing." delay={380} />
        </h2>
        <Reveal variant="blur" delay={550}>
          <p className="sub">
            Create your account in under a minute and start sharing the subscriptions you already
            love.
          </p>
        </Reveal>
        <Reveal variant="zoom" delay={680}>
          <Link to="/register" className="pill">
            <span>Get Started</span>
          </Link>
        </Reveal>
      </section>

      <Reveal as="div" variant="draw" className="divider" />

      {/* ── FAQ ────────────────────────────────────────────────── */}
      <section className="section" data-section data-theme="faq" id="faq">
        <div className="section-inner">
          <Reveal>
            <span className="eyebrow">FAQ</span>
          </Reveal>
          <Reveal variant="blur" delay={80}>
            <h2 className="h2">Questions, answered.</h2>
          </Reveal>

          <div className="faq-list" style={{ marginTop: "clamp(36px, 5vh, 54px)" }}>
            {FAQS.map((f, i) => (
              <Reveal key={f.q} variant="left" delay={i * 70}>
                <div className={`faq-item ${faqOpen === i ? "open" : ""}`}>
                  <button className="faq-q" onClick={() => setFaqOpen(faqOpen === i ? -1 : i)} aria-expanded={faqOpen === i}>
                    {f.q}
                    <span className="chev">
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
                        <path d="M6 1v10M1 6h10" />
                      </svg>
                    </span>
                  </button>
                  <div className="faq-a">
                    <p>{f.a}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <Reveal as="div" variant="draw" className="divider" />

      {/* ── Contact ───────────────────────────────────────────── */}
      <section className="section" data-section data-theme="contact" id="contact">
        <div className="section-inner">
          <Reveal>
            <span className="eyebrow">Contact</span>
          </Reveal>
          <Words className="h2" text="Talk to us." />

          <div className="contact-grid" style={{ marginTop: "clamp(40px, 6vh, 64px)" }}>
            <Reveal variant="left" delay={120}>
              <div className="contact-meta">
                <p>
                  Questions, feedback, or partnership ideas — we read everything.
                  <br />
                  <strong>hello@splitup.app</strong>
                </p>
                <p>
                  Typically replies within <strong>24 hours</strong>.
                </p>
                <p style={{ color: "var(--strip)", fontSize: 13.5 }}>
                  SplitUp — split the cost of subscriptions with ease.
                </p>
              </div>
            </Reveal>

            <Reveal variant="right" delay={200}>
              <form
                className="auth-form"
                onSubmit={(e) => {
                  e.preventDefault();
                  const fd = new FormData(e.currentTarget);
                  const subject = encodeURIComponent(`SplitUp message from ${fd.get("name")}`);
                  const body = encodeURIComponent(`${fd.get("message")}\n\n— ${fd.get("name")} (${fd.get("email")})`);
                  window.location.href = `mailto:hello@splitup.app?subject=${subject}&body=${body}`;
                }}
              >
                <div className="field">
                  <label htmlFor="c-name">Name</label>
                  <input id="c-name" name="name" required maxLength={40} placeholder="Your name" />
                </div>
                <div className="field">
                  <label htmlFor="c-email">Email</label>
                  <input id="c-email" name="email" type="email" required maxLength={60} placeholder="you@example.com" />
                </div>
                <div className="field">
                  <label htmlFor="c-msg">Message</label>
                  <textarea id="c-msg" name="message" rows={4} required maxLength={500} placeholder="How can we help?" />
                </div>
                <button type="submit" className="pill">
                  <span>Send message</span>
                </button>
              </form>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────── */}
      <footer className="footer">
        <div className="footer-inner">
          <div className="fbrand">
            <LogoMark className="fmark" />
            <Wordmark className="small" />
          </div>
          <nav>
            {NAV.map((n) => (
              <a key={n.href} href={n.href}>
                {n.label}
              </a>
            ))}
          </nav>
          <span>© {new Date().getFullYear()} SplitUp. All rights reserved.</span>
        </div>
      </footer>
    </div>
  );
}
