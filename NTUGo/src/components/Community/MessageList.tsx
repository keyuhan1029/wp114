'use client';

import * as React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import Avatar from '@mui/material/Avatar';
import AvatarGroup from '@mui/material/AvatarGroup';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import ListItemText from '@mui/material/ListItemText';
import CircularProgress from '@mui/material/CircularProgress';
import Badge from '@mui/material/Badge';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import SearchIcon from '@mui/icons-material/Search';
import GroupAddIcon from '@mui/icons-material/GroupAdd';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import Chip from '@mui/material/Chip';
import { useUserNotifications } from '@/contexts/PusherContext';

interface ChatRoom {
  id: string;
  type: 'private' | 'group';
  name: string;
  members: Array<{
    id: string;
    userId?: string | null;
    name?: string | null;
    avatar?: string | null;
  }>;
  memberCount: number;
  lastMessage?: string | null;
  lastMessageAt: string;
  unreadCount: number;
}

interface SelectedChat {
  roomId: string;
  type: 'private' | 'group' | 'ai';
  name: string;
  avatar?: string;
  friendId?: string;
}

interface MessageListProps {
  onSelectChat: (chat: SelectedChat) => void;
  selectedRoomId?: string | null;
  onCreateGroup?: () => void;
}

export default function MessageList({ onSelectChat, selectedRoomId, onCreateGroup }: MessageListProps) {
  const [chatRooms, setChatRooms] = React.useState<ChatRoom[]>([]);
  const [filteredRooms, setFilteredRooms] = React.useState<ChatRoom[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [currentUserId, setCurrentUserId] = React.useState<string | null>(null);

  // 獲取聊天室列表
  const fetchChatRooms = React.useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      const response = await fetch('/api/community/chatrooms', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('取得聊天室列表失敗');
      }

      const data = await response.json();
      setChatRooms(data.chatRooms);
      setFilteredRooms(data.chatRooms);
    } catch (error) {
      console.error('取得聊天室列表錯誤:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // 獲取當前用戶 ID
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

  // 處理即時訊息更新
  const handleChatUpdate = React.useCallback((data: {
    roomId: string;
    lastMessage: string;
    lastMessageAt: string;
    senderId: string;
    senderName?: string;
  }) => {
    setChatRooms((prev) => {
      const roomIndex = prev.findIndex((room) => room.id === data.roomId);
      
      if (roomIndex === -1) {
        // 如果聊天室不存在，重新獲取列表
        fetchChatRooms();
        return prev;
      }

      const updatedRooms = [...prev];
      const room = updatedRooms[roomIndex];
      
      // 更新訊息預覽和時間
      updatedRooms[roomIndex] = {
        ...room,
        lastMessage: data.lastMessage,
        lastMessageAt: data.lastMessageAt,
        // 如果不是當前選中的聊天室，增加未讀數
        unreadCount: selectedRoomId === data.roomId ? 0 : room.unreadCount + 1,
      };

      // 將有新訊息的聊天室移到最前面
      const [updatedRoom] = updatedRooms.splice(roomIndex, 1);
      updatedRooms.unshift(updatedRoom);

      return updatedRooms;
    });
  }, [selectedRoomId, fetchChatRooms]);

  // 訂閱即時更新
  useUserNotifications(currentUserId, {
    onChatUpdate: handleChatUpdate,
  });

  React.useEffect(() => {
    fetchChatRooms();
  }, [fetchChatRooms]);

  React.useEffect(() => {
    // 只顯示有訊息的聊天室
    const roomsWithMessages = chatRooms.filter((room) => room.lastMessage);
    
    if (searchQuery.trim() === '') {
      setFilteredRooms(roomsWithMessages);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredRooms(
        roomsWithMessages.filter((room) => room.name.toLowerCase().includes(query))
      );
    }
  }, [searchQuery, chatRooms]);

  // 當選擇聊天室時，將該聊天室的未讀數設為 0
  React.useEffect(() => {
    if (selectedRoomId) {
      setChatRooms((prev) =>
        prev.map((room) =>
          room.id === selectedRoomId ? { ...room, unreadCount: 0 } : room
        )
      );
    }
  }, [selectedRoomId]);

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return date.toLocaleTimeString('zh-TW', {
        hour: '2-digit',
        minute: '2-digit',
      });
    } else if (days === 1) {
      return '昨天';
    } else if (days < 7) {
      return `${days} 天前`;
    } else {
      return date.toLocaleDateString('zh-TW', {
        month: 'short',
        day: 'numeric',
      });
    }
  };

  const handleSelectRoom = (room: ChatRoom) => {
    const avatar = room.type === 'private' && room.members.length > 0
      ? room.members[0]?.avatar || undefined
      : undefined;
    
    const friendId = room.type === 'private' && room.members.length > 0
      ? room.members[0]?.id
      : undefined;

    onSelectChat({
      roomId: room.id,
      type: room.type,
      name: room.name,
      avatar,
      friendId,
    });
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* 標題 */}
      <Box sx={{ p: 2, pb: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, color: '#1a1a2e' }}>
            訊息
          </Typography>
          {onCreateGroup && (
            <Tooltip title="建立群組">
              <IconButton
                onClick={onCreateGroup}
                size="small"
                sx={{
                  color: '#0F4C75',
                  '&:hover': {
                    bgcolor: '#e3f2fd',
                  },
                }}
              >
                <GroupAddIcon />
              </IconButton>
            </Tooltip>
          )}
        </Box>

        {/* 搜尋欄 */}
        <TextField
          fullWidth
          size="small"
          placeholder="搜尋對話..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: '#9e9e9e' }} />
              </InputAdornment>
            ),
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: 2,
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
      </Box>

      {/* 聊天室列表 */}
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress size={24} />
          </Box>
        ) : (
          <List sx={{ py: 0 }}>
            {/* NTU AI 客服 - 固定在列表顶部，始终显示 */}
            {(!searchQuery || 'NTU AI 客服'.toLowerCase().includes(searchQuery.toLowerCase())) && (
              <ListItem disablePadding>
                <ListItemButton
                  onClick={() => {
                    onSelectChat({
                      roomId: 'ntu-ai-support',
                      type: 'ai',
                      name: 'NTU AI 客服',
                    });
                  }}
                  selected={selectedRoomId === 'ntu-ai-support'}
                  sx={{
                    py: 1.5,
                    px: 2,
                    bgcolor: selectedRoomId === 'ntu-ai-support' ? '#e3f2fd' : 'transparent',
                    '&:hover': {
                      bgcolor: '#f5f7fa',
                    },
                    '&.Mui-selected': {
                      bgcolor: '#e3f2fd',
                      '&:hover': {
                        bgcolor: '#e3f2fd',
                      },
                    },
                  }}
                >
                  <ListItemAvatar>
                    <Avatar
                      sx={{
                        bgcolor: '#0F4C75',
                        width: 44,
                        height: 44,
                      }}
                    >
                      <SmartToyIcon sx={{ color: '#ffffff' }} />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography
                            sx={{
                              fontWeight: 600,
                              color: '#1a1a2e',
                            }}
                          >
                            NTU AI 客服
                          </Typography>
                          <Chip
                            label="AI"
                            size="small"
                            sx={{
                              height: 18,
                              fontSize: '0.65rem',
                              bgcolor: '#0F4C75',
                              color: '#ffffff',
                              fontWeight: 600,
                            }}
                          />
                        </Box>
                      </Box>
                    }
                    secondary={
                      <Typography
                        variant="body2"
                        sx={{
                          color: '#9e9e9e',
                          fontSize: '0.8rem',
                        }}
                      >
                        隨時為您提供協助
                      </Typography>
                    }
                  />
                </ListItemButton>
              </ListItem>
            )}
            
            {filteredRooms.length === 0 ? (
              (!searchQuery || !'NTU AI 客服'.toLowerCase().includes(searchQuery.toLowerCase())) && (
                <Box sx={{ p: 3, textAlign: 'center' }}>
                  <Typography color="text.secondary" variant="body2">
                    {searchQuery ? '找不到符合的對話' : '還沒有對話'}
                  </Typography>
                </Box>
              )
            ) : (
              filteredRooms.map((room) => (
              <ListItem key={room.id} disablePadding>
                <ListItemButton
                  onClick={() => handleSelectRoom(room)}
                  sx={{
                    py: 1.5,
                    px: 2,
                    '&:hover': {
                      bgcolor: '#f5f7fa',
                    },
                  }}
                >
                  <ListItemAvatar>
                    {room.type === 'group' ? (
                      <Box sx={{ display: 'flex', alignItems: 'center', width: 44 }}>
                        <AvatarGroup
                          max={2}
                          sx={{
                            '& .MuiAvatar-root': {
                              width: 28,
                              height: 28,
                              fontSize: '0.75rem',
                              border: '2px solid #fff',
                            },
                            '& .MuiAvatarGroup-avatar': {
                              bgcolor: '#757575',
                              fontSize: '0.65rem',
                            },
                          }}
                          slotProps={{
                            additionalAvatar: {
                              sx: {
                                width: 28,
                                height: 28,
                                bgcolor: '#9c27b0',
                                fontSize: '0.65rem',
                              },
                            },
                          }}
                          total={room.memberCount - 1} // 不包含自己
                        >
                          {room.members.slice(0, 2).map((member, idx) => (
                            <Avatar
                              key={member.id || idx}
                              src={member.avatar || undefined}
                              sx={{ bgcolor: '#9c27b0' }}
                            >
                              {(member.name || member.userId)?.[0]?.toUpperCase()}
                            </Avatar>
                          ))}
                        </AvatarGroup>
                      </Box>
                    ) : (
                      <Badge
                        badgeContent={room.unreadCount}
                        color="error"
                        overlap="circular"
                        invisible={room.unreadCount === 0}
                      >
                        <Avatar
                          src={room.members[0]?.avatar || undefined}
                          sx={{
                            bgcolor: '#0F4C75',
                            width: 44,
                            height: 44,
                          }}
                        >
                          {(room.members[0]?.name || room.members[0]?.userId || room.name)?.[0]?.toUpperCase()}
                        </Avatar>
                      </Badge>
                    )}
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}
                      >
                        <Typography
                          sx={{
                            fontWeight: room.unreadCount > 0 ? 600 : 500,
                            color: '#1a1a2e',
                          }}
                        >
                          {room.type === 'group'
                            ? `${room.name} (${room.memberCount})`
                            : room.name}
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{ color: '#9e9e9e', ml: 1 }}
                        >
                          {formatTime(room.lastMessageAt)}
                        </Typography>
                      </Box>
                    }
                    secondary={
                      <Typography
                        variant="body2"
                        sx={{
                          color: room.unreadCount > 0 ? '#1a1a2e' : '#9e9e9e',
                          fontSize: '0.8rem',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          fontWeight: room.unreadCount > 0 ? 500 : 400,
                        }}
                      >
                        {room.lastMessage || '開始對話...'}
                      </Typography>
                    }
                  />
                </ListItemButton>
              </ListItem>
              ))
            )}
          </List>
        )}
      </Box>
    </Box>
  );
}

