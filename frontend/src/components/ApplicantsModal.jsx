import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import UserLink from "./UserLink.jsx";
import { showApplicants, acceptApplicant, removeApplicant } from "../lib/api.js";

/**
 * Requester-only modal: who applied to one of your splits.
 * Accept → /acceptapplicant · Remove → /removeapplicant (body: { requestid, aplicantid })
 */
export default function ApplicantsModal({ requestid, onClose }) {
  const [list, setList] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [busy, setBusy] = useState(null);
  const [msg, setMsg] = useState("");

  async function load(p, append = false) {
    const d = await showApplicants(requestid, p).catch((e) => {
      setMsg(e.message);
      return null;
    });
    if (!d) return;
    const items = d.applicants || [];
    setList((prev) => (append ? [...(prev || []), ...items] : items));
    setHasMore(Boolean(d.hasMore));
    setPage(d.page || p);
  }

  useEffect(() => {
    load(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestid]);

  const idOf = (it) =>
    (typeof it?.applicant === "string" ? it.applicant : it?.applicant?._id) || it?._id;
  const userOf = (it) =>
    typeof it?.applicant === "object" && it.applicant
      ? it.applicant
      : it?.profilename
        ? it
        : null;

  async function act(fn, it) {
    const aid = idOf(it);
    setBusy(aid);
    setMsg("");
    try {
      await fn(requestid, aid);
      await load(1);
    } catch (e) {
      setMsg(e.message);
    }
    setBusy(null);
  }

  return createPortal(
    <div
      className="modal-veil"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal-card" role="dialog" aria-label="Applicants">
        <div className="modal-head">
          <h3>Applicants</h3>
          <button className="toast-x" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        {msg && <p className="rate-msg err">{msg}</p>}

        <div className="applicant-list">
          {list === null ? (
            <p className="notif-empty">Loading applicants…</p>
          ) : list.length === 0 ? (
            <p className="notif-empty">No applicants yet — share your split!</p>
          ) : (
            list.map((it, i) => {
              const u = userOf(it);
              const aid = idOf(it);
              return (
                <div className="applicant-row" key={aid || i}>
                  <UserLink user={u} name={u?.profilename || "applicant"} />
                  <div className="applicant-actions">
                    <button
                      className="mini-btn ok"
                      disabled={busy === aid}
                      onClick={() => act(acceptApplicant, it)}
                      title="Accept"
                      aria-label="Accept applicant"
                    >
                      ✓
                    </button>
                    <button
                      className="mini-btn bad"
                      disabled={busy === aid}
                      onClick={() => act(removeApplicant, it)}
                      title="Remove"
                      aria-label="Remove applicant"
                    >
                      ×
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {hasMore && (
          <button type="button" className="showmore" onClick={() => load(page + 1, true)}>
            Load more applicants
          </button>
        )}
      </div>
    </div>,
    document.body
  );
}
