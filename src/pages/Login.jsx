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
    <div className="form-bg">
      <form className="form-box" onSubmit={handleLogin}>
        <h2 className="form-title">Welcome Back</h2>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          className="form-input"
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          className="form-input"
          required
        />
        <button type="submit" className="form-btn">Login</button>
        <div className="form-links">
          <Link to="/forgot-password">Forgot Password?</Link>
        </div>
        <div className="form-links">
          Don't have an account? <Link to="/sign-up">Sign Up</Link>
        </div>
      </form>
    </div>
  );
}