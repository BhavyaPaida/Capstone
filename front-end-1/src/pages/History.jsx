import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Dashboard.css";
import { api } from "../services/api";

export default function History() {
  const [user, setUser] = useState(null);
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState('interviews'); // 'interviews', 'resumes', 'jds'
  const [resumes, setResumes] = useState([]);
  const [jds, setJds] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      navigate('/login');
      return;
    }
    
    const parsedUser = JSON.parse(userData);
    setUser(parsedUser);
    fetchHistory(parsedUser.user_id);
  }, [navigate]);

  const fetchHistory = async (userId) => {
    setLoading(true);
    try {
      // Fetch interviews
      const interviewRes = await api.getUserInterviews(userId);
      if (interviewRes.success) {
        setInterviews(interviewRes.interviews || []);
      }
      
      // You can also fetch resumes and JDs history
      // const resumeRes = await api.getUserResumes(userId);
      // const jdRes = await api.getUserJDs(userId);
      
    } catch (err) {
      console.error('Error fetching history:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/login');
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getInterviewTypeColor = (type) => {
    const colors = {
      'Technical Interview': '#4CAF50',
      'HR & Behavioral': '#2196F3',
      'AI/ML Specific': '#FF9800',
      'Company-Specific': '#9C27B0'
    };
    return colors[type] || '#2187fb';
  };

  if (!user) return null;

  return (
    <div className="dashboard-layout">
      <aside className="sidebar">
        <ul>
          <li onClick={() => navigate('/dashboard')}>Dashboard/Home</li>
          <li onClick={() => navigate('/profile')}>Profile</li>
          <li style={{fontWeight: 'bold', color: '#2187fb', cursor: 'default'}}>History</li>
          <li onClick={handleLogout} style={{marginTop: '2em', color: '#ff6666'}}>
            Logout
          </li>
        </ul>
      </aside>
      
      <main>
        <h2>History</h2>
        
        {/* Tabs */}
        <div style={{
          display: 'flex',
          gap: '1em',
          marginBottom: '2em',
          borderBottom: '2px solid #333'
        }}>
          <button
            onClick={() => setSelectedTab('interviews')}
            style={{
              background: 'transparent',
              border: 'none',
              color: selectedTab === 'interviews' ? '#2187fb' : '#aaa',
              padding: '1em 1.5em',
              fontSize: '1em',
              cursor: 'pointer',
              borderBottom: selectedTab === 'interviews' ? '3px solid #2187fb' : 'none',
              marginBottom: '-2px'
            }}
          >
            Interviews ({interviews.length})
          </button>
          <button
            onClick={() => setSelectedTab('resumes')}
            style={{
              background: 'transparent',
              border: 'none',
              color: selectedTab === 'resumes' ? '#2187fb' : '#aaa',
              padding: '1em 1.5em',
              fontSize: '1em',
              cursor: 'pointer',
              borderBottom: selectedTab === 'resumes' ? '3px solid #2187fb' : 'none',
              marginBottom: '-2px'
            }}
          >
            Resumes
          </button>
          <button
            onClick={() => setSelectedTab('jds')}
            style={{
              background: 'transparent',
              border: 'none',
              color: selectedTab === 'jds' ? '#2187fb' : '#aaa',
              padding: '1em 1.5em',
              fontSize: '1em',
              cursor: 'pointer',
              borderBottom: selectedTab === 'jds' ? '3px solid #2187fb' : 'none',
              marginBottom: '-2px'
            }}
          >
            Job Descriptions
          </button>
        </div>
        
        {loading ? (
          <div style={{
            textAlign: 'center',
            padding: '3em',
            color: '#aaa'
          }}>
            Loading history...
          </div>
        ) : (
          <>
            {/* Interviews Tab */}
            {selectedTab === 'interviews' && (
              <div>
                {interviews.length === 0 ? (
                  <div style={{
                    background: '#222',
                    padding: '3em',
                    borderRadius: '1em',
                    textAlign: 'center',
                    color: '#aaa'
                  }}>
                    <div style={{fontSize: '3em', marginBottom: '0.5em'}}>📋</div>
                    <h3 style={{color: '#fff'}}>No Interviews Yet</h3>
                    <p>Start your first interview from the dashboard!</p>
                    <button
                      onClick={() => navigate('/dashboard')}
                      style={{
                        background: '#2187fb',
                        color: '#fff',
                        border: 'none',
                        padding: '0.8em 2em',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '1em',
                        marginTop: '1em'
                      }}
                    >
                      Go to Dashboard
                    </button>
                  </div>
                ) : (
                  <div style={{display: 'flex', flexDirection: 'column', gap: '1em'}}>
                    {interviews.map((interview, index) => (
                      <div
                        key={index}
                        style={{
                          background: '#222',
                          padding: '1.5em',
                          borderRadius: '1em',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          cursor: 'pointer',
                          transition: 'background 0.2s, transform 0.2s'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = '#2187fb22';
                          e.currentTarget.style.transform = 'translateX(8px)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = '#222';
                          e.currentTarget.style.transform = 'translateX(0)';
                        }}
                      >
                        <div>
                          <div style={{
                            display: 'inline-block',
                            padding: '0.3em 0.8em',
                            borderRadius: '4px',
                            fontSize: '0.85em',
                            fontWeight: 'bold',
                            background: getInterviewTypeColor(interview.interview_type) + '22',
                            color: getInterviewTypeColor(interview.interview_type),
                            marginBottom: '0.8em'
                          }}>
                            {interview.interview_type}
                          </div>
                          <div style={{fontSize: '1.1em', fontWeight: '500', marginBottom: '0.5em'}}>
                            Interview #{interview.interview_id}
                          </div>
                          <div style={{color: '#aaa', fontSize: '0.9em'}}>
                            {formatDate(interview.conducted_at)}
                            {interview.duration_minutes && ` • ${interview.duration_minutes} minutes`}
                          </div>
                        </div>
                        <div>
                          {interview.report_sent ? (
                            <span style={{
                              padding: '0.5em 1em',
                              borderRadius: '6px',
                              background: '#44ff4422',
                              color: '#44ff44',
                              fontSize: '0.9em'
                            }}>
                              ✓ Completed
                            </span>
                          ) : (
                            <span style={{
                              padding: '0.5em 1em',
                              borderRadius: '6px',
                              background: '#ff990022',
                              color: '#ff9900',
                              fontSize: '0.9em'
                            }}>
                              In Progress
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            
            {/* Resumes Tab */}
            {selectedTab === 'resumes' && (
              <div style={{
                background: '#222',
                padding: '3em',
                borderRadius: '1em',
                textAlign: 'center',
                color: '#aaa'
              }}>
                <div style={{fontSize: '3em', marginBottom: '0.5em'}}>📄</div>
                <h3 style={{color: '#fff'}}>Resume History</h3>
                <p>View all your uploaded resumes</p>
                <div style={{
                  marginTop: '2em',
                  padding: '1em',
                  background: '#2187fb22',
                  borderRadius: '8px',
                  color: '#4ec6fa'
                }}>
                  Feature coming soon! You'll be able to view, download, and manage all your uploaded resumes here.
                </div>
              </div>
            )}
            
            {/* Job Descriptions Tab */}
            {selectedTab === 'jds' && (
              <div style={{
                background: '#222',
                padding: '3em',
                borderRadius: '1em',
                textAlign: 'center',
                color: '#aaa'
              }}>
                <div style={{fontSize: '3em', marginBottom: '0.5em'}}>📋</div>
                <h3 style={{color: '#fff'}}>Job Description History</h3>
                <p>View all your uploaded job descriptions</p>
                <div style={{
                  marginTop: '2em',
                  padding: '1em',
                  background: '#2187fb22',
                  borderRadius: '8px',
                  color: '#4ec6fa'
                }}>
                  Feature coming soon! You'll be able to view, download, and manage all your uploaded job descriptions here.
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}