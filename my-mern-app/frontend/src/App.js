import React, { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, useNavigate } from "react-router-dom";
import { ThemeProvider } from "./context/ThemeContext";

import ProfileUI from './components/ProfileUI';
import LoginForm from "./components/LoginForm";
import SignupForm from "./components/SignupForm";
import ForgotPassword from "./components/ForgotPassword";
import ResetPassword from "./components/ResetPassword";
import VerifyEmail from "./components/VerifyEmail";
import Home from "./components/Home";
import AddClass from "./components/AddClass";
import DeleteClass from "./components/DeleteClass";
import DeleteCompletedClass from "./components/DeleteCompletedClass";
import ClassDetails from "./components/classDetails";

// Study Group Components
import CreateStudyGroup from "./components/CreateStudyGroup";
import StudyGroupDetails from "./components/StudyGroupDetails";
import ManageStudyGroup from "./components/ManageStudyGroup";
import ClassStudyGroups from "./components/ClassStudyGroups";
import GroupDetails from "./components/GroupDetails";
import ManageJoinRequests from "./components/ManageJoinRequests";
import PendingJoinRequests from "./components/PendingJoinRequests";

// Calendar and Chat Components
import Chat from "./components/Chat";
import ScheduleCalendar from "./components/setCalendar";
import FeedbackForm from "./components/FeedbackForm";

const OAuthHandler = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get("token");

    if (token) {
      localStorage.setItem("token", token);
      navigate("/home");
    }
  }, [navigate]);

  return <div>Redirecting...</div>;
};

function App() {
  return (
    <ThemeProvider>
      <Router>
        <Routes>
          <Route path="/" element={<SignupForm />} />
          <Route path="/login" element={<LoginForm />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route
            path="/reset-password/:id/:token"
            element={<ResetPassword />}
          />
          <Route path="/verify-email/:id/:token" element={<VerifyEmail />} />
          <Route path="/home" element={<Home />} />
          <Route path="/profile" element={<ProfileUI />} />
          <Route path="/add-class" element={<AddClass />} />
          <Route path="/delete-class" element={<DeleteClass />} />
          <Route
            path="/delete-completed-class"
            element={<DeleteCompletedClass />}
          />
          <Route path="/class/:id" element={<ClassDetails />} />

          {/* Study Group Routes */}
          <Route path="/create-study-group" element={<CreateStudyGroup />} />
          <Route path="/study-group/:id" element={<StudyGroupDetails />} />
          <Route
            path="/manage-study-group/:id"
            element={<ManageStudyGroup />}
          />
          <Route path="/class/:classId/groups" element={<ClassStudyGroups />} />
          <Route path="/groups/:groupId" element={<GroupDetails />} />
          <Route
            path="/groups/:groupId/requests"
            element={<ManageJoinRequests />}
          />
          <Route path="/pending-requests" element={<PendingJoinRequests />} />

          {/* Chat, Calendar, and Feedback Routes */}
          <Route path="/chat/:groupId" element={<Chat userId="650a4f2e9b5c7c001a2f3d89" />} />
          <Route path="/calendar" element={<ScheduleCalendar />} />
          <Route path="/feedback" element={<FeedbackForm />} />
          
          {/* OAuth Handler */}
          <Route path="/oauth-callback" element={<OAuthHandler />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;