import { useState } from "react";
import { Link } from "react-router-dom";
import "./Login.css";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="auth-page soft-scrollbar">
      <section className="auth-hero animate-float">
        <div className="auth-hero-content">
          <span className="tag-pill">We’ve got your back</span>
          <h1>Reset access, not your momentum</h1>
          <p>
            We’ll send a secure link so you can set a fresh password and jump
            straight back into your interview prep flow.
          </p>
          <ul className="auth-highlights">
            <li>🔒 End-to-end encrypted</li>
            <li>📮 Link valid for 24 hours</li>
            <li>💬 Need help? Our team is a ping away</li>
          </ul>
        </div>
      </section>

      <form className="auth-card animate-float" onSubmit={handleSubmit}>
        <div>
          <h2>Forgot password</h2>
          <p className="auth-subtitle">
            Enter the email you use with Interview Bot and we’ll send reset instructions.
          </p>
        </div>

        {!submitted ? (
          <div className="auth-input-group">
            <label className="auth-label" htmlFor="reset-email">
              Email address
              <span>We’ll never share this</span>
            </label>
            <input
              id="reset-email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="auth-input"
              required
            />

            <button type="submit" className="auth-submit">
              Send reset link
            </button>
          </div>
        ) : (
          <div className="auth-success animate-float">
            Password reset instructions have been emailed to
            <span>{email}</span>
            Check your inbox (and spam) for the secure link.
          </div>
        )}

        <div className="auth-footer">
          Remembered your password? <Link to="/login">Back to sign in</Link>
        </div>
      </form>
    </div>
  );
}