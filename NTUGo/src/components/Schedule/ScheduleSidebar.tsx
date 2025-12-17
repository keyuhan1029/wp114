'use client';

import * as React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import AddIcon from '@mui/icons-material/Add';
import IconButton from '@mui/material/IconButton';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';

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
  onUpdateSchedule: (scheduleId: string, name: string, isDefault: boolean) => void;
}

export default function ScheduleSidebar({
  schedules,
  currentScheduleId,
  onSelectSchedule,
  onAddSchedule,
  onDeleteSchedule,
  onUpdateSchedule,
}: ScheduleSidebarProps) {
  const [addDialogOpen, setAddDialogOpen] = React.useState(false);
  const [newScheduleName, setNewScheduleName] = React.useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [scheduleToDelete, setScheduleToDelete] = React.useState<string | null>(null);
  const [editDialogOpen, setEditDialogOpen] = React.useState(false);
  const [scheduleToEdit, setScheduleToEdit] = React.useState<Schedule | null>(null);
  const [editScheduleName, setEditScheduleName] = React.useState('');
  const [editIsDefault, setEditIsDefault] = React.useState(false);

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
    setScheduleToDelete(scheduleId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (scheduleToDelete) {
      onDeleteSchedule(scheduleToDelete);
      setScheduleToDelete(null);
      setDeleteDialogOpen(false);
    }
  };

  const handleDeleteCancel = () => {
    setScheduleToDelete(null);
    setDeleteDialogOpen(false);
  };

  const scheduleToDeleteName = scheduleToDelete 
    ? schedules.find(s => s._id === scheduleToDelete)?.name || ''
    : '';

  const handleEdit = (schedule: Schedule, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setScheduleToEdit(schedule);
    setEditScheduleName(schedule.name);
    setEditIsDefault(schedule.isDefault || false);
    setEditDialogOpen(true);
  };

  const handleEditConfirm = () => {
    if (scheduleToEdit && editScheduleName.trim()) {
      onUpdateSchedule(scheduleToEdit._id, editScheduleName.trim(), editIsDefault);
      setEditDialogOpen(false);
      setScheduleToEdit(null);
      setEditScheduleName('');
      setEditIsDefault(false);
    }
  };

  const handleEditCancel = () => {
    setEditDialogOpen(false);
    setScheduleToEdit(null);
    setEditScheduleName('');
    setEditIsDefault(false);
  };

  const currentSchedule = currentScheduleId 
    ? schedules.find(s => s._id === currentScheduleId)
    : null;

  return (
    <Box
      sx={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        boxSizing: 'border-box',
      }}
    >
      {/* 標題欄 */}
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
          我的課表
        </Typography>
        {currentSchedule && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <IconButton
              size="small"
              onClick={() => handleEdit(currentSchedule)}
              sx={{
                opacity: 0.7,
                '&:hover': {
                  opacity: 1,
                  color: 'primary.main',
                },
              }}
            >
              <EditIcon fontSize="small" />
            </IconButton>
            {schedules.length > 1 && (
              <IconButton
                size="small"
                onClick={() => {
                  setScheduleToDelete(currentSchedule._id);
                  setDeleteDialogOpen(true);
                }}
                sx={{
                  opacity: 0.7,
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
        )}
      </Box>

      {/* 課表列表 */}
      <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 2 }}>
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
          </Box>
        ))}
      </Box>
      <Box sx={{ p: 2, pt: 1 }}>
        <Button
          startIcon={<AddIcon />}
          onClick={handleAddClick}
          variant="text"
          fullWidth
          sx={{
            justifyContent: 'center',
            textTransform: 'none',
            '&:hover': {
              backgroundColor: 'rgba(0, 0, 0, 0.04)',
            },
          }}
        >
          新增課表
        </Button>
      </Box>

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

      {/* 刪除確認對話框 */}
      <Dialog 
        open={deleteDialogOpen} 
        onClose={handleDeleteCancel}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>確認刪除</DialogTitle>
        <DialogContent>
          <Typography>
            確定要刪除此課表「{scheduleToDeleteName}」嗎？
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel}>取消</Button>
          <Button
            onClick={handleDeleteConfirm}
            variant="contained"
            color="error"
          >
            刪除
          </Button>
        </DialogActions>
      </Dialog>

      {/* 編輯課表對話框 */}
      <Dialog 
        open={editDialogOpen} 
        onClose={handleEditCancel}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>編輯課表</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="課表名稱"
            fullWidth
            variant="outlined"
            value={editScheduleName}
            onChange={(e) => setEditScheduleName(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleEditConfirm();
              }
            }}
            sx={{ mb: 2 }}
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={editIsDefault}
                onChange={(e) => setEditIsDefault(e.target.checked)}
              />
            }
            label="設為預設課表"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleEditCancel}>取消</Button>
          <Button
            onClick={handleEditConfirm}
            variant="contained"
            disabled={!editScheduleName.trim()}
          >
            儲存
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

