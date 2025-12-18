'use client';

import * as React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import Avatar from '@mui/material/Avatar';
import Divider from '@mui/material/Divider';
import CircularProgress from '@mui/material/CircularProgress';
import Card from '@mui/material/Card';
import DeleteIcon from '@mui/icons-material/Delete';
import CloseIcon from '@mui/icons-material/Close';

interface Friend {
  id: string;
  userId?: string | null;
  name?: string | null;
  avatar?: string | null;
  department?: string | null;
}

interface SharedSchedule {
  shareId: string;
  friend: Friend;
  schedule: {
    _id: string;
    name: string;
    items: any[];
  };
}

interface FriendSchedulesListProps {
  sharedSchedules: SharedSchedule[];
  selectedFriendIds: Set<string>;
  deleteMode: boolean;
  loading: boolean;
  deletingShareIds: Set<string>;
  onToggleFriend: (friendId: string) => void;
  onToggleDeleteMode: () => void;
  onDeleteSharedSchedule: (shareId: string) => void;
}

export default function FriendSchedulesList({
  sharedSchedules,
  selectedFriendIds,
  deleteMode,
  loading,
  deletingShareIds,
  onToggleFriend,
  onToggleDeleteMode,
  onDeleteSharedSchedule,
}: FriendSchedulesListProps) {
  if (sharedSchedules.length === 0) {
    return null;
  }

  return (
    <Card
      sx={{
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        borderRadius: 2,
        overflow: 'hidden',
        maxHeight: 'calc(100vh - 200px)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Box
        sx={{
          p: 2,
          borderBottom: '1px solid #eee',
          bgcolor: '#f5f7fa',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1rem' }}>
          好友課表
        </Typography>
        <IconButton
          size="small"
          onClick={onToggleDeleteMode}
          sx={{
            color: deleteMode ? '#f44336' : 'text.secondary',
            '&:hover': {
              bgcolor: deleteMode ? 'rgba(244, 67, 54, 0.1)' : 'action.hover',
            },
          }}
        >
          {deleteMode ? <CloseIcon fontSize="small" /> : <DeleteIcon fontSize="small" />}
        </IconButton>
      </Box>
      <Box
        sx={{
          overflow: 'auto',
          flex: 1,
        }}
      >
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
            <CircularProgress size={24} />
          </Box>
        ) : (
          sharedSchedules.map((shared) => (
            <Box key={shared.shareId}>
              <Box
                sx={{
                  p: 1.5,
                  display: 'flex',
                  alignItems: 'center',
                  '&:hover': {
                    bgcolor: '#fafafa',
                  },
                }}
              >
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={selectedFriendIds.has(shared.friend.id)}
                      onChange={() => onToggleFriend(shared.friend.id)}
                      size="small"
                      disabled={deleteMode}
                      sx={{
                        color: '#0F4C75',
                        '&.Mui-checked': {
                          color: '#0F4C75',
                        },
                      }}
                    />
                  }
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 1, flex: 1 }}>
                      <Avatar
                        src={shared.friend.avatar || undefined}
                        sx={{
                          width: 28,
                          height: 28,
                          bgcolor: '#0F4C75',
                          fontSize: '0.75rem',
                        }}
                      >
                        {(shared.friend.name || shared.friend.userId)?.[0]?.toUpperCase()}
                      </Avatar>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {shared.friend.name || shared.friend.userId || '用戶'}
                      </Typography>
                      {deleteMode && (
                        <IconButton
                          size="small"
                          onClick={() => onDeleteSharedSchedule(shared.shareId)}
                          disabled={deletingShareIds.has(shared.shareId)}
                          sx={{
                            color: '#f44336',
                            ml: 'auto',
                            '&:hover': {
                              bgcolor: 'rgba(244, 67, 54, 0.1)',
                            },
                          }}
                        >
                          {deletingShareIds.has(shared.shareId) ? (
                            <CircularProgress size={16} sx={{ color: '#f44336' }} />
                          ) : (
                            <CloseIcon fontSize="small" />
                          )}
                        </IconButton>
                      )}
                    </Box>
                  }
                  sx={{ margin: 0, flex: 1 }}
                />
              </Box>
              <Divider />
            </Box>
          ))
        )}
      </Box>
    </Card>
  );
}

