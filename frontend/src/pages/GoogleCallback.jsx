import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuthShell, ProfilenameField } from "./AuthPage.jsx";
import Warp from "../components/Warp.jsx";
import { addUserDetails } from "../lib/api.js";
import { useProfilenameCheck } from "../lib/useProfilenameCheck.js";

/** New Google users land here to complete their profile (cookies already set). */
export default function GoogleCallback() {
  const navigate = useNavigate();
  const check = useProfilenameCheck();
  const [phoneno, setPhoneno] = useState("");
  const [upiid, setUpiid] = useState("");
  const [status, setStatus] = useState({ state: "idle", message: "" });
  const [warp, setWarp] = useState(false);

  async function submit(e) {
    e.preventDefault();
    if (check.state.status === "taken") {
      setStatus({ state: "error", message: "That profile name is already taken." });
      return;
    }
    setWarp(true);
    setStatus({ state: "idle", message: "" });
    try {
      const body = { profilename: check.value.trim() };
      if (phoneno) body.phoneno = phoneno;
      if (upiid.trim()) body.upiid = upiid.trim();
      await addUserDetails(body);
      navigate("/home", { replace: true });
    } catch (err) {
      setWarp(false);
      setStatus({ state: "error", message: err.message || "Could not save your details." });
    }
  }

  return (
    <AuthShell showUser>
      <h1>Complete your profile</h1>
      <p className="auth-sub">
        Your Google account is connected — pick a profile name to finish setting up.
      </p>

      <form className="auth-form" onSubmit={submit}>
        <ProfilenameField check={check} />

        <div className="field">
          <label htmlFor="g-phone">Phone number</label>
          <input
            id="g-phone"
            type="tel"
            value={phoneno}
            maxLength={10}
            onChange={(e) => setPhoneno(e.target.value.replace(/\D/g, "").slice(0, 10))}
            placeholder="Optional (10 digits)"
            autoComplete="tel"
          />
        </div>

        <div className="field">
          <label htmlFor="g-upi">UPI ID</label>
          <input
            id="g-upi"
            value={upiid}
            maxLength={100}
            onChange={(e) => setUpiid(e.target.value)}
            placeholder="Optional (max 100)"
          />
        </div>

        {status.state === "error" && (
          <p className="auth-msg error" role="alert">
            {status.message}
          </p>
        )}

        <button type="submit" className="pill" disabled={status.state === "loading"}>
          <span>Finish setup</span>
        </button>
      </form>

      <Warp active={warp} label="Setting up your profile…" />
    </AuthShell>
  );
}
