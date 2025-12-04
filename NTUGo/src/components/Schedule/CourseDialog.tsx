'use client';

import * as React from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Popover from '@mui/material/Popover';
import CloseIcon from '@mui/icons-material/Close';
import AccessTimeIcon from '@mui/icons-material/AccessTime';

interface OccupiedSlot {
  dayOfWeek: number;
  periodStart: number;
  periodEnd: number;
}

interface CourseDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CourseFormData[]) => void;
  onDelete?: () => void;
  initialData?: CourseFormData | null;
  dayOfWeek: number;
  periodStart: number;
  occupiedSlots?: OccupiedSlot[]; // 已佔用的時間段
  editingItemId?: string | null; // 正在編輯的項目 ID
}

export interface TimeSlot {
  dayOfWeek: number;
  period: number;
}

export interface CourseFormData {
  courseName: string;
  location: string;
  teacher: string;
  dayOfWeek: number;
  periodStart: number;
  periodEnd: number;
  color: string;
}

const PRESET_COLORS = [
  { name: '炭灰', value: '#4a4a4a' },
  { name: '石墨', value: '#5c5c5c' },
  { name: '深藍', value: '#3d5a80' },
  { name: '墨綠', value: '#4a6741' },
  { name: '深紫', value: '#5d4e6d' },
  { name: '棕褐', value: '#7d6b5d' },
  { name: '深紅', value: '#8b4049' },
  { name: '藏青', value: '#2c3e50' },
];

const DAYS = ['一', '二', '三', '四', '五'];

// 時間段標籤（索引 0-14）
const PERIOD_LABELS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'A', 'B', 'C', 'D'];
const TOTAL_PERIODS = 15;

