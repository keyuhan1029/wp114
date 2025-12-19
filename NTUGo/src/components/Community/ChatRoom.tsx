'use client';

import * as React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Avatar from '@mui/material/Avatar';
import AvatarGroup from '@mui/material/AvatarGroup';
import IconButton from '@mui/material/IconButton';
import CircularProgress from '@mui/material/CircularProgress';
import Tooltip from '@mui/material/Tooltip';
import CloseIcon from '@mui/icons-material/Close';
import SendIcon from '@mui/icons-material/Send';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import DoneIcon from '@mui/icons-material/Done';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import ImageIcon from '@mui/icons-material/Image';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import DownloadIcon from '@mui/icons-material/Download';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import { useChatRoomMessages } from '@/contexts/PusherContext';
import GroupMembersModal from './GroupMembersModal';

interface FileInfo {
  url: string;
  name: string;
  size: number;
  mimeType: string;
  width?: number;
  height?: number;
}

interface Message {
  id: string;
  senderId: string;
  sender?: {
    id: string;
    userId?: string | null;
    name?: string | null;
    avatar?: string | null;
  } | null;
  type?: 'text' | 'image' | 'file';
  content: string;
  file?: FileInfo | null;
  createdAt: string;
  isOwn: boolean;
  readBy?: string[];
}

interface ChatRoomProps {
  roomId: string;
  friendId?: string;
  name: string;
  avatar?: string;
  type?: 'private' | 'group' | 'ai';
  memberCount?: number;
  onClose: () => void;
  onRoomCreated?: (roomId: string) => void;
  onViewProfile?: (userId: string) => void;
}

