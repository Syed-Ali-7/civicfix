import React from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  Chip,
  Button,
} from '@mui/material';
import { AccountCircle } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const Topbar = () => {
  const navigate = useNavigate();

  const designation = localStorage.getItem('designation') || '';
  const officerName = localStorage.getItem('name') || 'Officer';

  const designationMeta = {
    field_engineer: { color: 'primary', label: 'Field Engineer' },
    zonal_officer: { color: 'warning', label: 'Zonal Officer' },
    supervisor: { color: 'error', label: 'Supervisor' },
  };

  const chipMeta = designationMeta[designation] || {
    color: 'default',
    label: 'Unknown',
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('designation');
    localStorage.removeItem('name');
    localStorage.removeItem('role');
    navigate('/login');
  };

  return (
    <AppBar
      position="fixed"
      sx={{
        width: `calc(100% - 250px)`,
        ml: `250px`,
        backgroundColor: 'white',
        color: 'text.primary',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      }}
    >
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
          CivicFix Officer Panel
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Chip
            color={chipMeta.color}
            size="small"
            label={chipMeta.label}
            variant="outlined"
          />
          <AccountCircle sx={{ color: 'primary.main' }} />
          <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600 }}>
            {officerName}
          </Typography>
          <Button size="small" variant="outlined" onClick={handleLogout}>
            Logout
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Topbar;