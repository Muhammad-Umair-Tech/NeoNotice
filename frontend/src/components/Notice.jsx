import styles from "../styles./Notice.module.css";

const CATEGORY_COLORS = [
  { bg: "#eff6ff", border: "#bfdbfe", accent: "#2563eb" },
  { bg: "#f0fdf4", border: "#bbf7d0", accent: "#16a34a" },
  { bg: "#fffbeb", border: "#fde68a", accent: "#d97706" },
  { bg: "#fdf4ff", border: "#e9d5ff", accent: "#7c3aed" },
  { bg: "#fff1f2", border: "#fecdd3", accent: "#e11d48" },
];

function formatDate(rawDate) {
  if (!rawDate) return "—";
  const d = new Date(rawDate);
  if (isNaN(d)) return rawDate;
  return d.toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatTime(rawDate) {
  if (!rawDate) return "";
  const d = new Date(rawDate);
  if (isNaN(d)) return "";
  return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
}

function getInitials(name = "") {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0].toUpperCase())
    .join("");
}

function hashName(name = "") {
  let h = 0;
  for (let i = 0; i < name.length; i++)
    h = (h * 31 + name.charCodeAt(i)) & 0xffffffff;
  return Math.abs(h) % CATEGORY_COLORS.length;
}

export default function Notice({ creator, postedAt, body, index = 0 }) {
  const colorSet = CATEGORY_COLORS[hashName(creator)];
  const initials = getInitials(creator);

  return (
    <article
      className={styles.card}
      style={{
        "--card-bg": colorSet.bg,
        "--card-border": colorSet.border,
        "--card-accent": colorSet.accent,
        animationDelay: `${index * 0.07}s`,
      }}
    >
      <div className={styles.accentBar} />

      <div className={styles.cardHeader}>
        <div className={styles.avatar} style={{ background: colorSet.accent }}>
          {initials || "?"}
        </div>
        <div className={styles.meta}>
          <span className={styles.creator}>{creator || "Department"}</span>
          <span className={styles.timestamp}>
            {formatDate(postedAt)}
            {formatTime(postedAt) && <> &middot; {formatTime(postedAt)}</>}
          </span>
        </div>
        <div className={styles.noticeBadge}>NOTICE</div>
      </div>
      <div className={styles.divider} />
      <p className={styles.body}>{body}</p>
    </article>
  );
}
