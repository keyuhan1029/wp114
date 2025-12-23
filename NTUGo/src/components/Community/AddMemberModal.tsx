'use client';

import * as React from 'react';
import Box from '@mui/material/Box';
import Modal from '@mui/material/Modal';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import ListItemText from '@mui/material/ListItemText';
import ListItemButton from '@mui/material/ListItemButton';
import Avatar from '@mui/material/Avatar';
import Checkbox from '@mui/material/Checkbox';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';

interface Friend {
  id: string;
  friendId: string;
  userId?: string | null;
  name?: string | null;
  avatar?: string | null;
  department?: string | null;
}

interface AddMemberModalProps {
  open: boolean;
  onClose: () => void;
  roomId: string;
  existingMemberIds: string[];
  onMembersAdded: (count: number, newMemberCount: number) => void;
}

export default function AddMemberModal({
  open,
  onClose,
  roomId,
  existingMemberIds,
  onMembersAdded,
}: AddMemberModalProps) {
  const [friends, setFriends] = React.useState<Friend[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());
  const [adding, setAdding] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      fetchFriends();
      setSelectedIds(new Set());
    }
  }, [open]);

  const fetchFriends = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch('/api/community/friends', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        // 過濾掉已經在群組中的成員
        const availableFriends = data.friends
          .filter((f: any) => !existingMemberIds.includes(f.friend.id))
          .map((f: any) => ({
            id: f.id,
            friendId: f.friend.id,
            userId: f.friend.userId,
            name: f.friend.name,
            avatar: f.friend.avatar,
            department: f.friend.department,
          }));
        setFriends(availableFriends);
      }
    } catch (error) {
      console.error('取得好友列表錯誤:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (friendId: string) => {
    setSelectedIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(friendId)) {
        newSet.delete(friendId);
      } else {
        newSet.add(friendId);
      }
      return newSet;
    });
  };

  const handleAddMembers = async () => {
    if (selectedIds.size === 0) return;

    try {
      setAdding(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/community/chatrooms/${roomId}/members`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          memberIds: Array.from(selectedIds),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        onMembersAdded(data.addedMembers.length, data.memberCount);
        onClose();
      } else {
        const data = await response.json();
        alert(data.message || '添加成員失敗');
      }
    } catch (error) {
      console.error('添加成員錯誤:', error);
      alert('添加成員失敗');
    } finally {
      setAdding(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      aria-labelledby="add-member-modal"
    >
      <Box
        sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: { xs: '90%', sm: 400 },
          maxHeight: '80vh',
          bgcolor: 'background.paper',
          borderRadius: 3,
          boxShadow: 24,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* 標題 */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            p: 2,
            borderBottom: '1px solid #e0e0e0',
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            添加成員
          </Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>

        {/* 好友列表 */}
        <Box sx={{ flex: 1, overflow: 'auto', maxHeight: 400 }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress size={24} />
            </Box>
          ) : friends.length === 0 ? (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <Typography color="text.secondary">
                沒有可添加的好友
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                所有好友都已在群組中
              </Typography>
            </Box>
          ) : (
            <List sx={{ py: 0 }}>
              {friends.map((friend) => (
                <ListItem key={friend.friendId} disablePadding>
                  <ListItemButton
                    onClick={() => handleToggle(friend.friendId)}
                    sx={{ py: 1.5 }}
                  >
                    <Checkbox
                      checked={selectedIds.has(friend.friendId)}
                      disableRipple
                      sx={{ mr: 1 }}
                    />
                    <ListItemAvatar>
                      <Avatar
                        src={friend.avatar || undefined}
                        sx={{ bgcolor: '#0F4C75' }}
                      >
                        {(friend.name || friend.userId)?.[0]?.toUpperCase()}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={friend.name || friend.userId || '未知用戶'}
                      secondary={friend.department}
                    />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          )}
        </Box>

        <Divider />

        {/* 底部按鈕 */}
        <Box sx={{ p: 2, display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            fullWidth
            onClick={onClose}
            disabled={adding}
          >
            取消
          </Button>
          <Button
            variant="contained"
            fullWidth
            onClick={handleAddMembers}
            disabled={selectedIds.size === 0 || adding}
            sx={{
              bgcolor: '#0F4C75',
              '&:hover': { bgcolor: '#0a3a5a' },
            }}
          >
            {adding ? (
              <CircularProgress size={20} sx={{ color: '#fff' }} />
            ) : (
              `添加 (${selectedIds.size})`
            )}
          </Button>
        </Box>
      </Box>
    </Modal>
  );
}

