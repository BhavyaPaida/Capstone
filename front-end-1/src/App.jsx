import { BrowserRouter, Routes, Route } from "react-router-dom";
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

function App() {
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
    </BrowserRouter>
  );
}

export default App;