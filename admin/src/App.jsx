import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { Box } from '@mui/material';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import IssueDetails from './pages/IssueDetails';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';

const ProtectedLayout = ({ children }) => {
  const navigate = useNavigate();
  const token = localStorage.getItem('admin_token');

  if (!token) {
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
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
