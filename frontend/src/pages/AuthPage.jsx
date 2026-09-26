import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { LogoMark } from "../components/Logo.jsx";
import ThemeToggle from "../components/ThemeToggle.jsx";
import PlateVideo from "../components/PlateVideo.jsx";
import UserChip from "../components/UserChip.jsx";
import Warp from "../components/Warp.jsx";
import { login, registerUser, verifyUser, apiFetch } from "../lib/api.js";
import { useProfilenameCheck } from "../lib/useProfilenameCheck.js";

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
    <path fill="#FFC107" d="M43.6 20.1H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3l5.7-5.7C34.3 6.1 29.4 4 24 4 13 4 4 13 4 24s9 20 20 20 20-9 20-20c0-1.3-.1-2.6-.4-3.9z" />
    <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.9 1.2 8 3l5.7-5.7C34.3 6.1 29.4 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
    <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
    <path fill="#1976D2" d="M43.6 20.1H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C36.9 39.2 44 34 44 24c0-1.3-.1-2.6-.4-3.9z" />
  </svg>
);



export function AuthShell({ children, showUser = false }) {
  return (
    <div className="auth-stage">
      <div className="plate">
        <PlateVideo
          videoStyle={{
            inset: 0,
            width: "100%",
            height: "100%",
            left: 0,
            top: 0,
            transform: "none",
            objectPosition: "50% center",
          }}
        />
      </div>

      <div className="auth-top">
        <Link to="/" className="back" aria-label="SplitUp home">
          <LogoMark className="amark" />
        </Link>
        <div className="auth-top-right">
          <ThemeToggle />
          {showUser && <UserChip quiet />}
          <Link to="/" className="back">
            ← Back to home
          </Link>
        </div>
      </div>

      <div className="auth-card">{children}</div>
    </div>
  );
}



export function ProfilenameField({ check }) {
  const { value, setValue, state } = check;
  const cls = state.status === "available" ? "ok" : state.status === "taken" ? "bad" : "";
  return (
    <div className="field">
      <label htmlFor="profilename">Profile name *</label>
      <input
        id="profilename"
        className={cls}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        required
        minLength={3}
        maxLength={10}
        placeholder="e.g. moss_wandr"
        autoComplete="off"
        spellCheck={false}
      />
      <p className={`hint ${state.status}`} aria-live="polite">
        {state.status === "checking" && "Checking availability…"}
        {state.status === "available" && `✓ ${state.message || "Profile name is available"}`}
        {state.status === "taken" && "✗ Already taken — try another name"}
        {state.status === "error" && "Could not check this name right now"}
      </p>
    </div>
  );
}

const GIS_SRC = "https://accounts.google.com/gsi/client";


export function GoogleButton({ onError }) {
  const navigate = useNavigate();

  const buttonRef = useRef(null);
  const initializedRef = useRef(false);
  const credRef = useRef(async () => {});

  credRef.current = async (token) => {
    try {
      const d = await apiFetch("/googleauth", {
        method: "POST",
        body: { token },
        auth: false,
        quiet: true,
      });

      console.log("Google backend response:", d);

      if (/logged in/i.test(d?.message || "")) {
        navigate("/home", { replace: true });
      } else {
        navigate("/google-callback", { replace: true });
      }
    } catch (e) {
      console.error("Google authentication failed:", e);

      const message =
        e?.message || "Google sign-in failed.";

      onError?.(message);
    }
  };

  useEffect(() => {
    const cid = import.meta.env.VITE_GOOGLE_CLIENT_ID;

    if (!cid) {
      onError?.(
        "Add VITE_GOOGLE_CLIENT_ID to .env to enable Google sign-in."
      );
      return;
    }

    const initGoogle = () => {
      if (
        initializedRef.current ||
        !window.google?.accounts?.id ||
        !buttonRef.current
      ) {
        return;
      }

      initializedRef.current = true;

      window.google.accounts.id.initialize({
        client_id: cid,

        // Your existing backend credential handler
        callback: (response) => {
          console.log("Google credential received");
          credRef.current(response.credential);
        },

        // Use popup for the actual Google button
        ux_mode: "popup",

        // Current FedCM button support
        use_fedcm_for_button: true,
      });

      window.google.accounts.id.renderButton(
        buttonRef.current,
        {
          type: "standard",
          theme: "outline",
          size: "large",
          text: "continue_with",
          shape: "pill",
          width: 350,
        }
      );
    };

    if (window.google?.accounts?.id) {
      initGoogle();
      return;
    }

    const script = document.createElement("script");

    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;

    script.onload = initGoogle;

    script.onerror = () => {
      onError?.("Could not load Google Sign-In.");
    };

    document.head.appendChild(script);

  }, [onError]);

  return (
    <div
      ref={buttonRef}
      style={{
        display: "flex",
        justifyContent: "center",
        marginTop: "12px",
      }}
    />
  );
}


