'use client';

import * as React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import AddIcon from '@mui/icons-material/Add';
import IconButton from '@mui/material/IconButton';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import PushPinIcon from '@mui/icons-material/PushPin';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import Tooltip from '@mui/material/Tooltip';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

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
  onReorderSchedules?: (newSchedules: Schedule[]) => void;
}

// 可拖拽的課表項目組件
interface SortableScheduleItemProps {
  schedule: Schedule;
  isSelected: boolean;
  onSelect: () => void;
}

function SortableScheduleItem({ schedule, isSelected, onSelect }: SortableScheduleItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: schedule._id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 1000 : undefined,
  };

  return (
    <Box
      ref={setNodeRef}
      style={style}
      onClick={onSelect}
      sx={{
        p: 1,
        px: 1.5,
        mb: 0.5,
        cursor: 'pointer',
        borderRadius: 1,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: isDragging
          ? 'rgba(25, 118, 210, 0.15)'
          : isSelected
          ? 'rgba(25, 118, 210, 0.08)'
          : 'transparent',
        border: isSelected
          ? '1px solid rgba(25, 118, 210, 0.3)'
          : '1px solid transparent',
        boxShadow: isDragging ? '0 4px 12px rgba(0,0,0,0.15)' : 'none',
        '&:hover': {
          backgroundColor: isSelected
            ? 'rgba(25, 118, 210, 0.12)'
            : 'rgba(0, 0, 0, 0.04)',
        },
        transition: isDragging ? 'none' : 'all 0.15s ease',
        opacity: isDragging ? 0.9 : 1,
      }}
    >
      {/* 拖拽手柄 */}
      <Box
        {...attributes}
        {...listeners}
        sx={{
          display: 'flex',
          alignItems: 'center',
          cursor: 'grab',
          color: '#999',
          mr: 0.5,
          '&:hover': { color: '#666' },
          '&:active': { cursor: 'grabbing' },
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <DragIndicatorIcon sx={{ fontSize: 18 }} />
      </Box>

      {/* 釘選圖示和名稱 */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flex: 1, minWidth: 0 }}>
        {schedule.isDefault && (
          <Tooltip title="預設課表" arrow placement="top">
            <PushPinIcon
              sx={{
                fontSize: 16,
                color: 'primary.main',
                transform: 'rotate(45deg)',
                flexShrink: 0,
              }}
            />
          </Tooltip>
        )}
        <Typography
          variant="body2"
          sx={{
            fontWeight: isSelected ? 600 : 'normal',
            color: isSelected ? 'primary.main' : 'text.primary',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {schedule.name}
        </Typography>
      </Box>
    </Box>
  );
}

export default function ScheduleSidebar({
  schedules,
  currentScheduleId,
  onSelectSchedule,
  onAddSchedule,
  onDeleteSchedule,
  onUpdateSchedule,
  onReorderSchedules,
}: ScheduleSidebarProps) {
  // 設置拖拽感應器
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 需要移動 8px 才觸發拖拽，避免誤觸
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // 處理拖拽結束
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = schedules.findIndex((s) => s._id === active.id);
      const newIndex = schedules.findIndex((s) => s._id === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        const newSchedules = arrayMove(schedules, oldIndex, newIndex);
        onReorderSchedules?.(newSchedules);
      }
    }
  };
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

      {/* 課表列表 - 支援拖拽排序 */}
      <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 2 }}>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={schedules.map((s) => s._id)}
            strategy={verticalListSortingStrategy}
          >
            {schedules.map((schedule) => (
              <SortableScheduleItem
                key={schedule._id}
                schedule={schedule}
                isSelected={currentScheduleId === schedule._id}
                onSelect={() => onSelectSchedule(schedule._id)}
              />
            ))}
          </SortableContext>
        </DndContext>
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

