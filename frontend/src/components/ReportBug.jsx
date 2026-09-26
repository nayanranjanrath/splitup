import { useState } from "react";
import { reportBug } from "../lib/api.js";

/** Floating bottom-right "report a bug" button → POST /reportabug { description } */
export default function ReportBug() {
  const [open, setOpen] = useState(false);
  const [desc, setDesc] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  async function submit(e) {
    e.preventDefault();
    if (!desc.trim()) {
      setMsg("Please describe the bug first.");
      return;
    }
    setBusy(true);
    setMsg("");
    try {
      await reportBug(desc.trim());
      window.dispatchEvent(new Event("splitup:notif-changed"));
      setMsg("Bug reported — thank you! 🐞");
      setDesc("");
      setTimeout(() => {
        setOpen(false);
        setMsg("");
      }, 1500);
    } catch (err) {
      setMsg(err.message || "Could not send the report.");
    }
    setBusy(false);
  }

  return (
    <>
      <button
        className="bug-fab"
        onClick={() => setOpen((v) => !v)}
        title="Report a bug"
        aria-label="Report a bug"
        aria-expanded={open}
      >
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M8 2.5 9.5 4.5M16 2.5 14.5 4.5M9.5 7V5.5a2.5 2.5 0 0 1 5 0V7" />
          <rect x="7" y="7" width="10" height="12" rx="5" />
          <path d="M12 8v11M7 11H4.5M7 15H5.5M17 11h2.5M17 15h1.5" />
        </svg>
      </button>

      {open && (
        <form className="bug-pop" onSubmit={submit}>
          <h4>Report a bug</h4>
          <textarea
            value={desc}
            onChange={(e) => setDesc(e.target.value.slice(0, 300))}
            maxLength={300}
            rows={3}
            placeholder="What happened? On which page? (max 300)"
            autoFocus
            aria-label="Bug description"
          />
          <span className="char-count">{desc.length}/300</span>
          {msg && (
            <p className={`rate-msg ${msg.includes("thank you") ? "ok" : "err"}`}>{msg}</p>
          )}
          <button type="submit" className="pill" disabled={busy}>
            <span>{busy ? "Sending…" : "Send report"}</span>
          </button>
        </form>
      )}
    </>
  );
}
