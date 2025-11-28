'use client';

import * as React from 'react';
import Box from '@mui/material/Box';
import Modal from '@mui/material/Modal';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Avatar from '@mui/material/Avatar';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import Divider from '@mui/material/Divider';
import CircularProgress from '@mui/material/CircularProgress';

interface User {
  id: string;
  userId?: string | null;
  email: string;
  name?: string | null;
  avatar?: string | null;
  provider?: 'email' | 'google';
}

interface ProfileModalProps {
  open: boolean;
  onClose: () => void;
  onEditProfile: () => void;
}

export default function ProfileModal({ open, onClose, onEditProfile }: ProfileModalProps) {
  const [user, setUser] = React.useState<User | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (open) {
      fetchUserInfo();
    }
  }, [open]);

  const fetchUserInfo = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('token');
      
      if (!token) {
        setError('請先登入');
        return;
      }

      const response = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('獲取用戶資訊失敗');
      }

      const data = await response.json();
      setUser(data.user);
    } catch (err: any) {
      setError(err.message || '載入用戶資訊時發生錯誤');
    } finally {
      setLoading(false);
    }
  };

  const handleEditProfile = () => {
    onEditProfile();
    onClose();
  };

  const handleLogout = async () => {
    try {
      // 調用登出 API（可選）
      await fetch('/api/auth/logout', {
        method: 'POST',
      });
    } catch (error) {
      // 忽略錯誤，繼續清除本地 token
    } finally {
      // 清除本地 token
      localStorage.removeItem('token');
      // 重定向到登入頁面
      window.location.href = '/login';
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      aria-labelledby="profile-modal-title"
      aria-describedby="profile-modal-description"
      sx={{
        '& .MuiBackdrop-root': {
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
          backdropFilter: 'blur(4px)',
        },
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: { xs: '90%', sm: 400 },
          maxWidth: 500,
          outline: 'none',
        }}
      >
        <Card
          sx={{
            borderRadius: 3,
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
          }}
        >
          {/* Header */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              p: 2,
              pb: 1,
            }}
          >
            <Typography
              id="profile-modal-title"
              variant="h6"
              component="h2"
              sx={{ fontWeight: 700 }}
            >
              個人主頁
            </Typography>
            <IconButton
              onClick={onClose}
              size="small"
              sx={{
                color: 'text.secondary',
                '&:hover': {
                  backgroundColor: 'action.hover',
                },
              }}
            >
              <CloseIcon />
            </IconButton>
          </Box>

          <Divider />

          <CardContent sx={{ p: 3 }}>
            {loading ? (
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  minHeight: 200,
                }}
              >
                <CircularProgress />
              </Box>
            ) : error ? (
              <Box
                sx={{
                  textAlign: 'center',
                  py: 4,
                }}
              >
                <Typography color="error">{error}</Typography>
                <Button
                  variant="outlined"
                  onClick={fetchUserInfo}
                  sx={{ mt: 2 }}
                >
                  重試
                </Button>
              </Box>
            ) : user ? (
              <>
                {/* Avatar */}
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    mb: 3,
                  }}
                >
                  <Avatar
                    src={user.avatar || undefined}
                    alt={user.name || user.email}
                    sx={{
                      width: 100,
                      height: 100,
                      bgcolor: '#0F4C75',
                      fontSize: '2.5rem',
                      mb: 2,
                    }}
                  >
                    {user.name?.[0]?.toUpperCase() || user.email[0]?.toUpperCase()}
                  </Avatar>
                </Box>

                {/* User Info */}
                <Box sx={{ mb: 3 }}>
                  <Box sx={{ mb: 2 }}>
                    <Typography
                      variant="caption"
                      sx={{
                        color: 'text.secondary',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        letterSpacing: 0.5,
                      }}
                    >
                      姓名
                    </Typography>
                    <Typography
                      variant="body1"
                      sx={{
                        mt: 0.5,
                        fontWeight: 500,
                        color: user.name ? 'text.primary' : 'text.secondary',
                      }}
                    >
                      {user.name || '未設定'}
                    </Typography>
                  </Box>

                  {user.userId && (
                    <Box sx={{ mb: 2 }}>
                      <Typography
                        variant="caption"
                        sx={{
                          color: 'text.secondary',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          textTransform: 'uppercase',
                          letterSpacing: 0.5,
                        }}
                      >
                        用戶 ID
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{
                          mt: 0.5,
                          color: 'text.primary',
                          fontFamily: 'monospace',
                          fontWeight: 500,
                        }}
                      >
                        {user.userId}
                      </Typography>
                    </Box>
                  )}

                  <Box>
                    <Typography
                      variant="caption"
                      sx={{
                        color: 'text.secondary',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        letterSpacing: 0.5,
                      }}
                    >
                      電子郵件
                    </Typography>
                    <Typography
                      variant="body1"
                      sx={{
                        mt: 0.5,
                        fontWeight: 500,
                      }}
                    >
                      {user.email}
                    </Typography>
                  </Box>
                </Box>

                {/* Edit Profile Button */}
                <Button
                  fullWidth
                  variant="contained"
                  onClick={handleEditProfile}
                  sx={{
                    mb: 2,
                    py: 1.5,
                    borderRadius: 2,
                    backgroundColor: '#0F4C75',
                    color: '#ffffff',
                    fontWeight: 600,
                    fontSize: '1rem',
                    textTransform: 'none',
                    '&:hover': {
                      backgroundColor: '#0a3a5a',
                    },
                  }}
                >
                  編輯個人資料
                </Button>

                {/* Logout Button */}
                <Button
                  fullWidth
                  variant="outlined"
                  onClick={handleLogout}
                  sx={{
                    py: 1.5,
                    borderRadius: 2,
                    borderColor: '#d32f2f',
                    color: '#d32f2f',
                    fontWeight: 600,
                    fontSize: '1rem',
                    textTransform: 'none',
                    '&:hover': {
                      borderColor: '#c62828',
                      backgroundColor: 'rgba(211, 47, 47, 0.04)',
                    },
                  }}
                >
                  登出
                </Button>
              </>
            ) : null}
          </CardContent>
        </Card>
      </Box>
    </Modal>
  );
}

