import { useState } from "react";
import { Link } from "react-router-dom";
import "./Login.css";

export default function SignUp() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="auth-page soft-scrollbar">
      <section className="auth-hero animate-float">
        <div className="auth-hero-content">
          <span className="tag-pill">Create your space</span>
          <h1>Unlock tailored interview coaching</h1>
          <p>
            Assemble curated question banks, coach with realistic AI avatars,
            and stay accountable with progress snapshots at every milestone.
          </p>
          <ul className="auth-highlights">
            <li>🎯 Personalised learning pathways</li>
            <li>🤖 AI practice partners 24/7</li>
            <li>📬 Weekly growth insights in your inbox</li>
          </ul>
        </div>
      </section>

      <form className="auth-card animate-float" onSubmit={handleSubmit}>
        <div>
          <h2>Create your account</h2>
          <p className="auth-subtitle">
            It only takes a minute to tailor Interview Bot to your goals.
          </p>
        </div>

        {!submitted ? (
          <div className="auth-input-group">
            <label className="auth-label" htmlFor="name">
              Full name
              <span>Let’s keep things personal</span>
            </label>
            <input
              id="name"
              type="text"
              placeholder="Alex Morgan"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="auth-input"
              required
            />

            <label className="auth-label" htmlFor="signup-email">
              Email
              <span>We’ll send confirmations here</span>
            </label>
            <input
              id="signup-email"
              type="email"
              placeholder="alex@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="auth-input"
              required
            />

            <label className="auth-label" htmlFor="signup-password">
              Password
              <span>Use at least 8 characters</span>
            </label>
            <input
              id="signup-password"
              type="password"
              placeholder="Create a strong password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="auth-input"
              required
              minLength={8}
            />

            <button type="submit" className="auth-submit">
              Create my profile
            </button>
          </div>
        ) : (
          <div className="auth-success animate-float">
            Account created for
            <span>
              {name} ({email})
            </span>
            Start curating your first mock interview!
          </div>
        )}

        <div className="auth-footer">
          Already practicing with us? <Link to="/login">Sign in</Link>
        </div>
      </form>
    </div>
  );
}