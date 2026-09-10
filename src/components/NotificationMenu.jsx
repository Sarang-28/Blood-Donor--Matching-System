import React, { useState, useEffect } from 'react';
import {
  Menu,
  MenuItem,
  Typography,
  Box,
  IconButton,
  Badge,
  Divider,
  List,
  ListItem,
  ListItemText,
  CircularProgress,
  Button,
} from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function NotificationMenu() {
  const { isAuthenticated } = useAuth();
  const [anchorEl, setAnchorEl] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = async () => {
    if (!isAuthenticated) return;
    try {
      setLoading(true);
      const res = await api.get('/notifications');

      // Defensively parse notifications array regardless of API response shape
      const rawData = res.data?.data || res.data?.notifications || res.data;
      const items = Array.isArray(rawData) ? rawData : [];

      setNotifications(items);
      setUnreadCount(items.filter((n) => !n.is_read && !n.isRead).length);
    } catch (err) {
      console.error('Failed to load notifications:', err);
      setNotifications([]);
      setUnreadCount(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); // 30s polling
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  const handleOpen = (e) => {
    setAnchorEl(e.currentTarget);
    fetchNotifications();
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleMarkAllRead = async () => {
    try {
      await api.patch('/notifications/mark-all-read');
      setNotifications((prev) =>
        (Array.isArray(prev) ? prev : []).map((n) => ({ ...n, is_read: true, isRead: true }))
      );
      setUnreadCount(0);
    } catch (err) {
      console.error('Error marking notifications read:', err);
    }
  };

  const handleMarkOne = async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications((prev) =>
        (Array.isArray(prev) ? prev : []).map((n) =>
          n.id === id ? { ...n, is_read: true, isRead: true } : n
        )
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Error marking notification read:', err);
    }
  };

  const safeNotifications = Array.isArray(notifications) ? notifications : [];

  return (
    <>
      <IconButton onClick={handleOpen}>
        <Badge
          badgeContent={unreadCount}
          color="error"
          sx={{
            '& .MuiBadge-badge': {
              animation: unreadCount > 0 ? 'pulseBadge 1.8s ease-in-out infinite' : 'none',
            },
            '@keyframes pulseBadge': {
              '0%, 100%': { transform: 'scale(1)' },
              '50%': { transform: 'scale(1.15)' },
            },
          }}
        >
          <NotificationsIcon />
        </Badge>
      </IconButton>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        PaperProps={{
          sx: {
            width: 360,
            maxHeight: 480,
            borderRadius: 3,
            boxShadow: '0 12px 32px rgba(0,0,0,0.15)',
          },
        }}
      >
        <Box sx={{ px: 2, py: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
            Notifications
          </Typography>
          {unreadCount > 0 && (
            <Button
              size="small"
              startIcon={<DoneAllIcon />}
              onClick={handleMarkAllRead}
              sx={{ textTransform: 'none', fontSize: '0.8rem' }}
            >
              Mark all read
            </Button>
          )}
        </Box>
        <Divider />

        {loading && safeNotifications.length === 0 ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress size={24} color="error" />
          </Box>
        ) : safeNotifications.length === 0 ? (
          <Box sx={{ py: 4, px: 2, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              No notifications yet. You're all caught up!
            </Typography>
          </Box>
        ) : (
          <List sx={{ p: 0, maxHeight: 360, overflowY: 'auto' }}>
            {safeNotifications.map((item) => {
              const isRead = item.is_read || item.isRead;
              return (
                <ListItem
                  key={item.id}
                  onClick={() => handleMarkOne(item.id)}
                  sx={{
                    bgcolor: isRead ? 'transparent' : 'rgba(229, 56, 77, 0.05)',
                    cursor: 'pointer',
                    borderBottom: '1px solid rgba(0,0,0,0.04)',
                    '&:hover': {
                      bgcolor: 'rgba(0,0,0,0.03)',
                    },
                  }}
                >
                  <ListItemText
                    primary={
                      <Typography
                        variant="body2"
                        sx={{ fontWeight: isRead ? 500 : 700, color: 'text.primary' }}
                      >
                        {item.title || 'Notification'}
                      </Typography>
                    }
                    secondary={
                      <Box sx={{ mt: 0.5 }}>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                          {item.body || item.message}
                        </Typography>
                        {item.created_at && (
                          <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '0.7rem' }}>
                            {new Date(item.created_at).toLocaleString()}
                          </Typography>
                        )}
                      </Box>
                    }
                  />
                </ListItem>
              );
            })}
          </List>
        )}
      </Menu>
    </>
  );
}