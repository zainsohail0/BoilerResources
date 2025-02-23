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
