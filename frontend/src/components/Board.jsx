import { useState, useEffect } from "react";
import Notice from "./Notice";
import styles from "../styles/Board.module.css";

export default function Board({ onAdminClick }) {
  const [state, setState] = useState({
    notices: [],
    noticesCount: 0,
    loading: true,
    error: null,
  });

  const fetchNotices = () => {
    setState((s) => ({ ...s, loading: true, error: null }));
    fetch("/notices", { credentials: "include" })
      .then((r) => {
        if (!r.ok) throw new Error("Server error");
        return r.json();
      })
      .then((data) => {
        setState({
          notices: data.notices || [],
          noticesCount: data.notices_count || 0,
          loading: false,
          error: null,
        });
      })
      .catch(() => {
        setState((s) => ({
          ...s,
          loading: false,
          error: "Could not load notices. Please try again.",
        }));
      });
  };

  useEffect(() => {
    fetchNotices();
    const interval = setInterval(fetchNotices, 60000);
    return () => clearInterval(interval);
  }, []);

  const now = new Date();
  const dateStr = now.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <div className={styles.brandBlock}>
            <div className={styles.logoMark}>
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                <rect width="28" height="28" rx="7" fill="white" fillOpacity="0.15"/>
                <rect x="6" y="8" width="16" height="2.5" rx="1.25" fill="white"/>
                <rect x="6" y="13" width="12" height="2.5" rx="1.25" fill="white"/>
                <rect x="6" y="18" width="9" height="2.5" rx="1.25" fill="white"/>
              </svg>
            </div>
            <div>
              <h1 className={styles.brandName}>NEO NOTICE</h1>
              <p className={styles.brandSub}>Department Notice Board</p>
            </div>
          </div>

          <div className={styles.headerRight}>
            <span className={styles.dateBadge}>{dateStr}</span>
            <button className={styles.adminBtn} onClick={onAdminClick}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
              </svg>
              Admin Login
            </button>
          </div>
        </div>
        <div className={styles.liveBanner}>
          <span className={styles.liveDot}></span>
          <span>Live Board</span>
          <span className={styles.countChip}>
            {state.loading ? "—" : state.noticesCount} Active Notice{state.noticesCount !== 1 ? "s" : ""}
          </span>
        </div>
      </header>
      <main className={styles.main}>
        {state.loading && (
          <div className={styles.stateContainer}>
            <div className={styles.skeletonGrid}>
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className={styles.skeleton} style={{ animationDelay: `${i * 0.08}s` }} />
              ))}
            </div>
          </div>
        )}

        {!state.loading && state.error && (
          <div className={styles.stateContainer}>
            <div className={styles.errorBox}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><circle cx="12" cy="16" r="0.5" fill="currentColor"/>
              </svg>
              <p>{state.error}</p>
              <button className="btn btn-primary btn-sm" onClick={fetchNotices}>Retry</button>
            </div>
          </div>
        )}

        {!state.loading && !state.error && state.notices.length === 0 && (
          <div className={styles.stateContainer}>
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
                  <rect x="3" y="3" width="18" height="18" rx="3"/>
                  <line x1="7" y1="8" x2="17" y2="8"/>
                  <line x1="7" y1="12" x2="13" y2="12"/>
                </svg>
              </div>
              <h3>No Notices Posted</h3>
              <p>The board is clear. Check back later for updates from the department.</p>
            </div>
          </div>
        )}

        {!state.loading && !state.error && state.notices.length > 0 && (
          <div className={styles.grid}>
            {state.notices.map((notice, index) => (
              <Notice
                key={notice.id ?? index}
                creator={notice.creator_name}
                postedAt={notice.posted_at}
                body={notice.body}
                index={index}
              />
            ))}
          </div>
        )}
      </main>
      <footer className={styles.footer}>
        <span>NEO NOTICE BOARD</span>
        <span>·</span>
        <span>View the Department Notices</span>
      </footer>
    </div>
  );
}
