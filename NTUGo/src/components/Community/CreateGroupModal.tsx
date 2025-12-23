'use client';

import * as React from 'react';
import Box from '@mui/material/Box';
import Modal from '@mui/material/Modal';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import Divider from '@mui/material/Divider';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import ListItemText from '@mui/material/ListItemText';
import Avatar from '@mui/material/Avatar';
import Checkbox from '@mui/material/Checkbox';
import CircularProgress from '@mui/material/CircularProgress';
import Chip from '@mui/material/Chip';

interface Friend {
  id: string;
  userId?: string | null;
  name?: string | null;
  avatar?: string | null;
  department?: string | null;
}

interface CreateGroupModalProps {
  open: boolean;
  onClose: () => void;
  onGroupCreated?: (roomId: string, name: string) => void;
}

export default function CreateGroupModal({
  open,
  onClose,
  onGroupCreated,
}: CreateGroupModalProps) {
  const [groupName, setGroupName] = React.useState('');
  const [friends, setFriends] = React.useState<Friend[]>([]);
  const [selectedFriends, setSelectedFriends] = React.useState<string[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [creating, setCreating] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (open) {
      fetchFriends();
      setGroupName('');
      setSelectedFriends([]);
      setError(null);
    }
  }, [open]);

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
        userId: f.friend.userId,
        name: f.friend.name,
        avatar: f.friend.avatar,
        department: f.friend.department,
      }));

      setFriends(friendsList);
    } catch (err: any) {
      setError(err.message || '載入好友列表失敗');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFriend = (friendId: string) => {
    setSelectedFriends((prev) =>
      prev.includes(friendId)
        ? prev.filter((id) => id !== friendId)
        : [...prev, friendId]
    );
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      setError('請輸入群組名稱');
      return;
    }

    if (selectedFriends.length < 1) {
      setError('請至少選擇 1 位好友');
      return;
    }

    try {
      setCreating(true);
      setError(null);
      const token = localStorage.getItem('token');

      const response = await fetch('/api/community/chatrooms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          type: 'group',
          name: groupName.trim(),
          memberIds: selectedFriends,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || '建立群組失敗');
      }

      const data = await response.json();
      onGroupCreated?.(data.chatRoom.id, groupName.trim());
      onClose();
    } catch (err: any) {
      setError(err.message || '建立群組失敗');
    } finally {
      setCreating(false);
    }
  };

  const selectedFriendsList = friends.filter((f) => selectedFriends.includes(f.id));

  return (
    <Modal
      open={open}
      onClose={onClose}
      aria-labelledby="create-group-modal"
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
          width: { xs: '90%', sm: 450 },
          maxWidth: 500,
          maxHeight: '90vh',
          outline: 'none',
        }}
      >
        <Card
          sx={{
            borderRadius: 3,
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
            display: 'flex',
            flexDirection: 'column',
            maxHeight: '90vh',
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
              id="create-group-modal"
              variant="h6"
              component="h2"
              sx={{ fontWeight: 700 }}
            >
              建立群組
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

          <CardContent sx={{ p: 2, flex: 1, overflow: 'auto' }}>
            {/* 群組名稱 */}
            <TextField
              fullWidth
              label="群組名稱"
              placeholder="輸入群組名稱..."
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              sx={{ mb: 2 }}
              error={!!error && !groupName.trim()}
            />

            {/* 已選擇的好友 */}
            {selectedFriendsList.length > 0 && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" sx={{ mb: 1, color: 'text.secondary' }}>
                  已選擇 ({selectedFriendsList.length})
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {selectedFriendsList.map((friend) => (
                    <Chip
                      key={friend.id}
                      avatar={<Avatar src={friend.avatar || undefined}>{friend.name?.[0]?.toUpperCase()}</Avatar>}
                      label={friend.name || friend.userId || '用戶'}
                      onDelete={() => handleToggleFriend(friend.id)}
                      size="small"
                      sx={{
                        bgcolor: '#e3f2fd',
                        '& .MuiChip-deleteIcon': {
                          color: '#1565c0',
                        },
                      }}
                    />
                  ))}
                </Box>
              </Box>
            )}

            {/* 好友列表 */}
            <Typography variant="body2" sx={{ mb: 1, color: 'text.secondary' }}>
              選擇成員
            </Typography>

            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress size={24} />
              </Box>
            ) : friends.length === 0 ? (
              <Box sx={{ py: 4, textAlign: 'center' }}>
                <Typography color="text.secondary" variant="body2">
                  還沒有好友
                </Typography>
              </Box>
            ) : (
              <List sx={{ py: 0, maxHeight: 300, overflow: 'auto' }}>
                {friends.map((friend) => (
                  <ListItem key={friend.id} disablePadding>
                    <ListItemButton
                      onClick={() => handleToggleFriend(friend.id)}
                      sx={{
                        py: 1,
                        borderRadius: 1,
                        '&:hover': {
                          bgcolor: '#f5f7fa',
                        },
                      }}
                    >
                      <Checkbox
                        checked={selectedFriends.includes(friend.id)}
                        sx={{
                          mr: 1,
                          color: '#0F4C75',
                          '&.Mui-checked': {
                            color: '#0F4C75',
                          },
                        }}
                      />
                      <ListItemAvatar>
                        <Avatar
                          src={friend.avatar || undefined}
                          sx={{ bgcolor: '#0F4C75', width: 40, height: 40 }}
                        >
                          {(friend.name || friend.userId)?.[0]?.toUpperCase()}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={friend.name || friend.userId || '用戶'}
                        secondary={friend.department}
                        primaryTypographyProps={{ fontWeight: 500 }}
                        secondaryTypographyProps={{ fontSize: '0.75rem' }}
                      />
                    </ListItemButton>
                  </ListItem>
                ))}
              </List>
            )}

            {/* 錯誤訊息 */}
            {error && (
              <Typography color="error" variant="body2" sx={{ mt: 2 }}>
                {error}
              </Typography>
            )}
          </CardContent>

          <Divider />

          {/* Footer */}
          <Box sx={{ p: 2, display: 'flex', gap: 1 }}>
            <Button
              fullWidth
              variant="outlined"
              onClick={onClose}
              sx={{
                borderRadius: 2,
                textTransform: 'none',
              }}
            >
              取消
            </Button>
            <Button
              fullWidth
              variant="contained"
              onClick={handleCreateGroup}
              disabled={creating || !groupName.trim() || selectedFriends.length < 1}
              sx={{
                borderRadius: 2,
                bgcolor: '#0F4C75',
                textTransform: 'none',
                '&:hover': {
                  bgcolor: '#0a3a5a',
                },
              }}
            >
              {creating ? <CircularProgress size={20} sx={{ color: '#fff' }} /> : '建立群組'}
            </Button>
          </Box>
        </Card>
      </Box>
    </Modal>
  );
}

