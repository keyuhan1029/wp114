'use client';

import * as React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Chip from '@mui/material/Chip';
import SearchIcon from '@mui/icons-material/Search';

interface Suggestion {
  id: string;
  userId?: string | null;
  name?: string | null;
  avatar?: string | null;
  department?: string | null;
  requestSent?: boolean;
}

interface FriendSuggestionsProps {
  onRequestSent?: () => void;
  onViewProfile?: (userId: string) => void;
}

export default function FriendSuggestions({ onRequestSent, onViewProfile }: FriendSuggestionsProps) {
  const [suggestions, setSuggestions] = React.useState<Suggestion[]>([]);
  const [searchResults, setSearchResults] = React.useState<Suggestion[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [searching, setSearching] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [sendingIds, setSendingIds] = React.useState<Set<string>>(new Set());

  React.useEffect(() => {
    fetchSuggestions();
  }, []);

  const fetchSuggestions = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      const response = await fetch('/api/community/friends/suggestions?limit=10', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('取得推薦好友失敗');
      }

      const data = await response.json();
      setSuggestions(data.suggestions.map((s: any) => ({ ...s, requestSent: false })));
    } catch (error) {
      console.error('取得推薦好友錯誤:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (searchQuery.trim().length < 1) {
      setSearchResults([]);
      return;
    }

    try {
      setSearching(true);
      const token = localStorage.getItem('token');

      const response = await fetch(
        `/api/community/users/search?q=${encodeURIComponent(searchQuery.trim())}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('搜尋失敗');
      }

      const data = await response.json();
      setSearchResults(
        data.users.map((u: any) => ({
          ...u,
          requestSent: u.friendshipStatus === 'pending' && u.friendshipDirection === 'sent',
        }))
      );
    } catch (error) {
      console.error('搜尋錯誤:', error);
    } finally {
      setSearching(false);
    }
  };

  const handleSendRequest = async (userId: string) => {
    try {
      setSendingIds((prev) => new Set(prev).add(userId));
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
      setSuggestions((prev) =>
        prev.map((s) => (s.id === userId ? { ...s, requestSent: true } : s))
      );
      setSearchResults((prev) =>
        prev.map((s) => (s.id === userId ? { ...s, requestSent: true } : s))
      );
      onRequestSent?.();
    } catch (error: any) {
      console.error('發送好友請求錯誤:', error);
      alert(error.message || '發送好友請求失敗');
    } finally {
      setSendingIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    }
  };

  const displayList = searchQuery.trim() ? searchResults : suggestions;

  return (
    <Box>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          mb: 2,
          flexWrap: 'wrap',
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 600, color: '#1a1a2e' }}>
          你可能認識的人
        </Typography>

        {/* 搜尋欄 */}
        <TextField
          size="small"
          placeholder="搜尋用戶"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              handleSearch();
            }
          }}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                {searching ? (
                  <CircularProgress size={18} />
                ) : (
                  <SearchIcon
                    sx={{ color: '#9e9e9e', cursor: 'pointer' }}
                    onClick={handleSearch}
                  />
                )}
              </InputAdornment>
            ),
          }}
          sx={{
            width: 200,
            '& .MuiOutlinedInput-root': {
              borderRadius: 4,
              bgcolor: '#f5f7fa',
              '& fieldset': {
                borderColor: '#e0e4e8',
              },
              '&:hover fieldset': {
                borderColor: '#bdbdbd',
              },
              '&.Mui-focused fieldset': {
                borderColor: '#0F4C75',
              },
            },
          }}
        />
      </Box>

      {loading && !searchQuery ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress size={24} />
        </Box>
      ) : displayList.length === 0 ? (
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <Typography color="text.secondary" variant="body2">
            {searchQuery ? '找不到符合的用戶' : '目前沒有推薦的好友'}
          </Typography>
        </Box>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {displayList.map((user) => (
            <Box
              key={user.id}
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
                src={user.avatar || undefined}
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
                onClick={() => onViewProfile?.(user.id)}
              >
                {(user.name || user.userId)?.[0]?.toUpperCase()}
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
                    onClick={() => onViewProfile?.(user.id)}
                  >
                    {user.name || user.userId || '用戶'}
                  </Typography>
                  {user.department && (
                    <Chip
                      label={user.department}
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

              <Button
                variant={user.requestSent ? 'text' : 'outlined'}
                size="small"
                onClick={() => !user.requestSent && handleSendRequest(user.id)}
                disabled={user.requestSent || sendingIds.has(user.id)}
                sx={{
                  borderRadius: 4,
                  textTransform: 'none',
                  minWidth: 100,
                  ...(user.requestSent
                    ? {
                        color: '#9e9e9e',
                      }
                    : {
                        borderColor: '#0F4C75',
                        color: '#0F4C75',
                        '&:hover': {
                          borderColor: '#0a3a5a',
                          bgcolor: 'rgba(15, 76, 117, 0.04)',
                        },
                      }),
                }}
              >
                {sendingIds.has(user.id) ? (
                  <CircularProgress size={16} />
                ) : user.requestSent ? (
                  '已發送'
                ) : (
                  '發送請求'
                )}
              </Button>
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
}

