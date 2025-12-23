'use client';

import * as React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { ScheduleItem } from '@/lib/models/ScheduleItem';

interface ScheduleGridProps {
  items: ScheduleItem[];
  onCellClick: (dayOfWeek: number, period: number) => void;
  onItemClick?: (item: ScheduleItem) => void;
}

// 時間段定義：使用索引 0-14
export const TIME_SLOTS = [
  { index: 0, label: '0', time: '07:10-08:00' },
  { index: 1, label: '1', time: '08:10-09:00' },
  { index: 2, label: '2', time: '09:10-10:00' },
  { index: 3, label: '3', time: '10:20-11:00' },
  { index: 4, label: '4', time: '11:20-12:20' },
  { index: 5, label: '5', time: '12:20-13:10' },
  { index: 6, label: '6', time: '13:20-14:10' },
  { index: 7, label: '7', time: '14:30-15:20' },
  { index: 8, label: '8', time: '15:30-16:20' },
  { index: 9, label: '9', time: '16:30-17:20' },
  { index: 10, label: '10', time: '17:30-18:20' },
  { index: 11, label: 'A', time: '18:25-19:15' },
  { index: 12, label: 'B', time: '19:20-20:10' },
  { index: 13, label: 'C', time: '20:15-21:05' },
  { index: 14, label: 'D', time: '21:10-22:00' },
];

const DAYS = [
  { label: '週一', value: 0 },
  { label: '週二', value: 1 },
  { label: '週三', value: 2 },
  { label: '週四', value: 3 },
  { label: '週五', value: 4 },
];

const CELL_HEIGHT = 48;
const TIME_COLUMN_WIDTH = 70;
const HEADER_HEIGHT = 32;

