import { useState } from "react";
import "./Login.css"; // Reuse your login form styling

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="form-bg">
      <form className="form-box" onSubmit={handleSubmit}>
        <h2 className="form-title">Forgot Password</h2>
        {!submitted ? (
          <>
            <input
              type="email"
              placeholder="Enter your registered email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="form-input"
              required
            />
            <button type="submit" className="form-btn">Send Reset Link</button>
          </>
        ) : (
          <div style={{color:"#4ec6fa",fontWeight:"700",fontSize:"1.08em",textAlign:"center"}}>
            Password reset instructions have been sent to <br />
            <span>{email}</span>
          </div>
        )}
      </form>
    </div>
  );
}