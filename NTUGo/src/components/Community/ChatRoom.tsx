'use client';

import * as React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Avatar from '@mui/material/Avatar';
import IconButton from '@mui/material/IconButton';
import CircularProgress from '@mui/material/CircularProgress';
import CloseIcon from '@mui/icons-material/Close';
import SendIcon from '@mui/icons-material/Send';
import { useChatRoomMessages } from '@/contexts/PusherContext';

interface Message {
  id: string;
  senderId: string;
  sender?: {
    id: string;
    userId?: string | null;
    name?: string | null;
    avatar?: string | null;
  } | null;
  content: string;
  createdAt: string;
  isOwn: boolean;
}

interface ChatRoomProps {
  roomId: string;
  friendId?: string;
  name: string;
  avatar?: string;
  onClose: () => void;
  onRoomCreated?: (roomId: string) => void;
  onViewProfile?: (userId: string) => void;
}

export default function ChatRoom({
  roomId: initialRoomId,
  friendId,
  name,
  avatar,
  onClose,
  onRoomCreated,
  onViewProfile,
}: ChatRoomProps) {
  const [roomId, setRoomId] = React.useState(initialRoomId);
  const [messages, setMessages] = React.useState<Message[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [sending, setSending] = React.useState(false);
  const [newMessage, setNewMessage] = React.useState('');
  const [friendStatus, setFriendStatus] = React.useState<string>('');
  const [currentUserId, setCurrentUserId] = React.useState<string | null>(null);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  // 取得當前用戶 ID
  React.useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        const response = await fetch('/api/auth/me', {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.ok) {
          const data = await response.json();
          setCurrentUserId(data.user.id);
        }
      } catch (error) {
        console.error('取得用戶資訊錯誤:', error);
      }
    };

    fetchCurrentUser();
  }, []);

  // Pusher 即時訊息
  const handleNewMessage = React.useCallback((data: any) => {
    // 忽略自己發送的訊息（已經通過 API 響應添加了）
    if (currentUserId && data.senderId === currentUserId) {
      return;
    }

    setMessages((prev) => {
      // 避免重複
      if (prev.some((m) => m.id === data.id)) {
        return prev;
      }
      return [
        ...prev,
        {
          id: data.id,
          senderId: data.senderId,
          sender: {
            id: data.senderId,
            name: data.senderName,
            avatar: data.senderAvatar,
          },
          content: data.content,
          createdAt: data.createdAt,
          isOwn: false, // 來自 Pusher 的是對方的訊息
        },
      ];
    });
  }, [currentUserId]);

  useChatRoomMessages(roomId || null, handleNewMessage);

  React.useEffect(() => {
    if (roomId) {
      fetchMessages();
    } else if (friendId) {
      // 如果沒有 roomId 但有 friendId，建立或取得聊天室
      createOrGetRoom();
    }
  }, [roomId, friendId]);

  React.useEffect(() => {
    if (friendId) {
      fetchFriendStatus();
    }
  }, [friendId]);

  React.useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const createOrGetRoom = async () => {
    if (!friendId) return;

    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      const response = await fetch('/api/community/chatrooms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          type: 'private',
          targetUserId: friendId,
        }),
      });

      if (!response.ok) {
        throw new Error('建立聊天室失敗');
      }

      const data = await response.json();
      const newRoomId = data.chatRoom.id;
      setRoomId(newRoomId);
      onRoomCreated?.(newRoomId);
    } catch (error) {
      console.error('建立聊天室錯誤:', error);
    }
  };

  const fetchMessages = async () => {
    if (!roomId) return;

    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      const response = await fetch(`/api/community/messages/${roomId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('取得訊息失敗');
      }

      const data = await response.json();
      setMessages(data.messages);
    } catch (error) {
      console.error('取得訊息錯誤:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFriendStatus = async () => {
    if (!friendId) return;

    try {
      const token = localStorage.getItem('token');

      const response = await fetch(`/api/community/status?userId=${friendId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) return;

      const data = await response.json();
      if (data.location) {
        setFriendStatus(`@ ${data.location}`);
      } else if (data.status === 'in class') {
        setFriendStatus(data.courseName || '上課中');
      } else {
        setFriendStatus('無課程');
      }
    } catch (error) {
      console.error('取得好友狀態錯誤:', error);
    }
  };

  const handleSend = async () => {
    if (!newMessage.trim() || !roomId || sending) return;

    const messageContent = newMessage.trim();
    setNewMessage('');

    try {
      setSending(true);
      const token = localStorage.getItem('token');

      const response = await fetch(`/api/community/messages/${roomId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content: messageContent }),
      });

      if (!response.ok) {
        throw new Error('發送訊息失敗');
      }

      const data = await response.json();
      setMessages((prev) => {
        // 避免重複添加（可能 Pusher 已經先收到）
        if (prev.some((m) => m.id === data.message.id)) {
          return prev;
        }
        return [...prev, data.message];
      });
    } catch (error) {
      console.error('發送訊息錯誤:', error);
      setNewMessage(messageContent); // 恢復訊息
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('zh-TW', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* 頂部 - 對方資訊 */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          p: 2,
          borderBottom: '1px solid #e0e4e8',
          bgcolor: '#ffffff',
        }}
      >
        <Avatar
          src={avatar}
          sx={{
            bgcolor: '#0F4C75',
            width: 44,
            height: 44,
            mr: 2,
            cursor: friendId ? 'pointer' : 'default',
            '&:hover': friendId ? {
              opacity: 0.8,
            } : {},
          }}
          onClick={() => friendId && onViewProfile?.(friendId)}
        >
          {name?.[0]?.toUpperCase()}
        </Avatar>
        <Box sx={{ flex: 1 }}>
          <Typography 
            sx={{ 
              fontWeight: 600, 
              color: '#1a1a2e',
              cursor: friendId ? 'pointer' : 'default',
              '&:hover': friendId ? {
                textDecoration: 'underline',
              } : {},
            }}
            onClick={() => friendId && onViewProfile?.(friendId)}
          >
            {name}
          </Typography>
          {friendStatus && (
            <Typography
              variant="body2"
              sx={{
                color: friendStatus === '無課程' ? '#9e9e9e' : '#2e7d32',
                fontSize: '0.8rem',
              }}
            >
              狀態：{friendStatus}
            </Typography>
          )}
        </Box>
        <IconButton onClick={onClose} sx={{ color: '#757575' }}>
          <CloseIcon />
        </IconButton>
      </Box>

      {/* 訊息區域 */}
      <Box
        sx={{
          flex: 1,
          overflow: 'auto',
          p: 2,
          bgcolor: '#f5f7fa',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress size={24} />
          </Box>
        ) : messages.length === 0 ? (
          <Box
            sx={{
              flex: 1,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <Typography color="text.secondary" variant="body2">
              開始對話吧！
            </Typography>
          </Box>
        ) : (
          <>
            {messages.map((message, index) => {
              const showAvatar =
                !message.isOwn &&
                (index === 0 || messages[index - 1]?.isOwn);

              return (
                <Box
                  key={`${message.id}-${index}`}
                  sx={{
                    display: 'flex',
                    justifyContent: message.isOwn ? 'flex-end' : 'flex-start',
                    mb: 1,
                    alignItems: 'flex-end',
                  }}
                >
                  {!message.isOwn && (
                    <Avatar
                      src={message.sender?.avatar || undefined}
                      sx={{
                        width: 32,
                        height: 32,
                        mr: 1,
                        bgcolor: '#0F4C75',
                        visibility: showAvatar ? 'visible' : 'hidden',
                      }}
                    >
                      {message.sender?.name?.[0]?.toUpperCase() || '?'}
                    </Avatar>
                  )}
                  <Box
                    sx={{
                      maxWidth: '70%',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: message.isOwn ? 'flex-end' : 'flex-start',
                    }}
                  >
                    <Box
                      sx={{
                        bgcolor: message.isOwn ? '#0F4C75' : '#ffffff',
                        color: message.isOwn ? '#ffffff' : '#1a1a2e',
                        px: 2,
                        py: 1,
                        borderRadius: 2,
                        borderTopRightRadius: message.isOwn ? 0 : 2,
                        borderTopLeftRadius: message.isOwn ? 2 : 0,
                        boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                      }}
                    >
                      <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                        {message.content}
                      </Typography>
                    </Box>
                    <Typography
                      variant="caption"
                      sx={{ color: '#9e9e9e', mt: 0.5, px: 0.5 }}
                    >
                      {formatTime(message.createdAt)}
                    </Typography>
                  </Box>
                </Box>
              );
            })}
            <div ref={messagesEndRef} />
          </>
        )}
      </Box>

      {/* 輸入區域 */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          p: 2,
          borderTop: '1px solid #e0e4e8',
          bgcolor: '#ffffff',
          gap: 1,
        }}
      >
        <TextField
          fullWidth
          multiline
          maxRows={4}
          placeholder="輸入訊息..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={sending || !roomId}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: 3,
              bgcolor: '#f5f7fa',
              '& fieldset': {
                borderColor: 'transparent',
              },
              '&:hover fieldset': {
                borderColor: '#e0e4e8',
              },
              '&.Mui-focused fieldset': {
                borderColor: '#0F4C75',
              },
            },
          }}
        />
        <IconButton
          onClick={handleSend}
          disabled={!newMessage.trim() || sending || !roomId}
          sx={{
            bgcolor: '#0F4C75',
            color: '#ffffff',
            width: 44,
            height: 44,
            '&:hover': {
              bgcolor: '#0a3a5a',
            },
            '&:disabled': {
              bgcolor: '#e0e4e8',
              color: '#9e9e9e',
            },
          }}
        >
          {sending ? <CircularProgress size={20} sx={{ color: '#ffffff' }} /> : <SendIcon />}
        </IconButton>
      </Box>
    </Box>
  );
}