export default function CourseDialog({
  open,
  onClose,
  onSubmit,
  onDelete,
  initialData,
  dayOfWeek,
  periodStart,
  occupiedSlots = [],
  editingItemId,
}: CourseDialogProps) {
  const [courseName, setCourseName] = React.useState('');
  const [location, setLocation] = React.useState('');
  const [teacher, setTeacher] = React.useState('');
  const [color, setColor] = React.useState(PRESET_COLORS[0].value);
  const [selectedSlots, setSelectedSlots] = React.useState<TimeSlot[]>([]);
  const [timePickerAnchor, setTimePickerAnchor] = React.useState<HTMLButtonElement | null>(null);

  React.useEffect(() => {
    if (initialData) {
      setCourseName(initialData.courseName);
      setLocation(initialData.location);
      setTeacher(initialData.teacher);
      setColor(initialData.color);
      // 將現有的時間段展開為單獨的 slots
      const slots: TimeSlot[] = [];
      for (let p = initialData.periodStart; p <= initialData.periodEnd; p++) {
        slots.push({ dayOfWeek: initialData.dayOfWeek, period: p });
      }
      setSelectedSlots(slots);
    } else {
      setCourseName('');
      setLocation('');
      setTeacher('');
      setColor(PRESET_COLORS[0].value);
      setSelectedSlots([{ dayOfWeek, period: periodStart }]);
    }
  }, [initialData, dayOfWeek, periodStart, open]);

  // 將選中的 slots 轉換為 CourseFormData[]
  const convertSlotsToFormData = (): CourseFormData[] => {
    // 按天分組
    const slotsByDay: Map<number, number[]> = new Map();
    selectedSlots.forEach(slot => {
      const periods = slotsByDay.get(slot.dayOfWeek) || [];
      periods.push(slot.period);
      slotsByDay.set(slot.dayOfWeek, periods);
    });

    const result: CourseFormData[] = [];
    slotsByDay.forEach((periods, day) => {
      // 排序
      periods.sort((a, b) => a - b);
      
      // 找出連續的區段
      let start = periods[0];
      let end = periods[0];
      
      for (let i = 1; i <= periods.length; i++) {
        if (i < periods.length && periods[i] === end + 1) {
          end = periods[i];
        } else {
          result.push({
            courseName: courseName.trim(),
            location: location.trim(),
            teacher: teacher.trim(),
            dayOfWeek: day,
            periodStart: start,
            periodEnd: end,
            color,
          });
          if (i < periods.length) {
            start = periods[i];
            end = periods[i];
          }
        }
      }
    });

    return result;
  };

  const handleSubmit = () => {
    if (!courseName.trim() || selectedSlots.length === 0) {
      return;
    }
    
    const formDataList = convertSlotsToFormData();
    onSubmit(formDataList);
  };

  const handleClose = () => {
    setTimePickerAnchor(null);
    onClose();
  };

  const handleTimePickerOpen = (event: React.MouseEvent<HTMLButtonElement>) => {
    setTimePickerAnchor(event.currentTarget);
  };

  const handleTimePickerClose = () => {
    setTimePickerAnchor(null);
  };

  // 檢查時間段是否被其他課程佔用（排除正在編輯的課程）
  const isOccupied = (day: number, period: number): boolean => {
    return occupiedSlots.some(slot => {
      // 如果是編輯模式且是自己的時間段，不算佔用
      if (editingItemId && initialData) {
        if (slot.dayOfWeek === initialData.dayOfWeek &&
            slot.periodStart <= period && slot.periodEnd >= period &&
            initialData.periodStart <= period && initialData.periodEnd >= period) {
          return false;
        }
      }
      return slot.dayOfWeek === day && slot.periodStart <= period && slot.periodEnd >= period;
    });
  };

  // 檢查是否已選中
  const isSelected = (day: number, period: number): boolean => {
    return selectedSlots.some(slot => slot.dayOfWeek === day && slot.period === period);
  };

  // 點擊時間格子 - 簡單 toggle 邏輯
  const handleTimeSlotClick = (day: number, period: number) => {
    if (isOccupied(day, period)) return;

    if (isSelected(day, period)) {
      // 已選中 -> 取消選擇
      setSelectedSlots(selectedSlots.filter(
        slot => !(slot.dayOfWeek === day && slot.period === period)
      ));
    } else {
      // 未選中 -> 選擇
      setSelectedSlots([...selectedSlots, { dayOfWeek: day, period }]);
    }
  };

  // 格式化已選時間段顯示
  const formatSelectedSlots = (): string => {
    const formDataList = convertSlotsToFormData();
    return formDataList.map(fd => {
      const dayName = DAYS[fd.dayOfWeek];
      const startLabel = PERIOD_LABELS[fd.periodStart];
      const endLabel = PERIOD_LABELS[fd.periodEnd];
      if (fd.periodStart === fd.periodEnd) {
        return `週${dayName}${startLabel}`;
      }
      return `週${dayName}${startLabel}-${endLabel}`;
    }).join('、');
  };

  const timePickerOpen = Boolean(timePickerAnchor);

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">
            {initialData ? '編輯課程' : '新增課程'}
          </Typography>
          <IconButton onClick={handleClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          <TextField
            label="課程名稱"
            required
            fullWidth
            value={courseName}
            onChange={(e) => setCourseName(e.target.value)}
          />
          <TextField
            label="上課地點"
            fullWidth
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />
          <TextField
            label="教師姓名"
            fullWidth
            value={teacher}
            onChange={(e) => setTeacher(e.target.value)}
          />
          
          {/* 時間選擇 */}
          <Box>
            <Typography variant="body2" sx={{ mb: 1, color: '#666' }}>
              上課時間
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
              <Box
                sx={{
                  flex: 1,
                  minWidth: 150,
                  backgroundColor: selectedSlots.length > 0 ? color : '#f5f5f5',
                  borderRadius: 1.5,
                  px: 1.5,
                  py: 0.75,
                }}
              >
                <Typography sx={{ 
                  fontSize: '0.85rem',
                  color: selectedSlots.length > 0 ? '#fff' : '#999',
                  fontWeight: selectedSlots.length > 0 ? 500 : 400,
                }}>
                  {selectedSlots.length > 0 ? formatSelectedSlots() : '請選擇時間'}
                </Typography>
              </Box>
              <Button
                variant="outlined"
                size="small"
                startIcon={<AccessTimeIcon />}
                onClick={handleTimePickerOpen}
                sx={{ 
                  borderColor: '#ddd', 
                  color: '#333',
                  '&:hover': { borderColor: '#333', backgroundColor: 'transparent' }
                }}
              >
                選擇時間
              </Button>
            </Box>
          </Box>

          {/* 顏色選擇 */}
          <Box>
            <Typography variant="body2" sx={{ mb: 1, color: '#666' }}>
              選擇顏色
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {PRESET_COLORS.map((c) => (
                <Box
                  key={c.value}
                  onClick={() => setColor(c.value)}
                  sx={{
                    width: 32,
                    height: 32,
                    borderRadius: 1,
                    backgroundColor: c.value,
                    cursor: 'pointer',
                    border: color === c.value ? '2px solid #333' : '2px solid transparent',
                    '&:hover': { border: '2px solid #333' },
                  }}
                />
              ))}
            </Box>
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        {initialData && onDelete && (
          <Button onClick={onDelete} color="error" sx={{ mr: 'auto' }}>
            刪除
          </Button>
        )}
        <Button onClick={handleClose}>取消</Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={!courseName.trim() || selectedSlots.length === 0}
        >
          {initialData ? '更新' : '新增'}
        </Button>
      </DialogActions>

      {/* 時間選擇器 Popover */}
      <Popover
        open={timePickerOpen}
        anchorEl={timePickerAnchor}
        onClose={handleTimePickerClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
      >
        <Box sx={{ p: 2, width: 280 }}>
          <Box sx={{ display: 'flex' }}>
            {/* 時間欄 */}
            <Box sx={{ width: 20 }}>
              <Box sx={{ height: 18 }} />
              {PERIOD_LABELS.map((label, i) => (
                <Box
                  key={i}
                  sx={{
                    height: 18,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Typography sx={{ fontSize: '0.5rem', color: '#999' }}>
                    {label}
                  </Typography>
                </Box>
              ))}
            </Box>
            {/* 星期格子 */}
            {DAYS.map((dayName, dayIndex) => (
              <Box key={dayIndex} sx={{ flex: 1 }}>
                <Box
                  sx={{
                    height: 18,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderBottom: '1px solid #eee',
                  }}
                >
                  <Typography sx={{ fontWeight: 500, fontSize: '0.6rem', color: '#333' }}>
                    {dayName}
                  </Typography>
                </Box>
                {Array.from({ length: TOTAL_PERIODS }, (_, periodIndex) => {
                  const occupied = isOccupied(dayIndex, periodIndex);
                  const selected = isSelected(dayIndex, periodIndex);
                  
                  return (
                    <Box
                      key={periodIndex}
                      onClick={() => handleTimeSlotClick(dayIndex, periodIndex)}
                      sx={{
                        height: 18,
                        border: '1px solid #eee',
                        borderTop: 'none',
                        cursor: occupied ? 'not-allowed' : 'pointer',
                        backgroundColor: occupied
                          ? '#f5f5f5'
                          : selected
                          ? color
                          : '#fff',
                        opacity: occupied ? 0.4 : 1,
                        '&:hover': {
                          backgroundColor: occupied
                            ? '#f5f5f5'
                            : selected
                            ? color
                            : '#f0f0f0',
                        },
                      }}
                    />
                  );
                })}
              </Box>
            ))}
          </Box>
          <Box sx={{ mt: 1.5, display: 'flex', justifyContent: 'flex-end' }}>
            <Button size="small" onClick={handleTimePickerClose} sx={{ color: '#333' }}>
              完成
            </Button>
          </Box>
        </Box>
      </Popover>
    </Dialog>
  );
}
