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
import TextField from '@mui/material/TextField';
import Divider from '@mui/material/Divider';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import ListSubheader from '@mui/material/ListSubheader';
import { useRouter } from 'next/navigation';
import { NTU_DEPARTMENTS } from '@/data/departments';

interface User {
  id: string;
  userId?: string | null;
  email: string;
  name?: string | null;
  avatar?: string | null;
  department?: string | null;
  provider?: 'email' | 'google';
}

interface EditProfileModalProps {
  open: boolean;
  onClose: () => void;
  onUpdate?: () => void;
}

export default function EditProfileModal({ open, onClose, onUpdate }: EditProfileModalProps) {
  const router = useRouter();
  const [user, setUser] = React.useState<User | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState(false);

  // Form fields
  const [name, setName] = React.useState('');
  const [avatar, setAvatar] = React.useState('');
  const [userId, setUserId] = React.useState('');
  const [department, setDepartment] = React.useState('');

  React.useEffect(() => {
    if (open) {
      fetchUserInfo();
    }
  }, [open]);

  const fetchUserInfo = async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(false);
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
      setName(data.user.name || '');
      setAvatar(data.user.avatar || '');
      setUserId(data.user.userId || '');
      setDepartment(data.user.department || '');
    } catch (err: any) {
      setError(err.message || '載入用戶資訊時發生錯誤');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(false);

      const token = localStorage.getItem('token');
      if (!token) {
        setError('請先登入');
        return;
      }

      const updateData: {
        name?: string;
        avatar?: string;
        userId?: string;
        department?: string;
      } = {};

      if (name.trim() !== (user?.name || '')) {
        updateData.name = name.trim();
      }
      if (avatar.trim() !== (user?.avatar || '')) {
        updateData.avatar = avatar.trim() || undefined;
      }
      if (userId.trim() !== (user?.userId || '')) {
        updateData.userId = userId.trim();
      }
      if (department !== (user?.department || '')) {
        updateData.department = department;
      }

      // 如果沒有變更，直接關閉
      if (Object.keys(updateData).length === 0) {
        onClose();
        return;
      }

      const response = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(updateData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || '更新失敗');
      }

      setSuccess(true);
      
      // 通知父組件更新
      if (onUpdate) {
        onUpdate();
      }

      // 延遲關閉以顯示成功訊息
      setTimeout(() => {
        onClose();
        // 重新載入頁面以更新頭像等資訊
        router.refresh();
      }, 1000);
    } catch (err: any) {
      setError(err.message || '更新個人資料時發生錯誤');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    // 重置表單
    if (user) {
      setName(user.name || '');
      setAvatar(user.avatar || '');
      setUserId(user.userId || '');
      setDepartment(user.department || '');
    }
    setError(null);
    setSuccess(false);
    onClose();
  };

  const handleDepartmentChange = (event: SelectChangeEvent) => {
    setDepartment(event.target.value);
  };

  return (
    <Modal
      open={open}
      onClose={handleCancel}
      aria-labelledby="edit-profile-modal-title"
      aria-describedby="edit-profile-modal-description"
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
          width: { xs: '90%', sm: 500 },
          maxWidth: 600,
          outline: 'none',
        }}
      >
        <Card
          sx={{
            borderRadius: 3,
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
            maxHeight: '90vh',
            overflow: 'auto',
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
              id="edit-profile-modal-title"
              variant="h6"
              component="h2"
              sx={{ fontWeight: 700 }}
            >
              編輯個人資料
            </Typography>
            <IconButton
              onClick={handleCancel}
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
            ) : error && !saving ? (
              <Box sx={{ mb: 2 }}>
                <Alert severity="error">{error}</Alert>
                <Button
                  variant="outlined"
                  onClick={fetchUserInfo}
                  sx={{ mt: 2 }}
                  fullWidth
                >
                  重試
                </Button>
              </Box>
            ) : (
              <>
                {success && (
                  <Alert severity="success" sx={{ mb: 2 }}>
                    個人資料更新成功！
                  </Alert>
                )}

                {error && (
                  <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                  </Alert>
                )}

                {/* Avatar Preview */}
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    mb: 3,
                  }}
                >
                  <Avatar
                    src={avatar || undefined}
                    alt={name || user?.email}
                    sx={{
                      width: 100,
                      height: 100,
                      bgcolor: '#0F4C75',
                      fontSize: '2.5rem',
                      mb: 2,
                    }}
                  >
                    {(name || user?.name)?.[0]?.toUpperCase() || user?.email[0]?.toUpperCase()}
                  </Avatar>
                </Box>

                {/* Form Fields */}
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <TextField
                    label="姓名"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    fullWidth
                    variant="outlined"
                    disabled={saving}
                  />

                  <TextField
                    label="頭像 URL"
                    value={avatar}
                    onChange={(e) => setAvatar(e.target.value)}
                    fullWidth
                    variant="outlined"
                    placeholder="輸入頭像圖片網址"
                    disabled={saving}
                    helperText="輸入圖片網址以設定頭像"
                  />

                  <TextField
                    label="用戶 ID"
                    value={userId}
                    onChange={(e) => setUserId(e.target.value)}
                    fullWidth
                    variant="outlined"
                    disabled={saving}
                    helperText="自定義用戶識別碼（可選）"
                  />

                  <FormControl fullWidth disabled={saving}>
                    <InputLabel id="department-select-label">系所</InputLabel>
                    <Select
                      labelId="department-select-label"
                      id="department-select"
                      value={department}
                      label="系所"
                      onChange={handleDepartmentChange}
                      MenuProps={{
                        PaperProps: {
                          style: {
                            maxHeight: 400,
                          },
                        },
                      }}
                    >
                      <MenuItem value="">
                        <em>未選擇</em>
                      </MenuItem>
                      {NTU_DEPARTMENTS.map((category) => [
                        <ListSubheader key={category.name} sx={{ fontWeight: 700, color: '#0F4C75' }}>
                          {category.name}
                        </ListSubheader>,
                        ...category.departments.map((dept) => (
                          <MenuItem key={dept} value={dept} sx={{ pl: 4 }}>
                            {dept}
                          </MenuItem>
                        )),
                      ])}
                    </Select>
                  </FormControl>

                  <TextField
                    label="電子郵件"
                    value={user?.email || ''}
                    fullWidth
                    variant="outlined"
                    disabled
                    helperText="電子郵件無法修改"
                  />
                </Box>

                {/* Action Buttons */}
                <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
                  <Button
                    variant="outlined"
                    onClick={handleCancel}
                    fullWidth
                    disabled={saving}
                    sx={{
                      py: 1.5,
                      borderRadius: 2,
                      textTransform: 'none',
                    }}
                  >
                    取消
                  </Button>
                  <Button
                    variant="contained"
                    onClick={handleSave}
                    fullWidth
                    disabled={saving}
                    sx={{
                      py: 1.5,
                      borderRadius: 2,
                      backgroundColor: '#0F4C75',
                      color: '#ffffff',
                      fontWeight: 600,
                      textTransform: 'none',
                      '&:hover': {
                        backgroundColor: '#0a3a5a',
                      },
                      '&:disabled': {
                        backgroundColor: '#0F4C75',
                        opacity: 0.6,
                      },
                    }}
                  >
                    {saving ? (
                      <CircularProgress size={20} sx={{ color: '#ffffff' }} />
                    ) : (
                      '儲存'
                    )}
                  </Button>
                </Box>
              </>
            )}
          </CardContent>
        </Card>
      </Box>
    </Modal>
  );
}


