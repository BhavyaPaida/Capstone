import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  LiveKitRoom,
  RoomAudioRenderer,
  useVoiceAssistant,
  BarVisualizer,
  RoomName,
  DisconnectButton,
} from "@livekit/components-react";
import "@livekit/components-styles";
import "./InterviewSession.css";
import { api } from "../services/api";

// Component to handle the voice assistant UI inside LiveKit room
function VoiceAssistantUI({ onTranscriptUpdate, interviewType }) {
  const { state, audioTrack } = useVoiceAssistant();

  useEffect(() => {
    console.log("Voice Assistant State:", state);
  }, [state, audioTrack]);

  return (
    <div className="voice-assistant-container">
      <div className="visualizer-container">
        {audioTrack && (
          <BarVisualizer
            state={state}
            barCount={7}
            trackRef={audioTrack}
            className="voice-visualizer"
          />
        )}
        <div className="status-indicator">
          {state === "listening" && (
            <div className="status listening">
              <div className="pulse-ring"></div>
              <span>🎤 Listening...</span>
            </div>
          )}
          {state === "thinking" && (
            <div className="status thinking">
              <span>💭 Processing...</span>
            </div>
          )}
          {state === "speaking" && (
            <div className="status speaking">
              <span>🗣️ Speaking...</span>
            </div>
          )}
          {state === "idle" && (
            <div className="status idle">
              <span>⏸️ Ready</span>
            </div>
          )}
        </div>
      </div>
      
      <div className="interview-tips">
        <h4>💡 Interview Tips</h4>
        <ul>
          <li>Speak clearly and at a moderate pace</li>
          <li>Take your time to think before answering</li>
          <li>Provide specific examples when possible</li>
          <li>Ask for clarification if needed</li>
        </ul>
      </div>
    </div>
  );
}

