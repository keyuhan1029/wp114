'use client';

import * as React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import { getCalendarMatrix, isSameDay } from './utils';
import { CombinedEvent } from './types';

interface CalendarGridProps {
  currentMonth: Date;
  selectedDate: Date;
  events: CombinedEvent[];
  onDateSelect: (date: Date) => void;
}

export default function CalendarGrid({
  currentMonth,
  selectedDate,
  events,
  onDateSelect,
}: CalendarGridProps) {
  const days = getCalendarMatrix(currentMonth);

  return (
    <Card sx={{ width: '100%', flexShrink: 0, mb: 2 }}>
      <CardContent>
        {/* 星期標題 */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            mb: 1,
            gap: 0.5,
          }}
        >
          {['日', '一', '二', '三', '四', '五', '六'].map((d) => (
            <Typography
              key={d}
              variant="subtitle2"
              align="center"
              sx={{ fontWeight: 'bold' }}
            >
              {d}
            </Typography>
          ))}
        </Box>

        {/* 日曆網格 */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            gridTemplateRows: 'repeat(6, 56px)', // 固定每列高度
            gap: 0.5,
          }}
        >
          {days.map((day) => {
            const inCurrentMonth = day.getMonth() === currentMonth.getMonth();
            const isSelected = isSameDay(day, selectedDate);
            const hasEvent = events.some((e) =>
              isSameDay(new Date(e.startTime), day)
            );

            return (
              <Box
                key={day.toISOString()}
                onClick={() => onDateSelect(day)}
                sx={{
                  borderRadius: 2,
                  border: '1px solid',
                  borderColor: isSelected
                    ? 'primary.main'
                    : 'rgba(0,0,0,0.08)',
                  backgroundColor: isSelected
                    ? 'primary.main'
                    : 'background.paper',
                  color: isSelected ? 'primary.contrastText' : 'inherit',
                  padding: 0.5,
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'flex-start',
                  overflow: 'hidden',
                }}
              >
                <Typography
                  variant="subtitle2"
                  sx={{
                    opacity: inCurrentMonth ? 1 : 0.4,
                    fontWeight: isSelected ? 'bold' : 'normal',
                  }}
                >
                  {day.getDate()}
                </Typography>
                {hasEvent && (
                  <Box
                    sx={{
                      mt: 0.25,
                      display: 'flex',
                      gap: 0.25,
                      flexWrap: 'wrap',
                      overflow: 'hidden',
                    }}
                  >
                    {(() => {
                      const dayEvents = events.filter((e) =>
                        isSameDay(new Date(e.startTime), day)
                      );
                      const maxVisible = 6;
                      const visible = dayEvents.slice(0, maxVisible);
                      const hasMore = dayEvents.length > maxVisible;

                      return (
                        <>
                          {visible.map((e) => (
                            <Chip
                              key={e.id}
                              size="small"
                              label={
                                e.sourceType === 'ntu_official' ? '校' : '個'
                              }
                              color={
                                e.sourceType === 'ntu_official'
                                  ? 'secondary'
                                  : 'primary'
                              }
                              sx={{ height: 18, fontSize: 10 }}
                            />
                          ))}
                          {hasMore && (
                            <Chip
                              size="small"
                              label="..."
                              sx={{
                                fontWeight: 'bold',
                                height: 18,
                                fontSize: 10,
                                color: 'inherit',
                              }}
                            />
                          )}
                        </>
                      );
                    })()}
                  </Box>
                )}
              </Box>
            );
          })}
        </Box>
      </CardContent>
    </Card>
  );
}

