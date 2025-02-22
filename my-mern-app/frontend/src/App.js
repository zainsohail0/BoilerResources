import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LoginForm from "./components/LoginForm";
import SignupForm from "./components/SignupForm";
import ForgotPassword from "./components/ForgotPassword";
import Home from "./components/Home"; // You'll need to create this component

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<SignupForm />} />
        <Route path="/login" element={<LoginForm />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/home" element={<Home />} />{" "}
        {/* This is where users will be redirected after login */}
      </Routes>
    </Router>
  );
}

export default App;
