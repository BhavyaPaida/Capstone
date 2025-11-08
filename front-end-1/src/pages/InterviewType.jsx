import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./InterviewType.css";
import { api } from "../services/api";

const interviewModes = [
  {
    id: "technical",
    title: "Technical interview",
    description:
      "Sharpen systems thinking, algorithmic reasoning, and coding fluency with adaptive question sequencing.",
    bullets: [
      "Whiteboard-friendly walkthroughs",
      "Complexity and trade-off prompts",
      "Follow-up challenges based on your answers",
    ],
    duration: "45 mins",
    focus: "Live coding + system design",
  },
  {
    id: "behavioral",
    title: "HR & Behavioral",
    description:
      "Tell stronger stories about influence, conflict navigation, and ownership – guided by STAR follow-ups.",
    bullets: [
      "SMART story scaffolding",
      "Leadership signal detection",
      "Empathy and communication checkpoints",
    ],
    duration: "30 mins",
    focus: "Narrative clarity + impact",
  },
  {
    id: "aiml",
    title: "Resume Based",
    description:
      "Drill into architectures, evaluation, and deployment trade-offs with production-grade scenarios.",
    bullets: [
      "Model diagnostics lab",
      "Bias + fairness probes",
      "MLOps workflow walkthroughs",
    ],
    duration: "50 mins",
    focus: "Research + production readiness",
  },
  {
    id: "company",
    title: "Company-Specific",
    description:
      "Upload a JD to mirror tone, priorities, and product context from the teams you're targeting.",
    bullets: [
      "Custom follow-up library",
      "Culture-aligned prompts",
      "Hiring manager style feedback",
    ],
    duration: "40 mins",
    focus: "Role-aligned preparation",
  },
];

