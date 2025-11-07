import { Link } from "react-router-dom";
import "./Dashboard.css";

const quickActions = [
  {
    title: "Upload resume",
    description: "Tune interview drills with the strengths already in your story.",
    action: "Upload",
  },
  {
    title: "Upload job description",
    description: "Let Interview Bot mirror the exact role expectations you’re targeting.",
    action: "Add JD",
  },
  {
    title: "Choose interview format",
    description: "Switch between behavioural, coding, system design, or panel rounds.",
    action: "Select",
    to: "/interview-type",
  },
  {
    title: "Review past sessions",
    description: "Revisit insights, transcripts, and feedback to identify focus areas.",
    action: "Open history",
  },
];

const focusAreas = [
  { label: "Communication clarity", progress: 82 },
  { label: "Problem framing", progress: 74 },
  { label: "Technical depth", progress: 66 },
  { label: "Leadership signals", progress: 58 },
];

const upcomingSessions = [
  { title: "System design deep-dive", date: "Tomorrow • 5:00 PM", interviewer: "AI Architect" },
  { title: "Behavioural warm-up", date: "Sat • 11:30 AM", interviewer: "Coach Nia" },
  { title: "Frontend architecture", date: "Mon • 8:00 PM", interviewer: "Coach Atlas" },
];

export default function Dashboard() {
  return (
    <div className="app-shell">
      <aside className="app-shell__sidebar soft-scrollbar">
        <div className="sidebar__brand">
          <span>Interview Bot</span>
        </div>
        <nav className="sidebar__nav">
          <Link to="/dashboard" className="sidebar__link sidebar__link--active">
            Dashboard overview
          </Link>
          <button type="button" className="sidebar__link">
            Profile & preferences
          </button>
          <button type="button" className="sidebar__link">
            Session history
          </button>
          <button type="button" className="sidebar__link">
            Resources library
          </button>
        </nav>
        <div className="sidebar__footer">
          <div>
            <p>Need a human coach?</p>
            <span>Book a strategy review call.</span>
          </div>
          <button type="button" className="ghost-button">
            Schedule call
          </button>
        </div>
      </aside>

      <main className="app-shell__main soft-scrollbar">
        <header className="dashboard-header animate-float">
          <div>
            <p className="dashboard-header__subtitle">Good afternoon,</p>
            <h1>Sarah Miller 👋</h1>
            <p className="dashboard-header__meta">
              Senior Frontend Engineer prep • Week 4 of 6 • Confidence index up 12%
              this week.
            </p>
          </div>
          <div className="dashboard-header__actions">
            <button type="button" className="ghost-button">
              Upload resume
            </button>
            <Link to="/interview-type" className="accent-button">
              Start new session
            </Link>
          </div>
        </header>

        <section className="dashboard-highlight animate-float glass-panel">
          <div>
            <h2>Weekly momentum</h2>
            <p>
              You completed <strong>3</strong> mock interviews this week and improved
              your system design score by <strong>+8 pts</strong>.
            </p>
          </div>
          <div className="highlight__metrics">
            <div>
              <span>AI confidence index</span>
              <strong>71%</strong>
              <small>+6% vs last week</small>
            </div>
            <div>
              <span>Time to next session</span>
              <strong>02:15:08</strong>
              <small>Behavioural warm-up</small>
            </div>
          </div>
        </section>

        <section className="dashboard-grid">
          <article className="dashboard-card glass-panel animate-float">
            <header>
              <h3>Focus areas</h3>
              <span>Today’s goals</span>
            </header>
            <div className="dashboard-card__body">
              {focusAreas.map((area) => (
                <div key={area.label} className="progress-item">
                  <div className="progress-item__header">
                    <span>{area.label}</span>
                    <span>{area.progress}%</span>
                  </div>
                  <div className="progress-bar">
                    <div style={{ width: `${area.progress}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </article>

          <article className="dashboard-card glass-panel animate-float">
            <header>
              <h3>Upcoming sessions</h3>
              <Link to="/interview-type">Manage</Link>
            </header>
            <div className="dashboard-card__body dashboard-card__body--list">
              {upcomingSessions.map((session) => (
                <div key={session.title} className="session-item">
                  <div>
                    <strong>{session.title}</strong>
                    <span>{session.date}</span>
                  </div>
                  <p>{session.interviewer}</p>
                </div>
              ))}
            </div>
          </article>

          <article className="dashboard-card glass-panel animate-float">
            <header>
              <h3>Quick actions</h3>
              <span>Stay on track</span>
            </header>
            <div className="dashboard-card__body dashboard-card__body--actions">
              {quickActions.map((action) => (
                <div key={action.title} className="action-item">
                  <div>
                    <strong>{action.title}</strong>
                    <p>{action.description}</p>
                  </div>
                  {action.to ? (
                    <Link to={action.to} className="ghost-button">
                      {action.action}
                    </Link>
                  ) : (
                    <button type="button" className="ghost-button">
                      {action.action}
                    </button>
                  )}
                </div>
              ))}
            </div>
          </article>

          <article className="dashboard-card glass-panel animate-float">
            <header>
              <h3>Recent insights</h3>
              <span>Yesterday • 7:45 PM</span>
            </header>
            <div className="dashboard-card__body dashboard-card__body--insights">
              <div>
                <strong>Double-click on impact</strong>
                <p>
                  Expand on the “why” behind architectural choices to show your
                  decision-making lens.
                </p>
              </div>
              <div>
                <strong>Elevate leadership cues</strong>
                <p>
                  Tie team outcomes to your role more explicitly for stronger STAR
                  stories.
                </p>
              </div>
            </div>
          </article>
        </section>
      </main>
    </div>
  );
}
