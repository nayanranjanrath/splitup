import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import AppFrame from "../components/AppFrame.jsx";
import Reveal from "../components/Reveal.jsx";
import PriceTag from "../components/PriceTag.jsx";
import RequestDetailsModal from "../components/RequestDetailsModal.jsx";
import { SkeletonCard } from "../components/Skeleton.jsx";
import { showSavedRequests } from "../lib/api.js";

/** Saved requests (🔖) — via /showsavedrequests. */
export default function SavedPage() {
  const [saved, setSaved] = useState(null);
  const [detailsFor, setDetailsFor] = useState(null);

  useEffect(() => {
    let alive = true;
    showSavedRequests()
      .then((d) => alive && setSaved(d?.savedrequests || []))
      .catch(() => alive && setSaved([]));
    return () => {
      alive = false;
    };
  }, []);

  return (
    <AppFrame>
      <Reveal>
        <span className="eyebrow">Your bookmark</span>
        <h1 className="home-hello">Saved requests</h1>
      </Reveal>
      <Reveal variant="blur" delay={120}>
        <p className="home-sub">Requests you saved for later — pick up where you left off.</p>
      </Reveal>

      <div className="req-grid" style={{ marginTop: 28 }}>
        {saved === null ? (
          [0, 1, 2].map((i) => <SkeletonCard key={i} />)
        ) : saved.length === 0 ? (
          <p className="sec-empty">
            Nothing saved yet — tap 🔖 Save on any request in Explore.
          </p>
        ) : (
          saved.map((s, i) => {
            const r = s?.request || {};
            const plat = typeof r.platformname === "object" ? r.platformname : null;
            const pid = plat?._id || r.platformname;
            return (
              <Reveal key={s?._id || i} variant="zoom" delay={(i % 3) * 90} className="req-card">
                <div className="req-top">
                  {plat?.platformimage ? (
                    <Link to={`/platform/${pid}`}>
                      <img className="req-logo" src={plat.platformimage} alt={plat.platformname} />
                    </Link>
                  ) : (
                    <span className="req-logo" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 800 }}>
                      {(plat?.platformname || "?")[0]}
                    </span>
                  )}
                  <div className="req-data">
                    <h3>{r.planname || "Plan"}</h3>
                    <p className="req-plat">
                      {pid ? <Link to={`/platform/${pid}`}>{plat?.platformname || "Platform"}</Link> : "Platform"}
                    </p>
                    <div className="req-mid">
                      <PriceTag price={r.planprice} slots={r.totalslots} per={r.perpersoncost} />
                    </div>
                  </div>
                  <span className={`status-pill s-${(r.status || "open").toLowerCase()}`}>
                    {r.status || "open"}
                  </span>
                </div>
                <div className="card-actions">
                  <button type="button" className="view-details" onClick={() => setDetailsFor(r._id)}>
                    View details
                  </button>
                </div>
              </Reveal>
            );
          })
        )}
      </div>

      {detailsFor && (
        <RequestDetailsModal requestid={detailsFor} onClose={() => setDetailsFor(null)} />
      )}
    </AppFrame>
  );
}
