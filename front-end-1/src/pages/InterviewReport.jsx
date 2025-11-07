import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "./Dashboard.css";
import { api } from "../services/api";

export default function InterviewReport() {
  const [user, setUser] = useState(null);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const [generationProgress, setGenerationProgress] = useState("");
  const [waitingForData, setWaitingForData] = useState(true);
  const [retryCount, setRetryCount] = useState(0);
  const { interviewId } = useParams();
  const navigate = useNavigate();
  const [isReportRequested, setIsReportRequested] = useState(false);

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (!userData) {
      navigate("/login");
      return;
    }

    setUser(JSON.parse(userData));
    checkAndGenerateReport();
  }, [navigate, interviewId]);

  const checkAndGenerateReport = async () => {
  if (isReportRequested) {
    console.log("⚠️ Report generation already in progress, skipping duplicate call.");
    return;
  }
  setIsReportRequested(true);

  try {
    setLoading(true);
    console.log(`🎬 Starting report generation for interview ${interviewId}...`);
    
    const dataReady = await waitForInterviewData();

    await generateReport();
  } catch (err) {
    console.error("Error in report generation flow:", err);
    setError("Failed to generate report. Please try again.");
    setLoading(false);
  } finally {
    setIsReportRequested(false);
  }
};


  const waitForInterviewData = async () => {
    setWaitingForData(true);
    setGenerationProgress("Waiting for interview data to be saved...");
    
    const maxWaitTime = 30000; // 30 seconds
    const checkInterval = 2000; // Check every 2 seconds
    const startTime = Date.now();
    let attempts = 0;
    
    console.log("⏳ Waiting for agent to save interview data...");
    
    while (Date.now() - startTime < maxWaitTime) {
      attempts++;
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      const remaining = Math.floor((maxWaitTime - (Date.now() - startTime)) / 1000);
      
      setGenerationProgress(
        `Waiting for interview data (${elapsed}s elapsed, ${remaining}s remaining)...`
      );
      
      try {
        // Check if data is available
        const response = await fetch(
          `http://localhost:5000/api/check-interview-data/${interviewId}`,
          {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
          }
        );
        
        const data = await response.json();
        
        console.log(`  Check attempt ${attempts}:`, data);
        
        if (data.success && data.data_available) {
          console.log(`✅ Interview data found!`);
          console.log(`   Q&A pairs: ${data.qa_count}`);
          console.log(`   Transcript items: ${data.transcript_items}`);
          setGenerationProgress("Interview data ready! Generating report...");
          setWaitingForData(false);
          
          // Small delay before proceeding
          await new Promise(resolve => setTimeout(resolve, 2000));
          return true;
        }
        
        console.log(`  ⏳ Data not yet available (attempt ${attempts})`);
        
      } catch (checkError) {
        console.warn(`Check attempt ${attempts} failed:`, checkError);
      }
      
      // Wait before next check
      await new Promise(resolve => setTimeout(resolve, checkInterval));
    }
    
    console.warn("⚠️ Timeout waiting for data");
    setWaitingForData(false);
    return false;
  };

  const generateReport = async () => {
    try {
      setGenerating(true);
      setGenerationProgress("Analyzing interview responses with AI...");
      
      console.log(`🤖 Calling API to generate report for interview ${interviewId}...`);
      
      // Call the generate endpoint
      const response = await api.generateReport(interviewId);

      if (response.success) {
        console.log("✅ Report generated successfully");
        setGenerationProgress("Report ready!");
        
        // Use the report_data directly from response
        setReport({
          interview_type: response.report_data.interview_type,
          report_data: response.report_data,
          completed_at: response.report_data.generated_at,
          pdf_path: response.pdf_path
        });
        
        console.log("✅ Report set:", response.report_data);
        
      } else {
        console.error("❌ Report generation failed:", response.error);
        
        // Check if it's a timeout error
        if (response.timeout && retryCount < 2) {
          console.log(`⏳ Timeout detected, retrying (attempt ${retryCount + 1}/2)...`);
          setRetryCount(retryCount + 1);
          setGenerationProgress("Data still processing, retrying...");
          
          // Wait 5 seconds and retry
          await new Promise(resolve => setTimeout(resolve, 5000));
          await checkAndGenerateReport();
          return;
        }
        
        setError(response.error || "Failed to generate report. Please try again from History.");
      }
    } catch (err) {
      console.error("❌ Error generating report:", err);
      setError("Failed to generate report. The interview may still be processing. Please wait a moment and try again from History.");
    } finally {
      setGenerating(false);
      setLoading(false);
      setGenerationProgress("");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/login");
  };

  const downloadReport = async () => {
    try {
      console.log("📥 Downloading report...");
      
      // Open download in new tab
      const downloadUrl = `http://localhost:5000/api/download-report/${interviewId}`;
      window.open(downloadUrl, '_blank');
      
    } catch (err) {
      console.error("Error downloading report:", err);
      alert("Failed to download report");
    }
  };

  const parseReportContent = (reportData) => {
    // Parse the full_report text into sections
    if (!reportData || !reportData.full_report) return null;
    
    const content = reportData.full_report;
    const sections = {};
    
    // Extract sections using regex
    const executiveSummary = content.match(/## EXECUTIVE SUMMARY([\s\S]*?)(?=##|$)/i);
    const questionAnalysis = content.match(/## DETAILED QUESTION ANALYSIS([\s\S]*?)(?=##|$)/i);
    const competencyAssessment = content.match(/## COMPETENCY ASSESSMENT([\s\S]*?)(?=##|$)/i);
    const strengths = content.match(/## STRENGTHS([\s\S]*?)(?=##|$)/i);
    const improvements = content.match(/## AREAS FOR IMPROVEMENT([\s\S]*?)(?=##|$)/i);
    const scores = content.match(/## OVERALL SCORES([\s\S]*?)(?=##|$)/i);
    const recommendation = content.match(/## FINAL RECOMMENDATION([\s\S]*?)(?=##|$)/i);
    
    if (executiveSummary) sections.executiveSummary = executiveSummary[1].trim();
    if (questionAnalysis) sections.questionAnalysis = questionAnalysis[1].trim();
    if (competencyAssessment) sections.competencyAssessment = competencyAssessment[1].trim();
    if (strengths) sections.strengths = strengths[1].trim();
    if (improvements) sections.improvements = improvements[1].trim();
    if (scores) sections.scores = scores[1].trim();
    if (recommendation) sections.recommendation = recommendation[1].trim();
    
    return sections;
  };

  if (!user) return null;

  if (loading || generating || waitingForData) {
    return (
      <div className="dashboard-layout">
        <aside className="sidebar">
          <ul>
            <li onClick={() => navigate("/dashboard")}>Dashboard/Home</li>
            <li onClick={() => navigate("/profile")}>Profile</li>
            <li onClick={() => navigate("/history")}>History</li>
            <li onClick={handleLogout} style={{ marginTop: "2em", color: "#ff6666" }}>
              Logout
            </li>
          </ul>
        </aside>
        <main>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              minHeight: "60vh",
            }}
          >
            <div
              style={{
                width: "60px",
                height: "60px",
                border: "4px solid #333",
                borderTopColor: "#2187fb",
                borderRadius: "50%",
                animation: "spin 1s linear infinite",
                marginBottom: "1.5em",
              }}
            ></div>
            <p style={{ fontSize: "1.2em", color: "#fff", marginBottom: "0.5em" }}>
              {waitingForData
                ? "⏳ Waiting for interview data..."
                : generating
                ? "🤖 Generating your interview report..."
                : "📊 Loading report..."}
            </p>
            {generationProgress && (
              <p style={{ fontSize: "0.9em", color: "#aaa", textAlign: "center", maxWidth: "500px" }}>
                {generationProgress}
              </p>
            )}
            <p style={{ fontSize: "0.85em", color: "#666", marginTop: "1em" }}>
              {waitingForData
                ? "The agent is saving your interview responses..."
                : "This may take 10-30 seconds..."}
            </p>
            {retryCount > 0 && (
              <p style={{ fontSize: "0.85em", color: "#ff9900", marginTop: "0.5em" }}>
                Retry attempt {retryCount}/2
              </p>
            )}
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-layout">
        <aside className="sidebar">
          <ul>
            <li onClick={() => navigate("/dashboard")}>Dashboard/Home</li>
            <li onClick={() => navigate("/profile")}>Profile</li>
            <li onClick={() => navigate("/history")}>History</li>
            <li onClick={handleLogout} style={{ marginTop: "2em", color: "#ff6666" }}>
              Logout
            </li>
          </ul>
        </aside>
        <main>
          <div
            style={{
              background: "#ff444422",
              border: "1px solid #ff4444",
              color: "#ff6666",
              padding: "2em",
              borderRadius: "1em",
              textAlign: "center",
            }}
          >
            <h2>❌ Error Loading Report</h2>
            <p>{error}</p>
            <div style={{ display: 'flex', gap: '1em', justifyContent: 'center', marginTop: '1.5em' }}>
              <button
                onClick={() => {
                  setError("");
                  setRetryCount(0);
                  checkAndGenerateReport();
                }}
                style={{
                  background: "#2187fb",
                  color: "#fff",
                  border: "none",
                  padding: "0.8em 2em",
                  borderRadius: "0.6em",
                  cursor: "pointer",
                }}
              >
                Retry
              </button>
              <button
                onClick={() => navigate("/history")}
                style={{
                  background: "#666",
                  color: "#fff",
                  border: "none",
                  padding: "0.8em 2em",
                  borderRadius: "0.6em",
                  cursor: "pointer",
                }}
              >
                Back to History
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const sections = report?.report_data ? parseReportContent(report.report_data) : null;

  return (
    <div className="dashboard-layout">
      <aside className="sidebar">
        <ul>
          <li onClick={() => navigate("/dashboard")}>Dashboard/Home</li>
          <li onClick={() => navigate("/profile")}>Profile</li>
          <li onClick={() => navigate("/history")}>History</li>
          <li onClick={handleLogout} style={{ marginTop: "2em", color: "#ff6666" }}>
            Logout
          </li>
        </ul>
      </aside>
      <main>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "2em",
          }}
        >
          <h2>📊 Interview Report</h2>
          <div style={{ display: "flex", gap: "1em" }}>
            <button
              onClick={downloadReport}
              style={{
                background: "#2187fb",
                color: "#fff",
                border: "none",
                padding: "0.8em 1.5em",
                borderRadius: "0.6em",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "0.5em"
              }}
            >
              📥 Download PDF
            </button>
            <button
              onClick={() => navigate("/history")}
              style={{
                background: "#666",
                color: "#fff",
                border: "none",
                padding: "0.8em 1.5em",
                borderRadius: "0.6em",
                cursor: "pointer",
              }}
            >
              ← Back to History
            </button>
          </div>
        </div>

        {/* Report Header */}
        <div
          style={{
            background: "#222",
            padding: "2em",
            borderRadius: "1em",
            marginBottom: "2em",
            border: "1px solid #333"
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1em" }}>
            <div>
              <h3 style={{ margin: 0, color: "#2187fb", fontSize: "1.5em" }}>
                {report?.interview_type || "Interview"}
              </h3>
              <p style={{ color: "#aaa", marginTop: "0.5em", fontSize: "0.9em" }}>
                Interview ID: #{interviewId}
              </p>
            </div>
            <div style={{ textAlign: "right" }}>
              <div
                style={{
                  padding: "0.5em 1em",
                  borderRadius: "6px",
                  background: "#44ff4422",
                  color: "#44ff44",
                  fontWeight: "600"
                }}
              >
                ✓ Completed
              </div>
              <p style={{ color: "#aaa", marginTop: "0.5em", fontSize: "0.85em" }}>
                {report?.completed_at
                  ? new Date(report.completed_at).toLocaleString()
                  : ""}
              </p>
            </div>
          </div>
        </div>

        {/* Executive Summary */}
        {sections?.executiveSummary && (
          <div
            style={{
              background: "#222",
              padding: "2em",
              borderRadius: "1em",
              marginBottom: "2em",
              border: "1px solid #333"
            }}
          >
            <h3 style={{ color: "#2187fb", marginTop: 0, marginBottom: "1em" }}>
              📝 Executive Summary
            </h3>
            <div style={{ color: "#ddd", lineHeight: "1.8", whiteSpace: "pre-wrap" }}>
              {sections.executiveSummary}
            </div>
          </div>
        )}

        {/* Overall Scores */}
        {sections?.scores && (
          <div
            style={{
              background: "#222",
              padding: "2em",
              borderRadius: "1em",
              marginBottom: "2em",
              border: "1px solid #333"
            }}
          >
            <h3 style={{ color: "#2187fb", marginTop: 0, marginBottom: "1em" }}>
              🎯 Overall Scores
            </h3>
            <div style={{ color: "#ddd", lineHeight: "1.8", whiteSpace: "pre-wrap" }}>
              {sections.scores}
            </div>
          </div>
        )}

        {/* Strengths */}
        {sections?.strengths && (
          <div
            style={{
              background: "#222",
              padding: "2em",
              borderRadius: "1em",
              marginBottom: "2em",
              border: "1px solid #333"
            }}
          >
            <h3 style={{ color: "#44ff44", marginTop: 0, marginBottom: "1em" }}>
              💪 Key Strengths
            </h3>
            <div style={{ color: "#ddd", lineHeight: "1.8", whiteSpace: "pre-wrap" }}>
              {sections.strengths}
            </div>
          </div>
        )}

        {/* Areas for Improvement */}
        {sections?.improvements && (
          <div
            style={{
              background: "#222",
              padding: "2em",
              borderRadius: "1em",
              marginBottom: "2em",
              border: "1px solid #333"
            }}
          >
            <h3 style={{ color: "#ff9900", marginTop: 0, marginBottom: "1em" }}>
              📈 Areas for Improvement
            </h3>
            <div style={{ color: "#ddd", lineHeight: "1.8", whiteSpace: "pre-wrap" }}>
              {sections.improvements}
            </div>
          </div>
        )}

        {/* Detailed Question Analysis */}
        {sections?.questionAnalysis && (
          <div
            style={{
              background: "#222",
              padding: "2em",
              borderRadius: "1em",
              marginBottom: "2em",
              border: "1px solid #333"
            }}
          >
            <h3 style={{ color: "#2187fb", marginTop: 0, marginBottom: "1em" }}>
              📋 Detailed Question Analysis
            </h3>
            <div style={{ color: "#ddd", lineHeight: "1.8", whiteSpace: "pre-wrap" }}>
              {sections.questionAnalysis}
            </div>
          </div>
        )}

        {/* Final Recommendation */}
        {sections?.recommendation && (
          <div
            style={{
              background: "#222",
              padding: "2em",
              borderRadius: "1em",
              marginBottom: "2em",
              border: "1px solid #333"
            }}
          >
            <h3 style={{ color: "#2187fb", marginTop: 0, marginBottom: "1em" }}>
              🎯 Final Recommendation
            </h3>
            <div style={{ color: "#ddd", lineHeight: "1.8", whiteSpace: "pre-wrap" }}>
              {sections.recommendation}
            </div>
          </div>
        )}

        {/* Download Again */}
        <div style={{ textAlign: "center", marginTop: "3em", marginBottom: "2em" }}>
          <button
            onClick={downloadReport}
            style={{
              background: "#2187fb",
              color: "#fff",
              border: "none",
              padding: "1em 2.5em",
              borderRadius: "0.6em",
              cursor: "pointer",
              fontSize: "1em",
              fontWeight: "600"
            }}
          >
            📥 Download Full Report (PDF)
          </button>
        </div>
      </main>
    </div>
  );
}