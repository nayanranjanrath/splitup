import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import AppFrame from "../components/AppFrame.jsx";
import Reveal from "../components/Reveal.jsx";
import { detailsOfPlatform, addPlatformImage, showPlatformImageJson } from "../lib/api.js";

/** Platform details via /detailsofplatform/:platformid.
 *  Image: platform field → /showplatformimage/:id → default asset.
 *  Upload (only when no image): /addplatformimage (multipart platformimage + platformid).
 */
export default function PlatformPage() {
  const { platformid } = useParams();
  const [plat, setPlat] = useState(null);
  const [err, setErr] = useState("");
  const [srcIdx, setSrcIdx] = useState(0);
  const [platImg, setPlatImg] = useState("");
  const [noImage, setNoImage] = useState(false);
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const fileRef = useRef(null);

  useEffect(() => {
    let alive = true;
    setPlat(null);
    setErr("");
    setSrcIdx(0);
    setNoImage(false);
    detailsOfPlatform(platformid)
      .then((d) => alive && setPlat(d?.platform || d))
      .catch((e) => alive && setErr(e.message || "Platform not found"));
    showPlatformImageJson(platformid)
      .then((d) => {
        const img = d?.platform?.platformimage;
        if (alive) setPlatImg(typeof img === "string" ? img : img?.url || "");
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [platformid]);

  const p = plat || {};
  const candidates = [platImg, p.image, p.url, p.platformimage, p.img].filter(Boolean);
  const src = noImage ? "" : candidates[srcIdx] || "";

  function onImgError() {
    if (srcIdx + 1 < candidates.length) setSrcIdx((i) => i + 1);
    else setNoImage(true);
  }

  function onFile(e) {
    setFile(e.target.files?.[0] || null);
    e.target.value = "";
  }

  async function upload(e) {
    e.preventDefault();
    if (!file) {
      setMsg("Choose an image first.");
      return;
    }
    setBusy(true);
    setMsg("");
    const fd = new FormData();
    fd.append("platformimage", file);
    fd.append("platformid", platformid);
    try {
      const d = await addPlatformImage(fd);
      setMsg("Platform image uploaded ✓");
      const url = d?.platform?.platformimage || d?.image || d?.url || "";
      setPlat({ ...p, image: url || "uploaded" });
      setNoImage(false);
      setSrcIdx(0);
      setFile(null);
    } catch (e2) {
      setMsg(e2.message || "Upload failed.");
    }
    setBusy(false);
  }

  return (
    <AppFrame>
      {err ? (
        <p className="sec-empty err">⚠ {err}</p>
      ) : plat === null ? (
        <p className="sec-empty">Loading platform…</p>
      ) : (
        <Reveal variant="zoom" className="platform-card">
          <div className="platform-img">
            {src && !noImage ? (
              <img src={src} onError={onImgError} alt={p.platformname || "Platform"} />
            ) : (
              <img src="/default-platform.png" alt="Default platform" />
            )}
          </div>
          <h1 className="profile-name">{p.platformname || "Platform"}</h1>
          {p.platformdescription && <p className="profile-full">{p.platformdescription}</p>}

          {noImage && (
            <form className="platform-upload" onSubmit={upload}>
              <p className="rate-sub">This platform has no image yet — add one.</p>
              <div className="proof-row">
                {file && (
                  <div className="proof-tile">
                    <img src={URL.createObjectURL(file)} alt="preview" />
                  </div>
                )}
                <button type="button" className="proof-tile proof-add" onClick={() => fileRef.current?.click()}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                  <span>Choose image</span>
                </button>
                <input ref={fileRef} type="file" accept="image/*" hidden onChange={onFile} />
              </div>
              {msg && <p className={`rate-msg ${msg.includes("✓") ? "ok" : "err"}`}>{msg}</p>}
              <button type="submit" className="pill" disabled={busy}>
                <span>{busy ? "Uploading…" : "Upload platform image"}</span>
              </button>
            </form>
          )}
        </Reveal>
      )}
    </AppFrame>
  );
}
