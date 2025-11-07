import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Dashboard.css";
import { api } from "../services/api";

export default function Profile() {
  const [user, setUser] = useState(null);
  const [editing, setEditing] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [resumeCount, setResumeCount] = useState(0);
  const [jdCount, setJdCount] = useState(0);
  const [interviewCount, setInterviewCount] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (!userData) {
      navigate("/login");
      return;
    }

    const parsedUser = JSON.parse(userData);
    setUser(parsedUser);
    setFullName(parsedUser.full_name);
    setEmail(parsedUser.email);
    fetchUserStats(parsedUser.user_id);
  }, [navigate]);

  const fetchUserStats = async () => {
    setResumeCount(1);
    setJdCount(1);
    setInterviewCount(0);
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/login");
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setMessage("Profile update feature coming soon!");
    setTimeout(() => setMessage(""), 3200);
    setEditing(false);
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      setMessage("Passwords do not match!");
      setTimeout(() => setMessage(""), 3200);
      return;
    }

    if (newPassword.length < 6) {
      setMessage("Password must be at least 6 characters!");
      setTimeout(() => setMessage(""), 3200);
      return;
    }

    try {
      const res = await api.changePassword(user.user_id, currentPassword, newPassword);
      if (res.success) {
        setMessage("Password changed successfully!");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        setMessage(res.error || "Password change failed");
      }
    } catch (err) {
      setMessage("Network error. Please try again.");
    } finally {
      setTimeout(() => setMessage(""), 3200);
    }
  };

  if (!user) return null;

  const messageVariant = message.toLowerCase().includes("soon") ? "info" : message.toLowerCase().includes("error") ? "error" : "success";

  return (
    <div className="app-shell">
      <aside className="app-shell__sidebar soft-scrollbar">
        <div className="sidebar__brand">
          <span>Interview Bot</span>
        </div>
        <nav className="sidebar__nav">
          <button type="button" className="sidebar__link" onClick={() => navigate("/dashboard")}>Dashboard overview</button>
          <button type="button" className="sidebar__link sidebar__link--active">Profile & preferences</button>
          <button type="button" className="sidebar__link" onClick={() => navigate("/history")}>Session history</button>
          <button type="button" className="sidebar__link" onClick={() => navigate("/interview-type")}>Interview studio</button>
        </nav>
        {/* coach promo removed */}
        <button type="button" className="sidebar__logout" onClick={handleLogout}>
          Log out
        </button>
      </aside>

      <main className="app-shell__main soft-scrollbar">
        <header className="dashboard-header animate-float">
          <div>
            <p className="dashboard-header__subtitle">Account controls</p>
            <h1>Profile settings</h1>
            <p className="dashboard-header__meta">
              Keep your personal details and security preferences up to date so Interview Bot can tailor every session.
            </p>
          </div>
          <div className="dashboard-header__actions">
            <button type="button" className="ghost-button" onClick={() => setEditing(!editing)}>
              {editing ? "Cancel edit" : "Edit profile"}
            </button>
            <button type="button" className="accent-button" onClick={() => navigate("/interview-type")}>Launch interview</button>
          </div>
        </header>

        {message && <div className={`profile-toast animate-float profile-toast--${messageVariant}`}>{message}</div>}

        <section className="glass-panel profile-stats animate-float">
          <h2>Account statistics</h2>
          <div className="profile-stat-grid">
            <div className="profile-stat">
              <strong>{resumeCount}</strong>
              <span>Resumes uploaded</span>
            </div>
            <div className="profile-stat">
              <strong>{jdCount}</strong>
              <span>Job descriptions</span>
            </div>
            <div className="profile-stat">
              <strong>{interviewCount}</strong>
              <span>Interviews completed</span>
            </div>
          </div>
        </section>

        <section className="glass-panel profile-section animate-float">
          <div className="profile-section__header">
            <h2>Profile information</h2>
            <span>Your details power personalised prep.</span>
          </div>
          {!editing ? (
            <div className="profile-details">
              <article>
                <label>Full name</label>
                <p>{user.full_name}</p>
              </article>
              <article>
                <label>Email</label>
                <p>{user.email}</p>
              </article>
              <article>
                <label>User ID</label>
                <p>{user.user_id}</p>
              </article>
            </div>
          ) : (
            <form className="profile-form" onSubmit={handleUpdateProfile}>
              <label htmlFor="full-name">Full name</label>
              <input
                id="full-name"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="profile-input"
              />
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="profile-input"
              />
              <button type="submit" className="accent-button">Save changes</button>
            </form>
          )}
        </section>

        <section className="glass-panel profile-section animate-float">
          <div className="profile-section__header">
            <h2>Change password</h2>
            <span>Keep your account secure with a strong password.</span>
          </div>
          <form className="profile-form" onSubmit={handleChangePassword}>
            <label htmlFor="current-password">Current password</label>
            <input
              id="current-password"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              className="profile-input"
              placeholder="Enter current password"
            />
            <label htmlFor="new-password">New password</label>
            <input
              id="new-password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={6}
              className="profile-input"
              placeholder="Enter new password"
            />
            <label htmlFor="confirm-password">Confirm new password</label>
            <input
              id="confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
              className="profile-input"
              placeholder="Confirm new password"
            />
            <button type="submit" className="accent-button">Change password</button>
          </form>
        </section>
      </main>
    </div>
  );
}