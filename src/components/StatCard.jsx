import React from 'react';
import { Card, CardContent, Typography, Box } from '@mui/material';
import { motion } from 'framer-motion';

const MotionCard = motion.create(Card);

export default function StatCard({ title, value, icon, color = 'primary.main', subtitle }) {
  return (
    <MotionCard
      whileHover={{ y: -4, boxShadow: '0 12px 28px rgba(0,0,0,0.08)' }}
      transition={{ duration: 0.2 }}
      sx={{
        borderRadius: 3,
        border: '1px solid rgba(0,0,0,0.05)',
        boxShadow: '0 4px 14px rgba(0,0,0,0.03)',
        height: '100%',
      }}
    >
      <CardContent sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 3 }}>
        <Box>
          <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600, mb: 0.5 }}>
            {title}
          </Typography>
          <Typography variant="h4" sx={{ fontWeight: 800, color: 'text.primary' }}>
            {value}
          </Typography>
          {subtitle && (
            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
              {subtitle}
            </Typography>
          )}
        </Box>
        {icon && (
          <Box
            sx={{
              width: 52,
              height: 52,
              borderRadius: 3,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: 'rgba(229, 56, 77, 0.1)',
              color: color,
            }}
          >
            {icon}
          </Box>
        )}
      </CardContent>
    </MotionCard>
  );
}