export default function ChatRoom({
  roomId: initialRoomId,
  friendId,
  name,
  avatar,
  type = 'private',
  memberCount,
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
  const [currentUserName, setCurrentUserName] = React.useState<string | null>(null);
  const [uploading, setUploading] = React.useState(false);
  const [groupMembers, setGroupMembers] = React.useState<Array<{
    id: string;
    name?: string | null;
    avatar?: string | null;
  }>>([]);
  const [currentMemberCount, setCurrentMemberCount] = React.useState(memberCount || 0);
  const [groupMembersModalOpen, setGroupMembersModalOpen] = React.useState(false);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const messageInputRef = React.useRef<HTMLTextAreaElement>(null);

  // 當 initialRoomId prop 變化時，同步更新 roomId 狀態並清除訊息
  React.useEffect(() => {
    if (initialRoomId !== roomId) {
      setRoomId(initialRoomId);
      setMessages([]); // 清除舊訊息
      setLoading(true); // 重置 loading 狀態
      setNewMessage(''); // 清除輸入框
      setFriendStatus(''); // 清除好友狀態
    }
  }, [initialRoomId]);

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
          setCurrentUserName(data.user.name || data.user.userId || data.user.email || null);
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
          type: data.type || 'text',
          content: data.content,
          file: data.file || null,
          createdAt: data.createdAt,
          isOwn: false, // 來自 Pusher 的是對方的訊息
          readBy: [data.senderId], // 發送者自動已讀
        },
      ];
    });
  }, [currentUserId]);

  // Pusher 已讀狀態更新
  const handleMessageRead = React.useCallback((data: { readerId: string; readerName?: string; readAt: string }) => {
    // 當對方閱讀訊息時，更新所有自己發送的訊息的已讀狀態
    if (currentUserId && data.readerId !== currentUserId) {
      setMessages((prev) =>
        prev.map((msg) => {
          // 只更新自己發送的訊息
          if (msg.isOwn && !msg.readBy?.includes(data.readerId)) {
            return {
              ...msg,
              readBy: [...(msg.readBy || []), data.readerId],
            };
          }
          return msg;
        })
      );
    }
  }, [currentUserId]);

  // 只在非 AI 类型时订阅 Pusher
  useChatRoomMessages(type !== 'ai' ? (roomId || null) : null, handleNewMessage, handleMessageRead);

  React.useEffect(() => {
    if (type === 'ai') {
      // AI 客服模式：添加预设欢迎消息
      const welcomeMessage: Message = {
        id: 'welcome-ai-' + Date.now(),
        senderId: 'ntu-ai-support',
        sender: {
          id: 'ntu-ai-support',
          name: 'NTU AI 客服',
          avatar: null,
        },
        type: 'text',
        content: currentUserName 
          ? `您好，${currentUserName}！歡迎使用 NTU AI 客服，我是您的智能助手，隨時為您提供協助。有什麼問題都可以問我哦！😊`
          : '您好！歡迎使用 NTU AI 客服，我是您的智能助手，隨時為您提供協助。有什麼問題都可以問我哦！😊',
        file: null,
        createdAt: new Date().toISOString(),
        isOwn: false,
        readBy: [],
      };
      setMessages([welcomeMessage]);
      setLoading(false);
    } else if (roomId) {
      fetchMessages();
    } else if (friendId) {
      // 如果沒有 roomId 但有 friendId，建立或取得聊天室
      createOrGetRoom();
    }
  }, [roomId, friendId, type, currentUserName]);

  React.useEffect(() => {
    if (friendId) {
      fetchFriendStatus();
    }
  }, [friendId]);

  // 取得群組成員資訊（用於顯示頭像）
  React.useEffect(() => {
    if (type === 'group' && roomId) {
      fetchGroupMembers();
    }
  }, [type, roomId]);

  const fetchGroupMembers = async () => {
    if (!roomId) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/community/chatrooms/${roomId}/members`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        // 過濾掉自己
        const otherMembers = data.members.filter(
          (m: any) => m.id !== currentUserId
        );
        setGroupMembers(otherMembers);
        setCurrentMemberCount(data.memberCount);
      }
    } catch (error) {
      console.error('取得群組成員錯誤:', error);
    }
  };

  const handleMembersAdded = (addedCount: number, newMemberCount: number) => {
    setCurrentMemberCount(newMemberCount);
    fetchGroupMembers(); // 重新取得成員列表
  };

  React.useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 自動聚焦輸入框
  React.useEffect(() => {
    // 當聊天室 ID 變化或組件載入時，自動聚焦輸入框
    if (roomId && !loading) {
      // 使用 setTimeout 確保 DOM 已完全渲染
      const timer = setTimeout(() => {
        if (messageInputRef.current) {
          messageInputRef.current.focus();
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [roomId, loading]);

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
    if (!newMessage.trim() || sending) return;
    
    // AI 客服模式：暂时禁用发送，稍后接入 API
    if (type === 'ai') {
      console.log('AI 客服消息发送功能待接入 OpenAI API:', newMessage.trim());
      // TODO: 接入 OpenAI API
      setNewMessage('');
      return;
    }

    if (!roomId) return;

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
      // 發送訊息後重新聚焦輸入框
      setTimeout(() => {
        if (messageInputRef.current) {
          messageInputRef.current.focus();
        }
      }, 50);
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

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !roomId || uploading) return;

    try {
      setUploading(true);
      const token = localStorage.getItem('token');

      // 上傳檔案
      const formData = new FormData();
      formData.append('file', file);

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
      const uploadedFile = uploadData.file;

      // 發送檔案訊息
      const messageType = uploadedFile.type === 'image' ? 'image' : 'file';
      const response = await fetch(`/api/community/messages/${roomId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          content: uploadedFile.name,
          type: messageType,
          file: {
            url: uploadedFile.url,
            name: uploadedFile.name,
            size: uploadedFile.size,
            mimeType: uploadedFile.mimeType,
            width: uploadedFile.width,
            height: uploadedFile.height,
          },
        }),
      });

      if (!response.ok) {
        throw new Error('發送檔案訊息失敗');
      }

      const data = await response.json();
      setMessages((prev) => {
        if (prev.some((m) => m.id === data.message.id)) {
          return prev;
        }
        return [...prev, data.message];
      });
      // 上傳檔案後重新聚焦輸入框
      setTimeout(() => {
        if (messageInputRef.current) {
          messageInputRef.current.focus();
        }
      }, 50);
    } catch (error: any) {
      console.error('檔案上傳錯誤:', error);
      alert(error.message || '檔案上傳失敗');
    } finally {
      setUploading(false);
      // 清空 input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
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
        {/* 頭像區域 */}
        {type === 'ai' ? (
          <Avatar
            sx={{
              bgcolor: '#0F4C75',
              width: 44,
              height: 44,
              mr: 2,
            }}
          >
            <SmartToyIcon sx={{ color: '#ffffff' }} />
          </Avatar>
        ) : type === 'group' ? (
          <AvatarGroup
            max={2}
            total={currentMemberCount - 1} // 不包含自己，正確顯示 +X
            sx={{
              mr: 2,
              '& .MuiAvatar-root': {
                width: 32,
                height: 32,
                fontSize: '0.85rem',
                border: '2px solid #fff',
              },
            }}
            slotProps={{
              additionalAvatar: {
                sx: {
                  bgcolor: '#9c27b0',
                  fontSize: '0.75rem',
                  width: 32,
                  height: 32,
                },
              },
            }}
          >
            {groupMembers.slice(0, 2).map((member) => (
              <Avatar
                key={member.id}
                src={member.avatar || undefined}
                sx={{ bgcolor: '#9c27b0' }}
              >
                {member.name?.[0]?.toUpperCase() || '?'}
              </Avatar>
            ))}
          </AvatarGroup>
        ) : (
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
        )}
        <Box sx={{ flex: 1 }}>
          <Typography 
            sx={{ 
              fontWeight: 600, 
              color: '#1a1a2e',
              cursor: type === 'group' || friendId ? 'pointer' : 'default',
              '&:hover': (type === 'group' || friendId) ? {
                textDecoration: 'underline',
              } : {},
            }}
            onClick={() => {
              if (type === 'group') {
                setGroupMembersModalOpen(true);
              } else if (friendId) {
                onViewProfile?.(friendId);
              }
            }}
          >
            {name}
            {type === 'group' && currentMemberCount > 0 && (
              <Typography component="span" sx={{ color: '#9e9e9e', fontWeight: 400, ml: 1, fontSize: '0.9rem' }}>
                ({currentMemberCount} 位成員)
              </Typography>
            )}
          </Typography>
          {type === 'ai' && (
            <Typography
              variant="body2"
              sx={{
                color: '#9e9e9e',
                fontSize: '0.85rem',
              }}
            >
              AI 智能助手
            </Typography>
          )}
          {type === 'private' && friendStatus && (
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
          {type === 'group' && (
            <Typography
              variant="body2"
              sx={{
                color: '#9e9e9e',
                fontSize: '0.8rem',
              }}
            >
              群組聊天
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
              // 群組聊天中，不同發送者要顯示各自的頭像
              const prevMessage = index > 0 ? messages[index - 1] : null;
              const showAvatar =
                !message.isOwn &&
                (index === 0 || 
                 prevMessage?.isOwn || 
                 prevMessage?.senderId !== message.senderId);

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
                    {/* 群組聊天中顯示發送者名稱 */}
                    {type === 'group' && showAvatar && !message.isOwn && (
                      <Typography
                        variant="caption"
                        sx={{
                          color: '#757575',
                          mb: 0.5,
                          ml: 0.5,
                          fontWeight: 500,
                        }}
                      >
                        {message.sender?.name || '未知用戶'}
                      </Typography>
                    )}
                    <Box
                      sx={{
                        bgcolor: message.isOwn ? '#0F4C75' : '#ffffff',
                        color: message.isOwn ? '#ffffff' : '#1a1a2e',
                        px: message.type === 'image' ? 0.5 : 2,
                        py: message.type === 'image' ? 0.5 : 1,
                        borderRadius: 2,
                        borderTopRightRadius: message.isOwn ? 0 : 2,
                        borderTopLeftRadius: message.isOwn ? 2 : 0,
                        boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                        overflow: 'hidden',
                      }}
                    >
                      {/* 圖片訊息 */}
                      {message.type === 'image' && message.file?.url ? (
                        <Box
                          component="a"
                          href={message.file.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          sx={{ display: 'block' }}
                        >
                          <Box
                            component="img"
                            src={message.file.url}
                            alt={message.file.name}
                            sx={{
                              maxWidth: 250,
                              maxHeight: 250,
                              borderRadius: 1.5,
                              display: 'block',
                              cursor: 'pointer',
                            }}
                          />
                        </Box>
                      ) : message.type === 'file' && message.file?.url ? (
                        /* 檔案訊息 */
                        <Box
                          component="a"
                          href={message.file.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          download={message.file.name}
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                            textDecoration: 'none',
                            color: 'inherit',
                            minWidth: 200,
                          }}
                        >
                          <InsertDriveFileIcon sx={{ fontSize: 36, opacity: 0.8 }} />
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography
                              variant="body2"
                              sx={{
                                fontWeight: 500,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {message.file.name}
                            </Typography>
                            <Typography
                              variant="caption"
                              sx={{ opacity: 0.7 }}
                            >
                              {formatFileSize(message.file.size)}
                            </Typography>
                          </Box>
                          <DownloadIcon sx={{ fontSize: 20, opacity: 0.6 }} />
                        </Box>
                      ) : (
                        /* 文字訊息 */
                        <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                          {message.content}
                        </Typography>
                      )}
                    </Box>
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.5,
                        mt: 0.5,
                        px: 0.5,
                      }}
                    >
                      <Typography
                        variant="caption"
                        sx={{ color: '#9e9e9e' }}
                      >
                        {formatTime(message.createdAt)}
                      </Typography>
                      {/* 已讀狀態指示器 - 只顯示在自己發送的訊息 */}
                      {message.isOwn && (
                        friendId && message.readBy && message.readBy.includes(friendId) ? (
                          <DoneAllIcon sx={{ fontSize: 14, color: '#4caf50' }} />
                        ) : (
                          <DoneIcon sx={{ fontSize: 14, color: '#9e9e9e' }} />
                        )
                      )}
                    </Box>
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
        {/* 隱藏的檔案輸入 */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
          style={{ display: 'none' }}
        />
        
        {/* 附件按鈕 */}
        <IconButton
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading || !roomId}
          sx={{
            color: '#757575',
            '&:hover': {
              bgcolor: '#f5f7fa',
            },
          }}
        >
          {uploading ? <CircularProgress size={20} /> : <AttachFileIcon />}
        </IconButton>
        
        <TextField
          inputRef={messageInputRef}
          fullWidth
          multiline
          maxRows={4}
          placeholder="輸入訊息..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={sending || uploading || !roomId}
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
          disabled={!newMessage.trim() || sending || uploading || !roomId}
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

      {/* 群組成員 Modal */}
      {type === 'group' && roomId && (
        <GroupMembersModal
          open={groupMembersModalOpen}
          onClose={() => setGroupMembersModalOpen(false)}
          roomId={roomId}
          currentUserId={currentUserId}
          onMembersAdded={handleMembersAdded}
          onViewProfile={onViewProfile}
        />
      )}
    </Box>
  );
}

