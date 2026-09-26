import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import { showRequestDetails } from "../lib/api.js";
import UserLink from "./UserLink.jsx";
import PriceTag from "./PriceTag.jsx";
import { SkeletonRow } from "./Skeleton.jsx";

/** Full request details via /showrequestdetails/:requestid (proofs + lightbox). */
export default function RequestDetailsModal({ requestid, onClose }) {
  const [d, setD] = useState(null);
  const [err, setErr] = useState("");
  const [full, setFull] = useState(null);

  useEffect(() => {
    let alive = true;
    showRequestDetails(requestid)
      .then((x) => alive && setD(x?.request || x))
      .catch((e) => alive && setErr(e.message || "Could not load details."));
    return () => {
      alive = false;
    };
  }, [requestid]);

  const req = d || {};
  const plat = typeof req.platformname === "object" ? req.platformname : null;
  const members = Array.isArray(req.members) ? req.members : [];
  const proofs = Array.isArray(req.proofimage) ? req.proofimage : [];

  return createPortal(
    <div className="modal-veil" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-card wide" role="dialog" aria-label="Request details">
        <div className="modal-head">
          <h3>{req.planname || "Request details"}</h3>
          <button className="toast-x" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        {!d && !err && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <SkeletonRow />
            <SkeletonRow />
          </div>
        )}
        {err && <p className="rate-msg err">{err}</p>}

        {d && (
          <>
            <div className="req-top" style={{ marginTop: 6 }}>
              {plat?.platformimage ? (
                <Link to={`/platform/${plat._id}`}>
                  <img className="req-logo" src={plat.platformimage} alt={plat.platformname} />
                </Link>
              ) : null}
              <div className="req-data">
                <h3 style={{ margin: 0 }}>{plat?.platformname || "Platform"}</h3>
                <p className="req-plat" style={{ margin: 0 }}>
                  <PriceTag price={req.planprice} slots={req.totalslots} per={req.perpersoncost} />
                </p>
              </div>
              <span className={`status-pill s-${(req.status || "open").toLowerCase()}`}>
                {req.status || "open"}
              </span>
            </div>

            <div className="req-rows" style={{ marginTop: 12 }}>
              <div><span>Validity</span><strong>{req.planvalidityday ? `${req.planvalidityday} days` : "—"}</strong></div>
              <div><span>Slots</span><strong>{req.totalslots ?? "—"}</strong></div>
              <div><span>Expires</span><strong>{req.expiresAt ? new Date(req.expiresAt).toLocaleDateString() : "—"}</strong></div>
              <div><span>Members</span><strong>{members.length}/{req.totalslots ?? "—"}</strong></div>
            </div>

            <p className="req-label">Requested by</p>
            <UserLink user={req.requister} name={req.requister?.profilename} />

            {members.length > 0 && (
              <>
                <p className="req-label">Members</p>
                <div className="member-row">
                  {members.map((m, i) => (
                    <UserLink key={i} user={m} name={m?.profilename} />
                  ))}
                </div>
              </>
            )}

            <p className="req-label">Payment proof from the requester</p>
            {proofs.length === 0 ? (
              <span className="none">No proof images.</span>
            ) : (
              <div className="proof-strip">
                {proofs.map((p, i) => (
                  <button
                    key={i}
                    type="button"
                    className="proof-thumb"
                    onClick={() => setFull(p?.url || p)}
                    aria-label="View proof image full screen"
                  >
                    <img src={p?.url || p} alt={`proof ${i + 1}`} />
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {full && (
        <div className="lightbox" onClick={() => setFull(null)} role="dialog" aria-label="Proof image">
          <img src={typeof full === "string" ? full : full.url} alt="Payment proof full screen" />
          <button type="button" className="toast-x lightbox-x" aria-label="Close">
            ×
          </button>
        </div>
      )}
    </div>,
    document.body
  );
}
