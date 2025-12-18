'use client';

import * as React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import { CalendarEvent } from '@/lib/calendar/CalendarEvent';

interface RecommendedEventsListProps {
  events: CalendarEvent[];
  onAddToPersonal: (event: CalendarEvent) => void;
}

export default function RecommendedEventsList({
  events,
  onAddToPersonal,
}: RecommendedEventsListProps) {
  return (
    <Card sx={{ height: 400 }}>
      <CardContent
        sx={{
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          boxSizing: 'border-box',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            mb: 1,
            flexShrink: 0,
          }}
        >
          <Typography variant="subtitle1">
            近期推薦活動（來自台大行事曆）
          </Typography>
        </Box>
        {events.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            近期沒有可推薦的活動。
          </Typography>
        ) : (
          <List dense sx={{ overflowY: 'auto', flexGrow: 1, minHeight: 0 }}>
            {events.map((e) => {
              const start = new Date(e.startTime);
              const label = `${start.getMonth() + 1}/${start.getDate()} ${
                start.getHours().toString().padStart(2, '0')
              }:${start
                .getMinutes()
                .toString()
                .padStart(2, '0')} - ${e.title}`;
              return (
                <ListItem
                  key={e.id}
                  alignItems="flex-start"
                  sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}
                >
                  <Box
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      flexGrow: 1,
                      minWidth: 0,
                      gap: 0.5,
                    }}
                  >
                    <Typography
                      variant="body2"
                      sx={{
                        display: 'block',
                        whiteSpace: 'normal',
                        wordBreak: 'break-word',
                      }}
                    >
                      {label}
                    </Typography>
                    {e.location && (
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{
                          display: 'block',
                          whiteSpace: 'normal',
                          wordBreak: 'break-word',
                        }}
                      >
                        {e.location}
                      </Typography>
                    )}
                  </Box>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => onAddToPersonal(e)}
                    sx={{ flexShrink: 0 }}
                  >
                    加入行事曆
                  </Button>
                </ListItem>
              );
            })}
          </List>
        )}
      </CardContent>
    </Card>
  );
}

