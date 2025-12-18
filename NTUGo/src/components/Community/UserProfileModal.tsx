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
import Chip from '@mui/material/Chip';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import RadioGroup from '@mui/material/RadioGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import Radio from '@mui/material/Radio';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';

interface UserProfile {
  id: string;
  userId?: string | null;
  name?: string | null;
  avatar?: string | null;
  department?: string | null;
  email?: string;
  friendshipStatus?: 'none' | 'pending' | 'accepted';
  friendshipDirection?: 'sent' | 'received' | null;
  friendshipId?: string | null;
}

interface Schedule {
  _id: string;
  name: string;
  isDefault?: boolean;
}

interface UserProfileModalProps {
  open: boolean;
  onClose: () => void;
  userId: string | null;
  onStartChat?: (userId: string, name: string, avatar?: string) => void;
  onFriendRemoved?: () => void;
}

export default function UserProfileModal({ 
  open, 
  onClose, 
  userId,
  onStartChat,
  onFriendRemoved,
}: UserProfileModalProps) {
  const [user, setUser] = React.useState<UserProfile | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [status, setStatus] = React.useState<string>('');
  const [sendingRequest, setSendingRequest] = React.useState(false);
  const [removingFriend, setRemovingFriend] = React.useState(false);
  const [sendingScheduleShare, setSendingScheduleShare] = React.useState(false);
  const [scheduleSelectDialogOpen, setScheduleSelectDialogOpen] = React.useState(false);
  const [schedules, setSchedules] = React.useState<Schedule[]>([]);
  const [selectedScheduleId, setSelectedScheduleId] = React.useState<string>('');
  const [loadingSchedules, setLoadingSchedules] = React.useState(false);
  const [snackbarOpen, setSnackbarOpen] = React.useState(false);
  const [snackbarMessage, setSnackbarMessage] = React.useState('');
  const [snackbarSeverity, setSnackbarSeverity] = React.useState<'success' | 'error' | 'info'>('info');

  React.useEffect(() => {
    if (open && userId) {
      fetchUserInfo();
      fetchUserStatus();
    }
  }, [open, userId]);

  const fetchUserInfo = async () => {
    if (!userId) return;
    
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('token');

      // 根據 ID 取得用戶詳細資訊
      const response = await fetch(`/api/community/users/${userId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          setError('找不到此用戶');
        } else {
          throw new Error('獲取用戶資訊失敗');
        }
        return;
      }

      const data = await response.json();
      setUser(data.user);
    } catch (err: any) {
      setError(err.message || '載入用戶資訊時發生錯誤');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserStatus = async () => {
    if (!userId) return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/community/status?userId=${userId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.location) {
          setStatus(`@ ${data.location}`);
        } else if (data.status === 'in class') {
          setStatus(data.courseName || '上課中');
        } else {
          setStatus('無課程');
        }
      }
    } catch (error) {
      // 靜默失敗
    }
  };

  const handleSendRequest = async () => {
    if (!userId || sendingRequest) return;

    try {
      setSendingRequest(true);
      const token = localStorage.getItem('token');

      const response = await fetch('/api/community/friends', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ targetUserId: userId }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || '發送好友請求失敗');
      }

      // 更新狀態
      setUser(prev => prev ? {
        ...prev,
        friendshipStatus: 'pending',
        friendshipDirection: 'sent',
      } : null);
      showSnackbar('好友請求已發送', 'success');
    } catch (error: any) {
      showSnackbar(error.message || '發送好友請求失敗', 'error');
    } finally {
      setSendingRequest(false);
    }
  };

  const handleStartChat = () => {
    if (user && onStartChat) {
      onStartChat(user.id, user.name || user.userId || '用戶', user.avatar || undefined);
      onClose();
    }
  };

  const handleRemoveFriend = async () => {
    if (!user || !user.friendshipId || removingFriend) return;

    const confirmRemove = window.confirm(`確定要刪除好友「${user.name || user.userId || '用戶'}」嗎？`);
    if (!confirmRemove) return;

    try {
      setRemovingFriend(true);
      const token = localStorage.getItem('token');

      const response = await fetch(`/api/community/friends/${user.friendshipId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || '刪除好友失敗');
      }

      // 更新狀態
      setUser(prev => prev ? {
        ...prev,
        friendshipStatus: 'none',
        friendshipId: null,
        friendshipDirection: null,
      } : null);

      onFriendRemoved?.();
      showSnackbar('已刪除好友', 'success');
    } catch (error: any) {
      showSnackbar(error.message || '刪除好友失敗', 'error');
    } finally {
      setRemovingFriend(false);
    }
  };

  const fetchSchedules = async () => {
    try {
      setLoadingSchedules(true);
      const token = localStorage.getItem('token');
      const response = await fetch('/api/schedule', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('獲取課表列表失敗');
      }

      const data = await response.json();
      const schedulesList = data.schedules || [];
      setSchedules(schedulesList);
      
      // 自動選擇默認課表
      const defaultSchedule = schedulesList.find((s: Schedule) => s.isDefault) || schedulesList[0];
      if (defaultSchedule) {
        setSelectedScheduleId(defaultSchedule._id);
      }
    } catch (error) {
      console.error('獲取課表列表失敗:', error);
    } finally {
      setLoadingSchedules(false);
    }
  };

  const handleOpenScheduleSelectDialog = () => {
    setScheduleSelectDialogOpen(true);
    fetchSchedules();
  };

  const handleCloseScheduleSelectDialog = () => {
    setScheduleSelectDialogOpen(false);
    setSelectedScheduleId('');
  };

  const showSnackbar = (message: string, severity: 'success' | 'error' | 'info' = 'info') => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  const handleShareSchedule = async () => {
    if (!userId || sendingScheduleShare) return;

    try {
      setSendingScheduleShare(true);
      const token = localStorage.getItem('token');

      const requestBody: { targetUserId: string; scheduleId?: string } = {
        targetUserId: userId,
      };

      // 如果選擇了課表，則包含 scheduleId（如果未選擇，則不傳 scheduleId，使用默認課表）
      if (selectedScheduleId) {
        requestBody.scheduleId = selectedScheduleId;
      }

      const response = await fetch('/api/community/schedule-share', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || '發送課表分享請求失敗');
      }

      // 檢查是否已經分享過相同的課表
      if (data.alreadyShared) {
        showSnackbar('此刻表已分享', 'info');
        handleCloseScheduleSelectDialog();
        return;
      }

      // 成功發送請求
      showSnackbar('課表分享請求已發送！', 'success');
      handleCloseScheduleSelectDialog();
    } catch (error: any) {
      // 檢查是否是已分享相同課表的錯誤
      if (error.message && (error.message.includes('已與對方分享此課表') || error.message.includes('已發送課表分享請求'))) {
        showSnackbar(error.message, 'info');
      } else {
        showSnackbar(error.message || '發送課表分享請求失敗', 'error');
      }
    } finally {
      setSendingScheduleShare(false);
    }
  };

  const getFriendshipButton = () => {
    if (!user) return null;

    if (user.friendshipStatus === 'accepted') {
      return (
        <>
          <Button
            fullWidth
            variant="contained"
            onClick={handleStartChat}
            sx={{
              mb: 1.5,
              py: 1.5,
              borderRadius: 2,
              backgroundColor: '#0F4C75',
              color: '#ffffff',
              fontWeight: 600,
              textTransform: 'none',
              '&:hover': {
                backgroundColor: '#0a3a5a',
              },
            }}
          >
            發送訊息
          </Button>
          <Button
            fullWidth
            variant="contained"
            onClick={handleOpenScheduleSelectDialog}
            disabled={sendingScheduleShare}
            sx={{
              mb: 1.5,
              py: 1.5,
              borderRadius: 2,
              backgroundColor: '#4caf50',
              color: '#ffffff',
              fontWeight: 600,
              textTransform: 'none',
              '&:hover': {
                backgroundColor: '#45a049',
              },
            }}
          >
            {sendingScheduleShare ? <CircularProgress size={20} sx={{ color: '#ffffff' }} /> : '分享課表'}
          </Button>
          <Button
            fullWidth
            variant="outlined"
            onClick={handleRemoveFriend}
            disabled={removingFriend}
            sx={{
              mb: 2,
              py: 1.5,
              borderRadius: 2,
              borderColor: '#f44336',
              color: '#f44336',
              fontWeight: 600,
              textTransform: 'none',
              '&:hover': {
                backgroundColor: '#ffebee',
                borderColor: '#d32f2f',
              },
            }}
          >
            {removingFriend ? <CircularProgress size={20} sx={{ color: '#f44336' }} /> : '刪除好友'}
          </Button>
        </>
      );
    }

    if (user.friendshipStatus === 'pending') {
      return (
        <Button
          fullWidth
          variant="outlined"
          disabled
          sx={{
            mb: 2,
            py: 1.5,
            borderRadius: 2,
            textTransform: 'none',
          }}
        >
          {user.friendshipDirection === 'sent' ? '已發送請求' : '等待您的回應'}
        </Button>
      );
    }

    return (
      <Button
        fullWidth
        variant="contained"
        onClick={handleSendRequest}
        disabled={sendingRequest}
        sx={{
          mb: 2,
          py: 1.5,
          borderRadius: 2,
          backgroundColor: '#0F4C75',
          color: '#ffffff',
          fontWeight: 600,
          textTransform: 'none',
          '&:hover': {
            backgroundColor: '#0a3a5a',
          },
        }}
      >
        {sendingRequest ? <CircularProgress size={20} sx={{ color: '#ffffff' }} /> : '加為好友'}
      </Button>
    );
  };

  return (
    <>
      <Modal
        open={open}
        onClose={onClose}
        aria-labelledby="user-profile-modal-title"
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
                id="user-profile-modal-title"
                variant="h6"
                component="h2"
                sx={{ fontWeight: 700 }}
              >
                用戶資料
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
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Typography color="error">{error}</Typography>
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
                      alt={user.name || '用戶'}
                      sx={{
                        width: 100,
                        height: 100,
                        bgcolor: '#0F4C75',
                        fontSize: '2.5rem',
                        mb: 2,
                      }}
                    >
                      {(user.name || user.userId)?.[0]?.toUpperCase()}
                    </Avatar>
                    
                    {/* 狀態 */}
                    {status && (
                      <Chip
                        label={`狀態：${status}`}
                        size="small"
                        sx={{
                          bgcolor: status === '無課程' ? '#f5f5f5' : '#e8f5e9',
                          color: status === '無課程' ? '#757575' : '#2e7d32',
                        }}
                      />
                    )}
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
                  </Box>

                  {/* Action Button */}
                  {getFriendshipButton()}
                </>
              ) : null}
            </CardContent>
          </Card>
        </Box>
      </Modal>

      {/* 課表選擇對話框 */}
      <Dialog 
        open={scheduleSelectDialogOpen} 
        onClose={handleCloseScheduleSelectDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>選擇要分享的課表</DialogTitle>
        <DialogContent>
          {loadingSchedules ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : schedules.length === 0 ? (
            <Typography color="text.secondary" sx={{ py: 2 }}>
              您還沒有課表
            </Typography>
          ) : (
            <RadioGroup
              value={selectedScheduleId}
              onChange={(e) => setSelectedScheduleId(e.target.value)}
            >
              {schedules.map((schedule) => (
                <FormControlLabel
                  key={schedule._id}
                  value={schedule._id}
                  control={<Radio />}
                  label={
                    <Box>
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        {schedule.name}
                      </Typography>
                      {schedule.isDefault && (
                        <Typography variant="caption" color="text.secondary">
                          預設課表
                        </Typography>
                      )}
                    </Box>
                  }
                  sx={{ mb: 1 }}
                />
              ))}
            </RadioGroup>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseScheduleSelectDialog}>取消</Button>
          <Button
            onClick={handleShareSchedule}
            variant="contained"
            disabled={!selectedScheduleId || sendingScheduleShare || schedules.length === 0}
            sx={{
              backgroundColor: '#4caf50',
              '&:hover': {
                backgroundColor: '#45a049',
              },
            }}
          >
            {sendingScheduleShare ? (
              <CircularProgress size={20} sx={{ color: '#ffffff' }} />
            ) : (
              '確認分享'
            )}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 提示訊息 Snackbar */}
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

