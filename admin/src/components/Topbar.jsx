import React from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
} from '@mui/material';
import { AccountCircle } from '@mui/icons-material';

const Topbar = () => {
  // Decode email from token (basic JWT decode)
  const getUserEmail = () => {
    try {
      const token = localStorage.getItem('admin_token');
      if (token) {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.email || 'Officer';
      }
    } catch (error) {
      console.error('Error decoding token:', error);
    }
    return 'Officer';
  };

  const userEmail = getUserEmail();

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
          <AccountCircle sx={{ color: 'primary.main' }} />
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            {userEmail}
          </Typography>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Topbar;