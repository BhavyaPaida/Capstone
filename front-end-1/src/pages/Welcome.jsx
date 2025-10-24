import "./Login.css"; // Use your dark, shared form/card stylesheet
import logo from "../assets/logo.png"; // Change 'logo.png' to your logo file name

export default function Welcome() {
  return (
    <div className="form-bg">
      <div className="form-box">
        {/* Logo centered above headline */}
        <img src={logo} alt="App Logo" className="welcome-logo" />

        {/* Main headline */}
        <h1 className="form-title">Welcome to Interview Bot</h1>

        {/* Subtitle */}
        <p style={{ textAlign: "center", marginBottom: "2em", color: "#fff" }}>
          Your journey to mastering interviews starts here.<br />
          Prepare with <span style={{ color: "#4ec6fa", fontWeight: "bold" }}>confidence</span>, powered by intelligent <span style={{ color: "#4ec6fa", fontWeight: "bold" }}>AI</span>.
        </p>

        {/* Button centered in box */}
        <div style={{ width: "100%", display: "flex", justifyContent: "center" }}>
          <a className="form-btn" href="/login">Get Started</a>
        </div>
      </div>
    </div>
  );
}