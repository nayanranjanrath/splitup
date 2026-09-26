import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AppFrame from "../components/AppFrame.jsx";
import Reveal from "../components/Reveal.jsx";
import PlatformLogo from "../components/PlatformLogo.jsx";
import AiLoader from "../components/AiLoader.jsx";
import { SkeletonCard } from "../components/Skeleton.jsx";
import {
  getPlatforms,
  selectPlatform,
  submitPlatformSplit,
  createPlatform,
  selectCategory,
  createCategory,
  getCategories,
  addPlatformImage,
} from "../lib/api.js";

const AI_MSGS = [
  "Uploading your proof images…",
  "AI is inspecting the screenshots…",
  "Verifying plan details…",
  "Cross-checking with the platform…",
  "Polishing your split…",
];

const hueFor = (s) => {
  let h = 0;
  for (let i = 0; i < (s || "").length; i++) h = (h * 31 + s.charCodeAt(i)) % 360;
  return h;
};

export default function CreatePage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [platforms, setPlatforms] = useState(null);
  const [next, setNext] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState("");
  const [q, setQ] = useState("");

  const [chosen, setChosen] = useState(null);
  const [requestId, setRequestId] = useState(null);

  const [form, setForm] = useState({ planname: "", planprice: "", planvalidityday: "", totalslots: "" });
  const [files, setFiles] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [aiMsg, setAiMsg] = useState(AI_MSGS[0]);
  const [done, setDone] = useState(false);
  const fileRef = useRef(null);

  /* add-new-platform flow */
  const [showAdd, setShowAdd] = useState(false);
  const [addStep, setAddStep] = useState("platform");
  const [pf, setPf] = useState({ name: "", desc: "" });
  const [logoFile, setLogoFile] = useState(null);
  const [logoPrev, setLogoPrev] = useState("");
  const logoRef = useRef(null);
  const [createdId, setCreatedId] = useState(null);
  const [cats, setCats] = useState([]);
  const [selCat, setSelCat] = useState(null);
  const [newCat, setNewCat] = useState("");
  const [busy, setBusy] = useState(false);
  const [addMsg, setAddMsg] = useState("");

  async function loadCats() {
    const d = await getCategories(null).catch(() => null);
    setCats(d ? d.allcategory || d.categories || d.data || [] : []);
  }

  useEffect(() => {
    if (addStep === "category" && cats.length === 0) loadCats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [addStep]);

  async function load() {
    const d = await getPlatforms(null).catch(() => null);
    if (!d) return;
    setPlatforms(d.allplatform || d.platforms || d.data || []);
    setHasMore(Boolean(d.hasMore));
    setNext(d.nextCursor ?? null);
  }

  useEffect(() => {
    load();
  }, []);

  async function more() {
    if (!next) return;
    const d = await getPlatforms(next).catch(() => null);
    if (d) setPlatforms((p) => [...(p || []), ...(d.allplatform || d.platforms || [])]);
  }

  const filtered = (platforms || []).filter((p) =>
    (p.platformname || "").toLowerCase().includes(q.trim().toLowerCase())
  );

  async function pick(p) {
    setBusyId(p._id);
    setError("");
    try {
      const d = await selectPlatform(p._id);
      setRequestId(d?.newrequest?._id || d?.newrequest?.id || null);
      setChosen({ id: p._id, name: p.platformname });
      setStep(2);
    } catch (e) {
      setError(e.message || "Could not select this platform.");
    }
    setBusyId(null);
  }

  async function doCreatePlatform() {
    if (!pf.name.trim() || !pf.desc.trim()) {
      setAddMsg("Platform name and description are both required.");
      return;
    }
    setBusy(true);
    setAddMsg("");
    try {
      const d = await createPlatform(pf.name.trim(), pf.desc.trim());
      const id = d?.savedplatform?._id || d?.newplatform?._id || d?.platform?._id || d?._id || d?.platformid || null;
      if (!id) throw new Error(d?.message || "No platform id returned.");

      /* optional logo upload for the brand-new platform */
      if (logoFile) {
        const fd = new FormData();
        fd.append("platformimage", logoFile);
        fd.append("platformid", id);
        await addPlatformImage(fd)
          .then(() => setAddMsg("Logo uploaded ✓"))
          .catch(() => setAddMsg("Platform created — logo upload failed."));
      }

      setCreatedId(id);
      if (!logoFile) setAddMsg("Platform created & selected ✓");
      setAddStep("category"); // platform pre-selected → category (optional) → continue
    } catch (e) {
      const m = e.message || "Could not create the platform.";
      setAddMsg(
        /internal|exist|already/i.test(m)
          ? "This platform already exists — pick it from the list below."
          : m
      );
    }
    setBusy(false);
  }

  async function doSelectCategory() {
    if (!selCat) return;
    setBusy(true);
    setAddMsg("");
    try {
      await selectCategory(selCat, createdId);
      setAddMsg("Category attached ✓");
    } catch (e) {
      setAddMsg(e.message || "Could not attach the category.");
    }
    setBusy(false);
  }

  async function doCreateCategory() {
    if (!newCat.trim()) return;
    setBusy(true);
    setAddMsg("");
    try {
      await createCategory(newCat.trim(), createdId);
      setAddMsg("Category created & linked ✓");
      setNewCat("");
      loadCats();
    } catch (e) {
      setAddMsg(e.message || "Could not create the category.");
    }
    setBusy(false);
  }

  /* the new platform is chosen by default → proceed to plan details */
  async function doContinue() {
    setBusy(true);
    setAddMsg("");
    try {
      const d = await selectPlatform(createdId);
      setRequestId(d?.newrequest?._id || d?.newrequest?.id || null);
      setChosen({ id: createdId, name: pf.name });
      setPlatforms((p) => [{ _id: createdId, platformname: pf.name }, ...(p || [])]);
      setShowAdd(false);
      setStep(2);
    } catch (e) {
      setAddMsg(e.message || "Could not start the split for this platform.");
    }
    setBusy(false);
  }

  function onFiles(e) {
    const list = Array.from(e.target.files || []);
    setFiles((f) => [...f, ...list].slice(0, 2));
    e.target.value = "";
  }

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  // cycling AI messages while the proof check runs
  useEffect(() => {
    if (!submitting) return;
    let i = 0;
    setAiMsg(AI_MSGS[0]);
    const t = setInterval(() => {
      i = (i + 1) % AI_MSGS.length;
      setAiMsg(AI_MSGS[i]);
    }, 2600);
    return () => clearInterval(t);
  }, [submitting]);

  async function submit(e) {
    e.preventDefault();
    if (files.length < 1) {
      setError("Please upload at least one proof image.");
      return;
    }
    setError("");
    setSubmitting(true);
    const fd = new FormData();
    fd.append("requestid", requestId);
    fd.append("planname", form.planname);
    fd.append("planprice", form.planprice);
    fd.append("planvalidityday", form.planvalidityday);
    fd.append("totalslots", form.totalslots);
    files.forEach((f) => fd.append("proofimages", f));
    try {
      await submitPlatformSplit(fd);
      setDone(true);
      setTimeout(() => navigate("/home"), 2600);
    } catch (err) {
      setError(err.message || "Something went wrong — try again.");
    }
    setSubmitting(false);
  }

  function reset() {
    setStep(1);
    setChosen(null);
    setRequestId(null);
    setForm({ planname: "", planprice: "", planvalidityday: "", totalslots: "" });
    setFiles([]);
    setError("");
    setDone(false);
  }

  return (
    <AppFrame>
      <div className="warp-overlay-note" hidden={!submitting} aria-live="polite">
        {aiMsg}
      </div>

      <Reveal>
        <span className="eyebrow">Primary action</span>
        <h1 className="home-hello">Create a split</h1>
      </Reveal>

      {step === 1 ? (
        <>
          <Reveal variant="blur" delay={100}>
            <p className="home-sub">
              Pick the platform you want to split — or add it if it's missing.
            </p>
          </Reveal>

          {/* search platforms */}
          <div className="create-search">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
              <circle cx="10.5" cy="10.5" r="6.5" />
              <path d="M15.5 15.5 21 21" />
            </svg>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search platforms…"
              maxLength={40}
              aria-label="Search platforms"
            />
          </div>

          {/* add-platform first */}
          <button className="plat-card plat-add top-add" onClick={() => setShowAdd((v) => !v)}>
            <span className="plat-ava add">+</span>
            <span className="plat-name">Add new platform</span>
            <span className="plat-cta">{showAdd ? "close" : "missing? add it →"}</span>
          </button>

          {showAdd && (
            <div className="addplat-panel">
              {addStep === "platform" ? (
                <>
                  <h3>Add a new platform</h3>
                  <div className="field">
                    <label htmlFor="np-name">Platform name *</label>
                    <input
                      id="np-name"
                      value={pf.name}
                      maxLength={30}
                      onChange={(e) => setPf((f) => ({ ...f, name: e.target.value }))}
                      placeholder="e.g. JioCinema"
                    />
                  </div>
                  <div className="field">
                    <label htmlFor="np-desc">Description *</label>
                    <textarea
                      id="np-desc"
                      rows={2}
                      maxLength={200}
                      value={pf.desc}
                      onChange={(e) => setPf((f) => ({ ...f, desc: e.target.value }))}
                      placeholder="What is this platform? (max 200)"
                    />
                  </div>
                  <div className="field">
                    <label>Platform logo (optional, one image)</label>
                    <div className="proof-row">
                      {logoPrev ? (
                        <>
                          <div className="proof-tile">
                            <img src={logoPrev} alt="logo preview" />
                            <button
                              type="button"
                              className="proof-x"
                              aria-label="Remove logo"
                              onClick={() => {
                                setLogoFile(null);
                                setLogoPrev("");
                              }}
                            >
                              ×
                            </button>
                          </div>
                          <button type="button" className="copy-btn" onClick={() => logoRef.current?.click()}>
                            Replace
                          </button>
                        </>
                      ) : (
                        <button type="button" className="proof-tile proof-add" onClick={() => logoRef.current?.click()}>
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                            <path d="M12 5v14M5 12h14" />
                          </svg>
                          <span>Logo</span>
                        </button>
                      )}
                      <input
                        ref={logoRef}
                        type="file"
                        accept="image/*"
                        hidden
                        onChange={(e) => {
                          const f = e.target.files?.[0] || null;
                          setLogoFile(f);
                          setLogoPrev(f ? URL.createObjectURL(f) : "");
                          e.target.value = "";
                        }}
                      />
                    </div>
                  </div>
                  {addMsg && <p className={`rate-msg ${addMsg.includes("✓") ? "ok" : "err"}`}>{addMsg}</p>}
                  <button type="button" className="pill" onClick={doCreatePlatform} disabled={busy}>
                    <span>{busy ? "Creating…" : "Create platform"}</span>
                  </button>
                </>
              ) : (
                <>
                  <h3>Set a category for {pf.name}</h3>
                  <p className="rate-sub">
                    Attach an existing category or create a new one — then continue. The new
                    platform is already selected for your split.
                  </p>

                  <div className="cat-chips">
                    {cats.length === 0 && <span className="none">No categories yet — create one below.</span>}
                    {cats.map((c) => (
                      <button
                        type="button"
                        key={c._id || c.id}
                        className={`catchip ${selCat === (c._id || c.id) ? "on" : ""}`}
                        onClick={() => setSelCat(c._id || c.id)}
                      >
                        {c.categoryname || c.name || "category"}
                      </button>
                    ))}
                  </div>
                  <div className="cat-actions">
                    <button type="button" className="pill" onClick={doSelectCategory} disabled={!selCat || busy}>
                      <span>{busy ? "Working…" : "Attach selected"}</span>
                    </button>
                  </div>

                  <div className="or">or</div>

                  <div className="cat-new">
                    <input
                      value={newCat}
                      maxLength={30}
                      onChange={(e) => setNewCat(e.target.value)}
                      placeholder="New category name"
                      aria-label="New category name"
                    />
                    <button type="button" className="pill" onClick={doCreateCategory} disabled={!newCat.trim() || busy}>
                      <span>Create category</span>
                    </button>
                  </div>

                  {addMsg && <p className={`rate-msg ${addMsg.includes("✓") ? "ok" : "err"}`}>{addMsg}</p>}
                  <button type="button" className="pill continue-btn" onClick={doContinue} disabled={busy}>
                    <span>Continue to plan details →</span>
                  </button>
                </>
              )}
            </div>
          )}

          {platforms === null ? (
            <div className="req-grid plat-grid">
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : filtered.length === 0 && !q ? (
            <p className="sec-empty">No platforms yet — add the first one above.</p>
          ) : filtered.length === 0 ? (
            <p className="sec-empty">No platform matches "{q}" — add it above.</p>
          ) : (
            <div className="req-grid plat-grid">
              {filtered.map((p, i) => (
                <Reveal key={p._id || i} variant="zoom" delay={(i % 3) * 80}>
                  <div className="plat-card" style={{ "--hue": hueFor(p.platformname) }}>
                    <button
                      type="button"
                      className="plat-main"
                      onClick={() => pick(p)}
                      disabled={busyId === p._id}
                    >
                      <PlatformLogo pid={p._id} name={p.platformname} />
                      <span className="plat-name">{p.platformname}</span>
                      <span className="plat-cta">{busyId === p._id ? "Setting up…" : "Split this →"}</span>
                    </button>
                    <Link className="view-details" to={`/platform/${p._id}`}>
                      View details
                    </Link>
                  </div>
                </Reveal>
              ))}
            </div>
          )}
          {hasMore && next && !q && (
            <div className="pagi">
              <button onClick={more}>Load more platforms</button>
            </div>
          )}
        </>
      ) : (
        <Reveal variant="blur" delay={100} className="create-form-wrap">
          <p className="chosen-plat">
            Splitting <b>{chosen?.name}</b>
            <button type="button" className="ghost-btn-sm" onClick={() => setStep(1)}>
              change
            </button>
          </p>

          <form className="auth-form create-form" onSubmit={submit}>
            <div className="field">
              <label htmlFor="planname">Plan name</label>
              <input id="planname" value={form.planname} maxLength={40} onChange={set("planname")} placeholder="e.g. Family Premium" />
            </div>
            <div className="create-row">
              <div className="field">
                <label htmlFor="planprice">Plan price (₹)</label>
                <input id="planprice" type="number" min="1" required value={form.planprice} onChange={set("planprice")} placeholder="799" />
              </div>
              <div className="field">
                <label htmlFor="planvalidityday">Validity (days)</label>
                <input id="planvalidityday" type="number" min="1" required value={form.planvalidityday} onChange={set("planvalidityday")} placeholder="30" />
              </div>
              <div className="field">
                <label htmlFor="totalslots">Total slots</label>
                <input id="totalslots" type="number" min="2" required value={form.totalslots} onChange={set("totalslots")} placeholder="4" />
              </div>
            </div>

            <div className="field">
              <label>Proof images (1–2) *</label>
              <div className="proof-row">
                {files.map((f, i) => (
                  <div className="proof-tile" key={i}>
                    <img src={URL.createObjectURL(f)} alt={f.name} />
                  </div>
                ))}
                {files.length < 2 && (
                  <button type="button" className="proof-tile proof-add" onClick={() => fileRef.current?.click()}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                      <path d="M12 5v14M5 12h14" />
                    </svg>
                    <span>Add proof</span>
                  </button>
                )}
                <input ref={fileRef} type="file" accept="image/*" hidden onChange={onFiles} />
              </div>
              <p className="hint checking">The AI verifies your proof images — it can take a few seconds.</p>
            </div>

            <button type="submit" className="pill" disabled={submitting}>
              <span>{submitting ? "AI is checking…" : "Create split"}</span>
            </button>
          </form>
        </Reveal>
      )}

      {error && !submitting && <p className="sec-empty err">⚠ {error}</p>}

      {submitting && <AiLoader label={aiMsg} />}

      {done && (
        <div className="success-pop" role="status" aria-live="polite">
          <div className="success-pop-card">
            <div className="icon ok">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m4.5 12.5 5 5 10-11" />
              </svg>
            </div>
            <h3>Your request is live! 🎉</h3>
            <p>It's now listed on Explore — taking you home…</p>
          </div>
        </div>
      )}
      {done && (
        <Reveal variant="zoom" className="home-card success-card">
          <div className="icon ok">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m4.5 12.5 5 5 10-11" />
            </svg>
          </div>
          <h3>Your split is live!</h3>
          <p>Your request is listed ✓ — taking you home…</p>
          <div className="success-actions">
            <a href="/search" className="pill"><span>Explore splits</span></a>
            <a href="/groups" className="ghost-btn-sm">My groups</a>
            <button type="button" className="ghost-btn-sm" onClick={reset}>Create another</button>
          </div>
        </Reveal>
      )}
    </AppFrame>
  );
}
