import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { LogoMark, Wordmark } from "../components/Logo.jsx";
import ThemeToggle from "../components/ThemeToggle.jsx";
import Atmosphere from "../components/Atmosphere.jsx";
import ParticleDrift from "../components/ParticleDrift.jsx";
import Reveal from "../components/Reveal.jsx";
import { PlatformRow } from "../components/PlatformLogos.jsx";
import SearchFilters from "../components/SearchFilters.jsx";
import UserChip from "../components/UserChip.jsx";
import UserLink from "../components/UserLink.jsx";
import PriceTag from "../components/PriceTag.jsx";
import PlatformLogo from "../components/PlatformLogo.jsx";
import { BookmarkIcon } from "../components/icons.jsx";
import RequestDetailsModal from "../components/RequestDetailsModal.jsx";
import { SkeletonCard } from "../components/Skeleton.jsx";
import NavRail from "../components/NavRail.jsx";
import ApplicantsModal from "../components/ApplicantsModal.jsx";
import { getCachedProfile } from "../lib/userCache.js";
import { applyForRequest, showRequestStatus, getMyApplies, deleteFalseRequests, saveRequest, showSavedRequests } from "../lib/api.js";
import { useMode } from "../lib/theme.js";
import { searchRequests, avatarSrc } from "../lib/api.js";

const FILTER_KEYS = [
  "searchtext",
  "categoryid",
  "minprice",
  "maxprice",
  "minmember",
  "maxmember",
  "planvalidityday",
  "slots",
];

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

function StatusPill({ status }) {
  const s = (status || "open").toLowerCase();
  return <span className={`status-pill s-${s}`}>{s}</span>;
}

/** Avatar with a default person pic when the user has none */
function Ava({ user }) {
  if (user?.avatar) return <img src={avatarSrc(user.avatar)} alt="" />;
  return (
    <svg viewBox="0 0 40 40" aria-hidden="true">
      <circle cx="20" cy="20" r="19" className="avatar-bg" />
      <circle cx="20" cy="15.5" r="6.2" className="avatar-fg" />
      <path d="M7.5 32.5c2-6.4 6.8-9.6 12.5-9.6s10.5 3.2 12.5 9.6" className="avatar-fg" />
    </svg>
  );
}

