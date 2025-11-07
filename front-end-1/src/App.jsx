import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useEffect, useState } from "react";
import Welcome from "./pages/Welcome";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import InterviewType from "./pages/InterviewType";
import ForgotPassword from "./pages/ForgotPassword";
import SignUp from "./pages/SignUp";
import Profile from "./pages/UserProfile";
import History from "./pages/History";

import InterviewSession from "./pages/InterviewSession";
import InterviewReport from "./pages/InterviewReport";

import Assistant from "./components/Assistant";


function App() {
  const [theme, setTheme] = useState(() => localStorage.getItem("theme") || "dark");

  useEffect(() => {
    if (theme === "light") {
      document.documentElement.setAttribute("data-theme", "light");
    } else {
      document.documentElement.removeAttribute("data-theme");
    }
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => setTheme((t) => (t === "light" ? "dark" : "light"));

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Welcome />} />
        <Route path="/login" element={<Login />} />
        <Route path="/sign-up" element={<SignUp />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/history" element={<History />} />
        <Route path="/interview-type" element={<InterviewType />} />
        <Route path="/interview-session" element={<InterviewSession />} />
        <Route path="/interview-report/:interviewId" element={<InterviewReport />} />
      </Routes>
      <button className="theme-toggle" onClick={toggleTheme} title="Toggle theme">
        {theme === "light" ? "🌞" : "🌙"} <span>{theme === "light" ? "Light" : "Dark"}</span>
      </button>
      <Assistant />
    </BrowserRouter>
  );
}

export default App;