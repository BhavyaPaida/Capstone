import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./InterviewType.css";
import { api } from "../services/api";

export default function InterviewType() {
  const [user, setUser] = useState(null);
  const [selectedType, setSelectedType] = useState("");
  const [resumeId, setResumeId] = useState(null);
  const [jdId, setJdId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      navigate('/login');
      return;
    }
    
    const parsedUser = JSON.parse(userData);
    setUser(parsedUser);
    
    // Fetch user's resume and JD
    fetchUserData(parsedUser.user_id);
  }, [navigate]);

  const fetchUserData = async (userId) => {
    try {
      const resumeRes = await api.getUserResume(userId);
      if (resumeRes.success) {
        setResumeId(resumeRes.resume.resume_id);
      }
      
      const jdRes = await api.getUserJD(userId);
      if (jdRes.success) {
        setJdId(jdRes.jd.jd_id);
      }
      
      if (!resumeRes.success || !jdRes.success) {
        setMessage('Please upload resume and JD first');
        setTimeout(() => navigate('/dashboard'), 2000);
      }
    } catch (err) {
      console.error('Error fetching user data:', err);
      setMessage('Error loading data');
    }
  };

  const interviewTypes = [
    {
      type: "Technical Interview",
      description: "Focuses on algorithms, data structures, and system design challenges, evaluating problem-solving skills."
    },
    {
      type: "HR & Behavioral",
      description: "Assesses communication skills, leadership potential, teamwork, and cultural fit within the organization."
    },
    {
      type: "AI/ML Specific",
      description: "Covers machine learning algorithms, deep learning architectures, model evaluation, and deployment strategies."
    },
    {
      type: "Company-Specific",
      description: "Tailored to a specific company's products, technologies, business model, and values, requiring deep research."
    }
  ];

  const handleStartInterview = async () => {
    if (!selectedType) {
      setMessage('Please select an interview type');
      setTimeout(() => setMessage(''), 3000);
      return;
    }

    if (!resumeId || !jdId) {
      setMessage('Missing resume or job description');
      return;
    }

    setLoading(true);
    setMessage('Creating interview session...');

    try {
      const response = await api.createInterview(
        user.user_id,
        resumeId,
        jdId,
        selectedType
      );

      if (response.success) {
        setMessage('Interview created! Starting session...');
        // Store interview ID for the interview page
        localStorage.setItem('current_interview', JSON.stringify({
          interview_id: response.interview_id,
          interview_type: selectedType
        }));
        
        // Navigate to interview page (you'll need to create this)
        setTimeout(() => {
          // For now, just show success message
          setMessage('Interview session ready! (Interview page coming soon)');
        }, 1000);
      } else {
        setMessage(response.error || 'Failed to create interview');
      }
    } catch (err) {
      setMessage('Network error. Please try again.');
      console.error('Create interview error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/login');
  };

  if (!user) return null;

  return (
    <div className="dashboard-layout">
      <aside className="sidebar">
        <ul>
          <li onClick={() => navigate('/dashboard')}>Dashboard/Home</li>
          <li onClick={() => navigate('/profile')}>Profile</li>
          <li onClick={() => navigate('/history')}>History</li>
          <li onClick={handleLogout} style={{marginTop: '2em', color: '#ff6666'}}>
            Logout
          </li>
        </ul>
      </aside>
      <main>
        <h2>Choose Your Interview Type</h2>
        
        {message && (
          <div style={{
            background: message.includes('ready') || message.includes('created') ? '#44ff4422' : '#ff444422',
            border: `1px solid ${message.includes('ready') || message.includes('created') ? '#44ff44' : '#ff4444'}`,
            color: message.includes('ready') || message.includes('created') ? '#66ff66' : '#ff6666',
            padding: '1em',
            borderRadius: '8px',
            marginBottom: '1em'
          }}>
            {message}
          </div>
        )}
        
        <div className="grid">
          {interviewTypes.map((interview, index) => (
            <div 
              key={index}
              className="card"
              onClick={() => !loading && setSelectedType(interview.type)}
              style={{
                cursor: loading ? 'not-allowed' : 'pointer',
                border: selectedType === interview.type ? '2px solid #2187fb' : '1px solid #2226',
                background: selectedType === interview.type ? '#2187fb22' : '#23272f'
              }}
            >
              <h3>{interview.type}</h3>
              <p>{interview.description}</p>
              {selectedType === interview.type && (
                <div style={{color: '#44ff44', marginTop: '0.5em'}}>✓ Selected</div>
              )}
            </div>
          ))}
        </div>
        
        <button 
          className="btn" 
          onClick={handleStartInterview}
          disabled={loading || !selectedType}
          style={{
            opacity: (loading || !selectedType) ? 0.5 : 1,
            cursor: (loading || !selectedType) ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? 'Creating Interview...' : 'Start Interview'}
        </button>
      </main>
    </div>
  );
}