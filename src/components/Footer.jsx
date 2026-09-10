import React from 'react';
import { Box, Container, Typography, Link as MuiLink } from '@mui/material';
import FavoriteIcon from '@mui/icons-material/Favorite';

export default function Footer() {
  return (
    <Box
      component="footer"
      sx={{
        py: 3,
        px: 2,
        mt: 'auto',
        backgroundColor: '#ffffff',
        borderTop: '1px solid rgba(0,0,0,0.06)',
        textAlign: 'center',
      }}
    >
      <Container maxWidth="lg">
        <Typography variant="body2" color="text.secondary">
          Hyperlocal Emergency Blood Donor Matching System &copy; {new Date().getFullYear()}
        </Typography>
        <Typography variant="caption" sx={{ color: 'text.disabled', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
          Built with <FavoriteIcon sx={{ fontSize: 14, color: '#D32F2F' }} /> for saving lives in real-time emergencies.
        </Typography>
      </Container>
    </Box>
  );
}
