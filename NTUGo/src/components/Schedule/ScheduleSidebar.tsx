'use client';

import * as React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import AddIcon from '@mui/icons-material/Add';
import IconButton from '@mui/material/IconButton';
import DeleteIcon from '@mui/icons-material/Delete';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';

interface Schedule {
  _id: string;
  name: string;
  isDefault?: boolean;
}

interface ScheduleSidebarProps {
  schedules: Schedule[];
  currentScheduleId: string | null;
  onSelectSchedule: (scheduleId: string) => void;
  onAddSchedule: (name: string) => void;
  onDeleteSchedule: (scheduleId: string) => void;
}

export default function ScheduleSidebar({
  schedules,
  currentScheduleId,
  onSelectSchedule,
  onAddSchedule,
  onDeleteSchedule,
}: ScheduleSidebarProps) {
  const [addDialogOpen, setAddDialogOpen] = React.useState(false);
  const [newScheduleName, setNewScheduleName] = React.useState('');

  const handleAddClick = () => {
    setAddDialogOpen(true);
  };

  const handleAddConfirm = () => {
    if (newScheduleName.trim()) {
      onAddSchedule(newScheduleName.trim());
      setNewScheduleName('');
      setAddDialogOpen(false);
    }
  };

  const handleAddCancel = () => {
    setNewScheduleName('');
    setAddDialogOpen(false);
  };

  const handleDelete = (e: React.MouseEvent, scheduleId: string) => {
    e.stopPropagation();
    if (window.confirm('確定要刪除此課表嗎？')) {
      onDeleteSchedule(scheduleId);
    }
  };

  return (
    <Box
      sx={{
        width: '100%',
        p: 2,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        boxSizing: 'border-box',
      }}
    >
      <Box sx={{ flexGrow: 1, overflowY: 'auto' }}>
        {schedules.map((schedule) => (
          <Box
            key={schedule._id}
            onClick={() => onSelectSchedule(schedule._id)}
            sx={{
              p: 1.5,
              mb: 0.5,
              cursor: 'pointer',
              borderRadius: 1,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              backgroundColor:
                currentScheduleId === schedule._id
                  ? 'rgba(0, 0, 0, 0)'
                  : 'transparent',
              '&:hover': {
                backgroundColor: 'rgba(0, 0, 0, 0.04)',
              },
            }}
          >
            <Typography
              variant="body2"
              sx={{
                fontWeight:
                  currentScheduleId === schedule._id ? 'bold' : 'normal',
                color:
                  currentScheduleId === schedule._id
                    ? 'primary.main'
                    : 'text.primary',
                textAlign: 'center',
              }}
            >
              {schedule.name}
            </Typography>
            {schedules.length > 1 && (
              <IconButton
                size="small"
                onClick={(e) => handleDelete(e, schedule._id)}
                sx={{
                  ml: 1,
                  opacity: 0.5,
                  '&:hover': {
                    opacity: 1,
                    color: 'error.main',
                  },
                }}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            )}
          </Box>
        ))}
      </Box>
      <Button
        startIcon={<AddIcon />}
        onClick={handleAddClick}
        variant="text"
        fullWidth
        sx={{
          mt: 2,
          justifyContent: 'center',
          textTransform: 'none',
          '&:hover': {
            backgroundColor: 'rgba(0, 0, 0, 0.04)',
          },
        }}
      >
        新增課表
      </Button>

      <Dialog open={addDialogOpen} onClose={handleAddCancel} maxWidth="sm" fullWidth>
        <DialogTitle>新增課表</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="課表名稱"
            fullWidth
            variant="outlined"
            value={newScheduleName}
            onChange={(e) => setNewScheduleName(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleAddConfirm();
              }
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleAddCancel}>取消</Button>
          <Button
            onClick={handleAddConfirm}
            variant="contained"
            disabled={!newScheduleName.trim()}
          >
            新增
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

