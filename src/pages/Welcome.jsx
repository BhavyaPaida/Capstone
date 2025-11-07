import { Link } from "react-router-dom";
import logo from "../assets/logo.png";
import "./Welcome.css";

export default function Welcome() {
  return (
    <div className="welcome-page soft-scrollbar">
      <header className="welcome-nav animate-float">
        <div className="welcome-brand">
          <img src={logo} alt="Interview Bot logo" />
          <span>Interview Bot</span>
        </div>
        <div className="welcome-nav-actions">
          <Link to="/login" className="ghost-button">
            Log in
          </Link>
          <Link to="/sign-up" className="accent-button">
            Create free account
          </Link>
        </div>
      </header>

      <main className="welcome-main">
        <section className="welcome-hero animate-float">
          <div className="welcome-hero-text">
            <span className="tag-pill">AI-powered interview studio</span>
            <h1>
              Craft your strongest interview performance with realtime coaching and
              analytics.
            </h1>
            <p>
              Build confidence with dynamic practice rooms, interactive interviewers,
              and insights tailored to the role you want next. Interview Bot adapts to
              your strengths, closing gaps with precision.
            </p>
            <div className="welcome-hero-actions">
              <Link to="/login" className="accent-button">
                Start practicing
              </Link>
              <Link to="/interview-type" className="ghost-button">
                Explore interview modes
              </Link>
            </div>
            <div className="welcome-trust-strip">
              <span>Trusted by candidates from</span>
              <div className="welcome-trust-logos">
                <span>FAANG</span>
                <span>FinTech</span>
                <span>Startups</span>
                <span>Consulting</span>
              </div>
            </div>
          </div>
          <div className="welcome-hero-preview">
            <div className="preview-card glass-panel">
              <div className="preview-card__header">
                <span className="tag-pill">Live feedback</span>
                <strong>Score +12%</strong>
              </div>
              <div className="preview-timeline">
                <div className="preview-timeline__item">
                  <span>Communication clarity</span>
                  <div className="preview-progress">
                    <div style={{ width: "78%" }} />
                  </div>
                  <small>78%</small>
                </div>
                <div className="preview-timeline__item">
                  <span>Technical depth</span>
                  <div className="preview-progress">
                    <div style={{ width: "64%" }} />
                  </div>
                  <small>64%</small>
                </div>
                <div className="preview-timeline__item">
                  <span>Structured thinking</span>
                  <div className="preview-progress">
                    <div style={{ width: "88%" }} />
                  </div>
                  <small>88%</small>
                </div>
              </div>
              <footer className="preview-card__footer">
                <span>Next session in 02:15</span>
                <Link to="/dashboard">View dashboard →</Link>
              </footer>
            </div>
          </div>
        </section>

        <section className="welcome-grid animate-float">
          <article className="welcome-tile glass-panel">
            <h3>Adaptive interview rooms</h3>
            <p>
              Practice with AI panels that shift topics as you respond. Build a
              portfolio of mock sessions across behavioural, system design, and coding
              scenarios.
            </p>
          </article>
          <article className="welcome-tile glass-panel">
            <h3>Deep-dive analytics</h3>
            <p>
              Discover trendlines in your pace, empathy, impact, and technical depth to
              identify where to focus next.
            </p>
          </article>
          <article className="welcome-tile glass-panel">
            <h3>Job-aligned prep</h3>
            <p>
              Upload resumes and job descriptions to generate curated drills and
              follow-up questions that mirror your target interviews.
            </p>
          </article>
        </section>
      </main>
    </div>
  );
}