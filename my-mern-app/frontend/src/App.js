import React, { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, useNavigate } from "react-router-dom";
import { ThemeProvider } from './context/ThemeContext';
import ProfileUI from './components/ProfileUI';
import LoginForm from "./components/LoginForm";
import SignupForm from "./components/SignupForm";
import ForgotPassword from "./components/ForgotPassword";
import Home from "./components/Home"; 
import ResetPassword from "./components/ResetPassword";
import AddClass from "./components/AddClass";
import ThemeToggle from './components/ThemeToggle';

const OAuthHandler = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Capture the token from the URL after Google login
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get("token");

    if (token) {
      // Store the token in localStorage
      localStorage.setItem("token", token);

      // ✅ Redirect to /dashboard instead of home for clarity - FIX THIS COMMENT
      navigate("/home");
    }
  }, [navigate]);

  return <div>Redirecting...</div>;
};

function App() {
  return (
    <ThemeProvider>
      <Router>
        <div className="min-h-screen bg-gray-100">
          <header className="p-4 bg-yellow-700 text-white flex justify-between items-center">
            <h1 className="text-xl font-bold">BoileResources</h1>
            <ThemeToggle />
          </header>
          <Routes>
            <Route path="/" element={<SignupForm />} />
            <Route path="/login" element={<LoginForm />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password/:id/:token" element={<ResetPassword />} />
            <Route path="/home" element={<Home />} />
            <Route path="/add-class" element={<AddClass />} />
            <Route path="/profile" element={<ProfileUI />} />
            <Route path="/oauth-callback" element={<OAuthHandler />} />
            {/* ✅ OAuth handler properly captures tokens */}
          </Routes>
        </div>
      </Router>
    </ThemeProvider>
  );
}

export default App;