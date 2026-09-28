import { useState } from "react";

import { useNavigate } from "react-router-dom";

import { AuthShell, ProfilenameField } from "./AuthPage.jsx";

import Warp from "../components/Warp.jsx";

import { addUserDetails } from "../lib/api.js";

import { useProfilenameCheck } from "../lib/useProfilenameCheck.js";

/**
 * New Google users land here to complete their profile.
 * User ID is read from localStorage and sent to the backend.
 */

export default function GoogleCallback() {
  const navigate = useNavigate();

  const check = useProfilenameCheck();

  const [phoneno, setPhoneno] = useState("");
  const [upiid, setUpiid] = useState("");

  const [status, setStatus] = useState({
    state: "idle",
    message: "",
  });

  const [warp, setWarp] = useState(false);

  async function submit(e) {
    

    console.log("userid from localStorage:", userid);
    console.log("Google callback body:", body);
    e.preventDefault();

    if (check.state.status === "taken") {
      setStatus({
        state: "error",
        message: "That profile name is already taken.",
      });
      return;
    }

    const userid = localStorage.getItem("userid");
     console.log("userid from localStorage:", userid);
    if (!userid) {
      setStatus({
        state: "error",
        message: "User ID not found. Please sign in with Google again.",
      });
      return;
    }

    setWarp(true);

    setStatus({
      state: "idle",
      message: "",
    });

    try {
      const body = {
        userid,
        profilename: check.value.trim(),
      };

      if (phoneno) {
        body.phoneno = phoneno;
      }

      if (upiid.trim()) {
        body.upiid = upiid.trim();
      }

      await addUserDetails(body);

      navigate("/home", {
        replace: true,
      });
    } catch (err) {
      setWarp(false);

      setStatus({
        state: "error",
        message:
          err.message || "Could not save your details.",
      });
    }
  }

  return (
    <AuthShell showUser>
      <h1>Complete your profile</h1>

      <p className="auth-sub">
        Your Google account is connected — pick a profile name to finish
        setting up.
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
            onChange={(e) =>
              setPhoneno(
                e.target.value
                  .replace(/\D/g, "")
                  .slice(0, 10)
              )
            }
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
            autoComplete="off"
          />
        </div>

        {status.state === "error" && (
          <p className="auth-msg error" role="alert">
            {status.message}
          </p>
        )}

        <button
          type="submit"
          className="pill"
          disabled={status.state === "loading"}
        >
          <span>Finish setup</span>
        </button>
      </form>

      <Warp
        active={warp}
        label="Setting up your profile…"
      />
    </AuthShell>
  );
}