function LoginCard() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState({ state: "idle", message: "" });
  const [warp, setWarp] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setStatus({ state: "loading", message: "" });
    setWarp(true);
    try {
      await login(email, password);
      navigate("/home", { replace: true });
    } catch (err) {
      setWarp(false);
      setStatus({ state: "error", message: err.message || "Sign in failed." });
    }
  }

  return (
    <>
      <h1>Sign in</h1>
      <p className="auth-sub">Welcome back — split more, pay less.</p>

      <div className="auth-tabs" role="tablist">
        <Link to="/login" className="active" role="tab" aria-selected="true">
          Sign in
        </Link>
        <Link to="/register" className="" role="tab" aria-selected="false">
          Sign up
        </Link>
      </div>

      <form className="auth-form" onSubmit={submit}>
        <div className="field">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            maxLength={60}
            placeholder="you@example.com"
            autoComplete="email"
          />
        </div>
        <div className="field">
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            maxLength={60}
            placeholder="••••••••"
            autoComplete="current-password"
          />
        </div>

        {status.state === "error" && (
          <p className="auth-msg error" role="alert">
            {status.message}
          </p>
        )}

        <button type="submit" className="pill" disabled={status.state === "loading"}>
          <span>{status.state === "loading" ? "Please wait…" : "Sign in"}</span>
        </button>
      </form>

      <GoogleButton onError={(m) => setStatus({ state: "error", message: m })} />

      <p className="auth-alt">
        New to SplitUp? <Link to="/register">Create an account</Link>
      </p>

      <Warp active={warp} label="Signing you in…" />
    </>
  );
}



const OTP_TTL = 300; // seconds

