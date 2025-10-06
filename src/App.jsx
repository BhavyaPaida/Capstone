import React, { useState, useRef } from "react";
import "./App.css";

export default function App() {
  const [resumeFile, setResumeFile] = useState("");
  const [jobFile, setJobFile] = useState("");
  const [jobText, setJobText] = useState("");
  const [dragging, setDragging] = useState({ resume: false, job: false });
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
    if (type === "resume") setResumeFile(f.name);
    if (type === "job") setJobFile(f.name);
  }

  // Analyze button click handler
  function analyze() {
    alert(
      `Analyzing:\nResume: ${resumeFile || "(none)"}\nJob Description File: ${
        jobFile || "(none)"
      }\nText Length: ${jobText.length} characters`
    );
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
                <strong>{resumeFile || "Drop your resume here"}</strong>
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
                <strong>{jobFile || "Drop job description file here"}</strong>
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

        <div className="analyze-wrap">
          <button className="analyze-button" onClick={analyze}>
            Analyze Resume
          </button>
        </div>
      </main>
    </div>
  );
}
