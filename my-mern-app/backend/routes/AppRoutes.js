import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import CreateStudyGroup from './components/CreateStudyGroup';
import ClassStudyGroups from './components/ClassStudyGroups';
import GroupDetails from './components/GroupDetails'; // Assuming this already exists
import ManageJoinRequests from './components/ManageJoinRequests';
import NotFound from './pages/NotFound';

// Authentication guard component
const PrivateRoute = ({ children }) => {
  // Check if user is logged in
  const isAuthenticated = localStorage.getItem('token') !== null;
  
  // For development, we'll allow access even if not authenticated
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  if (isAuthenticated || isDevelopment) {
    return children;
  }
  
  // Redirect to login if not authenticated
  return <Navigate to="/login" />;
};

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      
      <Route path="/" element={<Navigate to="/home" />} />
      <Route path="/home" element={
        <PrivateRoute>
          <Home />
        </PrivateRoute>
      } />
      
      <Route path="/create-study-group" element={
        <PrivateRoute>
          <CreateStudyGroup />
        </PrivateRoute>
      } />
      
      <Route path="/class/:classId/groups" element={
        <PrivateRoute>
          <ClassStudyGroups />
        </PrivateRoute>
      } />
      
      <Route path="/groups/:groupId" element={
        <PrivateRoute>
          <GroupDetails />
        </PrivateRoute>
      } />
      
      <Route path="/groups/:groupId/requests" element={
        <PrivateRoute>
          <ManageJoinRequests />
        </PrivateRoute>
      } />
      
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default AppRoutes;