import { useState } from "react";
import "./Login.css"; // Reuse your login form styling

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
    <div className="form-bg">
      <form className="form-box" onSubmit={handleSubmit}>
        <h2 className="form-title">Sign Up</h2>
        {!submitted ? (
          <>
            <input
              type="text"
              placeholder="Your Name"
              value={name}
              onChange={e => setName(e.target.value)}
              className="form-input"
              required
            />
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
            <button type="submit" className="form-btn">Create Account</button>
          </>
        ) : (
          <div style={{color:"#4ec6fa",fontWeight:"700",fontSize:"1.08em",textAlign:"center"}}>
            Account created for <br />
            <span>{name} ({email})</span>
          </div>
        )}
      </form>
    </div>
  );
}