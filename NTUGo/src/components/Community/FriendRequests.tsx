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

interface ScheduleShareRequest {
  shareId: string;
  user: {
    id: string;
    userId?: string | null;
    name?: string | null;
    avatar?: string | null;
    department?: string | null;
  } | null;
  createdAt: string;
}

interface FriendRequestsProps {
  onRequestHandled?: () => void;
  onViewProfile?: (userId: string) => void;
}

export default function FriendRequests({ onRequestHandled, onViewProfile }: FriendRequestsProps) {
  const [receivedRequests, setReceivedRequests] = React.useState<FriendRequest[]>([]);
  const [sentRequests, setSentRequests] = React.useState<FriendRequest[]>([]);
  const [receivedScheduleShares, setReceivedScheduleShares] = React.useState<ScheduleShareRequest[]>([]);
  const [sentScheduleShares, setSentScheduleShares] = React.useState<ScheduleShareRequest[]>([]);
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
      const [receivedRes, sentRes, receivedScheduleRes, sentScheduleRes] = await Promise.all([
        fetch('/api/community/friends/requests?type=received', {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch('/api/community/friends/requests?type=sent', {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch('/api/community/schedule-share/requests?type=received', {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch('/api/community/schedule-share/requests?type=sent', {
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

      if (receivedScheduleRes.ok) {
        const data = await receivedScheduleRes.json();
        setReceivedScheduleShares(data.requests);
      }

      if (sentScheduleRes.ok) {
        const data = await sentScheduleRes.json();
        setSentScheduleShares(data.requests);
      }
    } catch (error) {
      console.error('取得請求錯誤:', error);
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

  const handleAcceptScheduleShare = async (shareId: string) => {
    try {
      console.log('接受課表分享請求:', shareId);
      setProcessingIds((prev) => new Set(prev).add(shareId));
      const token = localStorage.getItem('token');

      if (!shareId) {
        throw new Error('分享 ID 不能為空');
      }

      const response = await fetch(`/api/community/schedule-share/${encodeURIComponent(shareId)}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        let errorMessage = '接受課表分享請求失敗';
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch {
          // 如果 JSON 解析失败，使用默认错误消息
          errorMessage = `接受課表分享請求失敗 (${response.status})`;
        }
        throw new Error(errorMessage);
      }

      // 移除已處理的請求
      setReceivedScheduleShares((prev) => prev.filter((r) => r.shareId !== shareId));
      onRequestHandled?.();
    } catch (error: any) {
      console.error('接受課表分享請求錯誤:', error);
      alert(error.message || '接受課表分享請求失敗');
    } finally {
      setProcessingIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(shareId);
        return newSet;
      });
    }
  };

  const handleRejectScheduleShare = async (shareId: string) => {
    try {
      setProcessingIds((prev) => new Set(prev).add(shareId));
      const token = localStorage.getItem('token');

      const response = await fetch(`/api/community/schedule-share/${shareId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        let errorMessage = '拒絕課表分享請求失敗';
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch {
          errorMessage = `拒絕課表分享請求失敗 (${response.status})`;
        }
        throw new Error(errorMessage);
      }

      // 移除已處理的請求
      setReceivedScheduleShares((prev) => prev.filter((r) => r.shareId !== shareId));
      onRequestHandled?.();
    } catch (error) {
      console.error('拒絕課表分享請求錯誤:', error);
      alert('拒絕課表分享請求失敗');
    } finally {
      setProcessingIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(shareId);
        return newSet;
      });
    }
  };

  const handleCancelSentScheduleShare = async (shareId: string) => {
    try {
      setProcessingIds((prev) => new Set(prev).add(shareId));
      const token = localStorage.getItem('token');

      const response = await fetch(`/api/community/schedule-share/${shareId}?action=cancel`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        let errorMessage = '取消課表分享請求失敗';
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch {
          errorMessage = `取消課表分享請求失敗 (${response.status})`;
        }
        throw new Error(errorMessage);
      }

      // 移除已取消的請求
      setSentScheduleShares((prev) => prev.filter((r) => r.shareId !== shareId));
      onRequestHandled?.();
    } catch (error) {
      console.error('取消課表分享請求錯誤:', error);
      alert('取消課表分享請求失敗');
    } finally {
      setProcessingIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(shareId);
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

  if (receivedRequests.length === 0 && sentRequests.length === 0 && 
      receivedScheduleShares.length === 0 && sentScheduleShares.length === 0) {
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

      {/* 收到的課表分享請求 */}
      {receivedScheduleShares.length > 0 && (
        <>
          <Typography variant="h6" sx={{ fontWeight: 600, color: '#1a1a2e', mb: 2, mt: 3 }}>
            課表分享請求
          </Typography>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mb: 3 }}>
            {receivedScheduleShares.map((request) => (
              <Box
                key={request.shareId}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  p: 2,
                  bgcolor: '#f5f7fa',
                  borderRadius: 2,
                  border: '1px solid #e0e4e8',
                }}
              >
                {request.user && (
                  <>
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
                      onClick={() => onViewProfile?.(request.user!.id)}
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
                          onClick={() => onViewProfile?.(request.user!.id)}
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
                              bgcolor: '#e8f5e9',
                              color: '#2e7d32',
                            }}
                          />
                        )}
                      </Box>
                      <Typography variant="caption" sx={{ color: '#9e9e9e' }}>
                        想與您分享課表
                      </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => handleAcceptScheduleShare(request.shareId)}
                        disabled={processingIds.has(request.shareId)}
                        sx={{
                          borderRadius: 4,
                          textTransform: 'none',
                          minWidth: 70,
                          borderColor: '#4caf50',
                          color: '#4caf50',
                          '&:hover': {
                            borderColor: '#45a049',
                            bgcolor: 'rgba(76, 175, 80, 0.04)',
                          },
                        }}
                      >
                        {processingIds.has(request.shareId) ? (
                          <CircularProgress size={16} />
                        ) : (
                          '同意'
                        )}
                      </Button>
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => handleRejectScheduleShare(request.shareId)}
                        disabled={processingIds.has(request.shareId)}
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
                  </>
                )}
              </Box>
            ))}
          </Box>
        </>
      )}

      {/* 已送出的課表分享請求 */}
      {sentScheduleShares.length > 0 && (
        <>
          <Typography variant="h6" sx={{ fontWeight: 600, color: '#1a1a2e', mb: 2, mt: 3 }}>
            已送出的課表分享邀請
          </Typography>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {sentScheduleShares.map((request) => (
              <Box
                key={request.shareId}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  p: 2,
                  bgcolor: '#fff8e1',
                  borderRadius: 2,
                  border: '1px solid #ffe0b2',
                }}
              >
                {request.user && (
                  <>
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
                      onClick={() => onViewProfile?.(request.user!.id)}
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
                          onClick={() => onViewProfile?.(request.user!.id)}
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
                              bgcolor: '#e8f5e9',
                              color: '#2e7d32',
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
                      onClick={() => handleCancelSentScheduleShare(request.shareId)}
                      disabled={processingIds.has(request.shareId)}
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
                      {processingIds.has(request.shareId) ? (
                        <CircularProgress size={16} />
                      ) : (
                        '取消請求'
                      )}
                    </Button>
                  </>
                )}
              </Box>
            ))}
          </Box>
        </>
      )}
    </Box>
  );
}
