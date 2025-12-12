'use client';

import * as React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Chip from '@mui/material/Chip';

interface FriendRequest {
  friendshipId: string;
  user: {
    id: string;
    userId?: string | null;
    name?: string | null;
    avatar?: string | null;
    department?: string | null;
  };
  createdAt: string;
}

interface FriendRequestsProps {
  onRequestHandled?: () => void;
  onViewProfile?: (userId: string) => void;
}

export default function FriendRequests({ onRequestHandled, onViewProfile }: FriendRequestsProps) {
  const [receivedRequests, setReceivedRequests] = React.useState<FriendRequest[]>([]);
  const [sentRequests, setSentRequests] = React.useState<FriendRequest[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [processingIds, setProcessingIds] = React.useState<Set<string>>(new Set());

  React.useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      // 同時獲取收到的和已送出的請求
      const [receivedRes, sentRes] = await Promise.all([
        fetch('/api/community/friends/requests?type=received', {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch('/api/community/friends/requests?type=sent', {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (receivedRes.ok) {
        const data = await receivedRes.json();
        setReceivedRequests(data.requests);
      }

      if (sentRes.ok) {
        const data = await sentRes.json();
        setSentRequests(data.requests);
      }
    } catch (error) {
      console.error('取得好友請求錯誤:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (friendshipId: string) => {
    try {
      setProcessingIds((prev) => new Set(prev).add(friendshipId));
      const token = localStorage.getItem('token');

      const response = await fetch(`/api/community/friends/${friendshipId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ action: 'accept' }),
      });

      if (!response.ok) {
        throw new Error('接受好友請求失敗');
      }

      // 移除已處理的請求
      setReceivedRequests((prev) => prev.filter((r) => r.friendshipId !== friendshipId));
      onRequestHandled?.();
    } catch (error) {
      console.error('接受好友請求錯誤:', error);
    } finally {
      setProcessingIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(friendshipId);
        return newSet;
      });
    }
  };

  const handleReject = async (friendshipId: string) => {
    try {
      setProcessingIds((prev) => new Set(prev).add(friendshipId));
      const token = localStorage.getItem('token');

      const response = await fetch(`/api/community/friends/${friendshipId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('拒絕好友請求失敗');
      }

      // 移除已處理的請求
      setReceivedRequests((prev) => prev.filter((r) => r.friendshipId !== friendshipId));
      onRequestHandled?.();
    } catch (error) {
      console.error('拒絕好友請求錯誤:', error);
    } finally {
      setProcessingIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(friendshipId);
        return newSet;
      });
    }
  };

  const handleCancelSent = async (friendshipId: string) => {
    try {
      setProcessingIds((prev) => new Set(prev).add(friendshipId));
      const token = localStorage.getItem('token');

      const response = await fetch(`/api/community/friends/${friendshipId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('取消好友請求失敗');
      }

      // 移除已取消的請求
      setSentRequests((prev) => prev.filter((r) => r.friendshipId !== friendshipId));
      onRequestHandled?.();
    } catch (error) {
      console.error('取消好友請求錯誤:', error);
    } finally {
      setProcessingIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(friendshipId);
        return newSet;
      });
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress size={24} />
      </Box>
    );
  }

  if (receivedRequests.length === 0 && sentRequests.length === 0) {
    return null;
  }

  return (
    <Box>
      {/* 收到的好友請求 */}
      {receivedRequests.length > 0 && (
        <>
          <Typography variant="h6" sx={{ fontWeight: 600, color: '#1a1a2e', mb: 2 }}>
            好友請求
          </Typography>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mb: 3 }}>
            {receivedRequests.map((request) => (
              <Box
                key={request.friendshipId}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  p: 2,
                  bgcolor: '#f5f7fa',
                  borderRadius: 2,
                  border: '1px solid #e0e4e8',
                }}
              >
                <Avatar
                  src={request.user.avatar || undefined}
                  sx={{
                    bgcolor: '#0F4C75',
                    width: 48,
                    height: 48,
                    mr: 2,
                    cursor: 'pointer',
                    '&:hover': {
                      opacity: 0.8,
                    },
                  }}
                  onClick={() => onViewProfile?.(request.user.id)}
                >
                  {(request.user.name || request.user.userId)?.[0]?.toUpperCase()}
                </Avatar>

                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography 
                      sx={{ 
                        fontWeight: 500, 
                        color: '#1a1a2e',
                        cursor: 'pointer',
                        '&:hover': {
                          textDecoration: 'underline',
                        },
                      }}
                      onClick={() => onViewProfile?.(request.user.id)}
                    >
                      {request.user.name || request.user.userId || '用戶'}
                    </Typography>
                    {request.user.department && (
                      <Chip
                        label={request.user.department}
                        size="small"
                        sx={{
                          height: 20,
                          fontSize: '0.7rem',
                          bgcolor: '#e3f2fd',
                          color: '#1565c0',
                        }}
                      />
                    )}
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => handleAccept(request.friendshipId)}
                    disabled={processingIds.has(request.friendshipId)}
                    sx={{
                      borderRadius: 4,
                      textTransform: 'none',
                      minWidth: 70,
                      borderColor: '#0F4C75',
                      color: '#0F4C75',
                      '&:hover': {
                        borderColor: '#0a3a5a',
                        bgcolor: 'rgba(15, 76, 117, 0.04)',
                      },
                    }}
                  >
                    {processingIds.has(request.friendshipId) ? (
                      <CircularProgress size={16} />
                    ) : (
                      '確認'
                    )}
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => handleReject(request.friendshipId)}
                    disabled={processingIds.has(request.friendshipId)}
                    sx={{
                      borderRadius: 4,
                      textTransform: 'none',
                      minWidth: 70,
                      borderColor: '#bdbdbd',
                      color: '#757575',
                      '&:hover': {
                        borderColor: '#9e9e9e',
                        bgcolor: 'rgba(0, 0, 0, 0.04)',
                      },
                    }}
                  >
                    取消
                  </Button>
                </Box>
              </Box>
            ))}
          </Box>
        </>
      )}

      {/* 已送出的好友請求 */}
      {sentRequests.length > 0 && (
        <>
          <Typography variant="h6" sx={{ fontWeight: 600, color: '#1a1a2e', mb: 2 }}>
            已送出的邀請
          </Typography>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {sentRequests.map((request) => (
              <Box
                key={request.friendshipId}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  p: 2,
                  bgcolor: '#fff8e1',
                  borderRadius: 2,
                  border: '1px solid #ffe0b2',
                }}
              >
                <Avatar
                  src={request.user.avatar || undefined}
                  sx={{
                    bgcolor: '#0F4C75',
                    width: 48,
                    height: 48,
                    mr: 2,
                    cursor: 'pointer',
                    '&:hover': {
                      opacity: 0.8,
                    },
                  }}
                  onClick={() => onViewProfile?.(request.user.id)}
                >
                  {(request.user.name || request.user.userId)?.[0]?.toUpperCase()}
                </Avatar>

                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography 
                      sx={{ 
                        fontWeight: 500, 
                        color: '#1a1a2e',
                        cursor: 'pointer',
                        '&:hover': {
                          textDecoration: 'underline',
                        },
                      }}
                      onClick={() => onViewProfile?.(request.user.id)}
                    >
                      {request.user.name || request.user.userId || '用戶'}
                    </Typography>
                    {request.user.department && (
                      <Chip
                        label={request.user.department}
                        size="small"
                        sx={{
                          height: 20,
                          fontSize: '0.7rem',
                          bgcolor: '#e3f2fd',
                          color: '#1565c0',
                        }}
                      />
                    )}
                  </Box>
                  <Typography variant="caption" sx={{ color: '#9e9e9e' }}>
                    等待對方回應
                  </Typography>
                </Box>

                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => handleCancelSent(request.friendshipId)}
                  disabled={processingIds.has(request.friendshipId)}
                  sx={{
                    borderRadius: 4,
                    textTransform: 'none',
                    minWidth: 90,
                    borderColor: '#bdbdbd',
                    color: '#757575',
                    '&:hover': {
                      borderColor: '#f44336',
                      color: '#f44336',
                      bgcolor: 'rgba(244, 67, 54, 0.04)',
                    },
                  }}
                >
                  {processingIds.has(request.friendshipId) ? (
                    <CircularProgress size={16} />
                  ) : (
                    '取消請求'
                  )}
                </Button>
              </Box>
            ))}
          </Box>
        </>
      )}
    </Box>
  );
}
