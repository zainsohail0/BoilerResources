import React, { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, useNavigate } from "react-router-dom";
import ProfileUI from './components/ProfileUI';
import LoginForm from "./components/LoginForm";
import SignupForm from "./components/SignupForm";
import ForgotPassword from "./components/ForgotPassword";
import ResetPassword from "./components/ResetPassword";
import VerifyEmail from "./components/VerifyEmail";
import Home from "./components/Home";
import AddClass from "./components/AddClass";
import DeleteClass from "./components/DeleteClass";
import ClassDetails from "./components/classDetails"; // ✅ Import ClassDetails

const OAuthHandler = () => {
  const navigate = useNavigate();
  
  useEffect(() => {
    // Capture the token from the URL after Google login
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get("token");
    
    if (token) {
      // Store the token in localStorage
      localStorage.setItem("token", token);

      // Redirect to home after authentication
      navigate("/home");
    }
  }, [navigate]);
  
  return <div>Redirecting...</div>;
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<SignupForm />} />
        <Route path="/login" element={<LoginForm />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:id/:token" element={<ResetPassword />} />
        <Route path="/verify-email/:id/:token" element={<VerifyEmail />} />
        <Route path="/home" element={<Home />} />
        <Route path="/profile" element={<ProfileUI />} />
        <Route path="/add-class" element={<AddClass />} />
        <Route path="/delete-class" element={<DeleteClass />} />
        <Route path="/class/:id" element={<ClassDetails />} /> {/* ✅ New route for class details */}
        <Route path="/oauth-callback" element={<OAuthHandler />} />
      </Routes>
    </Router>
  );
}

export default App;