function ResultCard({ r, delay, mine, onApplicants, appliedIds, onDetails, saved, onSave }) {

  const [open, setOpen] = useState(false);
  const [applied, setApplied] = useState(false);
  const [aMsg, setAMsg] = useState("");
  const members = asList(r?.members);
  const requister = r?.requister;
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

  /* apply / accepted / requester(manage) via the fixed /showrequeststatus */
  const [myState, setMyState] = useState(null); // "apply" | "accepted" | "requester"
  useEffect(() => {
    if (!r?._id) return;
    let alive = true;
    showRequestStatus(r._id)
      .then((d) => {
        if (!alive) return;
        const st = (d?.status || "").toLowerCase();
        setMyState(st === "requester" ? "requester" : st === "accepted" ? "accepted" : "apply");
      })
      .catch(() => alive && setMyState("apply"));
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const finalState =
    myState === "requester" || myState === "accepted"
      ? myState
      : appliedIds?.has?.(r?._id)
        ? "applied"
        : myState;

  async function apply() {
    setAMsg("");
    try {
      await applyForRequest(r?._id);
      setApplied(true);
    } catch (e) {
      setAMsg(e.message || "Could not apply.");
    }
  }

  return (
    <Reveal variant="zoom" delay={delay} className={`req-card ${open ? "open" : ""}`}>
      <div className="req-top">
        {platObj?.platformimage ? (
          <img className="req-logo" src={platObj.platformimage} alt={pname || "platform"} />
        ) : (
          <PlatformLogo pid={pid} name={pname} />
        )}
        <div className="req-data">
          <h3>{r?.planname || "Plan"}</h3>
          <p className="req-plat">
            {pid ? <Link to={`/platform/${pid}`}>{pname || "Platform"}</Link> : pname || "Platform"}
            {" · by "}<UserLink user={requister} name={requister?.profilename || "?"} />
          </p>
          <div className="req-mid">
            <PriceTag price={r?.planprice} slots={r?.totalslots} per={r?.perpersoncost} />
            <i>·</i>
            <span>{members.length}/{r?.totalslots ?? "—"} seats</span>
          </div>
        </div>
        <span className="req-side">
          {!mine && (
            <button
              type="button"
              className={`save-corner ${saved ? "saved" : ""}`}
              onClick={() => !saved && onSave(r?._id)}
              aria-pressed={saved}
              title={saved ? "Saved" : "Save request"}
              aria-label={saved ? "Saved — bookmarked" : "Save request"}
            >
              <BookmarkIcon size={19} strokeWidth={2.8} filled={saved} />
            </button>
          )}
          <StatusPill status={r?.status} />
        </span>
      </div>
      {members.length > 0 && (
        <p className="card-members">
          {members.map((m) => (typeof m === "string" ? m : m?.profilename)).filter(Boolean).join(" · ")}
        </p>
      )}

      <div className="req-more">
        <div className="req-more-in">
          <div className="req-rows">
            <div><span>Plan price</span><strong>{money(r?.planprice) || "—"}</strong></div>
            <div><span>Total slots</span><strong>{r?.totalslots ?? "—"}</strong></div>
            <div><span>Validity</span><strong>{r?.planvalidityday ? `${r.planvalidityday} days` : "—"}</strong></div>
            <div><span>Expires</span><strong>{fmtDate(r?.expiresAt) || "—"}</strong></div>
          </div>
          <p className="req-label">Requested by</p>
          <UserLink user={requister} name={requister?.profilename || "—"} />
          <p className="req-label">Members</p>
          {members.length ? (
            <div className="member-row">
              {members.map((m, i) => (
                <UserLink key={i} user={typeof m === "string" ? null : m} name={typeof m === "string" ? m : undefined} />
              ))}
            </div>
          ) : (
            <span className="none">No members yet</span>
          )}
        </div>
      </div>

      <div className="card-actions">
        <button type="button" className="view-details" onClick={() => onDetails(r?._id)}>
          View details
        </button>
        <button className="more-btn" onClick={() => onDetails(r?._id)}>
          View more
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
            <path d="m2 4.5 4 4 4-4" />
          </svg>
        </button>
        {mine && (
          <button className="more-btn applicants" onClick={() => onApplicants(r?._id)}>
            Applicants
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
              <circle cx="9" cy="8.5" r="3.5" />
              <path d="M2.5 20c.8-3.4 3.4-5 6.5-5s5.7 1.6 6.5 5" />
              <path d="M16 5.5a3 3 0 0 1 0 6M18.5 15.5c1.7.8 2.7 2.2 3 4.5" />
            </svg>
          </button>
        )}
        {!mine && finalState === "requester" && (
          <button className="more-btn apply" onClick={() => onApplicants(r?._id)}>
            Manage
          </button>
        )}
        {!mine && finalState === "accepted" && <span className="applied-tag">Accepted ✓</span>}
        {!mine && finalState === "applied" && <span className="applied-tag">Applied ✓</span>}
        {!mine && (!finalState || finalState === "apply") && (
          <button className="more-btn apply" onClick={apply} disabled={applied}>
            {applied ? "Applied ✓" : "Apply"}
          </button>
        )}
      </div>
      {aMsg && <p className="rate-msg err" style={{ marginTop: 8 }}>{aMsg}</p>}
    </Reveal>
  );
}

export default function SearchPage() {
  const mode = useMode();
  const [params, setParams] = useSearchParams();
  const [results, setResults] = useState(null);
  const [error, setError] = useState("");
  const [totalPages, setTotalPages] = useState(1);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [meId, setMeId] = useState("");
  const [appliedIds, setAppliedIds] = useState(new Set());
  const [applicantsFor, setApplicantsFor] = useState(null);
  const [detailsFor, setDetailsFor] = useState(null);

  const page = Number(params.get("page")) || 1;

  useEffect(() => {
    getCachedProfile()
      .then((p) => setMeId(p?.id || ""))
      .catch(() => {});
    let alive = true;
    getMyApplies()
      .then((d) => {
        if (!alive) return;
        const list = asList(
          Array.isArray(d) ? d : d?.requests || d?.applies || d?.applications || d?.data
        );
        setAppliedIds(
          new Set(list.map((a) => a?.request?._id || a?.request).filter(Boolean))
        );
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  // silent false-request cleanup, throttled to once per 10 min per browser
  useEffect(() => {
    const last = Number(localStorage.getItem("lastCleanup") || 0);
    const now = Date.now();
    if (!last || now - last > 10 * 60 * 1000) {
      deleteFalseRequests().finally(() =>
        localStorage.setItem("lastCleanup", Date.now().toString())
      );
    }
  }, []);

  // saved requests (bookmark button states)
  const [savedIds, setSavedIds] = useState(new Set());
  useEffect(() => {
    let alive = true;
    showSavedRequests()
      .then((d) => {
        if (!alive) return;
        const list = d?.savedrequests || [];
        setSavedIds(new Set(list.map((x) => x?.request?._id || x?.request).filter(Boolean)));
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  async function toggleSave(id) {
    if (savedIds.has(id)) return;
    try {
      await saveRequest(id);
      setSavedIds((p) => new Set([...p, id]));
    } catch { /* already saved etc. */ }
  }

  useEffect(() => {
    let cancelled = false;
    setResults(null);
    setError("");
    const t = setTimeout(async () => {
      const query = {};
      FILTER_KEYS.forEach((k) => {
        const v = params.get(k);
        if (v) query[k] = v;
      });
      // no filters yet? show a ready-made explore feed so the page is never empty
      const usingDefaults = Object.keys(query).length === 0;
      if (usingDefaults) {
        query.minmember = "0";
        query.maxmember = "12";
      }
      try {
        const data = await searchRequests({ ...query, page, limit: 10 });
        if (cancelled) return;
        const list = asList(
          Array.isArray(data) ? data : data?.requests || data?.data || data?.results
        );
        const total = data?.totalCount ?? data?.total ?? data?.count;
        const tp =
          data?.totalPages ??
          (total != null ? Math.ceil(Number(total) / 10) : list.length === 10 ? page + 1 : page);
        setTotalPages(Math.max(page, Number(tp) || page));
        setResults(list);
      } catch (err) {
        if (!cancelled) {
          setError(err.message || "Search failed");
          setResults([]);
        }
      }
    }, 350);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [params, page]);

  const setFilter = (k, v, replace = false) => {
    const next = new URLSearchParams(params);
    if (v === "" || v == null) next.delete(k);
    else next.set(k, v);
    next.delete("page");
    setParams(next, { replace });
  };

  const toggleCat = (id) => {
    const cur = (params.get("categoryid") || "").split(",").filter(Boolean);
    const i = cur.indexOf(id);
    if (i >= 0) cur.splice(i, 1);
    else cur.push(id);
    setFilter("categoryid", cur.join(","), true);
  };

  const filterValue = {
    categoryid: params.get("categoryid") || "",
    minprice: params.get("minprice") || "",
    maxprice: params.get("maxprice") || "",
    minmember: params.get("minmember") || "",
    maxmember: params.get("maxmember") || "",
    planvalidityday: params.get("planvalidityday") || "",
    slots: params.get("slots") || "",
  };

  const setPage = (p) => {
    const next = new URLSearchParams(params);
    next.set("page", String(p));
    setParams(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const clearAll = () => setParams(new URLSearchParams());

  return (
    <div className="home search-page">
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
          <Link to="/home" className="ghost-btn-sm">Home</Link>
        </div>
      </header>

      <main className="home-main" style={{ paddingTop: 110 }}>
        <Reveal>
          <span className="eyebrow">Explore</span>
          <h1 className="home-hello" style={{ fontSize: "clamp(28px,4vw,44px)" }}>
            Find a split worth joining
          </h1>
        </Reveal>

        {/* search bar */}
        <form
          className="search-bar"
          onSubmit={(e) => e.preventDefault()}
          role="search"
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
            <circle cx="10.5" cy="10.5" r="6.5" />
            <path d="M15.5 15.5 21 21" />
          </svg>
          <input
            value={params.get("searchtext") || ""}
            onChange={(e) => setFilter("searchtext", e.target.value, true)}
            placeholder="Search plans, platforms… e.g. Netflix family plan"
            aria-label="Search splits"
          />
          <button
            type="button"
            className={`filter-toggle ${filtersOpen ? "on" : ""}`}
            onClick={() => setFiltersOpen((v) => !v)}
            aria-expanded={filtersOpen}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <path d="M4 6h16M7 12h10M10 18h4" />
            </svg>
            Filters
          </button>
        </form>

        {/* filters */}
        <div className={`filters ${filtersOpen ? "open" : ""}`}>
          <div className="filters-in">
            <SearchFilters value={filterValue} onPatch={(k, v) => setFilter(k, v, true)} onToggleCat={toggleCat} />
            <button type="button" className="clear-btn" onClick={clearAll}>
              Clear all filters
            </button>
          </div>
        </div>

        {/* quick platforms */}
        <p className="quick-label">Quick search</p>
        <PlatformRow />

        {/* results */}
        <section className="home-sec" style={{ marginTop: 40 }}>
          {error && <p className="sec-empty err">{error}</p>}
          {!error && results === null && (
            <div className="req-grid">
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          )}
          {!error && results !== null && results.length === 0 && (
            <p className="sec-empty">No matching splits — try loosening the filters.</p>
          )}
          {!error && results !== null && results.length > 0 && (
            <>
              <div className="req-grid">
                {results.map((r, i) => {
                  const rid = r?.requister?._id || r?.requister?.id;
                  return (
                    <ResultCard
                      key={r?._id || i}
                      r={r}
                      delay={(i % 3) * 90}
                      mine={Boolean(rid && meId && rid === meId)}
                      onApplicants={setApplicantsFor}
                      appliedIds={appliedIds}
                      onDetails={setDetailsFor}
                      saved={savedIds.has(r?._id)}
                      onSave={toggleSave}
                    />
                  );
                })}
              </div>

              {/* pagination */}
              <div className="pagi">
                <button disabled={page <= 1} onClick={() => setPage(page - 1)}>
                  ← Prev
                </button>
                <span>
                  Page {page}
                  {totalPages > page ? ` of ${totalPages}` : ""}
                </span>
                <button disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
                  Next →
                </button>
              </div>
            </>
          )}
        </section>
      </main>

      {detailsFor && (
        <RequestDetailsModal requestid={detailsFor} onClose={() => setDetailsFor(null)} />
      )}

      {applicantsFor && (
        <ApplicantsModal requestid={applicantsFor} onClose={() => setApplicantsFor(null)} />
      )}
    </div>
  );
}
