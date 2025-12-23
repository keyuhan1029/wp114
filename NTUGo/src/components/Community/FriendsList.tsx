'use client';

import * as React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import Avatar from '@mui/material/Avatar';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import ListItemText from '@mui/material/ListItemText';
import CircularProgress from '@mui/material/CircularProgress';
import SearchIcon from '@mui/icons-material/Search';
import Chip from '@mui/material/Chip';

interface Friend {
  id: string;
  friendshipId: string;
  userId?: string | null;
  name?: string | null;
  avatar?: string | null;
  department?: string | null;
  lastSeen?: string | null;
  status?: {
    status: string;
    location?: string | null;
    courseName?: string | null;
  };
}

// 判斷用戶是否在線（30 秒內有心跳）
function isUserOnline(lastSeen?: string | null): boolean {
  if (!lastSeen) return false;
  const now = new Date();
  const diff = now.getTime() - new Date(lastSeen).getTime();
  return diff < 30000; // 30 秒
}

interface FriendsListProps {
  onSelectFriend: (friend: Friend) => void;
  onViewProfile?: (userId: string) => void;
}

export default function FriendsList({ onSelectFriend, onViewProfile }: FriendsListProps) {
  const [friends, setFriends] = React.useState<Friend[]>([]);
  const [filteredFriends, setFilteredFriends] = React.useState<Friend[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [searchQuery, setSearchQuery] = React.useState('');

  React.useEffect(() => {
    fetchFriends();
  }, []);

  React.useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredFriends(friends);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredFriends(
        friends.filter(
          (friend) =>
            friend.name?.toLowerCase().includes(query) ||
            friend.userId?.toLowerCase().includes(query) ||
            friend.department?.toLowerCase().includes(query)
        )
      );
    }
  }, [searchQuery, friends]);

  const fetchFriends = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      const response = await fetch('/api/community/friends', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('取得好友列表失敗');
      }

      const data = await response.json();
      const friendsList = data.friends.map((f: any) => ({
        id: f.friend.id,
        friendshipId: f.friendshipId,
        userId: f.friend.userId,
        name: f.friend.name,
        avatar: f.friend.avatar,
        department: f.friend.department,
        lastSeen: f.friend.lastSeen,
      }));

      // 取得好友狀態
      if (friendsList.length > 0) {
        const statusResponse = await fetch('/api/community/status', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            userIds: friendsList.map((f: Friend) => f.id),
          }),
        });

        if (statusResponse.ok) {
          const statusData = await statusResponse.json();
          friendsList.forEach((friend: Friend) => {
            friend.status = statusData.statuses[friend.id] || {
              status: 'no class',
              location: null,
            };
          });
        }
      }

      setFriends(friendsList);
      setFilteredFriends(friendsList);
    } catch (error) {
      console.error('取得好友列表錯誤:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusText = (friend: Friend) => {
    if (!friend.status) return '無課程';
    if (friend.status.location) {
      return `@ ${friend.status.location}`;
    }
    return friend.status.status === 'in class'
      ? friend.status.courseName || '上課中'
      : '無課程';
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* 標題 */}
      <Box sx={{ p: 2, pb: 1 }}>
        <Typography variant="h6" sx={{ fontWeight: 600, color: '#1a1a2e', mb: 1.5 }}>
          好友列表
        </Typography>

        {/* 搜尋欄 */}
        <TextField
          fullWidth
          size="small"
          placeholder="搜尋好友..."
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

      {/* 好友列表 */}
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress size={24} />
          </Box>
        ) : filteredFriends.length === 0 ? (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography color="text.secondary" variant="body2">
              {searchQuery ? '找不到符合的好友' : '還沒有好友'}
            </Typography>
          </Box>
        ) : (
          <List sx={{ py: 0 }}>
            {filteredFriends.map((friend) => (
              <ListItem key={friend.id} disablePadding>
                <ListItemButton
                  onClick={() => onSelectFriend(friend)}
                  sx={{
                    py: 1.5,
                    px: 2,
                    '&:hover': {
                      bgcolor: '#f5f7fa',
                    },
                  }}
                >
                  <ListItemAvatar>
                    <Box sx={{ position: 'relative' }}>
                      <Avatar
                        src={friend.avatar || undefined}
                        sx={{
                          bgcolor: '#0F4C75',
                          width: 44,
                          height: 44,
                          cursor: 'pointer',
                          '&:hover': {
                            opacity: 0.8,
                          },
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          onViewProfile?.(friend.id);
                        }}
                      >
                        {(friend.name || friend.userId)?.[0]?.toUpperCase()}
                      </Avatar>
                      {/* 線上狀態指示器 */}
                      <Box
                        sx={{
                          position: 'absolute',
                          bottom: 2,
                          right: 2,
                          width: 12,
                          height: 12,
                          borderRadius: '50%',
                          bgcolor: isUserOnline(friend.lastSeen) ? '#4caf50' : '#bdbdbd',
                          border: '2px solid #fff',
                        }}
                      />
                    </Box>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography 
                          sx={{ 
                            fontWeight: 500,
                            cursor: 'pointer',
                            '&:hover': {
                              textDecoration: 'underline',
                            },
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            onViewProfile?.(friend.id);
                          }}
                        >
                          {friend.name || friend.userId || '用戶'}
                        </Typography>
                        {friend.department && (
                          <Chip
                            label={friend.department}
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
                    }
                    secondary={
                      <Typography
                        variant="body2"
                        sx={{
                          color:
                            friend.status?.status === 'in class'
                              ? '#2e7d32'
                              : '#9e9e9e',
                          fontSize: '0.8rem',
                        }}
                      >
                        狀態：{getStatusText(friend)}
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

