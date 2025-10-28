import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "./Login.css";
import { api } from "../services/api";

export default function SignUp() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await api.register(name, email, password);
      
      console.log('Registration response:', response); // Debug log
      
      if (response.success) {
        // Store user info
        localStorage.setItem('user', JSON.stringify({
          user_id: response.user_id,
          full_name: name,
          email: email
        }));
        
        console.log('Stored user data, navigating to dashboard...'); // Debug log
        
        // Navigate immediately (or after short delay)
        setTimeout(() => {
          navigate('/dashboard');
        }, 500);
      } else {
        setError(response.error || 'Registration failed');
        setLoading(false);
      }
    } catch (err) {
      setError('Network error. Please try again.');
      console.error('Registration error:', err);
      setLoading(false);
    }
  };

  return (
    <div className="form-bg">
      <form className="form-box" onSubmit={handleSubmit}>
        <h2 className="form-title">Sign Up</h2>
        
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
          type="text"
          placeholder="Your Name"
          value={name}
          onChange={e => setName(e.target.value)}
          className="form-input"
          required
          disabled={loading}
        />
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
          minLength="6"
        />
        <button type="submit" className="form-btn" disabled={loading}>
          {loading ? 'Creating Account...' : 'Create Account'}
        </button>
        <div className="form-links">
          Already have an account? <Link to="/login">Login</Link>
        </div>
      </form>
    </div>
  );
}