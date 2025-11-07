import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "./Dashboard.css";
import { api } from "../services/api";

const readinessMilestones = [
  { label: "Resume uploaded", key: "resume" },
  { label: "Job description uploaded", key: "jd" },
  { label: "Interview type chosen", key: "session" },
];

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [resumeUploaded, setResumeUploaded] = useState(false);
  const [jdUploaded, setJdUploaded] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const resumeInputRef = useRef(null);
  const jdInputRef = useRef(null);

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (!userData) {
      navigate("/login");
      return;
    }

    const parsedUser = JSON.parse(userData);
    setUser(parsedUser);
    checkUserData(parsedUser.user_id);
  }, [navigate]);

  const checkUserData = async (userId) => {
    try {
      const resumeRes = await api.getUserResume(userId);
      if (resumeRes.success) {
        setResumeUploaded(true);
      }

      const jdRes = await api.getUserJD(userId);
      if (jdRes.success) {
        setJdUploaded(true);
      }
    } catch (err) {
      console.error("Error checking user data:", err);
    }
  };

  const handleResumeUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
      setMessage("Please upload a PDF file");
      return;
    }

    setUploading(true);
    setMessage("Uploading and parsing resume...");

    try {
      const response = await api.uploadResume(user.user_id, file);

      if (response.success) {
        setResumeUploaded(true);
        setMessage("Resume uploaded successfully!");
        setTimeout(() => setMessage(""), 3200);
      } else {
        setMessage(response.error || "Upload failed");
      }
    } catch (err) {
      setMessage("Network error. Please try again.");
      console.error("Resume upload error:", err);
    } finally {
      setUploading(false);
    }
  };

  const handleJDUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
      setMessage("Please upload a PDF file");
      return;
    }

    setUploading(true);
    setMessage("Uploading and parsing job description...");

    try {
      const response = await api.uploadJD(user.user_id, file);

      if (response.success) {
        setJdUploaded(true);
        setMessage("Job description uploaded successfully!");
        setTimeout(() => setMessage(""), 3200);
      } else {
        setMessage(response.error || "Upload failed");
      }
    } catch (err) {
      setMessage("Network error. Please try again.");
      console.error("JD upload error:", err);
    } finally {
      setUploading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/login");
  };

  const goToInterview = () => {
    if (resumeUploaded && jdUploaded) {
      navigate("/interview-type");
    } else {
      setMessage("Please upload both resume and job description first");
      setTimeout(() => setMessage(""), 3200);
    }
  };

  const openHistory = () => navigate("/history");
  const openProfile = () => navigate("/profile");

  if (!user) return null;

  const readyForInterview = resumeUploaded;

  return (
    <div className="app-shell">
      <aside className="app-shell__sidebar soft-scrollbar">
        <div className="sidebar__brand">
          <span>Interview Bot</span>
        </div>
        <nav className="sidebar__nav">
          <button type="button" className="sidebar__link sidebar__link--active">
            Dashboard overview
          </button>
          <button type="button" className="sidebar__link" onClick={openProfile}>
            Profile & preferences
          </button>
          <button type="button" className="sidebar__link" onClick={openHistory}>
            Session history
          </button>
          <button type="button" className="sidebar__link" onClick={() => navigate("/interview-type")}>
            Interview studio
          </button>
        </nav>
        {/* coach promo removed */}
        <button type="button" className="sidebar__logout" onClick={handleLogout}>
          Log out
        </button>
      </aside>

      <main className="app-shell__main soft-scrollbar">
        <header className="dashboard-header animate-float">
          <div>
            <p className="dashboard-header__subtitle">Welcome back,</p>
            <h1>{user.full_name} 👋</h1>
            <p className="dashboard-header__meta">
              Let’s get your next mock interview ready. Upload your latest materials and craft a new adaptive session.
            </p>
          </div>
          <div className="dashboard-header__actions">
            <button
              type="button"
              className="ghost-button"
              onClick={() => resumeInputRef.current?.click()}
              disabled={uploading}
            >
              Upload resume
            </button>
            <button type="button" className="accent-button" onClick={goToInterview}>
              Start new session
            </button>
          </div>
        </header>

        {message && (
          <div
            className={`dashboard-toast animate-float ${
              message.toLowerCase().includes("success") || message.toLowerCase().includes("ready")
                ? "dashboard-toast--success"
                : message.toLowerCase().includes("coming soon")
                ? "dashboard-toast--info"
                : "dashboard-toast--error"
            }`}
          >
            {message}
          </div>
        )}

        <section className="dashboard-highlight glass-panel animate-float">
          <div>
            <h2>Practice readiness</h2>
            <p>
              Complete the steps below to unlock a tailored mock interview with real-time coaching feedback.
            </p>
          </div>
          <div className="highlight__metrics">
            {readinessMilestones.map((milestone) => {
              const isComplete =
                (milestone.key === "resume" && resumeUploaded) ||
                (milestone.key === "jd" && jdUploaded) ||
                (milestone.key === "session" && readyForInterview);

              return (
                <div key={milestone.key} className={isComplete ? "metric-card metric-card--complete" : "metric-card"}>
                  <span>{milestone.label}</span>
                  <strong>{isComplete ? "Ready" : "Pending"}</strong>
                  <small>{isComplete ? "✔ Completed" : "Action required"}</small>
                </div>
              );
            })}
          </div>
        </section>

        <section className="dashboard-grid">
          <article className="dashboard-card glass-panel animate-float">
            <header>
              <h3>Resume on file</h3>
              <span className={resumeUploaded ? "status-chip status-chip--success" : "status-chip"}>
                {resumeUploaded ? "Updated" : "Missing"}
              </span>
            </header>
            <p>
              Upload your latest story so Interview Bot can align questions with your projects, stack, and achievements.
            </p>
            <input
              ref={resumeInputRef}
              type="file"
              accept=".pdf"
              onChange={handleResumeUpload}
              hidden
              disabled={uploading}
            />
            <div className="dashboard-card__actions">
              <button
                type="button"
                className="accent-button"
                onClick={() => resumeInputRef.current?.click()}
                disabled={uploading}
              >
                {resumeUploaded ? "Replace resume" : "Upload PDF"}
              </button>
              <button type="button" className="ghost-button" onClick={openProfile}>
                Manage profile
              </button>
            </div>
          </article>

          <article className="dashboard-card glass-panel animate-float">
            <header>
              <h3>Target role (optional)</h3>
              <span className={jdUploaded ? "status-chip status-chip--success" : "status-chip status-chip--warning"}>
                {jdUploaded ? "Uploaded" : "Optional"}
              </span>
            </header>
            <p>
              Drop in a job description so we can mirror the language, competencies, and expectations of that team.
            </p>
            <input
              ref={jdInputRef}
              type="file"
              accept=".pdf"
              onChange={handleJDUpload}
              hidden
              disabled={uploading}
            />
            <div className="dashboard-card__actions">
              <button
                type="button"
                className="accent-button"
                onClick={() => jdInputRef.current?.click()}
                disabled={uploading}
              >
                {jdUploaded ? "Replace JD" : "Upload JD"}
              </button>
              <button type="button" className="ghost-button" onClick={openHistory}>
                View history
              </button>
            </div>
          </article>

          <article className="dashboard-card glass-panel animate-float">
            <header>
              <h3>Launch interview studio</h3>
              <span className={readyForInterview ? "status-chip status-chip--success" : "status-chip status-chip--warning"}>
                {readyForInterview ? "Ready" : "Blocked"}
              </span>
            </header>
            <p>
              Choose between behavioural, technical, or company-specific practice rooms with AI follow-ups tailored to your goals.
            </p>
            <div className="dashboard-card__actions">
              <button type="button" className="accent-button" onClick={goToInterview}>
                Open interview modes
              </button>
              <button type="button" className="ghost-button" onClick={openHistory}>
                Review past reports
              </button>
            </div>
          </article>

          <article className="dashboard-card glass-panel animate-float">
            <header>
              <h3>Latest coaching notes</h3>
              <span>Yesterday • 7:45 PM</span>
            </header>
            <div className="dashboard-card__body dashboard-card__body--insights">
              <div>
                <strong>Double-click on impact</strong>
                <p>
                  Expand on the “why” behind architectural choices to show your decision-making lens during interviews.
                </p>
              </div>
              <div>
                <strong>Elevate leadership cues</strong>
                <p>
                  Tie team outcomes to your role more explicitly for stronger STAR stories and executive presence.
                </p>
              </div>
              <div>
                <strong>Sharpen closing statements</strong>
                <p>
                  Summarise trade-offs and lessons learned in the final minute to leave a memorable impression.
                </p>
              </div>
            </div>
          </article>
        </section>
      </main>
    </div>
  );
}