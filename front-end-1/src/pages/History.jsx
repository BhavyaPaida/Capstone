import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Dashboard.css";
import { api } from "../services/api";

const tabs = [
  { id: "interviews", label: "Interviews" },
  { id: "resumes", label: "Resumes" },
  { id: "jds", label: "Job descriptions" },
];

export default function History() {
  const [user, setUser] = useState(null);
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState("interviews");
  const navigate = useNavigate();

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (!userData) {
      navigate("/login");
      return;
    }

    const parsedUser = JSON.parse(userData);
    setUser(parsedUser);
    fetchHistory(parsedUser.user_id);
  }, [navigate]);

  const fetchHistory = async (userId) => {
    setLoading(true);
    try {
      const interviewRes = await api.getUserInterviews(userId);
      if (interviewRes.success) {
        setInterviews(interviewRes.interviews || []);
      }
    } catch (err) {
      console.error("Error fetching history:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/login");
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getInterviewTypeColor = (type) => {
    const colors = {
      "Technical Interview": "#4CAF50",
      "HR & Behavioral": "#2196F3",
      "AI/ML Specific": "#FF9800",
      "Company-Specific": "#9C27B0",
    };
    return colors[type] || "#4d7bff";
  };

  if (!user) return null;

  return (
    <div className="app-shell">
      <aside className="app-shell__sidebar soft-scrollbar">
        <div className="sidebar__brand">
          <span>Interview Bot</span>
        </div>
        <nav className="sidebar__nav">
          <button type="button" className="sidebar__link" onClick={() => navigate("/dashboard")}>Dashboard overview</button>
          <button type="button" className="sidebar__link" onClick={() => navigate("/profile")}>Profile & preferences</button>
          <button type="button" className="sidebar__link sidebar__link--active">Session history</button>
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
            <p className="dashboard-header__subtitle">Your interview trail</p>
            <h1>History & insights</h1>
            <p className="dashboard-header__meta">
              Revisit past sessions, exports, and uploads. Use this space to spot patterns in your preparation journey.
            </p>
          </div>
          <div className="dashboard-header__actions">
            <button type="button" className="ghost-button" onClick={() => navigate("/dashboard")}>Back to dashboard</button>
            <button type="button" className="accent-button" onClick={() => navigate("/interview-type")}>Start new session</button>
          </div>
        </header>

        <section className="glass-panel history-tabs animate-float">
          <div className="tab-strip">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                className={`tab-strip__button ${selectedTab === tab.id ? "tab-strip__button--active" : ""}`}
                onClick={() => setSelectedTab(tab.id)}
              >
                {tab.label}
                {tab.id === "interviews" && ` (${interviews.length})`}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="history-loading">Loading your activity...</div>
          ) : (
            <div className="history-content">
              {selectedTab === "interviews" && (
                <div className="history-list">
                  {interviews.length === 0 ? (
                    <div className="history-empty">
                      <div className="history-empty__icon">📋</div>
                      <h3>No interviews yet</h3>
                      <p>Kickstart your first AI-powered mock from the dashboard.</p>
                      <button type="button" className="accent-button" onClick={() => navigate("/dashboard")}>
                        Go to dashboard
                      </button>
                    </div>
                  ) : (
                    interviews.map((interview) => (
                      <article key={interview.interview_id} className="history-card glass-panel">
                        <div className="history-card__header">
                          <span
                            className="history-badge"
                            style={{
                              background: `${getInterviewTypeColor(interview.interview_type)}22`,
                              color: getInterviewTypeColor(interview.interview_type),
                            }}
                          >
                            {interview.interview_type}
                          </span>
                          <span className={`status-chip ${interview.report_sent ? "status-chip--success" : "status-chip--warning"}`}>
                            {interview.report_sent ? "Completed" : "In progress"}
                          </span>
                        </div>
                        <div className="history-card__body">
                          <h3>Interview #{interview.interview_id}</h3>
                          <p>{formatDate(interview.conducted_at)}</p>
                          {interview.duration_minutes && (
                            <p>{interview.duration_minutes} minute session</p>
                          )}
                        </div>
                        <div className="history-card__footer">
                          <button type="button" className="ghost-button" onClick={() => navigate("/interview-type")}>Recreate format</button>
                          <button type="button" className="ghost-button" onClick={() => navigate("/dashboard")}>Download report</button>
                        </div>
                      </article>
                    ))
                  )}
                </div>
              )}

              {selectedTab === "resumes" && (
                <div className="history-empty">
                  <div className="history-empty__icon">📄</div>
                  <h3>Resume library coming soon</h3>
                  <p>We’re building a timeline to manage every version you’ve uploaded.</p>
                  <button type="button" className="ghost-button" onClick={() => navigate("/dashboard")}>Upload a resume</button>
                </div>
              )}

              {selectedTab === "jds" && (
                <div className="history-empty">
                  <div className="history-empty__icon">📝</div>
                  <h3>Job description archive</h3>
                  <p>Soon you’ll be able to revisit the roles you’ve targeted and their tailored drills.</p>
                  <button type="button" className="ghost-button" onClick={() => navigate("/dashboard")}>Upload JD</button>
                </div>
              )}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}