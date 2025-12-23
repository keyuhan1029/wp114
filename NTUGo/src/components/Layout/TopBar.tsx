'use client';

import * as React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Box from '@mui/material/Box';
import Avatar from '@mui/material/Avatar';
import IconButton from '@mui/material/IconButton';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import ClassIcon from '@mui/icons-material/Class';
import NotificationsIcon from '@mui/icons-material/Notifications';
import Badge from '@mui/material/Badge';
import Tooltip from '@mui/material/Tooltip';
import ProfileModal from '@/components/Auth/ProfileModal';
import EditProfileModal from '@/components/Auth/EditProfileModal';
import NotificationMenu from '@/components/Layout/NotificationMenu';
import { useUserNotifications } from '@/contexts/PusherContext';

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

export default function TopBar() {
  const router = useRouter();
  const pathname = usePathname();
  const [profileModalOpen, setProfileModalOpen] = React.useState(false);
  const [editProfileModalOpen, setEditProfileModalOpen] = React.useState(false);
  const [userAvatar, setUserAvatar] = React.useState<string | null>(null);
  const [userInitial, setUserInitial] = React.useState<string>('U');
  const [userId, setUserId] = React.useState<string | null>(null);
  
  // 通知狀態
  const [notificationAnchor, setNotificationAnchor] = React.useState<HTMLElement | null>(null);
  const [notifications, setNotifications] = React.useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = React.useState(0);
  const [notificationsLoading, setNotificationsLoading] = React.useState(false);

  React.useEffect(() => {
    // 載入用戶資訊以顯示頭像
    const loadUserInfo = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const response = await fetch('/api/auth/me', {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });
          if (response.ok) {
            const data = await response.json();
            if (data.user) {
              setUserId(data.user.id);
              if (data.user.avatar) {
                setUserAvatar(data.user.avatar);
              }
              if (data.user.name) {
                setUserInitial(data.user.name[0].toUpperCase());
              } else if (data.user.email) {
                setUserInitial(data.user.email[0].toUpperCase());
              }
            }
          }
        } catch (error) {
          // 靜默失敗，使用默認值
        }
      }
    };
    loadUserInfo();
  }, []);

  // 定期載入未讀通知數量
  React.useEffect(() => {
    const loadUnreadCount = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;

      try {
        const response = await fetch('/api/notifications?unreadOnly=true&limit=1', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.ok) {
          const data = await response.json();
          setUnreadCount(data.unreadCount || 0);
        }
      } catch (error) {
        // 靜默失敗
      }
    };

    loadUnreadCount();
    const interval = setInterval(loadUnreadCount, 30000); // 每 30 秒更新一次

    return () => clearInterval(interval);
  }, []);

  // 加载通知列表
  const loadNotifications = React.useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      setNotificationsLoading(true);
      const response = await fetch('/api/notifications?limit=20', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (error) {
      console.error('載入通知失敗:', error);
    } finally {
      setNotificationsLoading(false);
    }
  }, []);

  // 刷新通知的回调函数（稳定引用）
  const handleBusArrival = React.useCallback(async (data?: any) => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      // 刷新未读数量
      const countResponse = await fetch('/api/notifications?unreadOnly=true&limit=1', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (countResponse.ok) {
        const countData = await countResponse.json();
        setUnreadCount(countData.unreadCount || 0);
      }

      // 刷新通知列表
      await loadNotifications();
    } catch (error) {
      console.error('刷新通知失敗:', error);
    }
  }, [loadNotifications]);

  // 监听 Pusher 实时通知
  useUserNotifications(userId, {
    onBusArrival: handleBusArrival,
  });


  // 定期檢查提醒（用於本地開發環境，因為 cron job 不會自動執行）
  // 每 30 秒檢查一次提醒，觸發通知
  React.useEffect(() => {
    if (!userId) return;

    const checkReminders = async () => {
      try {
        // 調用 cron job API 來檢查提醒
        const response = await fetch('/api/cron/bus-reminders', {
          method: 'GET',
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.count > 0) {
            // 如果有提醒被處理，刷新通知列表
            await loadNotifications();
            // 刷新未讀數量
            const token = localStorage.getItem('token');
            if (token) {
              const countResponse = await fetch('/api/notifications?unreadOnly=true&limit=1', {
                headers: { Authorization: `Bearer ${token}` },
              });
              if (countResponse.ok) {
                const countData = await countResponse.json();
                setUnreadCount(countData.unreadCount || 0);
              }
            }
          }
        }
      } catch (error) {
        console.error('定期檢查提醒失敗:', error);
      }
    };

    // 立即執行一次
    checkReminders();
    
    // 每 30 秒執行一次
    const interval = setInterval(checkReminders, 30000);
    
    return () => clearInterval(interval);
  }, [userId, loadNotifications]);

  const handleProfileClick = React.useCallback(() => {
    setProfileModalOpen(true);
  }, []);

  const handleEditProfile = React.useCallback(() => {
    setEditProfileModalOpen(true);
  }, []);

  const handleCalendarClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    // 第二次點擊回到主頁：在 /calendar 時再點一次 icon 就導回 /
    if (pathname === '/calendar') {
      console.log('Navigating to /');
      router.push('/');
    } else {
      router.push('/calendar');
    }
  };

  const handleScheduleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    // 課表功能
    if (pathname === '/schedule') {
      router.push('/');
    } else {
      router.push('/schedule');
    }
  };

  const handleProfileUpdate = React.useCallback(() => {
    // 重新載入用戶資訊以更新頭像
    const loadUserInfo = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const response = await fetch('/api/auth/me', {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });
          if (response.ok) {
            const data = await response.json();
            if (data.user) {
              if (data.user.avatar) {
                setUserAvatar(data.user.avatar);
              }
              if (data.user.name) {
                setUserInitial(data.user.name[0].toUpperCase());
              } else if (data.user.email) {
                setUserInitial(data.user.email[0].toUpperCase());
              }
            }
          }
        } catch (error) {
          // 靜默失敗，使用默認值
        }
      }
    };
    loadUserInfo();
  }, []);

  // 通知相關處理
  const handleNotificationClick = async (event: React.MouseEvent<HTMLElement>) => {
    setNotificationAnchor(event.currentTarget);
    await loadNotifications();
  };

  const handleNotificationClose = () => {
    setNotificationAnchor(null);
  };

  const handleMarkAsRead = async (notificationId: string) => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      await fetch('/api/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ action: 'markAsRead', notificationId }),
      });

      // 更新本地狀態
      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('標記已讀失敗:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      await fetch('/api/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ action: 'markAllAsRead' }),
      });

      // 更新本地狀態
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('標記全部已讀失敗:', error);
    }
  };

  const handleNotificationItemClick = (notification: NotificationItem) => {
    handleNotificationClose();
    
    // 根據通知類型跳轉
    if (notification.type === 'friend_request' || notification.type === 'friend_accepted') {
      router.push('/community');
    } else if (notification.type === 'new_message' && notification.relatedId) {
      router.push('/community');
    } else if (notification.type === 'group_invite') {
      router.push('/community');
    } else if (notification.type === 'schedule_share') {
      router.push('/community');
    } else if (notification.type === 'bus_arrival') {
      // 公车到站通知，跳转到地图页面
      router.push('/');
    }
  };

  return (
    <>
      <Box
        sx={{
          position: 'absolute',
          top: 16,
          right: 16,
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          zIndex: 1100, // Above map
          backgroundColor: 'rgba(255, 255, 255, 0.8)',
          padding: '8px 16px',
          borderRadius: '24px',
          backdropFilter: 'blur(4px)',
          pointerEvents: 'auto', // 確保可以接收點擊事件
        }}
      >
        <Tooltip title="通知">
          <IconButton onClick={handleNotificationClick}>
            <Badge badgeContent={unreadCount} color="error">
              <NotificationsIcon sx={{ color: 'black' }} />
            </Badge>
          </IconButton>
        </Tooltip>
        <Tooltip title="個人行事曆">
          <IconButton 
            onClick={handleCalendarClick}
            sx={{ 
              pointerEvents: 'auto',
              backgroundColor: pathname === '/calendar' ? 'rgba(0, 0, 0, 0.1)' : 'transparent',
              '&:hover': {
                backgroundColor: pathname === '/calendar' ? 'rgba(0, 0, 0, 0.15)' : 'rgba(0, 0, 0, 0.05)',
              },
            }}
          >
            <CalendarMonthIcon sx={{ color: 'black' }} />
          </IconButton>
        </Tooltip>
        <Tooltip title="課表">
          <IconButton 
            onClick={handleScheduleClick}
            sx={{ 
              pointerEvents: 'auto',
              backgroundColor: pathname === '/schedule' ? 'rgba(0, 0, 0, 0.1)' : 'transparent',
              '&:hover': {
                backgroundColor: pathname === '/schedule' ? 'rgba(0, 0, 0, 0.15)' : 'rgba(0, 0, 0, 0.05)',
              },
            }}
          >
            <ClassIcon sx={{ color: 'black' }} />
          </IconButton>
        </Tooltip>
        <Tooltip title="個人主頁">
          <IconButton sx={{ p: 0 }} onClick={handleProfileClick}>
            <Avatar
              alt="User Avatar"
              src={userAvatar || undefined}
              sx={{ bgcolor: 'black' }}
            >
              {userInitial}
            </Avatar>
          </IconButton>
        </Tooltip>
      </Box>

      <ProfileModal
        open={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
        onEditProfile={handleEditProfile}
      />
      <EditProfileModal
        open={editProfileModalOpen}
        onClose={() => setEditProfileModalOpen(false)}
        onUpdate={handleProfileUpdate}
      />
      
      <NotificationMenu
        anchorEl={notificationAnchor}
        open={Boolean(notificationAnchor)}
        onClose={handleNotificationClose}
        notifications={notifications}
        loading={notificationsLoading}
        onMarkAsRead={handleMarkAsRead}
        onMarkAllAsRead={handleMarkAllAsRead}
        onNotificationClick={handleNotificationItemClick}
      />
    </>
  );
}


