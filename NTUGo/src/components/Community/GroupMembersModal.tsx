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
import Avatar from '@mui/material/Avatar';
import Checkbox from '@mui/material/Checkbox';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import Chip from '@mui/material/Chip';

interface Member {
  id: string;
  userId?: string | null;
  name?: string | null;
  avatar?: string | null;
  department?: string | null;
}

interface Friend {
  id: string;
  friendId: string;
  userId?: string | null;
  name?: string | null;
  avatar?: string | null;
  department?: string | null;
}

interface GroupMembersModalProps {
  open: boolean;
  onClose: () => void;
  roomId: string;
  currentUserId?: string | null;
  onMembersAdded?: (count: number, newMemberCount: number) => void;
  onViewProfile?: (userId: string) => void;
}

export default function GroupMembersModal({
  open,
  onClose,
  roomId,
  currentUserId,
  onMembersAdded,
  onViewProfile,
}: GroupMembersModalProps) {
  const [members, setMembers] = React.useState<Member[]>([]);
  const [friends, setFriends] = React.useState<Friend[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [showAddMember, setShowAddMember] = React.useState(false);
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());
  const [adding, setAdding] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      fetchMembers();
      setShowAddMember(false);
      setSelectedIds(new Set());
    }
  }, [open, roomId]);

  const fetchMembers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/community/chatrooms/${roomId}/members`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setMembers(data.members || []);
      }
    } catch (error) {
      console.error('取得成員列表錯誤:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFriends = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch('/api/community/friends', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        const existingMemberIds = members.map(m => m.id);
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

  const handleToggleAddMember = () => {
    if (!showAddMember) {
      fetchFriends();
    }
    setShowAddMember(!showAddMember);
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
        onMembersAdded?.(data.addedMembers.length, data.memberCount);
        // 重新載入成員列表
        await fetchMembers();
        setShowAddMember(false);
        setSelectedIds(new Set());
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
      aria-labelledby="group-members-modal"
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
          width: { xs: '90%', sm: 500 },
          maxHeight: '80vh',
          bgcolor: 'background.paper',
          borderRadius: 3,
          boxShadow: 24,
          display: 'flex',
          flexDirection: 'column',
          outline: 'none',
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
            {showAddMember ? '添加成員' : `群組成員 (${members.length})`}
          </Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>

        {/* 內容 */}
        <Box sx={{ flex: 1, overflow: 'auto', maxHeight: 'calc(80vh - 140px)' }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress size={24} />
            </Box>
          ) : showAddMember ? (
            // 添加成員列表
            <>
              {friends.length === 0 ? (
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
                      <Box
                        onClick={() => handleToggle(friend.friendId)}
                        sx={{
                          width: '100%',
                          py: 1.5,
                          px: 2,
                          display: 'flex',
                          alignItems: 'center',
                          cursor: 'pointer',
                          '&:hover': {
                            bgcolor: 'action.hover',
                          },
                        }}
                      >
                        <Checkbox
                          checked={selectedIds.has(friend.friendId)}
                          disableRipple
                          sx={{ mr: 1 }}
                        />
                        <Avatar
                          src={friend.avatar || undefined}
                          sx={{ bgcolor: '#0F4C75', mr: 2 }}
                        >
                          {(friend.name || friend.userId)?.[0]?.toUpperCase()}
                        </Avatar>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="body1" sx={{ fontWeight: 500 }}>
                            {friend.name || friend.userId || '未知用戶'}
                          </Typography>
                          {friend.department && (
                            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                              {friend.department}
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    </ListItem>
                  ))}
                </List>
              )}
            </>
          ) : (
            // 成員列表
            <List sx={{ py: 0 }}>
              {members.map((member) => {
                const isCurrentUser = member.id === currentUserId;
                return (
                  <ListItem
                    key={member.id}
                    disablePadding
                    sx={{
                      cursor: onViewProfile && !isCurrentUser ? 'pointer' : 'default',
                      '&:hover': onViewProfile && !isCurrentUser ? {
                        bgcolor: 'action.hover',
                      } : {},
                    }}
                    onClick={() => {
                      if (onViewProfile && !isCurrentUser) {
                        onViewProfile(member.id);
                      }
                    }}
                  >
                    <Box sx={{ width: '100%', py: 1.5, px: 2, display: 'flex', alignItems: 'center' }}>
                      <Avatar
                        src={member.avatar || undefined}
                        sx={{ bgcolor: '#0F4C75', mr: 2 }}
                      >
                        {(member.name || member.userId)?.[0]?.toUpperCase()}
                      </Avatar>
                      <Box sx={{ flex: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="body1" sx={{ fontWeight: 500 }}>
                            {member.name || member.userId || '未知用戶'}
                          </Typography>
                          {isCurrentUser && (
                            <Chip
                              label="我"
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
                        {member.department && (
                          <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                            {member.department}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  </ListItem>
                );
              })}
            </List>
          )}
        </Box>

        <Divider />

        {/* 底部按鈕 */}
        <Box sx={{ p: 2, display: 'flex', gap: 2 }}>
          {showAddMember ? (
            <>
              <Button
                variant="outlined"
                fullWidth
                onClick={handleToggleAddMember}
                disabled={adding}
              >
                返回
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
            </>
          ) : (
            <Button
              variant="contained"
              fullWidth
              startIcon={<PersonAddIcon />}
              onClick={handleToggleAddMember}
              sx={{
                bgcolor: '#0F4C75',
                '&:hover': { bgcolor: '#0a3a5a' },
              }}
            >
              添加成員
            </Button>
          )}
        </Box>
      </Box>
    </Modal>
  );
}

