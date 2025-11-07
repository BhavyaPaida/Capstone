import { useState } from "react";
import { Link } from "react-router-dom";
import "./InterviewType.css";

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
  const [selectedMode, setSelectedMode] = useState(interviewModes[0].id);
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
          <p>Mode: <strong>{activeMode.title}</strong></p>
          <p>Duration: <strong>{activeMode.duration}</strong></p>
          <p>Focus area: <strong>{activeMode.focus}</strong></p>
          <Link to="/dashboard">Back to dashboard</Link>
        </div>
        <div className="interview-sidebar__footer">
          <p>Tip: Stack two formats back-to-back for a mock onsite.</p>
        </div>
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
            <strong>{activeMode.duration}</strong>
          </div>
        </header>

        <section className="interview-grid animate-float">
          {interviewModes.map((mode) => (
            <article
              key={mode.id}
              className={`mode-card glass-panel ${
                selectedMode === mode.id ? "mode-card--selected" : ""
              }`}
              onClick={() => setSelectedMode(mode.id)}
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
              </footer>
            </article>
          ))}
        </section>

        <div className="interview-actions animate-float">
          <button type="button" className="ghost-button">
            Preview questions
          </button>
          <button type="button" className="accent-button">
            Launch {activeMode.title.toLowerCase()}
          </button>
        </div>
      </main>
    </div>
  );
}
