import { useState, useEffect, useRef } from "react";
import styles from "../styles/Dashboard.module.css";
import profileStyles from "../styles/UpdateProfile.module.css";

const MAX_CHARS = 100;

function getCsrfToken() {
  const cookies = document.cookie.split(";");
  for (const cookie of cookies) {
    const [key, val] = cookie.trim().split("=");
    if (key === "csrftoken") return decodeURIComponent(val);
  }
  return null;
}

function formatDate(raw) {
  if (!raw) return "—";
  const d = new Date(raw);
  if (isNaN(d)) return raw;
  return (
    d.toLocaleDateString("en-US", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }) +
    " · " +
    d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
  );
}

// Added onProfileUpdate prop to dynamically update parent's user object state
export default function Dashboard({ user, onLogout, onProfileUpdate }) {
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [compose, setCompose] = useState({
    open: false,
    mode: "add",
    notice: null,
  });
  const [formBody, setFormBody] = useState("");
  const [formSaving, setFormSaving] = useState(false);
  const [formError, setFormError] = useState(null);
  const [formSuccess, setFormSuccess] = useState(null);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const [showUpdateProfilePanel, setShowUpdateProfilePanel] = useState(false);
  const [updateProfileFields, setUpdateProfileFields] = useState({
    username: user?.username || "",
    password: "",
    firstName: "",
    lastName: "",
    email: "",
  });
  const [updateProfileSaving, setUpdateProfileSaving] = useState(false);
  const [updateProfileError, setUpdateProfileError] = useState(null);
  const [updateProfileSuccess, setUpdateProfileSuccess] = useState(false);

  const textareaRef = useRef(null);

  // Sync update fields whenever the user object changes or side panel opens
  useEffect(() => {
    if (user) {
      setUpdateProfileFields((prev) => ({
        ...prev,
        username: user.username || "",
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        email: user.email || "",
      }));
    }
  }, [user, showUpdateProfilePanel]);

  const fetchNotices = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/notices", { credentials: "include" });
      const data = await res.json();
      setNotices(data.notices || []);
    } catch {
      setError("Could not load notices.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotices();
  }, []);

  const openAdd = () => {
    setFormBody("");
    setFormError(null);
    setFormSuccess(null);
    setCompose({ open: true, mode: "add", notice: null });
    setTimeout(() => textareaRef.current?.focus(), 100);
  };

  const openEdit = (notice) => {
    setFormBody(notice.body || "");
    setFormError(null);
    setFormSuccess(null);
    setCompose({ open: true, mode: "edit", notice });
    setTimeout(() => textareaRef.current?.focus(), 100);
  };

  const closeCompose = () => {
    setCompose({ open: false, mode: "add", notice: null });
    setFormError(null);
    setFormSuccess(null);
  };

  const handleAdd = async () => {
    if (!formBody.trim()) {
      setFormError("Notice body cannot be empty.");
      return;
    }
    setFormSaving(true);
    setFormError(null);
    try {
      const res = await fetch("/add_notices", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": getCsrfToken() || "",
        },
        credentials: "include",
        body: JSON.stringify({ body: formBody.trim(), is_live: true }),
      });
      const data = await res.json();
      if (data.status) {
        setFormSuccess("Notice posted successfully!");
        fetchNotices();
        setTimeout(closeCompose, 1200);
      } else {
        setFormError(data.error || "Failed to post notice.");
      }
    } catch {
      setFormError("Network error. Please try again.");
    } finally {
      setFormSaving(false);
    }
  };

  const handleUpdate = async () => {
    if (!formBody.trim()) {
      setFormError("Notice body cannot be empty.");
      return;
    }
    setFormSaving(true);
    setFormError(null);
    try {
      const res = await fetch("/update_notices", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": getCsrfToken() || "",
        },
        credentials: "include",
        body: JSON.stringify({
          notice_id: compose.notice.id,
          body: formBody.trim(),
          is_live: compose.notice.is_live ?? true,
          posted_at: compose.notice.posted_at,
        }),
      });
      const data = await res.json();
      if (data.status) {
        setFormSuccess("Notice updated!");
        fetchNotices();
        setTimeout(closeCompose, 1000);
      } else {
        setFormError(data.error || "Failed to update.");
      }
    } catch {
      setFormError("Network error. Please try again.");
    } finally {
      setFormSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch("/delete_notices", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": getCsrfToken() || "",
        },
        credentials: "include",
        body: JSON.stringify({ notice_id: deleteTarget.id }),
      });
      const data = await res.json();
      if (data.success) {
        setDeleteTarget(null);
        fetchNotices();
      } else {
        alert(data.error || "Delete failed.");
      }
    } catch {
      alert("Network error.");
    } finally {
      setDeleting(false);
    }
  };

  const handleUpdateProfileChange = (e) => {
    setUpdateProfileError(null);
    setUpdateProfileSuccess(false);
    setUpdateProfileFields({
      ...updateProfileFields,
      [e.target.name]: e.target.value,
    });
  };

  const handleUpdateProfileSubmit = async (e) => {
    e.preventDefault();
    setUpdateProfileSaving(true);
    try {
      const response = await fetch("/update_admin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": getCsrfToken() || "",
        },
        body: JSON.stringify(updateProfileFields),
      });
      const data = await response.json();
      if (data.success) {
        setUpdateProfileSuccess(true);
        setUpdateProfileFields({ ...updateProfileFields, password: "" });

        const updatedUserPayload = {
          ...user,
          username: updateProfileFields.username,
          firstName: updateProfileFields.firstName,
          lastName: updateProfileFields.lastName,
          email: updateProfileFields.email,
        };

        // Notify parent state handler to propagate updated user attributes down
        if (onProfileUpdate) {
          onProfileUpdate(updatedUserPayload);
        }
      } else {
        setUpdateProfileError(
          // data.error || "Failed to update profile credentials.",
          data.error,
        );
      }
    } catch {
      setUpdateProfileError("An error occurred.");
    } finally {
      setUpdateProfileSaving(false);
    }
  };

  const charsLeft = MAX_CHARS - formBody.length;

  return (
    <div className={styles.page}>
      <aside className={styles.sidebar}>
        <div className={styles.sideTop}>
          <div className={styles.sideLogoMark}>
            <svg width="22" height="22" viewBox="0 0 28 28" fill="none">
              <rect x="4" y="7" width="20" height="3" rx="1.5" fill="white" />
              <rect x="4" y="13" width="15" height="3" rx="1.5" fill="white" />
              <rect x="4" y="19" width="10" height="3" rx="1.5" fill="white" />
            </svg>
          </div>
          <div>
            <div className={styles.sideBrand}>NEO NOTICE</div>
            <div className={styles.sideSub}>Admin Panel</div>
          </div>
        </div>

        <nav className={styles.nav}>
          <div className={`${styles.navItem} ${styles.navActive}`}>
            <svg
              width="17"
              height="17"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <line x1="7" y1="8" x2="17" y2="8" />
              <line x1="7" y1="12" x2="13" y2="12" />
            </svg>
            Notices
            <span className={styles.navBadge}>{notices.length}</span>
          </div>
        </nav>

        <div className={styles.sideBottom}>
          <div className={styles.userCard}>
            {/* dynamic upper-cased initials react layout setup */}
            <div className={styles.userAvatar}>
              {user?.username ? user.username.charAt(0).toUpperCase() : "A"}
            </div>
            <div className={styles.userInfo}>
              <span className={styles.userName}>
                {user?.username || "Admin"}
              </span>
            </div>
          </div>

          <div className={styles.actionGroup}>
            <button
              className={styles.dashboardBtn}
              onClick={() => setShowUpdateProfilePanel(true)}
            >
              Update Profile
            </button>
            <button
              className={styles.dashboardBtn}
              onClick={() => alert("Coming soon.")}
            >
              Add New Admin
            </button>
            <button className={styles.dashboardBtn} onClick={onLogout}>
              Log Out
            </button>
          </div>
        </div>
      </aside>

      <main className={styles.main}>
        <div className={styles.topBar}>
          <div>
            <h2 className={styles.pageTitle}>Manage Notices</h2>
            <p className={styles.pageSubtitle}>
              {loading
                ? "Loading…"
                : `${notices.length} notice${notices.length !== 1 ? "s" : ""} on the board`}
            </p>
          </div>
          <button className="btn btn-primary" onClick={openAdd}>
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Post Notice
          </button>
        </div>

        {loading && (
          <div className={styles.stateBox}>
            <div className={styles.spinner} />
            <p>Loading notices…</p>
          </div>
        )}

        {!loading && error && (
          <div className={styles.stateBox}>
            <p className={styles.errText}>{error}</p>
            <button className="btn btn-ghost btn-sm" onClick={fetchNotices}>
              Retry
            </button>
          </div>
        )}

        {!loading && !error && notices.length === 0 && (
          <div className={styles.stateBox}>
            <div className={styles.emptyIcon}>
              <svg
                width="42"
                height="42"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.3"
              >
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <line x1="12" y1="8" x2="12" y2="16" />
                <line x1="8" y1="12" x2="16" y2="12" />
              </svg>
            </div>
            <p>
              No notices yet. Click <strong>Post Notice</strong> to add the
              first one.
            </p>
          </div>
        )}

        {!loading && !error && notices.length > 0 && (
          <div className={styles.table}>
            <div className={styles.tableHeader}>
              <span>Notice</span>
              <span>Posted By</span>
              <span>Date</span>
              <span>Actions</span>
            </div>
            {notices.map((notice, i) => (
              <div
                key={notice.id ?? i}
                className={styles.tableRow}
                style={{ animationDelay: `${i * 0.05}s` }}
              >
                <div className={styles.noticeBody}>{notice.body}</div>
                <div className={styles.noticeCreator}>
                  {notice.creator_name}
                </div>
                <div className={styles.noticeDate}>
                  {formatDate(notice.posted_at)}
                </div>
                <div className={styles.actions}>
                  <button
                    className={`btn btn-ghost btn-sm ${styles.editBtn}`}
                    onClick={() => openEdit(notice)}
                  >
                    <svg
                      width="13"
                      height="13"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.2"
                    >
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                    Edit
                  </button>
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => setDeleteTarget(notice)}
                  >
                    <svg
                      width="13"
                      height="13"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.2"
                    >
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6l-1 14H6L5 6" />
                      <path d="M10 11v6M14 11v6M9 6V4h6v2" />
                    </svg>
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {compose.open && (
        <div
          className={styles.overlay}
          onClick={(e) => {
            if (e.target === e.currentTarget) closeCompose();
          }}
        >
          <div className={styles.panel}>
            <div className={styles.panelHeader}>
              <h3 className={styles.panelTitle}>
                {compose.mode === "add" ? "Post New Notice" : "Edit Notice"}
              </h3>
              <button
                className={profileStyles.closeBtn}
                onClick={closeCompose}
                aria-label="Close"
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            {formError && (
              <div className={styles.panelError}>
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                </svg>
                {formError}
              </div>
            )}
            {formSuccess && (
              <div className={styles.panelSuccess}>
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <path d="M20 6L9 17l-5-5" />
                </svg>
                {formSuccess}
              </div>
            )}
            <div className={styles.panelField}>
              <label className={styles.panelLabel}>Notice Content</label>
              <textarea
                ref={textareaRef}
                className={styles.textarea}
                value={formBody}
                onChange={(e) => {
                  if (e.target.value.length <= MAX_CHARS)
                    setFormBody(e.target.value);
                  setFormError(null);
                }}
                placeholder="Write the notice content here…"
                rows={7}
                disabled={formSaving}
              />
              <div
                className={`${styles.charCount} ${charsLeft < 100 ? styles.charWarn : ""}`}
              >
                {charsLeft} characters remaining
              </div>
            </div>
            <div className={styles.panelActions}>
              <button
                className="btn btn-ghost"
                onClick={closeCompose}
                disabled={formSaving}
              >
                Cancel
              </button>
              <button
                className={`btn btn-primary ${formSaving ? styles.saving : ""}`}
                onClick={compose.mode === "add" ? handleAdd : handleUpdate}
                disabled={formSaving}
              >
                {formSaving ? (
                  <>
                    <span className={styles.btnSpinner} /> Saving…
                  </>
                ) : compose.mode === "add" ? (
                  <>
                    <svg
                      width="15"
                      height="15"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                    >
                      <line x1="12" y1="5" x2="12" y2="19" />
                      <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>{" "}
                    Post Notice
                  </>
                ) : (
                  <>
                    <svg
                      width="15"
                      height="15"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                    >
                      <path d="M20 6L9 17l-5-5" />
                    </svg>{" "}
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div
          className={styles.overlay}
          onClick={(e) => {
            if (e.target === e.currentTarget && !deleting)
              setDeleteTarget(null);
          }}
        >
          <div className={styles.modal}>
            <div className={styles.modalIcon}>
              <svg
                width="26"
                height="26"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
              >
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6l-1 14H6L5 6" />
                <path d="M10 11v6M14 11v6M9 6V4h6v2" />
              </svg>
            </div>
            <h3 className={styles.modalTitle}>Delete Notice?</h3>
            <p className={styles.modalDesc}>
              This will permanently remove the notice from the board. This
              action cannot be undone.
            </p>
            <div className={styles.modalPreview}>"{deleteTarget.body}"</div>
            <div className={styles.modalActions}>
              <button
                className="btn btn-ghost"
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                className="btn btn-danger"
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? (
                  <>
                    <span className={styles.btnSpinner} /> Deleting…
                  </>
                ) : (
                  "Delete"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {showUpdateProfilePanel && (
        <div
          className={profileStyles.sidebarOverlay}
          onClick={() => setShowUpdateProfilePanel(false)}
        >
          <div
            className={profileStyles.sidebarContent}
            onClick={(e) => e.stopPropagation()}
          >
            {/* FIXED CLOSE BUTTON HANDLER LINKAGE */}
            <button
              className={profileStyles.closeBtn}
              onClick={() => setShowUpdateProfilePanel(false)}
              aria-label="Close"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>

            <h3 className={profileStyles.sidebarHeading}>
              Update Profile Credentials
            </h3>
            <p className={styles.sidebarSubheading}>
              Fill in the fields you want to change. Empty fields will be
              retained.
            </p>

            {updateProfileError && (
              <div className={profileStyles.profileErrorAlert}>
                {updateProfileError}
              </div>
            )}
            {updateProfileSuccess && (
              <div className={profileStyles.profileSuccessAlert}>
                Profile saved successfully!
              </div>
            )}

            <form
              onSubmit={handleUpdateProfileSubmit}
              className={profileStyles.profileForm}
              noValidate
            >
              <div className={profileStyles.fieldGroup}>
                <label htmlFor="profileUsername">Username</label>
                <input
                  id="profileUsername"
                  type="text"
                  name="username"
                  placeholder={user?.username || "Enter username"} // Display full original username placeholder context dynamically
                  value={updateProfileFields.username}
                  onChange={handleUpdateProfileChange}
                  disabled={updateProfileSaving}
                  required
                />
              </div>

              <div className={profileStyles.fieldGroup}>
                <label htmlFor="profilePassword">New Password</label>
                <input
                  id="profilePassword"
                  type="password"
                  name="password"
                  placeholder="Enter a strong password"
                  value={updateProfileFields.password}
                  onChange={handleUpdateProfileChange}
                  disabled={updateProfileSaving}
                  required
                />
              </div>

              <div className={profileStyles.fieldGroup}>
                <label htmlFor="profileFirstName">First Name</label>
                <input
                  id="profileFirstName"
                  type="text"
                  name="firstName"
                  value={updateProfileFields.firstName}
                  onChange={handleUpdateProfileChange}
                  disabled={updateProfileSaving}
                />
              </div>

              <div className={profileStyles.fieldGroup}>
                <label htmlFor="profileLastName">Last Name</label>
                <input
                  id="profileLastName"
                  type="text"
                  name="lastName"
                  value={updateProfileFields.lastName}
                  onChange={handleUpdateProfileChange}
                  disabled={updateProfileSaving}
                />
              </div>

              <div className={profileStyles.fieldGroup}>
                <label htmlFor="profileEmail">Email Address</label>
                <input
                  id="profileEmail"
                  type="email"
                  name="email"
                  value={updateProfileFields.email}
                  onChange={handleUpdateProfileChange}
                  disabled={updateProfileSaving}
                />
              </div>

              <button
                type="submit"
                className={profileStyles.saveProfileBtn}
                disabled={updateProfileSaving}
              >
                {updateProfileSaving ? "Saving Changes..." : "Save Credentials"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
