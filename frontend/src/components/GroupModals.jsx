import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  showPlansOfFinalGroup,
  showLoginDetails,
  addSigninDetails,
  getPlatforms,
  createPlatform,
  selectPlatformToFinalGroup,
  addPlan,
} from "../lib/api.js";

async function copyText(t) {
  try {
    await navigator.clipboard.writeText(t);
    return true;
  } catch {
    try {
      const ta = document.createElement("textarea");
      ta.value = t;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
      return true;
    } catch {
      return false;
    }
  }
}

function CopyBtn({ value, label, onCopied }) {
  return (
    <button
      type="button"
      className="copy-btn"
      onClick={async () => {
        if (await copyText(value)) onCopied?.(label);
      }}
    >
       {label}
    </button>
  );
}

/* ── Show details: plans + platform, credentials view/add ─────────── */
export function GroupDetailsModal({ groupid, isAdmin, onClose, onChanged }) {
  const [plans, setPlans] = useState(null);
  const [creds, setCreds] = useState({});
  const [credOpen, setCredOpen] = useState(null);
  const [addCredFor, setAddCredFor] = useState(null);
  const [form, setForm] = useState({ email: "", pass: "" });
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let alive = true;
    showPlansOfFinalGroup(groupid)
      .then((d) => alive && setPlans(Array.isArray(d) ? d : d?.plans || d?.data || []))
      .catch(() => alive && setPlans([]));
    return () => {
      alive = false;
    };
  }, [groupid]);

  async function viewCred(planid) {
    if (creds[planid]) {
      setCredOpen(credOpen === planid ? null : planid);
      return;
    }
    setMsg("");
    const d = await showLoginDetails(planid).catch((e) => {
      setMsg(e.message || "No sign-in details for this plan yet.");
      return null;
    });
    if (d) {
      setCreds((c) => ({ ...c, [planid]: { id: d.loginid, pass: d.loginpassword } }));
      setCredOpen(planid);
    }
  }

  async function submitCred(planid) {
    if (!form.email.trim() || !form.pass.trim()) {
      setMsg("Both email and password are required.");
      return;
    }
    setBusy(true);
    setMsg("");
    try {
      await addSigninDetails({
        planid,
        platformemail: form.email.trim(),
        platformepassword: form.pass.trim(),
      });
      setMsg("Sign-in details saved ✓");
      setCreds((c) => ({
        ...c,
        [planid]: { id: form.email.trim(), pass: form.pass.trim() },
      }));
      setAddCredFor(null);
      setForm({ email: "", pass: "" });
      onChanged?.();
    } catch (e) {
      setMsg(e.message || "Could not save the details.");
    }
    setBusy(false);
  }

  return createPortal(
    <div className="modal-veil" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-card wide" role="dialog" aria-label="Group details">
        <div className="modal-head">
          <h3>Group plans & platform</h3>
          <button className="toast-x" onClick={onClose} aria-label="Close">×</button>
        </div>

        {plans === null ? (
          <p className="notif-empty">Loading plans…</p>
        ) : plans.length === 0 ? (
          <p className="notif-empty">No plans yet — add one from the chat tools.</p>
        ) : (
          <div className="plan-list">
            {plans.map((p, i) => {
              const pid = p?._id || p?.id;
              const plat =
                typeof p?.platform === "object"
                  ? p?.platform?.platformname
                  : p?.platform || "—";
              return (
                <div className="plan-row" key={pid || i}>
                  <div className="plan-info">
                    <strong>{p?.planname || "Plan"}</strong>
                    <span>
                      {plat}
                      {p?.planvalidity ? ` · ${p.planvalidity} days` : ""}
                    </span>
                  </div>
                  <div className="plan-actions">
                    <button type="button" className="copy-btn" onClick={() => viewCred(pid)}>
                      🔑 {credOpen === pid ? "Hide" : "Sign-in"}
                    </button>
                    {isAdmin && (
                      <button
                        type="button"
                        className="copy-btn"
                        onClick={() => setAddCredFor(addCredFor === pid ? null : pid)}
                      >
                        + details
                      </button>
                    )}
                  </div>

                  {credOpen === pid && creds[pid] && (
                    <div className="cred-box">
                      <div className="cred-line">
                        <span>ID</span>
                        <code>{creds[pid].id}</code>
                        <CopyBtn value={creds[pid].id} label="copy" />
                      </div>
                      <div className="cred-line">
                        <span>Pass</span>
                        <code>{creds[pid].pass}</code>
                        <CopyBtn value={creds[pid].pass} label="copy" />
                      </div>
                    </div>
                  )}

                  {addCredFor === pid && (
                    <div className="cred-box">
                      <input
                        value={form.email}
                        maxLength={60}
                        placeholder="Platform email"
                        onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                      />
                      <input
                        value={form.pass}
                        maxLength={60}
                        placeholder="Platform password"
                        onChange={(e) => setForm((f) => ({ ...f, pass: e.target.value }))}
                      />
                      <button
                        type="button"
                        className="pill"
                        disabled={busy}
                        onClick={() => submitCred(pid)}
                      >
                        <span>{busy ? "Saving…" : "Save details"}</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
        {msg && <p className={`rate-msg ${msg.includes("✓") ? "ok" : "err"}`}>{msg}</p>}
      </div>
    </div>,
    document.body
  );
}

/* ── Add plan: pick/create platform → plan form ───────────────────── */
export function AddPlanModal({ groupid, onClose, onDone }) {
  const [step, setStep] = useState(1);
  const [plats, setPlats] = useState(null);
  const [sel, setSel] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [np, setNp] = useState({ name: "", desc: "" });
  const [form, setForm] = useState({ planname: "", planvalidity: "" });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    let alive = true;
    getPlatforms(null)
      .then((d) => alive && setPlats(d?.allplatform || d?.platforms || d?.data || []))
      .catch(() => alive && setPlats([]));
    return () => {
      alive = false;
    };
  }, []);

  async function createPlat() {
    if (!np.name.trim() || !np.desc.trim()) {
      setMsg("Platform name and description are required.");
      return;
    }
    setBusy(true);
    setMsg("");
    try {
      const d = await createPlatform(np.name.trim(), np.desc.trim());
      const id = d?.newplatform?._id || d?.platform?._id || d?._id || null;
      if (!id) throw new Error(d?.message || "No platform id returned.");
      setPlats((p) => [{ _id: id, platformname: np.name }, ...(p || [])]);
      setSel(id);
      setShowAdd(false);
      setNp({ name: "", desc: "" });
    } catch (e) {
      setMsg(e.message);
    }
    setBusy(false);
  }

  async function choosePlatform() {
    if (!sel) {
      setMsg("Select a platform first.");
      return;
    }
    setBusy(true);
    setMsg("");
    try {
      await selectPlatformToFinalGroup(sel, groupid);
      setStep(2);
    } catch (e) {
      setMsg(e.message || "Could not select the platform.");
    }
    setBusy(false);
  }

  async function submit() {
    if (!form.planname.trim() || !form.planvalidity) {
      setMsg("Plan name and validity are required.");
      return;
    }
    setBusy(true);
    setMsg("");
    try {
      await addPlan({
        groupid,
        planname: form.planname.trim(),
        planvalidity: form.planvalidity,
      });
      onDone?.();
      onClose();
    } catch (e) {
      setMsg(e.message || "Could not add the plan.");
    }
    setBusy(false);
  }

  return createPortal(
    <div className="modal-veil" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-card" role="dialog" aria-label="Add plan">
        <div className="modal-head">
          <h3>{step === 1 ? "Choose a platform" : "New plan"}</h3>
          <button className="toast-x" onClick={onClose} aria-label="Close">×</button>
        </div>

        {step === 1 ? (
          <>
            <div className="gpicker-list">
              {plats === null && <p className="notif-empty">Loading platforms…</p>}
              {plats?.map((p) => (
                <label key={p._id} className={`radio-row ${sel === p._id ? "on" : ""}`}>
                  <input
                    type="radio"
                    name="plat-pick"
                    checked={sel === p._id}
                    onChange={() => setSel(p._id)}
                  />
                  <span>{p.platformname}</span>
                </label>
              ))}
            </div>
            <button type="button" className="copy-btn" onClick={() => setShowAdd((v) => !v)}>
              {showAdd ? "− close" : "+ Add new platform"}
            </button>
            {showAdd && (
              <div className="cred-box">
                <input
                  value={np.name}
                  maxLength={30}
                  placeholder="Platform name"
                  onChange={(e) => setNp((f) => ({ ...f, name: e.target.value }))}
                />
                <input
                  value={np.desc}
                  maxLength={200}
                  placeholder="Description"
                  onChange={(e) => setNp((f) => ({ ...f, desc: e.target.value }))}
                />
                <button type="button" className="pill" disabled={busy} onClick={createPlat}>
                  <span>Create platform</span>
                </button>
              </div>
            )}
            {msg && <p className="rate-msg err">{msg}</p>}
            <button type="button" className="pill" disabled={busy} onClick={choosePlatform}>
              <span>Continue →</span>
            </button>
          </>
        ) : (
          <>
            <div className="cred-box">
              <input
                value={form.planname}
                maxLength={40}
                placeholder="Plan name (e.g. Family 4K)"
                onChange={(e) => setForm((f) => ({ ...f, planname: e.target.value }))}
              />
              <input
                type="number"
                min="1"
                value={form.planvalidity}
                placeholder="Validity (days)"
                onChange={(e) => setForm((f) => ({ ...f, planvalidity: e.target.value }))}
              />
            </div>
            {msg && <p className="rate-msg err">{msg}</p>}
            <button type="button" className="pill" disabled={busy} onClick={submit}>
              <span>{busy ? "Adding…" : "Add plan"}</span>
            </button>
          </>
        )}
      </div>
    </div>,
    document.body
  );
}
