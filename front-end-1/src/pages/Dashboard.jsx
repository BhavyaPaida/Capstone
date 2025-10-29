import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "./Dashboard.css";
import { api } from "../services/api";

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [resumeUploaded, setResumeUploaded] = useState(false);
  const [jdUploaded, setJdUploaded] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const navigate = useNavigate();
  
  const resumeInputRef = useRef(null);
  const jdInputRef = useRef(null);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      navigate('/login');
      return;
    }
    
    const parsedUser = JSON.parse(userData);
    setUser(parsedUser);
    
    // Check if user has uploaded resume and JD
    checkUserData(parsedUser.user_id);
  }, [navigate]);

  const checkUserData = async (userId) => {
    try {
      const resumeRes = await api.getUserResume(userId);
      if (resumeRes.success) {
        setResumeUploaded(true);
      }
      
      const jdRes = await api.getUserJD(userId);
      if (jdRes.success) {
        setJdUploaded(true);
      }
    } catch (err) {
      console.error('Error checking user data:', err);
    }
  };

  const handleResumeUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      setMessage('Please upload a PDF file');
      return;
    }

    setUploading(true);
    setMessage('Uploading and parsing resume...');

    try {
      const response = await api.uploadResume(user.user_id, file);
      
      if (response.success) {
        setResumeUploaded(true);
        setMessage('Resume uploaded successfully!');
        setTimeout(() => setMessage(''), 3000);
      } else {
        setMessage(response.error || 'Upload failed');
      }
    } catch (err) {
      setMessage('Network error. Please try again.');
      console.error('Resume upload error:', err);
    } finally {
      setUploading(false);
    }
  };

  const handleJDUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      setMessage('Please upload a PDF file');
      return;
    }

    setUploading(true);
    setMessage('Uploading and parsing job description...');

    try {
      const response = await api.uploadJD(user.user_id, file);
      
      if (response.success) {
        setJdUploaded(true);
        setMessage('Job description uploaded successfully!');
        setTimeout(() => setMessage(''), 3000);
      } else {
        setMessage(response.error || 'Upload failed');
      }
    } catch (err) {
      setMessage('Network error. Please try again.');
      console.error('JD upload error:', err);
    } finally {
      setUploading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/login');
  };

  const goToInterview = () => {
    if (resumeUploaded && jdUploaded) {
      navigate('/interview-type');
    } else {
      setMessage('Please upload both resume and job description first');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const viewHistory = () => {
    // TODO: Navigate to history page when created
    setMessage('History page coming soon!');
    setTimeout(() => setMessage(''), 3000);
  };

  if (!user) return null;

  return (
    <div className="dashboard-layout">
      <aside className="sidebar">
        <ul>
          <li style={{fontWeight: 'bold', color: '#2187fb', cursor: 'default'}}>Dashboard/Home</li>
          <li onClick={() => navigate('/profile')}>Profile</li>
          <li onClick={() => navigate('/history')}>History</li>
          <li onClick={handleLogout} style={{marginTop: '2em', color: '#ff6666'}}>
            Logout
          </li>
        </ul>
      </aside>
      <main>
        <h2>Hi, {user.full_name}</h2>
        
        {message && (
          <div style={{
            background: message.includes('success') ? '#44ff4422' : message.includes('coming soon') ? '#2187fb22' : '#ff444422',
            border: `1px solid ${message.includes('success') ? '#44ff44' : message.includes('coming soon') ? '#2187fb' : '#ff4444'}`,
            color: message.includes('success') ? '#66ff66' : message.includes('coming soon') ? '#4ec6fa' : '#ff6666',
            padding: '1em',
            borderRadius: '8px',
            marginBottom: '1em'
          }}>
            {message}
          </div>
        )}
        
        <div className="grid">
          <div 
            className="card" 
            onClick={() => !uploading && resumeInputRef.current?.click()}
            style={{
              cursor: uploading ? 'not-allowed' : 'pointer',
              transition: 'transform 0.2s, box-shadow 0.2s'
            }}
            onMouseEnter={(e) => {
              if (!uploading) {
                e.currentTarget.style.transform = 'translateY(-4px)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <input
              ref={resumeInputRef}
              type="file"
              accept=".pdf"
              onChange={handleResumeUpload}
              style={{display: 'none'}}
              disabled={uploading}
            />
            <div style={{fontSize: '1.15em', fontWeight: '500'}}>Upload Resume</div>
            {resumeUploaded && <div style={{color: '#44ff44', marginTop: '0.5em', fontSize: '0.9em'}}>✓ Uploaded</div>}
          </div>
          
          <div 
            className="card"
            onClick={() => !uploading && jdInputRef.current?.click()}
            style={{
              cursor: uploading ? 'not-allowed' : 'pointer',
              transition: 'transform 0.2s, box-shadow 0.2s'
            }}
            onMouseEnter={(e) => {
              if (!uploading) {
                e.currentTarget.style.transform = 'translateY(-4px)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <input
              ref={jdInputRef}
              type="file"
              accept=".pdf"
              onChange={handleJDUpload}
              style={{display: 'none'}}
              disabled={uploading}
            />
            <div style={{fontSize: '1.15em', fontWeight: '500'}}>Upload JD</div>
            {jdUploaded && <div style={{color: '#44ff44', marginTop: '0.5em', fontSize: '0.9em'}}>✓ Uploaded</div>}
          </div>
          
          <div 
            className="card"
            onClick={goToInterview}
            style={{
              cursor: (resumeUploaded && jdUploaded) ? 'pointer' : 'not-allowed',
              opacity: (resumeUploaded && jdUploaded) ? 1 : 0.5,
              transition: 'transform 0.2s, box-shadow 0.2s'
            }}
            onMouseEnter={(e) => {
              if (resumeUploaded && jdUploaded) {
                e.currentTarget.style.transform = 'translateY(-4px)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <div style={{fontSize: '1.15em', fontWeight: '500'}}>Choose Interview Type</div>
            {(!resumeUploaded || !jdUploaded) && (
              <div style={{fontSize: '0.85em', color: '#aaa', marginTop: '0.5em'}}>
                Upload resume and JD first
              </div>
            )}
          </div>
          
          <div 
            className="card"
            onClick={viewHistory}
            style={{
              cursor: 'pointer',
              transition: 'transform 0.2s, box-shadow 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <div style={{fontSize: '1.15em', fontWeight: '500'}}>View Past Reports</div>
          </div>
        </div>
      </main>
    </div>
  );
}