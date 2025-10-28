import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Dashboard.css";

export default function Profile() {
  const [user, setUser] = useState(null);
  const [editing, setEditing] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [resumeCount, setResumeCount] = useState(0);
  const [jdCount, setJdCount] = useState(0);
  const [interviewCount, setInterviewCount] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      navigate('/login');
      return;
    }
    
    const parsedUser = JSON.parse(userData);
    setUser(parsedUser);
    setFullName(parsedUser.full_name);
    setEmail(parsedUser.email);
    
    // Fetch user statistics (you can implement these API calls)
    fetchUserStats(parsedUser.user_id);
  }, [navigate]);

  const fetchUserStats = async (userId) => {
    // TODO: Implement API calls to get counts
    // For now, using dummy data
    setResumeCount(1);
    setJdCount(1);
    setInterviewCount(0);
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/login');
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    
    // TODO: Implement API call to update profile
    setMessage('Profile update feature coming soon!');
    setTimeout(() => setMessage(''), 3000);
    setEditing(false);
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      setMessage('Passwords do not match!');
      setTimeout(() => setMessage(''), 3000);
      return;
    }
    
    if (newPassword.length < 6) {
      setMessage('Password must be at least 6 characters!');
      setTimeout(() => setMessage(''), 3000);
      return;
    }
    
    // TODO: Implement API call to change password
    setMessage('Password change feature coming soon!');
    setTimeout(() => setMessage(''), 3000);
    
    // Clear password fields
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  };

  if (!user) return null;

  return (
    <div className="dashboard-layout">
      <aside className="sidebar">
        <ul>
          <li onClick={() => navigate('/dashboard')}>Dashboard/Home</li>
          <li style={{fontWeight: 'bold', color: '#2187fb', cursor: 'default'}}>Profile</li>
          <li onClick={() => navigate('/history')}>History</li>
          <li onClick={handleLogout} style={{marginTop: '2em', color: '#ff6666'}}>
            Logout
          </li>
        </ul>
      </aside>
      
      <main>
        <h2>Profile Settings</h2>
        
        {message && (
          <div style={{
            background: message.includes('success') || message.includes('soon') ? '#2187fb22' : '#ff444422',
            border: `1px solid ${message.includes('success') || message.includes('soon') ? '#2187fb' : '#ff4444'}`,
            color: message.includes('success') || message.includes('soon') ? '#4ec6fa' : '#ff6666',
            padding: '1em',
            borderRadius: '8px',
            marginBottom: '1.5em'
          }}>
            {message}
          </div>
        )}
        
        {/* User Statistics */}
        <div style={{
          background: '#222',
          padding: '2em',
          borderRadius: '1em',
          marginBottom: '2em'
        }}>
          <h3 style={{marginTop: 0, color: '#2187fb'}}>Account Statistics</h3>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '1.5em',
            marginTop: '1.5em'
          }}>
            <div style={{textAlign: 'center'}}>
              <div style={{fontSize: '2em', fontWeight: 'bold', color: '#2187fb'}}>
                {resumeCount}
              </div>
              <div style={{color: '#aaa', marginTop: '0.5em'}}>Resumes</div>
            </div>
            <div style={{textAlign: 'center'}}>
              <div style={{fontSize: '2em', fontWeight: 'bold', color: '#2187fb'}}>
                {jdCount}
              </div>
              <div style={{color: '#aaa', marginTop: '0.5em'}}>Job Descriptions</div>
            </div>
            <div style={{textAlign: 'center'}}>
              <div style={{fontSize: '2em', fontWeight: 'bold', color: '#2187fb'}}>
                {interviewCount}
              </div>
              <div style={{color: '#aaa', marginTop: '0.5em'}}>Interviews</div>
            </div>
          </div>
        </div>
        
        {/* Profile Information */}
        <div style={{
          background: '#222',
          padding: '2em',
          borderRadius: '1em',
          marginBottom: '2em'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1.5em'
          }}>
            <h3 style={{margin: 0, color: '#2187fb'}}>Profile Information</h3>
            <button
              onClick={() => setEditing(!editing)}
              style={{
                background: editing ? '#666' : '#2187fb',
                color: '#fff',
                border: 'none',
                padding: '0.6em 1.5em',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '0.95em'
              }}
            >
              {editing ? 'Cancel' : 'Edit Profile'}
            </button>
          </div>
          
          {!editing ? (
            <div style={{display: 'flex', flexDirection: 'column', gap: '1em'}}>
              <div>
                <label style={{color: '#aaa', fontSize: '0.9em'}}>Full Name</label>
                <div style={{fontSize: '1.1em', marginTop: '0.3em'}}>{user.full_name}</div>
              </div>
              <div>
                <label style={{color: '#aaa', fontSize: '0.9em'}}>Email</label>
                <div style={{fontSize: '1.1em', marginTop: '0.3em'}}>{user.email}</div>
              </div>
              <div>
                <label style={{color: '#aaa', fontSize: '0.9em'}}>User ID</label>
                <div style={{fontSize: '1.1em', marginTop: '0.3em'}}>{user.user_id}</div>
              </div>
            </div>
          ) : (
            <form onSubmit={handleUpdateProfile}>
              <div style={{display: 'flex', flexDirection: 'column', gap: '1em'}}>
                <div>
                  <label style={{color: '#aaa', fontSize: '0.9em', display: 'block', marginBottom: '0.5em'}}>
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.8em',
                      borderRadius: '6px',
                      background: '#181b23',
                      border: '1px solid #2187fb44',
                      color: '#fff',
                      fontSize: '1em'
                    }}
                  />
                </div>
                <div>
                  <label style={{color: '#aaa', fontSize: '0.9em', display: 'block', marginBottom: '0.5em'}}>
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.8em',
                      borderRadius: '6px',
                      background: '#181b23',
                      border: '1px solid #2187fb44',
                      color: '#fff',
                      fontSize: '1em'
                    }}
                  />
                </div>
                <button
                  type="submit"
                  style={{
                    background: '#2187fb',
                    color: '#fff',
                    border: 'none',
                    padding: '0.8em',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '1em',
                    marginTop: '0.5em'
                  }}
                >
                  Save Changes
                </button>
              </div>
            </form>
          )}
        </div>
        
        {/* Change Password */}
        <div style={{
          background: '#222',
          padding: '2em',
          borderRadius: '1em'
        }}>
          <h3 style={{marginTop: 0, color: '#2187fb'}}>Change Password</h3>
          <form onSubmit={handleChangePassword}>
            <div style={{display: 'flex', flexDirection: 'column', gap: '1em'}}>
              <div>
                <label style={{color: '#aaa', fontSize: '0.9em', display: 'block', marginBottom: '0.5em'}}>
                  Current Password
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                  style={{
                    width: '100%',
                    padding: '0.8em',
                    borderRadius: '6px',
                    background: '#181b23',
                    border: '1px solid #2187fb44',
                    color: '#fff',
                    fontSize: '1em'
                  }}
                  required
                />
              </div>
              <div>
                <label style={{color: '#aaa', fontSize: '0.9em', display: 'block', marginBottom: '0.5em'}}>
                  New Password
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  minLength="6"
                  style={{
                    width: '100%',
                    padding: '0.8em',
                    borderRadius: '6px',
                    background: '#181b23',
                    border: '1px solid #2187fb44',
                    color: '#fff',
                    fontSize: '1em'
                  }}
                  required
                />
              </div>
              <div>
                <label style={{color: '#aaa', fontSize: '0.9em', display: 'block', marginBottom: '0.5em'}}>
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  minLength="6"
                  style={{
                    width: '100%',
                    padding: '0.8em',
                    borderRadius: '6px',
                    background: '#181b23',
                    border: '1px solid #2187fb44',
                    color: '#fff',
                    fontSize: '1em'
                  }}
                  required
                />
              </div>
              <button
                type="submit"
                style={{
                  background: '#2187fb',
                  color: '#fff',
                  border: 'none',
                  padding: '0.8em',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '1em',
                  marginTop: '0.5em'
                }}
              >
                Change Password
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}