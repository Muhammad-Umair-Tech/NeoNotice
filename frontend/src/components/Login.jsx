import { useState } from "react";
import styles from "../styles./Login.module.css";

export default function Login({ onSuccess, onBack }) {
  const [fields, setFields] = useState({ username: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showPass, setShowPass] = useState(false);

  const handleChange = (e) => {
    setError(null);
    setFields((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!fields.username.trim() || !fields.password) {
      setError("Please fill in all fields.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("username", fields.username.trim());
      formData.append("password", fields.password);

      const csrfToken = getCsrfToken();

      const res = await fetch("/login", {
        method: "POST",
        headers: csrfToken ? { "X-CSRFToken": csrfToken } : {},
        body: formData,
        credentials: "include",
      });

      const data = await res.json();

      if (data.success) {
        if (data.role !== "admin" && data.role !== "Admin") {
          setError("Access denied. Only admin accounts can log in here.");
          setLoading(false);
          return;
        }
        onSuccess({ username: data.username, role: data.role });
      } else {
        setError(data.error || "Login failed. Please try again.");
      }
    } catch {
      setError("Network error. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.bgCircle1} />
      <div className={styles.bgCircle2} />

      <div className={styles.card}>
        <button className={styles.backBtn} onClick={onBack}>
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
          >
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
          Back to Board
        </button>
        <div className={styles.brand}>
          <div className={styles.logoMark}>
            <svg width="32" height="32" viewBox="0 0 28 28" fill="none">
              <rect x="4" y="7" width="20" height="3" rx="1.5" fill="white" />
              <rect x="4" y="13" width="15" height="3" rx="1.5" fill="white" />
              <rect x="4" y="19" width="10" height="3" rx="1.5" fill="white" />
            </svg>
          </div>
          <h1 className={styles.brandName}>NEO NOTICE</h1>
          <p className={styles.brandSub}>Admin Portal</p>
        </div>
        <div className={styles.headingBlock}>
          <h2 className={styles.heading}>Welcome back</h2>
          <p className={styles.subheading}>
            Log in to manage the department notice board
          </p>
        </div>
        {error && (
          <div className={styles.errorAlert} role="alert">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <circle cx="12" cy="16" r="0.5" fill="currentColor" />
            </svg>
            {error}
          </div>
        )}
        <form className={styles.form} onSubmit={handleSubmit} noValidate>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="username">
              Username
            </label>
            <div className={styles.inputWrap}>
              <svg
                className={styles.inputIcon}
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="12" cy="8" r="4" />
                <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
              </svg>
              <input
                className={styles.input}
                id="username"
                name="username"
                type="text"
                value={fields.username}
                onChange={handleChange}
                placeholder="Enter your username"
                autoComplete="username"
                autoFocus
                disabled={loading}
              />
            </div>
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="password">
              Password
            </label>
            <div className={styles.inputWrap}>
              <svg
                className={styles.inputIcon}
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <rect x="3" y="11" width="18" height="11" rx="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              <input
                className={styles.input}
                id="password"
                name="password"
                type={showPass ? "text" : "password"}
                value={fields.password}
                onChange={handleChange}
                placeholder="Enter your password"
                autoComplete="current-password"
                disabled={loading}
              />
              <button
                type="button"
                className={styles.eyeBtn}
                onClick={() => setShowPass((v) => !v)}
                tabIndex={-1}
                aria-label={showPass ? "Hide password" : "Show password"}
              >
                {showPass ? (
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M1 12S5 4 12 4s11 8 11 8-4 8-11 8S1 12 1 12z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className={`${styles.submitBtn} ${loading ? styles.loading : ""}`}
            disabled={loading}
          >
            {loading ? (
              <>
                <span className={styles.spinner} />
                Logging In…
              </>
            ) : (
              <>
                Log In
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                >
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </>
            )}
          </button>
        </form>

        <p className={styles.helpText}>
          This portal is restricted to department administrators only.
        </p>
      </div>
    </div>
  );
}

function getCsrfToken() {
  const name = "csrftoken";
  const cookies = document.cookie.split(";");
  for (const cookie of cookies) {
    const [key, val] = cookie.trim().split("=");
    if (key === name) return decodeURIComponent(val);
  }
  return null;
}