const ScheduleGrid = React.forwardRef<HTMLDivElement, ScheduleGridProps>(
  ({ items, onCellClick, onItemClick }, ref) => {
    // 找到覆蓋某個時間段的所有課程（可能有多個）
    const getItemsForCell = (dayOfWeek: number, periodIndex: number): ScheduleItem[] => {
      return items.filter(
        (item) =>
          item.dayOfWeek === dayOfWeek &&
          item.periodStart <= periodIndex &&
          item.periodEnd >= periodIndex
      );
    };

    return (
      <Box ref={ref} id="schedule-grid" sx={{ width: '100%', minWidth: 600 }}>
      {/* 表頭 - 星期 */}
      <Box sx={{ display: 'flex', borderBottom: '1px solid #ddd' }}>
        <Box
          sx={{
            width: TIME_COLUMN_WIDTH,
            height: HEADER_HEIGHT,
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#fff',
            borderRight: '1px solid #ddd',
          }}
        />
        {DAYS.map((day) => (
          <Box
            key={day.value}
            sx={{
              flex: 1,
              height: HEADER_HEIGHT,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#fff',
              borderRight: day.value < 4 ? '1px solid #eee' : 'none',
            }}
          >
            <Typography sx={{ fontWeight: 500, color: '#333', fontSize: '0.8rem' }}>
              {day.label}
            </Typography>
          </Box>
        ))}
      </Box>

      {/* 網格主體 */}
      {TIME_SLOTS.map((slot) => (
        <Box key={slot.index} sx={{ display: 'flex', borderBottom: '1px solid #eee' }}>
          {/* 時間欄 */}
          <Box
            sx={{
              width: TIME_COLUMN_WIDTH,
              height: CELL_HEIGHT,
              flexShrink: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#fff',
              borderRight: '1px solid #ddd',
            }}
          >
            <Typography sx={{ fontWeight: 500, fontSize: '0.75rem', color: '#333' }}>
              {slot.label}
            </Typography>
            <Typography sx={{ color: '#999', fontSize: '0.55rem' }}>
              {slot.time}
            </Typography>
          </Box>

          {/* 星期格子 */}
          {DAYS.map((day) => {
            const cellItems = getItemsForCell(day.value, slot.index);
            const hasItems = cellItems.length > 0;
            const itemCount = cellItems.length;

            return (
              <Box
                key={`${slot.index}-${day.value}`}
                onClick={() => {
                  if (hasItems && onItemClick && cellItems.length === 1) {
                    // 如果只有一个课程，点击整个格子
                    onItemClick(cellItems[0]);
                  } else if (!hasItems) {
                    onCellClick(day.value, slot.index);
                  }
                }}
                sx={{
                  flex: 1,
                  height: CELL_HEIGHT,
                  borderRight: day.value < 4 ? '1px solid #eee' : 'none',
                  cursor: hasItems ? 'default' : 'pointer',
                  padding: '2px',
                  boxSizing: 'border-box',
                  backgroundColor: '#fff',
                  display: 'flex',
                  flexDirection: itemCount > 1 ? 'row' : 'row',
                  gap: itemCount > 1 ? '1px' : 0,
                  '&:hover': {
                    backgroundColor: hasItems ? 'transparent' : 'rgba(0, 0, 0, 0.02)',
                  },
                }}
              >
                {hasItems && cellItems.map((item, idx) => {
                  const itemWidth = itemCount > 1 ? `calc((100% - ${(itemCount - 1) * 1}px) / ${itemCount})` : '100%';
                  const itemHeight = '100%';
                  
                  // 檢查是否為好友的課程
                  const isFriendSchedule = (item as any).isFriendSchedule === true;
                  const friendName = (item as any).friendName;
                  
                  return (
                    <Box
                      key={`${item._id || idx}-${day.value}-${slot.index}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        // 好友的課程不允許點擊編輯
                        if (!isFriendSchedule && onItemClick) {
                          onItemClick(item);
                        }
                      }}
                      sx={{
                        width: itemWidth,
                        height: itemHeight,
                        // 好友的課程使用透明背景，帶邊框
                        backgroundColor: isFriendSchedule ? 'transparent' : item.color,
                        border: isFriendSchedule ? `2px solid ${item.color || '#9c27b0'}` : 'none',
                        borderRadius: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: itemCount > 1 ? 0.3 : 0.5,
                        boxSizing: 'border-box',
                        transition: 'transform 0.1s, box-shadow 0.1s',
                        cursor: isFriendSchedule ? 'default' : 'pointer',
                        opacity: isFriendSchedule ? 0.85 : 1,
                        '&:hover': {
                          transform: isFriendSchedule ? 'none' : 'scale(1.02)',
                          boxShadow: isFriendSchedule ? 'none' : '0 2px 8px rgba(0,0,0,0.15)',
                          zIndex: isFriendSchedule ? 0 : 1,
                          position: isFriendSchedule ? 'static' : 'relative',
                        },
                      }}
                    >
                      {isFriendSchedule && friendName && (
                        <Typography
                          sx={{
                            fontSize: '0.45rem',
                            color: item.color || '#9c27b0',
                            fontWeight: 500,
                            mb: 0.2,
                            textAlign: 'center',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            maxWidth: '100%',
                          }}
                        >
                          {friendName}
                        </Typography>
                      )}
                      <Typography
                        sx={{
                          fontWeight: 600,
                          fontSize: itemCount > 1 ? '0.55rem' : '0.65rem',
                          color: isFriendSchedule ? (item.color || '#9c27b0') : '#fff',
                          textAlign: 'center',
                          lineHeight: 1.2,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          maxWidth: '100%',
                          textShadow: isFriendSchedule ? 'none' : '0 1px 2px rgba(0,0,0,0.2)',
                        }}
                      >
                        {item.courseName}
                      </Typography>
                      {item.location && itemCount <= 2 && (
                        <Typography
                          sx={{
                            fontSize: '0.5rem',
                            color: isFriendSchedule ? (item.color || '#9c27b0') : 'rgba(255,255,255,0.85)',
                            textAlign: 'center',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            maxWidth: '100%',
                          }}
                        >
                          {item.location}
                        </Typography>
                      )}
                    </Box>
                  );
                })}
              </Box>
            );
          })}
        </Box>
      ))}
    </Box>
    );
  }
);

ScheduleGrid.displayName = 'ScheduleGrid';

export default ScheduleGrid;