function OtpCard({ email, password, onRestart }) {
  const navigate = useNavigate();
  const [otp, setOtp] = useState("");
  const [left, setLeft] = useState(OTP_TTL);
  const [expired, setExpired] = useState(false);
  const [status, setStatus] = useState({ state: "idle", message: "" });
  const [warp, setWarp] = useState(false);

  useEffect(() => {
    const id = setInterval(() => {
      setLeft((l) => {
        if (l <= 1) {
          clearInterval(id);
          setExpired(true);
          return 0;
        }
        return l - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const mm = Math.floor(left / 60);
  const ss = String(left % 60).padStart(2, "0");

  async function submit(e) {
    e.preventDefault();
    setStatus({ state: "loading", message: "" });
    setWarp(true);
    try {
      await verifyUser(email, otp.trim());
    
      await login(email, password);
      navigate("/home", { replace: true });
    } catch (err) {
      setWarp(false);
      setStatus({ state: "error", message: err.message || "Incorrect OTP. Try again." });
    }
  }

  return (
    <div className="otp-box">
      <h1>Verify your email</h1>
      <p className="auth-sub">
        We sent a one-time code to <strong>{email}</strong>. Enter it below to finish creating
        your account.
      </p>

      <form className="auth-form" onSubmit={submit} style={{ width: "100%" }}>
        <input
          className="otp-input"
          value={otp}
          onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
          placeholder="——————"
          inputMode="numeric"
          autoFocus
          disabled={expired}
          aria-label="One-time code"
        />

        <p className={`otp-timer ${left <= 60 ? "warn" : ""}`} aria-live="polite">
          {expired ? (
            <>OTP expired — the code is no longer valid.</>
          ) : (
            <>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <circle cx="12" cy="13" r="8" />
                <path d="M12 9v4l2.5 2.5M9 2h6" />
              </svg>
              Code expires in {mm}:{ss}
            </>
          )}
        </p>

        {status.state === "error" && (
          <p className="auth-msg error" role="alert">
            {status.message}
          </p>
        )}

        {expired ? (
          <button type="button" className="pill" onClick={onRestart}>
            <span>Start over</span>
          </button>
        ) : (
          <button
            type="submit"
            className="pill"
            disabled={status.state === "loading" || otp.length < 4}
          >
            <span>{status.state === "loading" ? "Verifying…" : "Verify & continue"}</span>
          </button>
        )}
      </form>

      <Warp active={warp} label="Verifying your email…" />
    </div>
  );
}



function RegisterCard() {
  const navigate = useNavigate();
  const check = useProfilenameCheck();
  const [step, setStep] = useState("form");
  const [form, setForm] = useState({ email: "", password: "", fullname: "", phoneno: "" });
  const [avatar, setAvatar] = useState(null);
  const [preview, setPreview] = useState("");
  const [status, setStatus] = useState({ state: "idle", message: "" });
  const [warp, setWarp] = useState(false);
  const fileRef = useRef(null);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  function onAvatar(e) {
    const f = e.target.files?.[0] || null;
    setAvatar(f);
    setPreview(f ? URL.createObjectURL(f) : "");
  }

  async function submit(e) {
    e.preventDefault();
    if (check.state.status === "taken") {
      setStatus({ state: "error", message: "That profile name is already taken." });
      return;
    }
    if (form.password.length < 6) {
      setStatus({ state: "error", message: "Password must be at least 6 characters." });
      return;
    }
    if (!form.phoneno) {
      setStatus({ state: "error", message: "Phone number is required." });
      return;
    }
    setStatus({ state: "loading", message: "" });
    setWarp(true);
    try {
      await registerUser({
        profilename: check.value.trim(),
        email: form.email,
        password: form.password,
        fullname: form.fullname,
        phoneno: form.phoneno,
        avatar,
      });
      setWarp(false);
      setStep("otp");
    } catch (err) {
     
      navigate("/", {
        state: { authError: `Registration failed — ${err.message || "please try again."}` },
      });
    }
  }

  if (step === "otp") {
    return <OtpCard email={form.email} password={form.password} onRestart={() => setStep("form")} />;
  }

  return (
    <>
      <h1>Create your account</h1>
      <p className="auth-sub">Join SplitUp and start splitting subscriptions in minutes.</p>

      <div className="auth-tabs" role="tablist">
        <Link to="/login" className="" role="tab" aria-selected="false">
          Sign in
        </Link>
        <Link to="/register" className="active" role="tab" aria-selected="true">
          Sign up
        </Link>
      </div>

      <form className="auth-form" onSubmit={submit}>
        <ProfilenameField check={check} />

              <div className="field">
                <label htmlFor="email">Email *</label>
                <input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={set("email")}
                  required
                  maxLength={60}
                  placeholder="you@example.com"
                  autoComplete="email"
                />
              </div>

              <div className="field">
                <label htmlFor="password">Password *</label>
                <input
                  id="password"
                  type="password"
                  value={form.password}
                  onChange={set("password")}
                  required
                  maxLength={60}
                  placeholder="At least 6 characters"
                  autoComplete="new-password"
                />
              </div>

              <div className="field">
                <label htmlFor="fullname">Full name</label>
                <input
                  id="fullname"
                  value={form.fullname}
                  onChange={set("fullname")}
                  maxLength={30}
                  placeholder="Optional (max 30)"
                  autoComplete="name"
                />
              </div>

              <div className="field">
                <label htmlFor="phoneno">Phone number *</label>
                <input
                  id="phoneno"
                  type="tel"
                  value={form.phoneno}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, phoneno: e.target.value.replace(/\D/g, "").slice(0, 10) }))
                  }
                  maxLength={10}
                  required
                  placeholder="10 digits"
                  autoComplete="tel"
                />
              </div>

        <div className="field">
          <label>Avatar</label>
          <div className="avatar-row">
            {preview ? (
              <img className="avatar-prev" src={preview} alt="Avatar preview" />
            ) : (
              <div className="avatar-prev avatar-empty" aria-hidden="true">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
                  <circle cx="12" cy="8.5" r="3.5" />
                  <path d="M4.5 20c1-3.6 4-5.5 7.5-5.5s6.5 1.9 7.5 5.5" />
                </svg>
              </div>
            )}
            <button type="button" className="avatar-btn" onClick={() => fileRef.current?.click()}>
              {avatar ? "Change photo" : "Upload photo"}
            </button>
            <input ref={fileRef} type="file" accept="image/*" hidden onChange={onAvatar} />
            <span className="avatar-note">Optional</span>
          </div>
        </div>

        {status.state === "error" && (
          <p className="auth-msg error" role="alert">
            {status.message}
          </p>
        )}

        <button type="submit" className="pill" disabled={status.state === "loading"}>
          <span>{status.state === "loading" ? "Creating account…" : "Create account"}</span>
        </button>
      </form>

      <GoogleButton onError={(m) => setStatus({ state: "error", message: m })} />

      <p className="auth-alt">
        Already have an account? <Link to="/login">Sign in</Link>
      </p>

      <Warp active={warp} label="Creating your account…" />
    </>
  );
}

export default function AuthPage({ mode }) {
  return (
    <AuthShell showUser={mode !== "login"}>
      {mode === "login" ? <LoginCard /> : <RegisterCard />}
    </AuthShell>
  );
}