export default function InterviewSession() {
  const [user, setUser] = useState(null);
  const [interviewData, setInterviewData] = useState(null);
  const [token, setToken] = useState(null);
  const [roomUrl, setRoomUrl] = useState(null);
  const [isStarted, setIsStarted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [questionCount, setQuestionCount] = useState(0);
  const [interviewComplete, setInterviewComplete] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const userData = localStorage.getItem("user");
    const currentInterview = localStorage.getItem("current_interview");

    if (!userData || !currentInterview) {
      console.error("Missing user data or interview data");
      navigate("/dashboard");
      return;
    }

    const parsedUser = JSON.parse(userData);
    const parsedInterview = JSON.parse(currentInterview);

    setUser(parsedUser);
    setInterviewData(parsedInterview);
    
    console.log("Interview Data:", parsedInterview);
    
    // Initialize LiveKit connection
    initializeLiveKit(parsedUser, parsedInterview);
  }, [navigate]);

  const initializeLiveKit = async (userData, interviewData) => {
    try {
      setIsLoading(true);
      
      console.log("Requesting LiveKit token with:", {
        user_id: userData.user_id,
        interview_id: interviewData.interview_id,
        interview_type: interviewData.interview_type
      });
      
      // Get LiveKit token from backend
      const response = await api.getLiveKitToken(
        userData.user_id,
        interviewData.interview_id,
        interviewData.interview_type
      );

      console.log("LiveKit token response:", response);

      if (response.success) {
        setToken(response.token);
        setRoomUrl(response.room_url);
        setError("");
        console.log("✓ LiveKit token obtained successfully");
        console.log("Room metadata:", response.room_metadata);
      } else {
        console.error("Failed to get token:", response.error);
        setError(response.error || "Failed to initialize interview session");
      }
    } catch (err) {
      console.error("LiveKit initialization error:", err);
      setError("Failed to connect to interview service");
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartInterview = () => {
    console.log("Starting interview...");
    setIsStarted(true);
  };

  const handleEndInterview = async () => {
    console.log("Ending interview...");
    setInterviewComplete(true);
    
    // Wait a moment for any final data to be saved
    setTimeout(() => {
      // Navigate to report page - report will be generated there
      navigate(`/interview-report/${interviewData.interview_id}`);
    }, 2000);
  };

  const handleTranscriptUpdate = (transcript) => {
    console.log("Transcript update:", transcript);
    // This will be called when we capture transcripts from LiveKit
  };

  if (isLoading) {
    return (
      <div className="interview-loading">
        <div className="loader"></div>
        <p>Setting up your interview session...</p>
        <p style={{ fontSize: '0.9em', color: '#aaa', marginTop: '1em' }}>
          Connecting to LiveKit...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="interview-error">
        <div className="error-icon">⚠️</div>
        <h2>Connection Error</h2>
        <p>{error}</p>
        <div style={{ marginTop: '1em', fontSize: '0.9em', color: '#aaa' }}>
          <p>Troubleshooting steps:</p>
          <ul style={{ textAlign: 'left', marginTop: '0.5em' }}>
            <li>Check your internet connection</li>
            <li>Ensure LiveKit server is running</li>
            <li>Verify API keys in .env file</li>
            <li>Check browser console for errors</li>
          </ul>
        </div>
        <button onClick={() => navigate("/dashboard")} className="btn-primary">
          Back to Dashboard
        </button>
      </div>
    );
  }

  if (!isStarted) {
    return (
      <div className="interview-setup">
        <div className="setup-card">
          <h1>Ready to Start Your Interview?</h1>
          <div className="interview-details">
            <div className="detail-item">
              <span className="label">Interview Type:</span>
              <span className="value">{interviewData?.interview_type}</span>
            </div>
            <div className="detail-item">
              <span className="label">Interview ID:</span>
              <span className="value">#{interviewData?.interview_id}</span>
            </div>
            <div className="detail-item">
              <span className="label">Duration:</span>
              <span className="value">Approximately 15-20 minutes</span>
            </div>
            <div className="detail-item">
              <span className="label">Questions:</span>
              <span className="value">5 main questions + follow-ups</span>
            </div>
          </div>
          
          <div className="setup-instructions">
            <h3>Before You Begin:</h3>
            <ul>
              <li>✓ Ensure your microphone is working</li>
              <li>✓ Find a quiet environment</li>
              <li>✓ Speak clearly and at a normal pace</li>
              <li>✓ The AI will wait for you to finish speaking</li>
              <li>✓ You can stop the interview anytime</li>
            </ul>
          </div>

          <div style={{ marginTop: '2em', display: 'flex', gap: '1em', justifyContent: 'center' }}>
            <button onClick={handleStartInterview} className="btn-start">
              Start Interview
            </button>
            <button onClick={() => navigate("/dashboard")} className="btn-secondary">
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (interviewComplete) {
    return (
      <div className="interview-complete">
        <div className="complete-card">
          <div className="success-icon">✓</div>
          <h2>Interview Complete!</h2>
          <p>Thank you for completing the interview.</p>
          <p>Redirecting to your report...</p>
          <div className="loader" style={{ margin: '2em auto' }}></div>
        </div>
      </div>
    );
  }

  return (
    <div className="interview-session">
      {token && roomUrl ? (
        <LiveKitRoom
          token={token}
          serverUrl={roomUrl}
          connect={true}
          audio={true}
          video={false}
          className="livekit-room"
          onDisconnected={() => {
            console.log("Room disconnected");
            handleEndInterview();
          }}
        >
          <div className="interview-header">
            <div className="header-left">
              <h2>{interviewData?.interview_type}</h2>
              <RoomName />
            </div>
            <div className="header-right">
              <button onClick={handleEndInterview} className="btn-stop">
                End Interview
              </button>
            </div>
          </div>

          <div className="interview-content">
            <VoiceAssistantUI 
              onTranscriptUpdate={handleTranscriptUpdate}
              interviewType={interviewData?.interview_type}
            />
            
            <div className="interview-info">
              <div className="info-card">
                <span className="info-label">Interview Type:</span>
                <span className="info-value">{interviewData?.interview_type}</span>
              </div>
              <div className="info-card">
                <span className="info-label">Status:</span>
                <span className="info-value status-active">● Active</span>
              </div>
              <div className="info-card">
                <span className="info-label">Interview ID:</span>
                <span className="info-value">#{interviewData?.interview_id}</span>
              </div>
            </div>
          </div>

          <RoomAudioRenderer />
        </LiveKitRoom>
      ) : (
        <div className="interview-loading">
          <div className="loader"></div>
          <p>Connecting to interview room...</p>
        </div>
      )}
    </div>
  );
}