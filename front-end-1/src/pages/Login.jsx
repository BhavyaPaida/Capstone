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
        // Store user info in localStorage
        localStorage.setItem('user', JSON.stringify({
          user_id: response.user_id,
          full_name: response.full_name,
          email: response.email
        }));
        
        // Redirect to dashboard
        navigate('/dashboard');
      } else {
        setError(response.error || 'Login failed');
      }
    } catch (err) {
      setError('Network error. Please try again.');
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-bg">
      <form className="form-box" onSubmit={handleLogin}>
        <h2 className="form-title">Welcome Back</h2>
        
        {error && (
          <div style={{
            background: '#ff444422',
            border: '1px solid #ff4444',
            color: '#ff6666',
            padding: '0.8em',
            borderRadius: '8px',
            marginBottom: '1em',
            width: '100%'
          }}>
            {error}
          </div>
        )}
        
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          className="form-input"
          required
          disabled={loading}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          className="form-input"
          required
          disabled={loading}
        />
        <button type="submit" className="form-btn" disabled={loading}>
          {loading ? 'Logging in...' : 'Login'}
        </button>
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