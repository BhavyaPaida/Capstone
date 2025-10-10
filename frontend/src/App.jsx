import { useState, useRef } from "react";
import "./App.css";

export default function App() {
  const [resumeFile, setResumeFile] = useState(null);
  const [jobFile, setJobFile] = useState(null);
  const [jobText, setJobText] = useState("");
  const [dragging, setDragging] = useState({ resume: false, job: false });
  const [loading, setLoading] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [error, setError] = useState("");
  
  const resumeInputRef = useRef();
  const jobInputRef = useRef();

  // Handle uploaded files
  function handleFiles(files, type) {
    if (!files || files.length === 0) return;
    const f = files[0];
    if (f.size > 10 * 1024 * 1024) {
      alert("File size exceeds 10MB limit.");
      return;
    }
    if (type === "resume") setResumeFile(f);
    if (type === "job") setJobFile(f);
  }

  // Analyze button click handler
  async function analyze() {
    setError("");
    setQuestions([]);

    // Validation
    if (!resumeFile) {
      setError("Please upload a resume file");
      return;
    }

    if (!jobFile && !jobText.trim()) {
      setError("Please upload a job description file or paste the text");
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("resume", resumeFile);
      
      if (jobFile) {
        formData.append("jobDescription", jobFile);
      }
      
      if (jobText.trim()) {
        formData.append("jobText", jobText);
      }

      const response = await fetch("http://localhost:5000/api/analyze-resume", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to generate questions");
      }

      const data = await response.json();
      
      if (data.success && data.questions) {
        setQuestions(data.questions);
      } else if (data.error) {
        throw new Error(data.error);
      }
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  }

  // Drag events for upload boxes
  const makeDropEvents = (type) => ({
    onDrop: (e) => {
      e.preventDefault();
      setDragging((d) => ({ ...d, [type]: false }));
      if (e.dataTransfer?.files?.length) handleFiles(e.dataTransfer.files, type);
    },
    onDragOver: (e) => {
      e.preventDefault();
      setDragging((d) => ({ ...d, [type]: true }));
    },
    onDragLeave: (e) => {
      e.preventDefault();
      setDragging((d) => ({ ...d, [type]: false }));
    },
  });

  return (
    <div className="page-wrap">
      <header className="header">
        <div className="logo-circle">
          <svg
            viewBox="0 0 48 48"
            width="36"
            height="36"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle cx="24" cy="24" r="22" stroke="#fff" strokeWidth="2" />
            <circle cx="24" cy="24" r="10" stroke="#fff" strokeWidth="2" />
            <circle cx="24" cy="24" r="4" fill="#fff" />
          </svg>
        </div>
        <h1 className="title">ATS Resume Analyzer</h1>
      </header>

      <p className="subtitle">
        Upload your resume and job description to get instant ATS compatibility
        scoring and actionable improvement suggestions
      </p>

      <main className="card">
        <h2 className="card-title">Get Your Resume ATS-Ready</h2>

        <section className="form-row">
          {/* Resume Upload */}
          <div className="left-col">
            <div className="field-label">Upload Resume</div>
            <div
              className={`dropbox ${dragging.resume ? "drag-active" : ""}`}
              {...makeDropEvents("resume")}
              onClick={() => resumeInputRef.current?.click()}
            >
              <input
                ref={resumeInputRef}
                type="file"
                accept=".pdf,.doc,.docx"
                className="file-input"
                onChange={(e) => handleFiles(e.target.files, "resume")}
              />
              <div className="upload-icon">
                <svg viewBox="0 0 24 24" width="48" height="48">
                  <path
                    d="M12 3v13"
                    stroke="#6b7280"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                  />
                  <path
                    d="M8 7l4-4 4 4"
                    stroke="#6b7280"
                    strokeWidth="1.6"
                    fill="none"
                  />
                </svg>
              </div>
              <div className="drop-text">
                <strong>{resumeFile ? resumeFile.name : "Drop your resume here"}</strong>
                <div className="drop-sub">or click to browse</div>
                <div className="small-muted">PDF, DOC, DOCX up to 10MB</div>
              </div>
            </div>
          </div>

          {/* Job Description Section */}
          <div className="right-col">
            <div className="field-label">Job Description</div>

            {/* File upload */}
            <div
              className={`dropbox ${dragging.job ? "drag-active" : ""}`}
              {...makeDropEvents("job")}
              onClick={() => jobInputRef.current?.click()}
            >
              <input
                ref={jobInputRef}
                type="file"
                accept=".pdf,.doc,.docx,.txt"
                className="file-input"
                onChange={(e) => handleFiles(e.target.files, "job")}
              />
              <div className="upload-icon">
                <svg viewBox="0 0 24 24" width="48" height="48">
                  <path
                    d="M12 3v13"
                    stroke="#6b7280"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                  />
                  <path
                    d="M8 7l4-4 4 4"
                    stroke="#6b7280"
                    strokeWidth="1.6"
                    fill="none"
                  />
                </svg>
              </div>
              <div className="drop-text">
                <strong>{jobFile ? jobFile.name : "Drop job description file here"}</strong>
                <div className="drop-sub">or click to browse</div>
                <div className="small-muted">
                  Plain Text, PDF, DOCX up to 10MB
                </div>
              </div>
            </div>

            {/* Text box */}
            <textarea
              className="job-text"
              placeholder="Or paste the job description text here..."
              value={jobText}
              onChange={(e) => setJobText(e.target.value)}
            ></textarea>
            <div className="hint">
              Include requirements, skills, and qualifications for best results
            </div>
          </div>
        </section>

        {/* Error Message */}
        {error && (
          <div style={{
            margin: "20px 28px",
            padding: "14px",
            background: "#fee",
            border: "1px solid #fcc",
            borderRadius: "6px",
            color: "#c33"
          }}>
            <strong>Error:</strong> {error}
          </div>
        )}

        <div className="analyze-wrap">
          <button 
            className="analyze-button" 
            onClick={analyze}
            disabled={loading}
            style={{ opacity: loading ? 0.6 : 1 }}
          >
            {loading ? "Generating Questions..." : "Analyze Resume"}
          </button>
        </div>

        {/* Questions Display */}
        {questions.length > 0 && (
          <div style={{
            marginTop: "32px",
            padding: "28px",
            background: "#f9fafb",
            borderRadius: "12px"
          }}>
            <h3 style={{
              fontSize: "22px",
              marginBottom: "20px",
              color: "#111827"
            }}>
              Generated Interview Questions ({questions.length})
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              {questions.map((question, index) => (
                <div key={index} style={{
                  padding: "16px",
                  background: "white",
                  borderRadius: "8px",
                  borderLeft: "4px solid #4b5563",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
                }}>
                  <div style={{ display: "flex", gap: "12px" }}>
                    <span style={{
                      flexShrink: 0,
                      width: "28px",
                      height: "28px",
                      background: "#4b5563",
                      color: "white",
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: "600",
                      fontSize: "14px"
                    }}>
                      {index + 1}
                    </span>
                    <p style={{
                      margin: 0,
                      lineHeight: "1.6",
                      color: "#374151",
                      fontSize: "15px"
                    }}>
                      {question}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}