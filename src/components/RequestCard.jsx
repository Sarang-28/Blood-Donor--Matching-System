import React from 'react';
import { Card, CardContent, Typography, Box, Chip, Button } from '@mui/material';
import BloodtypeIcon from '@mui/icons-material/Bloodtype';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import { motion } from 'framer-motion';

const MotionCard = motion.create(Card);

export default function RequestCard({ request, onRespond, userRole }) {
  const isCritical = request.urgency === 'Critical';
  const isUrgent = request.urgency === 'Urgent';

  return (
    <MotionCard
      whileHover={{ y: -3, boxShadow: '0 8px 24px rgba(0,0,0,0.08)' }}
      sx={{
        borderRadius: 3,
        border: '1px solid',
        borderColor: isCritical ? 'rgba(211, 47, 47, 0.3)' : 'rgba(0,0,0,0.06)',
        boxShadow: isCritical ? '0 4px 16px rgba(211, 47, 47, 0.1)' : '0 4px 12px rgba(0,0,0,0.03)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {isCritical && (
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 4,
            bgcolor: 'error.main',
          }}
        />
      )}

      <CardContent sx={{ p: 2.5 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box
              sx={{
                width: 46,
                height: 46,
                borderRadius: '50%',
                bgcolor: 'rgba(229, 56, 77, 0.12)',
                color: 'error.main',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: '1.1rem',
              }}
            >
              {request.bloodGroup || request.blood_group}
            </Box>
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
                {request.patientName || request.patient_name || 'Emergency Patient'}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.3 }}>
                <LocalHospitalIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                {request.hospitalName || request.hospital_name || request.hospital}
              </Typography>
            </Box>
          </Box>

          <Chip
            label={request.urgency}
            color={isCritical ? 'error' : isUrgent ? 'warning' : 'default'}
            size="small"
            sx={{ fontWeight: 700, borderRadius: 1.5 }}
          />
        </Box>

        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 2, bgcolor: '#fafafa', p: 1.5, borderRadius: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <BloodtypeIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
            <Typography variant="caption" sx={{ fontWeight: 600 }}>
              Units: {request.unitsRequired || request.units_required || request.units || 1} Unit(s)
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <LocationOnIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
            <Typography variant="caption" sx={{ fontWeight: 600 }}>
              {request.locationName || request.location_name || request.location || 'Pune, India'}
            </Typography>
          </Box>

          {request.created_at && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <AccessTimeIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
              <Typography variant="caption" color="text.secondary">
                {new Date(request.created_at).toLocaleDateString()}
              </Typography>
            </Box>
          )}
        </Box>

        {onRespond && (
          <Button
            fullWidth
            variant="contained"
            color={isCritical ? 'error' : 'primary'}
            onClick={() => onRespond(request)}
            sx={{
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 700,
              boxShadow: 'none',
            }}
          >
            {userRole === 'donor' ? 'Offer Blood Donation' : 'View Matching Donors'}
          </Button>
        )}
      </CardContent>
    </MotionCard>
  );
}
