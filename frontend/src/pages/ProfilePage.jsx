import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { BookmarkIcon } from "../components/icons.jsx";
import AppFrame from "../components/AppFrame.jsx";
import Reveal from "../components/Reveal.jsx";
import { DefaultAvatar } from "../components/UserChip.jsx";
import UserLink from "../components/UserLink.jsx";
import LogoutButton from "../components/LogoutButton.jsx";
import QrcodeIcon from "../components/QrcodeIcon.jsx";
import { apiFetch, avatarSrc, reportUser, addUpiId, updateUpiId, showUpiId } from "../lib/api.js";
import { getCachedProfile } from "../lib/userCache.js";

const fmtMemberSince = (d) => {
  const n = Number(d);
  if (!Number.isFinite(n)) return "";
  if (n < 30) return `${n} day${n === 1 ? "" : "s"}`;
  if (n < 365) return `${Math.round(n / 30)} month${Math.round(n / 30) === 1 ? "" : "s"}`;
  const y = Math.round(n / 365);
  return `${y} year${y === 1 ? "" : "s"}`;
};

const STAR_PATH =
  "M12 2.8l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.7l-5.9 3.1 1.2-6.5L2.5 9.7l6.6-.9 2.9-6Z";

const Stars = ({ value }) => (
  <span className="stars" aria-label={`Rating ${value} out of 5`}>
    {[1, 2, 3, 4, 5].map((i) => (
      <svg key={i} viewBox="0 0 24 24" className={i <= Math.round(value) ? "on" : ""} fill="currentColor" aria-hidden="true">
        <path d={STAR_PATH} />
      </svg>
    ))}
  </span>
);

function StarPicker({ value, onChange }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="star-picker" onMouseLeave={() => setHover(0)} role="radiogroup" aria-label="Your rating">
      {[1, 2, 3, 4, 5].map((i) => (
        <button
          key={i}
          type="button"
          role="radio"
          aria-checked={value === i}
          aria-label={`${i} star${i > 1 ? "s" : ""}`}
          className={i <= (hover || value) ? "on" : ""}
          onMouseEnter={() => setHover(i)}
          onClick={() => onChange(i)}
        >
          <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d={STAR_PATH} />
          </svg>
        </button>
      ))}
    </div>
  );
}

