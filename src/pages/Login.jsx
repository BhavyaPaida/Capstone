import { useState } from "react";
import { Link } from "react-router-dom";
import "./Login.css";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = (e) => {
    e.preventDefault();
    // Add login logic here and redirect to dashboard
  };

  return (
    <div className="auth-page soft-scrollbar">
      <section className="auth-hero animate-float">
        <div className="auth-hero-content">
          <span className="tag-pill">Intelligent Interview Prep</span>
          <h1>Step back into your coaching hub</h1>
          <p>
            Track progress, rehearse with AI-driven interviewers, and receive
            personalised guidance crafted for your next role.
          </p>
          <ul className="auth-highlights">
            <li>⚡ Adaptive question difficulty</li>
            <li>🧠 Instant feedback summaries</li>
            <li>📈 Visual performance analytics</li>
          </ul>
        </div>
      </section>

      <form className="auth-card animate-float" onSubmit={handleLogin}>
        <div>
          <h2>Welcome Back</h2>
          <p className="auth-subtitle">Sign in to continue your interview journey.</p>
        </div>

        <div className="auth-input-group">
          <label className="auth-label" htmlFor="email">
            Email
            <span>Required</span>
          </label>
          <input
            id="email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="auth-input"
            required
          />

          <label className="auth-label" htmlFor="password">
            Password
            <span>Minimum 8 characters</span>
          </label>
          <input
            id="password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="auth-input"
            required
          />
        </div>

        <div className="auth-actions">
          <span>Stay focused and keep learning.</span>
          <Link to="/forgot-password">Forgot password?</Link>
        </div>

        <button type="submit" className="auth-submit">
          Sign in securely
        </button>

        <div className="auth-footer">
          New to Interview Bot? <Link to="/sign-up">Create an account</Link>
        </div>
      </form>
    </div>
  );
}