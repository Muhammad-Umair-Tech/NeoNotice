import styles from "../styles./Notice.module.css";
const CATEGORY_COLORS = [
  { bg: "#f0f9ff", border: "#bae6fd", accent: "#0c4a6e" },
  { bg: "#e0f2fe", border: "#bae6fd", accent: "#1e40af" },
  { bg: "#dbeafe", border: "#bfdbfe", accent: "#1e3a8a" },
  { bg: "#e6e6ff", border: "#c4c4ff", accent: "#312e81" },
  { bg: "#f1f5f9", border: "#cbd5e1", accent: "#1e2937" },
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
