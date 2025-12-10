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
import SearchIcon from '@mui/icons-material/Search';

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
  type: 'private' | 'group';
  name: string;
  avatar?: string;
  friendId?: string;
}

interface MessageListProps {
  onSelectChat: (chat: SelectedChat) => void;
}

export default function MessageList({ onSelectChat }: MessageListProps) {
  const [chatRooms, setChatRooms] = React.useState<ChatRoom[]>([]);
  const [filteredRooms, setFilteredRooms] = React.useState<ChatRoom[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [searchQuery, setSearchQuery] = React.useState('');

  React.useEffect(() => {
    fetchChatRooms();
  }, []);

  React.useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredRooms(chatRooms);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredRooms(
        chatRooms.filter((room) => room.name.toLowerCase().includes(query))
      );
    }
  }, [searchQuery, chatRooms]);

  const fetchChatRooms = async () => {
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
  };

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
        <Typography variant="h6" sx={{ fontWeight: 600, color: '#1a1a2e', mb: 1.5 }}>
          訊息
        </Typography>

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
        ) : filteredRooms.length === 0 ? (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography color="text.secondary" variant="body2">
              {searchQuery ? '找不到符合的對話' : '還沒有對話'}
            </Typography>
          </Box>
        ) : (
          <List sx={{ py: 0 }}>
            {filteredRooms.map((room) => (
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
                      <AvatarGroup max={2} sx={{ width: 44, justifyContent: 'flex-start' }}>
                        {room.members.slice(0, 2).map((member, idx) => (
                          <Avatar
                            key={member.id || idx}
                            src={member.avatar || undefined}
                            sx={{
                              bgcolor: '#0F4C75',
                              width: 32,
                              height: 32,
                              fontSize: '0.8rem',
                            }}
                          >
                            {(member.name || member.userId)?.[0]?.toUpperCase()}
                          </Avatar>
                        ))}
                      </AvatarGroup>
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
            ))}
          </List>
        )}
      </Box>
    </Box>
  );
}

