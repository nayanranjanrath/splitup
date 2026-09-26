import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { LogoMark, Wordmark } from "../components/Logo.jsx";
import ThemeToggle from "../components/ThemeToggle.jsx";
import FilledBellIcon from "../components/FilledBellIcon.jsx";
import Reveal from "../components/Reveal.jsx";
import Atmosphere from "../components/Atmosphere.jsx";
import ParticleDrift from "../components/ParticleDrift.jsx";
import UserChip from "../components/UserChip.jsx";
import UserLink from "../components/UserLink.jsx";
import PriceTag from "../components/PriceTag.jsx";
import PlatformLogo from "../components/PlatformLogo.jsx";
import RequestDetailsModal from "../components/RequestDetailsModal.jsx";
import { SkeletonCard, SkeletonRow } from "../components/Skeleton.jsx";
import NavRail from "../components/NavRail.jsx";
import ApplicantsModal from "../components/ApplicantsModal.jsx";
import { PlatformRow } from "../components/PlatformLogos.jsx";
import SearchFilters from "../components/SearchFilters.jsx";
import { BookmarkIcon, MessageCircleIcon, SearchIcon } from "../components/icons.jsx";
import { useMode } from "../lib/theme.js";
import { getCachedProfile } from "../lib/userCache.js";
import {
  getNotificationCount,
  getNotifications,
  getMyRequests,
  getMyApplies,
  deleteRequest,
  showRequestStatus,
  avatarSrc,
  parseCount,
  parseNotifications,
} from "../lib/api.js";

const isObjectId = (s) => typeof s === "string" && /^[0-9a-fA-F]{24}$/.test(s);
const platName = (r) => {
  const p = r?.platformname;
  if (!p) return "";
  if (typeof p === "object") return p.platformname || p.name || "";
  return isObjectId(p) ? "" : p;
};
const money = (n) => (n != null && n !== "" ? `₹${n}` : "");
const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" }) : "";
const asList = (v) => (Array.isArray(v) ? v : []);

function MemberChips({ members }) {
  if (!members?.length) return <span className="none">No members yet</span>;
  return (
    <div className="member-row">
      {members.map((m, i) => (
        <UserLink key={i} user={typeof m === "string" ? null : m} name={typeof m === "string" ? m : undefined} />
      ))}
    </div>
  );
}

function StatusPill({ status }) {
  const s = (status || "open").toLowerCase();
  return <span className={`status-pill s-${s}`}>{s}</span>;
}

