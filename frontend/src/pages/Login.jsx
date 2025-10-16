import React, { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v || "");

const Login = () => {
  const { login } = useAuth() || {};
  const nav = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState(() => localStorage.getItem("tt_remember_email") || "");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [remember, setRemember] = useState(!!localStorage.getItem("tt_remember_email"));
  const [msg, setMsg] = useState("");
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  // if redirected from a protected route, show a hint
  useEffect(() => {
    if (location.state?.fromProtected) {
      setMsg("Please log in to continue.");
    }
  }, [location.state]);

  const validate = () => {
    const e = {};
    if (!isEmail(email)) e.email = "Enter a valid email address";
    if (!password) e.password = "Password is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async (ev) => {
    ev.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setMsg("Signing you in…");
    try {
      await login(email.trim(), password);
      // Remember email if checked
      if (remember) localStorage.setItem("tt_remember_email", email.trim());
      else localStorage.removeItem("tt_remember_email");
      // go to dashboard
      nav("/", { replace: true });
    } catch (err) {
      setMsg(err?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const quickFill = (type) => {
    if (type === "admin") {
      setEmail("admin@tt.local");
      setPassword("pass123");
    } else {
      setEmail("res@tt.local");
      setPassword("pass123");
    }
    setMsg("Demo credentials filled.");
  };

  return (
    <div className="container" style={{ display: "grid", placeItems: "center", minHeight: "calc(100vh - 80px)" }}>
      <div
        className="card"
        style={{
          width: "100%",
          maxWidth: 460,
          padding: 22,
          boxShadow: "var(--shadow-2)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
          <span className="brand-dot" />
          <h1 style={{ margin: 0 }}>Welcome back</h1>
        </div>
        <div className="muted" style={{ marginBottom: 16 }}>
          Sign in to manage special pickups and recyclables.
        </div>

        {msg && (
          <div className="alert" style={{ marginBottom: 12 }}>
            {msg}
          </div>
        )}

        <form onSubmit={submit} noValidate>
          <label>Email</label>
          <input
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
            autoComplete="username"
          />
          {errors.email && <div className="error">{errors.email}</div>}

          <label style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span>Password</span>
            <button
              type="button"
              className="btn-ghost"
              style={{ padding: "6px 10px", fontSize: 12 }}
              onClick={() => setShowPwd((s) => !s)}
              disabled={loading}
            >
              {showPwd ? "Hide" : "Show"}
            </button>
          </label>
          <input
            type={showPwd ? "text" : "password"}
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
            autoComplete="current-password"
          />
          {errors.password && <div className="error">{errors.password}</div>}

          <div style={{ marginTop: 12, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <label style={{ display: "flex", gap: 8, alignItems: "center", userSelect: "none" }}>
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                disabled={loading}
                style={{ width: 16, height: 16 }}
              />
              <span className="muted">Remember my email</span>
            </label>
            <Link to="#" className="muted" onClick={(e) => e.preventDefault()}>
              Forgot password?
            </Link>
          </div>

          <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? "Logging in…" : "Login"}
            </button>
            <Link to="/register" className="btn-ghost" style={{ textDecoration: "none", display: "inline-flex", alignItems: "center" }}>
              Create account
            </Link>
          </div>
        </form>

        {/* Divider */}
        <div style={{ height: 1, background: "var(--border)", margin: "16px 0" }} />

        {/* Quick-fill demo creds */}
        <div className="muted" style={{ marginBottom: 8, fontSize: 12 }}>
          Try the demo accounts:
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button type="button" className="btn-ghost" onClick={() => quickFill("resident")} disabled={loading}>
            Use Demo Resident
          </button>
          <button type="button" className="btn-ghost" onClick={() => quickFill("admin")} disabled={loading}>
            Use Demo Admin
          </button>
        </div>

        <div className="helper" style={{ marginTop: 10 }}>
          Admin requires the invite code during registration. For demo, email: <code>admin@tt.local</code>, password: <code>pass123</code>.
        </div>
      </div>
    </div>
  );
};

export default Login;