/** Public profile via GET /showprofile/:userid + reviews & rating */
export default function ProfilePage() {
  const { userid } = useParams();
  const [user, setUser] = useState(null);
  const [err, setErr] = useState("");

  const [reviews, setReviews] = useState(null);
  const [showAll, setShowAll] = useState(false);
  const [mine, setMine] = useState(null);

  const [stars, setStars] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [meId, setMeId] = useState("");
  const [reportOpen, setReportOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [reportMsg, setReportMsg] = useState("");
  const [reporting, setReporting] = useState(false);
  const [upiEdit, setUpiEdit] = useState(false);
  const [upi, setUpi] = useState("");
  const [upiMsg, setUpiMsg] = useState("");
  const [savingUpi, setSavingUpi] = useState(false);
  const [upiId, setUpiId] = useState(null); // source of truth: /showupiid
  const [showUpiPop, setShowUpiPop] = useState(false);
  const [copiedUpi, setCopiedUpi] = useState(false);

  useEffect(() => {
    getCachedProfile()
      .then((p) => setMeId(p?.id || ""))
      .catch(() => {});
  }, []);

  const loadExtra = useCallback(async () => {
    const [rv, al] = await Promise.all([
      apiFetch(`/showreviews/${userid}`).catch(() => null),
      apiFetch(`/showalredyratedornot/${userid}`).catch(() => null),
    ]);
    setReviews(rv ? (Array.isArray(rv) ? rv : rv.reviews || rv.data || []) : []);
    if (al?.existingrating) {
      const er = al.existingrating;
      setMine(
        typeof er === "number"
          ? { rating: er, review: "" }
          : { rating: er.rating ?? 0, review: er.review ?? "" }
      );
    } else {
      setMine(null);
    }
  }, [userid]);

  useEffect(() => {
    let alive = true;
    setUser(null);
    setErr("");
    setReviews(null);
    setShowAll(false);
    setStars(0);
    setReviewText("");
    setMsg("");
    apiFetch(`/showprofile/${encodeURIComponent(userid)}`)
      .then((d) => {
        if (!alive) return;
        setUser(d?.user || d);
        const u = d?.user || d;
        if (u?.upiid) setUpiId((prev) => prev || u.upiid);
      })
      .catch((e) => alive && setErr(e.message || "Profile not found"));
    loadExtra();
    return () => {
      alive = false;
    };
  }, [userid, loadExtra]);

  useEffect(() => {
    if (mine) {
      setStars(mine.rating || 0);
      setReviewText(mine.review || "");
    }
  }, [mine]);

  async function submitRate(e) {
    e.preventDefault();
    if (!stars) {
      setMsg("Pick a star rating first.");
      return;
    }
    setSaving(true);
    setMsg("");
    const body = { rateduserid: userid, rating: stars };
    const t = reviewText.trim();
    if (t) body.review = t;
    try {
      await apiFetch(mine ? "/editrating" : "/rateuser", { method: "POST", body });
      setMsg(mine ? "Rating updated ✓" : "Thanks for rating ✓");
      await loadExtra();
    } catch (e2) {
      setMsg(e2.message || "Could not save your rating.");
    }
    setSaving(false);
  }

  const avg = reviews?.length
    ? reviews.reduce((s, r) => s + (Number(r.rating) || 0), 0) / reviews.length
    : null;

  const own = meId && meId === userid;
  const visible = reviews ? (showAll ? reviews : reviews.slice(0, 3)) : [];

  async function saveUpi(e) {
    e.preventDefault();
    const v = upi.trim();
    if (!v) {
      setUpiMsg("Enter a UPI id first.");
      return;
    }
    setSavingUpi(true);
    setUpiMsg("");
    try {
      if (upiId) await updateUpiId(v);
      else await addUpiId(v);
      setUser((u) => ({ ...u, upiid: v }));
      setUpiId(v);
      setUpiMsg("UPI id saved ✓");
      setUpiEdit(false);
      setUpi("");
    } catch (e2) {
      setUpiMsg(e2.message || "Could not save the UPI id.");
    }
    setSavingUpi(false);
  }

  async function submitReport(e) {
    e.preventDefault();
    if (!reason.trim()) {
      setReportMsg("Please give a short reason.");
      return;
    }
    setReporting(true);
    setReportMsg("");
    try {
      await reportUser(userid, reason.trim());
      setReportMsg("Report submitted — thank you.");
      setReason("");
      setReportOpen(false);
    } catch (e2) {
      setReportMsg(e2.message || "Could not submit the report.");
    }
    setReporting(false);
  }

  return (
    <AppFrame>
      {err ? (
        <p className="sec-empty err">⚠ {err}</p>
      ) : user === null ? (
        <p className="sec-empty">Loading profile…</p>
      ) : (
        <>
          <Reveal variant="zoom" className="profile-card">
            <div className="profile-ava">
              {user?.avatar ? <img src={avatarSrc(user.avatar)} alt={user.profilename} /> : <DefaultAvatar />}
            </div>
            <h1 className="profile-name">@{user?.profilename || "user"}</h1>
            {user?.fullname && <p className="profile-full">{user.fullname}</p>}

            {(user?.averageRating != null || avg !== null) && (
              <div className="profile-rating">
                <Stars value={Number(user?.averageRating ?? avg) || 0} />
                <span className="rating-num">
                  {Number(user?.averageRating ?? avg).toFixed(1)} ·{" "}
                  {user?.totalRatings ?? reviews.length} rating
                  {(user?.totalRatings ?? reviews.length) === 1 ? "" : "s"}
                </span>
              </div>
            )}

            <div className="profile-badges">
              {user?.memberSinceDays != null && (
                <span className="pbadge">🗓 Member for {fmtMemberSince(user.memberSinceDays)}</span>
              )}
              {user?.upiid && <span className="pbadge">UPI linked</span>}
              {user?.googleId && <span className="pbadge">Google account</span>}
            </div>

            {own && (
              <div className="upi-sec">
                {upiId && !upiEdit && (
                  <p className="upi-line">
                    UPI: <code>{upiId}</code>
                    <button type="button" className="copy-btn" onClick={() => setUpiEdit(true)}>
                      update
                    </button>
                  </p>
                )}
                {!upiId && !upiEdit && (
                  <button type="button" className="copy-btn" onClick={() => setUpiEdit(true)}>
                    + Add UPI ID
                  </button>
                )}
                {upiEdit && (
                  <form className="report-form" onSubmit={saveUpi}>
                    <input
                      value={upi}
                      maxLength={100}
                      onChange={(e) => setUpi(e.target.value)}
                      placeholder="yourname@bank (max 100)"
                      aria-label="UPI id"
                    />
                    <span className="char-count">{upi.length}/100</span>
                    {upiMsg && (
                      <p className={`rate-msg ${upiMsg.includes("✓") ? "ok" : "err"}`}>{upiMsg}</p>
                    )}
                    <button type="submit" className="pill" disabled={savingUpi}>
                      <span>{savingUpi ? "Saving…" : upiId ? "Update UPI" : "Add UPI"}</span>
                    </button>
                  </form>
                )}
              </div>
            )}

            <div className="profile-actions">
              {own && (
                <div className="own-actions">
                  <LogoutButton />
                  <span className="own-hint">Logout</span>
                </div>
              )}
              {upiId && (
                <span style={{ position: "relative", display: "inline-flex" }}>
                  <button
                    type="button"
                    className="qr-btn"
                    onClick={() => {
                      setShowUpiPop((v) => !v);
                      setCopiedUpi(false);
                    }}
                    title="UPI id (QR)"
                    aria-label="UPI id"
                  >
                    <QrcodeIcon size={18} />
                  </button>
                  {showUpiPop && (
                    <span className="upi-pop" role="dialog" aria-label="UPI id">
                      <p className="upi-line">
                        <code>{upiId}</code>
                        <button
                          type="button"
                          className="copy-btn"
                          onClick={async () => {
                            try {
                              await navigator.clipboard.writeText(upiId);
                              setCopiedUpi(true);
                            } catch {
                              setCopiedUpi(false);
                            }
                          }}
                        >
                          {copiedUpi ? "copied ✓" : "copy"}
                        </button>
                      </p>
                    </span>
                  )}
                </span>
              )}
              {!own && meId && (
                <button
                  type="button"
                  className="report-toggle"
                  onClick={() => setReportOpen((v) => !v)}
                >
                  ⚑ Report user
                </button>
              )}
            </div>

            {!own && meId && reportOpen && (
              <form className="report-form" onSubmit={submitReport}>
                <div className="field">
                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value.slice(0, 200))}
                    rows={2}
                    maxLength={200}
                    placeholder="Reason for reporting (max 200 characters)…"
                    aria-label="Report reason"
                  />
                  <span className="char-count">{reason.length}/200</span>
                </div>
                {reportMsg && (
                  <p className={`rate-msg ${reportMsg.includes("thank you") ? "ok" : "err"}`}>
                    {reportMsg}
                  </p>
                )}
                <button type="submit" className="pill" disabled={reporting}>
                  <span>{reporting ? "Sending…" : "Submit report"}</span>
                </button>
              </form>
            )}
          </Reveal>

          {/* saved-requests shortcut — outside the card, own profile only */}
          {own && (
            <Reveal variant="blur" delay={90}>
              <Link to="/saved" className="saved-tile">
                <span className="saved-tile-ico">
                  <BookmarkIcon size={20} strokeWidth={2.4} />
                </span>
                <span className="saved-tile-txt">
                  <strong>Saved requests</strong>
                  <small>Requests you bookmarked — pick up where you left off.</small>
                </span>
                <span className="saved-tile-go" aria-hidden="true">→</span>
              </Link>
            </Reveal>
          )}

          {/* rate / edit rating */}
          {!own && meId && (
            <Reveal variant="blur" delay={120} className="rate-card">
              <h3>{mine ? "Your rating" : "Rate this user"}</h3>
              <p className="rate-sub">
                {mine
                  ? "You already rated this user — you can edit it anytime."
                  : "Shared a split with them? Leave a rating for the community."}
              </p>
              <form onSubmit={submitRate}>
                <StarPicker value={stars} onChange={setStars} />
                <div className="field">
                  <textarea
                    value={reviewText}
                    onChange={(e) => setReviewText(e.target.value.slice(0, 100))}
                    rows={3}
                    placeholder="Optional review (max 100 characters)…"
                    aria-label="Review"
                  />
                  <span className="char-count">{reviewText.length}/100</span>
                </div>
                {msg && <p className={`rate-msg ${msg.includes("✓") ? "ok" : "err"}`}>{msg}</p>}
                <button type="submit" className="pill" disabled={saving}>
                  <span>{saving ? "Saving…" : mine ? "Update rating" : "Submit rating"}</span>
                </button>
              </form>
            </Reveal>
          )}

          {/* reviews */}
          <section className="reviews-sec">
            <Reveal>
              <h2 className="home-sec-title">
                Reviews
                <span className="sec-count">{reviews ? reviews.length : "…"}</span>
              </h2>
            </Reveal>
            {reviews === null ? (
              <p className="sec-empty">Loading reviews…</p>
            ) : reviews.length === 0 ? (
              <p className="sec-empty">No reviews yet.</p>
            ) : (
              <>
                <div className="review-list">
                  {visible.map((r, i) => (
                    <Reveal key={i} variant="zoom" delay={(i % 3) * 80} className="review-card">
                      <div className="review-top">
                        <UserLink user={r.rater} />
                        <Stars value={Number(r.rating) || 0} />
                      </div>
                      {r.review && <p className="review-text">{r.review}</p>}
                    </Reveal>
                  ))}
                </div>
                {reviews.length > 3 && (
                  <button type="button" className="showmore" onClick={() => setShowAll((v) => !v)}>
                    {showAll ? "Show less" : `Show all ${reviews.length} reviews`}
                  </button>
                )}
              </>
            )}
          </section>
        </>
      )}
    </AppFrame>
  );
}
