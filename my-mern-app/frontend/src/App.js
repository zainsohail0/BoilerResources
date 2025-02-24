<<<<<<< HEAD
import React from 'react';
import ProfileUI from './components/ProfileUI';
//import './App.css';

function App() {
  return (
    <div className="App">
      <ProfileUI />
    </div>
  );
}

export default App;





// import React, { useState } from 'react';


// const LoginForm = () => {
//   const [email, setEmail] = useState('');
//   const [password, setPassword] = useState('');
//   const [rememberMe, setRememberMe] = useState(false);

//   const handleEmailChange = (e) => setEmail(e.target.value);
//   const handlePasswordChange = (e) => setPassword(e.target.value);
//   const handleRememberMeChange = () => setRememberMe(!rememberMe);

//   const handleSubmit = (e) => {
//     e.preventDefault();
//     // Handle form submission (will connect to backend API later)
//   };

//   return (
//     <div className="login-form">
//       <h2>Login</h2>  {/* This is the form heading */}
//       <form onSubmit={handleSubmit}>
//         <div>
//           <label htmlFor="email">Email</label>
//           <input
//             type="email"
//             id="email"
//             name="email"
//             value={email}
//             onChange={handleEmailChange}
//             required
//           />
//         </div>
//         <div>
//           <label htmlFor="password">Password</label>
//           <input
//             type="password"
//             id="password"
//             name="password"
//             value={password}
//             onChange={handlePasswordChange}
//             required
//           />
//         </div>
//         <div>
//           <label htmlFor="rememberMe">
//             <input
//               type="checkbox"
//               id="rememberMe"
//               checked={rememberMe}
//               onChange={handleRememberMeChange}
//             />
//             Remember Me
//           </label>
//         </div>
//         <div>
//           <button type="submit">Login</button>  {/* Button text */}
//         </div>
//       </form>
//     </div>
//   );
// };

// export default LoginForm;  // Default export
=======
import React, { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, useNavigate } from "react-router-dom";
import ProfileUI from './components/ProfileUI';
import LoginForm from "./components/LoginForm";
import SignupForm from "./components/SignupForm";
import ForgotPassword from "./components/ForgotPassword";
import Home from "./components/Home"; 

const OAuthHandler = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Capture the token from the URL after Google login
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get("token");

    if (token) {
      // Store the token in localStorage
      localStorage.setItem("token", token);

      // ✅ Redirect to /dashboard instead of home for clarity
      navigate("/dashboard");
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
        <Route path="/home" element={<Home />} />
        <Route path="/profile" element={<ProfileUI />} />
        <Route path="/oauth-callback" element={<OAuthHandler />} /> 
        {/* ✅ OAuth handler properly captures tokens */}
      </Routes>
    </Router>
  );
}

export default App;
>>>>>>> @{-1}
