'use client';

import * as React from 'react';
import Box from '@mui/material/Box';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Typography from '@mui/material/Typography';
import Avatar from '@mui/material/Avatar';
import Divider from '@mui/material/Divider';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import PersonIcon from '@mui/icons-material/Person';
import MessageIcon from '@mui/icons-material/Message';
import GroupIcon from '@mui/icons-material/Group';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import DirectionsBusIcon from '@mui/icons-material/DirectionsBus';

interface NotificationItem {
  id: string;
  type: 'friend_request' | 'friend_accepted' | 'new_message' | 'group_invite' | 'schedule_share' | 'bus_arrival';
  title: string;
  content: string;
  relatedId?: string | null;
  isRead: boolean;
  createdAt: string;
  sender?: {
    id: string;
    name?: string | null;
    avatar?: string | null;
  } | null;
}

interface NotificationMenuProps {
  anchorEl: HTMLElement | null;
  open: boolean;
  onClose: () => void;
  notifications: NotificationItem[];
  loading: boolean;
  onMarkAsRead: (notificationId: string) => void;
  onMarkAllAsRead: () => void;
  onNotificationClick?: (notification: NotificationItem) => void;
}

export default function NotificationMenu({
  anchorEl,
  open,
  onClose,
  notifications,
  loading,
  onMarkAsRead,
  onMarkAllAsRead,
  onNotificationClick,
}: NotificationMenuProps) {
  const getNotificationIcon = (type: NotificationItem['type']) => {
    switch (type) {
      case 'friend_request':
        return <PersonAddIcon sx={{ color: '#1976d2' }} />;
      case 'friend_accepted':
        return <PersonIcon sx={{ color: '#4caf50' }} />;
      case 'new_message':
        return <MessageIcon sx={{ color: '#ff9800' }} />;
      case 'group_invite':
        return <GroupIcon sx={{ color: '#9c27b0' }} />;
      case 'schedule_share':
        return <CalendarTodayIcon sx={{ color: '#00bcd4' }} />;
      case 'bus_arrival':
        return <DirectionsBusIcon sx={{ color: '#2196f3' }} />;
      default:
        return <PersonIcon sx={{ color: '#757575' }} />;
    }
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return '剛剛';
    if (diffMins < 60) return `${diffMins} 分鐘前`;
    if (diffHours < 24) return `${diffHours} 小時前`;
    if (diffDays < 7) return `${diffDays} 天前`;
    return date.toLocaleDateString('zh-TW');
  };

  const handleClick = (notification: NotificationItem) => {
    if (!notification.isRead) {
      onMarkAsRead(notification.id);
    }
    onNotificationClick?.(notification);
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <Menu
      anchorEl={anchorEl}
      open={open}
      onClose={onClose}
      transformOrigin={{ horizontal: 'right', vertical: 'top' }}
      anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      slotProps={{
        paper: {
          sx: {
            width: 360,
            maxHeight: 480,
            mt: 1,
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
            borderRadius: 2,
          },
        },
      }}
    >
      {/* Header */}
      <Box
        sx={{
          px: 2,
          py: 1.5,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          bgcolor: '#f5f7fa',
        }}
      >
        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
          通知
        </Typography>
        {unreadCount > 0 && (
          <Button
            size="small"
            onClick={onMarkAllAsRead}
            sx={{ fontSize: '0.75rem', textTransform: 'none' }}
          >
            全部標為已讀
          </Button>
        )}
      </Box>

      <Divider />

      {/* Notification List */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress size={24} />
        </Box>
      ) : notifications.length === 0 ? (
        <Box sx={{ py: 4, textAlign: 'center' }}>
          <Typography color="text.secondary" variant="body2">
            暫無通知
          </Typography>
        </Box>
      ) : (
        <Box sx={{ maxHeight: 380, overflow: 'auto' }}>
          {notifications.map((notification) => (
            <MenuItem
              key={notification.id}
              onClick={() => handleClick(notification)}
              sx={{
                py: 1.5,
                px: 2,
                alignItems: 'flex-start',
                bgcolor: notification.isRead ? 'transparent' : 'rgba(15, 76, 117, 0.04)',
                '&:hover': {
                  bgcolor: notification.isRead ? 'action.hover' : 'rgba(15, 76, 117, 0.08)',
                },
              }}
            >
              <Box sx={{ mr: 1.5, mt: 0.5 }}>
                {notification.sender?.avatar ? (
                  <Avatar
                    src={notification.sender.avatar}
                    sx={{ width: 40, height: 40 }}
                  />
                ) : (
                  <Avatar sx={{ width: 40, height: 40, bgcolor: '#e3f2fd' }}>
                    {getNotificationIcon(notification.type)}
                  </Avatar>
                )}
              </Box>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: notification.isRead ? 400 : 600,
                      color: '#1a1a2e',
                    }}
                  >
                    {notification.title}
                  </Typography>
                  {!notification.isRead && (
                    <Box
                      sx={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        bgcolor: '#0F4C75',
                      }}
                    />
                  )}
                </Box>
                <Typography
                  variant="body2"
                  sx={{
                    color: 'text.secondary',
                    fontSize: '0.8rem',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {notification.content}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{ color: '#9e9e9e', fontSize: '0.7rem' }}
                >
                  {formatTime(notification.createdAt)}
                </Typography>
              </Box>
            </MenuItem>
          ))}
        </Box>
      )}
    </Menu>
  );
}

