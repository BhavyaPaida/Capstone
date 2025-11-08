import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Login.css";
import { api } from "../services/api";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await api.login(email, password);

      if (response.success) {
        localStorage.setItem(
          "user",
          JSON.stringify({
            user_id: response.user_id,
            full_name: response.full_name,
            email: response.email,
          })
        );

        navigate("/dashboard");
      } else {
        setError(response.error || "Login failed");
      }
    } catch (err) {
      setError("Network error. Please try again.");
      console.error("Login error:", err);
    } finally {
      setLoading(false);
    }
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
          <h2>Welcome back</h2>
          <p className="auth-subtitle">Sign in to continue your interview journey.</p>
        </div>

        {error && <div className="auth-alert">{error}</div>}

        <div className="auth-input-group">
          <label className="auth-label" htmlFor="login-email">
            Email
            <span>Required</span>
          </label>
          <input
            id="login-email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="auth-input"
            required
            disabled={loading}
          />

          <label className="auth-label" htmlFor="login-password">
            Password
            <span>Minimum 8 characters</span>
          </label>
          <input
            id="login-password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="auth-input"
            required
            disabled={loading}
          />
        </div>

        <div className="auth-actions">
          <span>Stay focused and keep learning.</span>
          
        </div>

        <button type="submit" className="auth-submit" disabled={loading}>
          {loading ? "Signing you in..." : "Sign in securely"}
        </button>

        <div className="auth-footer">
          New to Interview Bot? <Link to="/sign-up">Create an account</Link>
        </div>
      </form>
    </div>
  );
}