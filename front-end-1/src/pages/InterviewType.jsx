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
    title: "Behavioural & leadership",
    description:
      "Tell stronger stories about influence, conflict navigation, and ownership — guided by STAR follow-ups.",
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
    title: "AI / ML deep dive",
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
    title: "Company-specific",
    description:
      "Upload a JD to mirror tone, priorities, and product context from the teams you’re targeting.",
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

    if (!resumeId) {
      setMessage("Missing resume");
      return;
    }

    setLoading(true);
    setMessage("Creating interview session...");

    try {
      const response = await api.createInterview(
        user.user_id,
        resumeId,
        jdId,
        activeMode.title
      );

      if (response.success) {
        setMessage("Interview created! Starting session...");
        localStorage.setItem(
          "current_interview",
          JSON.stringify({
            interview_id: response.interview_id,
            interview_type: activeMode.title,
          })
        );

        setTimeout(() => {
          setMessage("Interview session ready! (Interview room coming soon)");
        }, 1000);
      } else {
        setMessage(response.error || "Failed to create interview");
      }
    } catch (err) {
      setMessage("Network error. Please try again.");
      console.error("Create interview error:", err);
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

  return (
    <div className="interview-page">
      <aside className="interview-sidebar soft-scrollbar">
        <div className="interview-sidebar__header">
          <span>Select your experience</span>
          <p>Design the session flow that suits today’s practice goal.</p>
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
                : message.toLowerCase().includes("error") || message.toLowerCase().includes("failed")
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
              onClick={() => !loading && setSelectedMode(mode.id)}
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
              <footer>
                <span>{mode.focus}</span>
                {selectedMode === mode.id && <div className="mode-card__selected">✓ Selected</div>}
              </footer>
            </article>
          ))}
        </section>

        <div className="interview-actions animate-float">
          <button type="button" className="ghost-button" onClick={() => navigate("/history")}>Preview questions</button>
          <button type="button" className="accent-button" onClick={handleStartInterview} disabled={loading}>
            {loading ? "Preparing session..." : `Launch ${activeMode?.title.toLowerCase()}`}
          </button>
        </div>
      </main>
    </div>
  );
}