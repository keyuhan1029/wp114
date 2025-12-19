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
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import Divider from '@mui/material/Divider';
import CircularProgress from '@mui/material/CircularProgress';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';

interface User {
  id: string;
  userId?: string | null;
  email: string;
  name?: string | null;
  avatar?: string | null;
  department?: string | null;
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
  const [uploading, setUploading] = React.useState(false);
  const [snackbarOpen, setSnackbarOpen] = React.useState(false);
  const [snackbarMessage, setSnackbarMessage] = React.useState('');
  const [snackbarSeverity, setSnackbarSeverity] = React.useState<'success' | 'error' | 'info'>('info');
  const fileInputRef = React.useRef<HTMLInputElement>(null);

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

  const handleCameraClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // 檢查檔案類型
    if (!file.type.startsWith('image/')) {
      setSnackbarMessage('請選擇圖片檔案');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      return;
    }

    // 檢查檔案大小（5MB）
    if (file.size > 5 * 1024 * 1024) {
      setSnackbarMessage('圖片大小不能超過 5MB');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      return;
    }

    try {
      setUploading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('請先登入');
      }

      // 創建 FormData
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'avatars'); // 使用 avatars 文件夾

      // 上傳到 Cloudinary
      const uploadResponse = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json();
        throw new Error(errorData.message || '上傳失敗');
      }

      const uploadData = await uploadResponse.json();
      const imageUrl = uploadData.file.url;

      // 更新用戶資料
      const updateResponse = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ avatar: imageUrl }),
      });

      if (!updateResponse.ok) {
        const errorData = await updateResponse.json();
        throw new Error(errorData.message || '更新頭像失敗');
      }

      // 更新本地狀態
      setUser(prev => prev ? { ...prev, avatar: imageUrl } : null);
      setSnackbarMessage('頭像更新成功');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);

      // 重新獲取用戶資訊以確保同步
      await fetchUserInfo();
    } catch (err: any) {
      setSnackbarMessage(err.message || '上傳頭像失敗');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    } finally {
      setUploading(false);
      // 重置 input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <>
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
                    position: 'relative',
                  }}
                >
                  <Box sx={{ position: 'relative' }}>
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
                    {uploading ? (
                      <Box
                        sx={{
                          position: 'absolute',
                          bottom: 8,
                          right: 0,
                          bgcolor: '#0F4C75',
                          borderRadius: '50%',
                          width: 32,
                          height: 32,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          opacity: 0.8,
                        }}
                      >
                        <CircularProgress size={16} sx={{ color: 'white' }} />
                      </Box>
                    ) : (
                      <IconButton
                        onClick={handleCameraClick}
                        sx={{
                          position: 'absolute',
                          bottom: 8,
                          right: 0,
                          bgcolor: '#0F4C75',
                          color: 'white',
                          width: 32,
                          height: 32,
                          '&:hover': {
                            bgcolor: '#0a3a5a',
                          },
                        }}
                      >
                        <CameraAltIcon fontSize="small" />
                      </IconButton>
                    )}
                  </Box>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={handleFileChange}
                  />
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
                      系所
                    </Typography>
                    <Typography
                      variant="body1"
                      sx={{
                        mt: 0.5,
                        fontWeight: 500,
                        color: user.department ? 'text.primary' : 'text.secondary',
                      }}
                    >
                      {user.department || '未設定'}
                    </Typography>
                  </Box>

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

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbarOpen(false)}
          severity={snackbarSeverity}
          sx={{ width: '100%' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </>
  );
}