/* ── myrequest card: 3 fields collapsed, everything on "view more" ── */
export function RequestCard({ r, delay, onApplicants, onDelete }) {
  const [open, setOpen] = useState(false);
  const [arm, setArm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const members = asList(r?.members);
  const platObj =
    r?.platform && typeof r.platform === "object"
      ? r.platform
      : typeof r?.platformname === "object"
        ? r.platformname
        : null;
  const rawPlat = r?.platformname;
  const pid =
    platObj?._id ||
    (typeof rawPlat === "string" && /^[0-9a-fA-F]{24}$/.test(rawPlat) ? rawPlat : null);
  const pname =
    platObj?.platformname ||
    (typeof rawPlat === "string" && !/^[0-9a-fA-F]{24}$/.test(rawPlat) ? rawPlat : "") ||
    "";

  async function del() {
    setDeleting(true);
    try {
      await deleteRequest(r?._id);
      onDelete?.(r?._id);
    } catch {
      setDeleting(false);
      setArm(false);
    }
  }
  return (
    <Reveal variant="zoom" delay={delay} className={`req-card ${open ? "open" : ""}`}>
      <div className="req-top">
        <PlatformLogo pid={pid} name={pname} />
        <div className="req-data">
          <h3>{r?.planname || "Plan"}</h3>
          <p className="req-plat">
            {pid ? <Link to={`/platform/${pid}`}>{pname || "Platform"}</Link> : pname || "Platform"}
          </p>
          <div className="req-mid">
            <PriceTag price={r?.planprice} slots={r?.totalslots} per={r?.perpersoncost} />
            <i>·</i>
            <span>{members.length}/{r?.totalslots ?? "—"} seats</span>
          </div>
        </div>
        <StatusPill status={r?.status} />
      </div>

      <div className="req-more">
        <div className="req-more-in">
          <div className="req-rows">
            <div><span>Plan price</span><strong>{money(r?.planprice) || "—"}</strong></div>
            <div><span>Total slots</span><strong>{r?.totalslots ?? "—"}</strong></div>
            <div><span>Filled</span><strong>{members.length}</strong></div>
            <div><span>Expires</span><strong>{fmtDate(r?.expiresAt) || "—"}</strong></div>
          </div>
          <p className="req-label">Members</p>
          <MemberChips members={members} />
        </div>
      </div>

      <div className="card-actions">
        <button className="more-btn" onClick={() => setOpen((v) => !v)} aria-expanded={open}>
          {open ? "Show less" : "View more"}
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
            <path d="m2 4.5 4 4 4-4" />
          </svg>
        </button>
        <button className="more-btn applicants" onClick={() => onApplicants(r?._id)}>
          Applicants
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
            <circle cx="9" cy="8.5" r="3.5" />
            <path d="M2.5 20c.8-3.4 3.4-5 6.5-5s5.7 1.6 6.5 5" />
            <path d="M16 5.5a3 3 0 0 1 0 6M18.5 15.5c1.7.8 2.7 2.2 3 4.5" />
          </svg>
        </button>
        <button
          className={`more-btn delete ${arm ? "armed" : ""}`}
          disabled={deleting}
          onClick={() => {
            if (!arm) {
              setArm(true);
              setTimeout(() => setArm(false), 2500);
            } else {
              del();
            }
          }}
        >
          {deleting ? "Deleting…" : arm ? "Confirm?" : "Delete"}
          {!arm && (
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
            </svg>
          )}
        </button>
      </div>
      {members.length > 0 && (
        <p className="card-members">
          {members.map((m) => (typeof m === "string" ? m : m?.profilename)).filter(Boolean).join(" · ")}
        </p>
      )}
    </Reveal>
  );
}

/* ── myapply card: platform + requester collapsed, rest on show more ── */
export function ApplyCard({ a, delay, status, onDetails }) {
  const [open, setOpen] = useState(false);
  const req = a?.request || a || {};
  const requester = req?.requister;
  const members = asList(req?.members);
  const reqImg =
    req?.platformimage ||
    (typeof req?.platformname === "object" ? req?.platformname?.platformimage : "") ||
    a?.platformimage ||
    "";
  const reqPid =
    (typeof req?.platformname === "object" ? req?.platformname?._id : null) ||
    (/^[0-9a-fA-F]{24}$/.test(req?.platformname || "") ? req.platformname : null);
  return (
    <Reveal variant="zoom" delay={delay} className={`req-card ${open ? "open" : ""}`}>
      <div className="req-top">
        {reqImg ? (
          <img className="req-logo" src={reqImg} alt="" />
        ) : (
          <PlatformLogo pid={reqPid} name={platName(req)} />
        )}
        <div className="req-data">
          <h3>{req?.planname || "Plan"}</h3>
          <p className="req-plat">
            {reqPid ? (
              <Link to={`/platform/${reqPid}`}>{platName(req) || "Platform"}</Link>
            ) : (
              platName(req) || "Platform"
            )}
            {" · by "}
            <UserLink user={requester} name={requester?.profilename || "—"} />
          </p>
        </div>
        <div className="pills-col">
          <StatusPill status={a?.status || req?.status} />
          {status && <StatusPill status={status} />}
        </div>
      </div>
      {members.length > 0 && (
        <p className="card-members">
          {members.map((m) => (typeof m === "string" ? m : m?.profilename)).filter(Boolean).join(" · ")}
        </p>
      )}

      <div className="req-more">
        <div className="req-more-in">
          <div className="req-rows">
            <div><span>Plan</span><strong>{req?.planname || "—"}</strong></div>
            <div><span>Plan price</span><strong>{money(req?.planprice) || "—"}</strong></div>
            <div><span>Total slots</span><strong>{req?.totalslots ?? "—"}</strong></div>
            <div><span>Expires</span><strong>{fmtDate(req?.expiresAt) || "—"}</strong></div>
          </div>
          <p className="req-label">Requester</p>
          <MemberChips members={requester ? [requester] : []} />
          <p className="req-label">Members</p>
          <MemberChips members={members.map((m) => (typeof m === "string" ? { profilename: m } : m))} />
        </div>
      </div>

      <button className="more-btn" onClick={() => onDetails((a?.request?._id || a?.request))}>
        View more
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
          <path d="m2 4.5 4 4 4-4" />
        </svg>
      </button>
    </Reveal>
  );
}

export default function HomePage() {
  const mode = useMode();
  const [profile, setProfile] = useState(null);
  const [count, setCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [notifs, setNotifs] = useState(null);
  const [requests, setRequests] = useState(null);
  const [applies, setApplies] = useState(null);
  const [applicantsFor, setApplicantsFor] = useState(null);
  const [detailsFor, setDetailsFor] = useState(null);
  const [zoomN, setZoomN] = useState(null);
  const [statusMap, setStatusMap] = useState({});
  const [reqErr, setReqErr] = useState("");
  const [applyErr, setApplyErr] = useState("");
  const bellRef = useRef(null);
  const bellBtnRef = useRef(null);
  const popRef = useRef(null);

  useEffect(() => {
    (async () => {
      try {
        setProfile(await getCachedProfile());
      } catch {
        setProfile({ profilename: "", avatar: "" });
      }
      try {
        setCount(parseCount(await getNotificationCount()));
      } catch { /* 403 flow handled in apiFetch */ }
      try {
        const d = await getMyRequests();
        setRequests(
          asList(
            Array.isArray(d)
              ? d
              : d?.requests || d?.myrequest || d?.list || d?.results || d?.data
          )
        );
      } catch (e) {
        setRequests([]);
        setReqErr(e?.message || "");
      }
      try {
        const d = await getMyApplies();
        const list = asList(
          Array.isArray(d)
            ? d
            : d?.requests || d?.applies || d?.applications || d?.myapply || d?.list || d?.results || d?.data
        );
        setApplies(list);
        // fetch each application's live status (accepted / pending / …)
        const ids = [
          ...new Set(list.map((a) => a?.request?._id || a?.request).filter(Boolean)),
        ];
        if (ids.length) {
          const entries = await Promise.all(
            ids.map(async (id) => {
              try {
                const s = await showRequestStatus(id);
                return [id, (s?.status || "").toLowerCase()];
              } catch {
                return [id, ""];
              }
            })
          );
          setStatusMap(Object.fromEntries(entries.filter(([, v]) => v)));
        }
      } catch (e) {
        setApplies([]);
        setApplyErr(e?.message || "");
      }
    })();
  }, []);

  // keep the bell badge correct: refresh after reading + after actions that create notifications
  const refreshCount = async () => {
    try {
      setCount(parseCount(await getNotificationCount()));
    } catch { /* offline / logged out */ }
  };

  useEffect(() => {
    const onNotif = () => refreshCount();
    window.addEventListener("splitup:notif-changed", onNotif);
    return () => window.removeEventListener("splitup:notif-changed", onNotif);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (open || notifs === null) return;
    refreshCount(); // popup opened → backend marked them seen → badge clears
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // application statuses (accepted / pending) via the fixed /showrequeststatus
  useEffect(() => {
    if (!applies?.length) return;
    let alive = true;
    (async () => {
      const m = {};
      await Promise.all(
        applies.map(async (a) => {
          const rid = a?.request?._id || a?.request;
          if (!rid) return;
          try {
            const d = await showRequestStatus(rid);
            const st = (d?.status || "").toLowerCase();
            if (st) m[rid] = st;
          } catch { /* ignore */ }
        })
      );
      if (alive) setStatusMap(m);
    })();
    return () => {
      alive = false;
    };
  }, [applies]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e) => {
      if (
        popRef.current && !popRef.current.contains(e.target) &&
        bellBtnRef.current && !bellBtnRef.current.contains(e.target)
      ) {
        setOpen(false);
      }
    };
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  async function toggleBell() {
    const next = !open;
    setOpen(next);
    bellRef.current?.startAnimation?.();
    if (next) {
      // always fetch fresh notifications when the bell opens (no stale list)
      try {
        setNotifs(parseNotifications(await getNotifications()));
        refreshCount();
      } catch {
        setNotifs([]);
      }
    }
  }

  const src = profile ? avatarSrc(profile.avatar) : "";
  const name = profile?.profilename || "";
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [homeFiltersOpen, setHomeFiltersOpen] = useState(false);
  const [homeFilters, setHomeFilters] = useState({
    categoryid: "",
    minprice: "",
    maxprice: "",
    minmember: "",
    maxmember: "",
    planvalidityday: "",
    slots: "",
  });

  const patchHomeFilter = (k, v) => setHomeFilters((f) => ({ ...f, [k]: v }));
  const toggleHomeCat = (id) =>
    setHomeFilters((f) => {
      const cur = (f.categoryid || "").split(",").filter(Boolean);
      const i = cur.indexOf(id);
      if (i >= 0) cur.splice(i, 1);
      else cur.push(id);
      return { ...f, categoryid: cur.join(",") };
    });

  function goSearch(e) {
    e.preventDefault();
    const params = new URLSearchParams();
    const q = query.trim();
    if (q) params.set("searchtext", q);
    Object.entries(homeFilters).forEach(([k, v]) => {
      if (v) params.set(k, v);
    });
    if (q || params.toString()) navigate(`/search?${params.toString()}`);
  }

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

        <form className="nav-search" role="search" onSubmit={goSearch}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
            <circle cx="10.5" cy="10.5" r="6.5" />
            <path d="M15.5 15.5 21 21" />
          </svg>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search plans, platforms…"
              aria-label="Search splits"
              maxLength={50}
            />
          <button
            type="button"
            className={`filter-toggle ${homeFiltersOpen ? "on" : ""}`}
            onClick={() => setHomeFiltersOpen((v) => !v)}
            aria-expanded={homeFiltersOpen}
            title="Filters"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <path d="M4 6h16M7 12h10M10 18h4" />
            </svg>
          </button>
          <button type="submit" className="pill">
            <span>Search</span>
          </button>
        </form>

        {homeFiltersOpen && (
          <div className="nav-filter-pop">
            <SearchFilters value={homeFilters} onPatch={patchHomeFilter} onToggleCat={toggleHomeCat} />
            <p className="pop-hint">Filters apply when you hit Search.</p>
          </div>
        )}

        <div className="home-right">
          <div className="notif-wrap">
            <button
              ref={bellBtnRef}
              className="bell-btn"
              onClick={toggleBell}
              aria-label={`Notifications${count ? ` (${count} new)` : ""}`}
              aria-expanded={open}
            >
              <FilledBellIcon ref={bellRef} size={20} />
              {count > 0 && <span className="bell-badge">{count > 99 ? "99+" : count}</span>}
            </button>

            {open && (
              <div className="notif-pop" ref={popRef} role="dialog" aria-label="Notifications">
                <div className="notif-head">
                  <span>Notifications</span>
                  {count > 0 && <span className="notif-count">{count} new</span>}
                </div>
                <div className="notif-list">
                  {notifs === null && <p className="notif-empty">Loading…</p>}
                  {notifs !== null && notifs.length === 0 && (
                    <p className="notif-empty">You're all caught up ✨</p>
                  )}
                  {notifs !== null &&
                    notifs.map((n, i) => {
                      const msg =
                        n?.message || n?.text || n?.title || n?.content ||
                        (typeof n === "string" ? n : "Notification");
                      const time = n?.time || n?.createdAt || n?.created_at || n?.date || "";
                      return (
                        <button
                          type="button"
                          className="notif-item"
                          key={i}
                          style={{ cursor: "pointer", background: "none", border: 0, textAlign: "left", fontFamily: "inherit", width: "100%" }}
                          onClick={() => setZoomN({ msg, time })}
                        >
                          <span className="notif-dot" />
                          <div>
                            <p>{msg}</p>
                            {time && <span className="notif-time">{String(time)}</span>}
                          </div>
                        </button>
                      );
                    })}
                </div>
              </div>
            )}
          </div>

          <ThemeToggle />

          <UserChip />
        </div>
      </header>

      <main className="home-main">
        <Reveal>
          <span className="eyebrow">Your space</span>
          <h1 className="home-hello">
            Hey{name ? `, ${name}` : ""} —
            <br />
            ready to split less?
          </h1>
        </Reveal>
        <Reveal variant="blur" delay={140}>
          <p className="home-sub">
            Your requests, your applications and your groups — everything lives here.
          </p>
        </Reveal>

        {/* search + quick platforms */}
        <Reveal delay={200}>
          <p className="quick-label">Quick search</p>
          <PlatformRow />
        </Reveal>

        {/* ── my requests ── */}
        <section className="home-sec">
          <Reveal>
            <h2 className="home-sec-title">
              Your split requests
              <span className="sec-count">{requests ? requests.length : "…"}</span>
            </h2>
          </Reveal>
          {requests === null ? (
            <div className="req-grid">
              {[0, 1, 2].map((i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : requests.length === 0 ? (
            <>
              <p className="sec-empty">No split requests yet — create one and start sharing.</p>
              {reqErr && <p className="sec-empty err">⚠ {reqErr}</p>}
            </>
          ) : (
            <>
              <div className="req-grid">
                {requests.slice(0, 4).map((r, i) => (
                  <RequestCard
                    key={r?._id || i}
                    r={r}
                    delay={(i % 3) * 100}
                    onApplicants={setApplicantsFor}
                    onDelete={(id) => setRequests((p) => (p || []).filter((x) => x._id !== id))}
                  />
                ))}
              </div>
              {requests.length > 4 && (
                <Link to="/my-requests" className="home-more">
                  View all {requests.length} requests →
                </Link>
              )}
            </>
          )}
        </section>

        {/* ── my applications ── */}
        <section className="home-sec">
          <Reveal>
            <h2 className="home-sec-title">
              Where you've applied
              <span className="sec-count">{applies ? applies.length : "…"}</span>
            </h2>
          </Reveal>
          {applies === null ? (
            <div className="req-grid">
              {[0, 1, 2].map((i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : applies.length === 0 ? (
            <>
              <p className="sec-empty">You haven't applied to any group yet.</p>
              {applyErr && <p className="sec-empty err">⚠ {applyErr}</p>}
            </>
          ) : (
            <>
              <div className="req-grid">
                {applies.slice(0, 4).map((a, i) => {
                  return (
                    <ApplyCard
                      key={a?._id || i}
                      a={a}
                      delay={(i % 3) * 100}
                      status={statusMap[a?.request?._id || a?.request]}
                      onDetails={setDetailsFor}
                    />
                  );
                })}
              </div>
              {applies.length > 4 && (
                <Link to="/applied" className="home-more">
                  View all {applies.length} applications →
                </Link>
              )}
            </>
          )}
        </section>

        {/* ── coming next ── */}
        <section className="home-sec">
          <Reveal>
            <h2 className="home-sec-title">Coming next</h2>
          </Reveal>
          <div className="home-grid">
            {[
              {
                t: "Discover plans", to: "/search",
                d: "Browse subscription plans with open seats and see what you could save.",
                icon: <SearchIcon size={21} strokeWidth={1.7} />,
              },
              {
                t: "Discuss splits", to: "/discuss",
                d: "Talk it through with your group — renewals, seats and payment proofs.",
                icon: <MessageCircleIcon size={21} strokeWidth={1.7} />,
              },
              {
                t: "Saved requests", to: "/saved",
                d: "Requests you bookmarked with 🔖 — pick them up anytime from Explore.",
                icon: <BookmarkIcon size={21} strokeWidth={2.2} />,
              },
            ].map((c, i) => (
              <Reveal key={c.t} variant="zoom" className="home-card clickable" delay={i * 110}>
                <Link to={c.to} className="card-link">
                  <div className="icon">{c.icon}</div>
                  <h3>{c.t}</h3>
                  <p>{c.d}</p>
                  <span className="soon">open →</span>
                </Link>
              </Reveal>
            ))}
          </div>
        </section>
      </main>

      {detailsFor && (
        <RequestDetailsModal requestid={detailsFor} onClose={() => setDetailsFor(null)} />
      )}

      {zoomN && (
        <div className="notif-zoom" onClick={() => setZoomN(null)}>
          <div className="notif-zoom-card" onClick={(e) => e.stopPropagation()}>
            <span className="eyebrow">Notification</span>
            <p>{zoomN.msg}</p>
            {zoomN.time && <span className="notif-time">{String(zoomN.time)}</span>}
            <div>
              <button
                type="button"
                className="pill"
                style={{ marginTop: 16 }}
                onClick={() => {
                  setZoomN(null);
                  refreshCount();
                }}
              >
                <span>Mark as read & back</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {applicantsFor && (
        <ApplicantsModal requestid={applicantsFor} onClose={() => setApplicantsFor(null)} />
      )}
    </div>
  );
}
