'use client';

import * as React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Box from '@mui/material/Box';
import Avatar from '@mui/material/Avatar';
import IconButton from '@mui/material/IconButton';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import ClassIcon from '@mui/icons-material/Class';
import Tooltip from '@mui/material/Tooltip';
import ProfileModal from '@/components/Auth/ProfileModal';
import EditProfileModal from '@/components/Auth/EditProfileModal';

export default function TopBar() {
  const router = useRouter();
  const pathname = usePathname();
  const [profileModalOpen, setProfileModalOpen] = React.useState(false);
  const [editProfileModalOpen, setEditProfileModalOpen] = React.useState(false);
  const [userAvatar, setUserAvatar] = React.useState<string | null>(null);
  const [userInitial, setUserInitial] = React.useState<string>('U');

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

  const handleProfileClick = () => {
    setProfileModalOpen(true);
  };

  const handleEditProfile = () => {
    setEditProfileModalOpen(true);
  };

  const handleCalendarClick = () => {
    // 第二次點擊回到主頁：在 /calendar 時再點一次 icon 就導回 /
    if (pathname === '/calendar') {
      router.push('/');
    } else {
      router.push('/calendar');
    }
  };

  const handleScheduleClick = () => {
    // 課表功能（待實作）
    if (pathname === '/schedule') {
      router.push('/');
    } else {
      router.push('/schedule');
    }
  };

  const handleProfileUpdate = () => {
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
        }}
      >
        <Tooltip title="個人行事曆">
          <IconButton onClick={handleCalendarClick}>
            <CalendarMonthIcon sx={{ color: 'black' }} />
          </IconButton>
        </Tooltip>
        <Tooltip title="課表">
          <IconButton onClick={handleScheduleClick}>
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
    </>
  );
}