export default function InterviewType() {
  const [user, setUser] = useState(null);
  const [selectedMode, setSelectedMode] = useState(interviewModes[0].id);
  const [resumeId, setResumeId] = useState(null);
  const [jdId, setJdId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [loadingCompanies, setLoadingCompanies] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState("");
  const companies = [
  { name: "Google", segment: "Tech Giants" },
  { name: "Microsoft", segment: "Tech Giants" },
  { name: "Amazon", segment: "Tech Giants" },
  { name: "Apple", segment: "Tech Giants" },
  { name: "Meta", segment: "Tech Giants" },
  { name: "Netflix", segment: "Tech Giants" },
  { name: "Tesla", segment: "Tech Giants" },
  { name: "TCS", segment: "Indian IT & Service-Based" },
  { name: "Infosys", segment: "Indian IT & Service-Based" },
  { name: "Wipro", segment: "Indian IT & Service-Based" },
  { name: "Tech Mahindra", segment: "Indian IT & Service-Based" },
  { name: "HCL Technologies", segment: "Indian IT & Service-Based" },
  { name: "Cognizant", segment: "Indian IT & Service-Based" },
  { name: "Accenture", segment: "Indian IT & Service-Based" },
  { name: "Zomato", segment: "Startups & Product-Based" },
  { name: "Swiggy", segment: "Startups & Product-Based" },
  { name: "Ola", segment: "Startups & Product-Based" },
  { name: "Paytm", segment: "Startups & Product-Based" },
  { name: "CRED", segment: "Startups & Product-Based" },
  { name: "Flipkart", segment: "Startups & Product-Based" },
  { name: "Deloitte", segment: "Consulting & Management" },
  { name: "KPMG", segment: "Consulting & Management" },
  { name: "EY", segment: "Consulting & Management" },
  { name: "PwC", segment: "Consulting & Management" },
  { name: "McKinsey & Company", segment: "Consulting & Management" },
  { name: "Boston Consulting Group", segment: "Consulting & Management" },
  { name: "Bain & Company", segment: "Consulting & Management" },
  { name: "Goldman Sachs", segment: "FinTech & Banking" },
  { name: "J.P. Morgan", segment: "FinTech & Banking" },
  { name: "Morgan Stanley", segment: "FinTech & Banking" },
  { name: "Barclays", segment: "FinTech & Banking" },
  { name: "HDFC Bank", segment: "FinTech & Banking" },
  { name: "ICICI Bank", segment: "FinTech & Banking" }
];
  const navigate = useNavigate();

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (!userData) {
      navigate("/login");
      return;
    }

    const parsedUser = JSON.parse(userData);
    setUser(parsedUser);
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

      if (!resumeRes.success) {
        setMessage("Please upload a resume first");
        setTimeout(() => navigate("/dashboard"), 2000);
      }
    } catch (err) {
      console.error("Error fetching user data:", err);
      setMessage("Error loading data");
    }
  };

  

  const handleStartInterview = async () => {
    const activeMode = interviewModes.find((mode) => mode.id === selectedMode);

    if (!activeMode) {
      setMessage("Please select an interview type");
      return;
    }

    // Check if company-specific mode is selected but no company chosen
    if (activeMode.id === "company" && !selectedCompany) {
      setMessage("⚠️ Please select a company for company-specific interview");
      return;
    }

    if (!resumeId) {
      setMessage("Missing resume");
      return;
    }

    setLoading(true);
    setMessage("Creating interview session...");

    try {
      console.log("🎬 Creating interview:", {
        user_id: user.user_id,
        resume_id: resumeId,
        jd_id: jdId,
        interview_type: activeMode.title,
        company_name: activeMode.id === "company" ? selectedCompany : null
      });

      const response = await api.createInterview(
        user.user_id,
        resumeId,
        jdId,
        activeMode.title,
        activeMode.id === "company" ? selectedCompany : null
      );

      if (response.success) {
        setMessage("Interview created! Starting session...");
        console.log("✅ Interview created:", response.interview_id);

        localStorage.setItem(
          "current_interview",
          JSON.stringify({
            interview_id: response.interview_id,
            interview_type: activeMode.title,
            company_name: activeMode.id === "company" ? selectedCompany : null,
          })
        );

        navigate("/interview-session");
      } else {
        setMessage(response.error || "Failed to create interview");
      }
    } catch (err) {
      console.error("Create interview error:", err);
      setMessage("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/login");
  };

  if (!user) return null;

  const activeMode = interviewModes.find((mode) => mode.id === selectedMode);

  // Group companies by segment for dropdown
  const groupedCompanies = companies.reduce((acc, company) => {
    if (!acc[company.segment]) {
      acc[company.segment] = [];
    }
    acc[company.segment].push(company);
    return acc;
  }, {});

  return (
    <div className="interview-page">
      <aside className="interview-sidebar soft-scrollbar">
        <div className="interview-sidebar__header">
          <span>Select your experience</span>
          <p>Design the session flow that suits today's practice goal.</p>
        </div>
        <div className="interview-sidebar__summary glass-panel">
          <h3>Session summary</h3>
          <p>
            Mode: <strong>{activeMode?.title}</strong>
          </p>
          <p>
            Duration: <strong>{activeMode?.duration}</strong>
          </p>
          <p>
            Focus area: <strong>{activeMode?.focus}</strong>
          </p>
          
          {/* Show selected company in sidebar */}
          {selectedMode === "company" && selectedCompany && (
            <p style={{ 
              marginTop: '0.75rem', 
              fontSize: '0.9rem', 
              color: '#8fffe3',
              padding: '0.5rem 0.75rem',
              borderRadius: '8px',
              background: 'rgba(83, 239, 187, 0.12)',
              border: '1px solid rgba(83, 239, 187, 0.25)'
            }}>
              🏢 Company: <strong>{selectedCompany}</strong>
            </p>
          )}
          
          <button type="button" className="ghost-button" onClick={() => navigate("/dashboard")}>
            Back to dashboard
          </button>
        </div>
        <div className="interview-sidebar__footer">
          <p>Tip: Stack two formats back-to-back for a mock onsite.</p>
        </div>
        <button type="button" className="sidebar__logout" onClick={handleLogout}>
          Log out
        </button>
      </aside>

      <main className="interview-content soft-scrollbar">
        <header className="interview-header animate-float">
          <div>
            <p className="tag-pill">Tailored mock interviews</p>
            <h1>Choose your next practice room</h1>
            <p>
              Each format adapts in realtime based on your responses. Switch modes any
              time or combine multiple rounds to simulate a full interview loop.
            </p>
          </div>
          <div className="interview-header__cta">
            <span>Estimated completion</span>
            <strong>{activeMode?.duration}</strong>
          </div>
        </header>

        {message && (
          <div
            className={`interview-toast animate-float ${
              message.toLowerCase().includes("ready") || message.toLowerCase().includes("created")
                ? "interview-toast--success"
                : message.toLowerCase().includes("error") || message.toLowerCase().includes("failed") || message.toLowerCase().includes("⚠️")
                ? "interview-toast--error"
                : "interview-toast--info"
            }`}
          >
            {message}
          </div>
        )}

        <section className="interview-grid animate-float">
          {interviewModes.map((mode) => (
            <article
              key={mode.id}
              className={`mode-card glass-panel ${selectedMode === mode.id ? "mode-card--selected" : ""}`}
              onClick={() => {
                // Only allow direct click if NOT company mode
                if (mode.id !== "company") {
                  !loading && setSelectedMode(mode.id);
                }
              }}
              style={{
                cursor: mode.id === "company" ? "default" : "pointer"
              }}
            >
              <header>
                <h3>{mode.title}</h3>
                <span>{mode.duration}</span>
              </header>
              <p>{mode.description}</p>
              <ul>
                {mode.bullets.map((bullet) => (
                  <li key={bullet}>{bullet}</li>
                ))}
              </ul>
              
              {/* Company Selector - Only for Company-Specific Mode */}
              {mode.id === "company" && (
                <div 
                  onClick={(e) => e.stopPropagation()} 
                  style={{ 
                    marginTop: '1rem', 
                    padding: '1rem', 
                    borderRadius: '12px', 
                    background: 'rgba(16, 20, 42, 0.65)',
                    border: '1px solid rgba(110, 145, 255, 0.18)'
                  }}
                >
                  <p style={{ 
                    marginBottom: '0.75rem', 
                    fontSize: '0.9rem', 
                    fontWeight: '600',
                    color: 'rgba(177, 193, 255, 0.9)'
                  }}>
                    🏢 Select Target Company:
                  </p>
                  
                  {loadingCompanies ? (
                    <p style={{ fontSize: '0.85rem', color: 'rgba(177, 193, 255, 0.6)' }}>
                      Loading companies...
                    </p>
                  ) : (
                    <>
                      <select
                        value={selectedCompany}
                        onChange={(e) => {
                          setSelectedCompany(e.target.value);
                          // Auto-select this mode when company is chosen
                          if (e.target.value) {
                            setSelectedMode(mode.id);
                          }
                        }}
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          borderRadius: '12px',
                          border: '1px solid rgba(107, 142, 255, 0.3)',
                          background: 'rgba(16, 20, 42, 0.85)',
                          color: '#dbe5ff',
                          fontSize: '0.95rem',
                          cursor: 'pointer',
                          outline: 'none',
                          transition: 'border-color 0.2s ease'
                        }}
                        onFocus={(e) => e.target.style.borderColor = 'rgba(126, 201, 255, 0.6)'}
                        onBlur={(e) => e.target.style.borderColor = 'rgba(107, 142, 255, 0.3)'}
                      >
                        <option value="">-- Choose a company --</option>
                        {Object.entries(groupedCompanies).map(([segment, segmentCompanies]) => (
                          <optgroup key={segment} label={segment}>
                            {segmentCompanies.map((company) => (
                              <option key={company.name} value={company.name}>
                                {company.name}
                              </option>
                            ))}
                          </optgroup>
                        ))}
                      </select>
                      
                      {selectedCompany && (
                        <p style={{ 
                          marginTop: '0.75rem', 
                          fontSize: '0.85rem', 
                          color: '#8fffe3',
                          padding: '0.5rem 0.75rem',
                          borderRadius: '8px',
                          background: 'rgba(83, 239, 187, 0.12)',
                          border: '1px solid rgba(83, 239, 187, 0.25)'
                        }}>
                          ✓ Interview tailored for <strong>{selectedCompany}</strong>
                        </p>
                      )}
                    </>
                  )}
                </div>
              )}
              
              <footer>
                <span>{mode.focus}</span>
                {selectedMode === mode.id && <div className="mode-card__selected">✓ Selected</div>}
              </footer>
            </article>
          ))}
        </section>

        <div className="interview-actions animate-float">
          <button type="button" className="ghost-button" onClick={() => navigate("/history")}>
            Preview questions
          </button>
          <button 
            type="button" 
            className="accent-button" 
            onClick={handleStartInterview} 
            disabled={loading || (selectedMode === "company" && !selectedCompany)}
            style={{
              opacity: loading || (selectedMode === "company" && !selectedCompany) ? 0.5 : 1,
              cursor: loading || (selectedMode === "company" && !selectedCompany) ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? "Preparing session..." : `Launch ${activeMode?.title.toLowerCase()}`}
          </button>
        </div>
      </main>
    </div>
  );
}