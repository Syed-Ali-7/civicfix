import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { Box } from '@mui/material';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import IssueDetails from './pages/IssueDetails';
import DemoPage from './pages/DemoPage';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';

const ProtectedLayout = ({ children }) => {
  const navigate = useNavigate();
  const token = localStorage.getItem('admin_token');
  const designation = localStorage.getItem('designation');

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (!designation || designation === 'zonal_officer') {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('designation');
    localStorage.removeItem('name');
    localStorage.removeItem('role');
    return <Navigate to="/login" replace />;
  }

  return (
    <Box sx={{ display: 'flex', height: '100vh' }}>
      <Sidebar />
      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        <Topbar />
        <Box sx={{ flexGrow: 1, overflow: 'auto', backgroundColor: '#f8f9fa' }}>
          {children}
        </Box>
      </Box>
    </Box>
  );
};

const ProtectedRoute = ({ element }) => {
  return (
    <ProtectedLayout>
      {element}
    </ProtectedLayout>
  );
};

const SupervisorRoute = ({ element }) => {
  const designation = localStorage.getItem('designation');
  if (designation !== 'supervisor') {
    return <Navigate to="/" replace />;
  }

  return <ProtectedRoute element={element} />;
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route 
          path="/" 
          element={<ProtectedRoute element={<Dashboard />} />} 
        />
        <Route 
          path="/issue/:id" 
          element={<ProtectedRoute element={<IssueDetails />} />} 
        />
        {/* DEMO CONTROLS */}
        <Route
          path="/demo"
          element={<SupervisorRoute element={<DemoPage />} />}
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
