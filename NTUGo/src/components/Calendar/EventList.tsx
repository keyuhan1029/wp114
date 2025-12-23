'use client';

import * as React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import IconButton from '@mui/material/IconButton';
import Chip from '@mui/material/Chip';
import Switch from '@mui/material/Switch';
import CircularProgress from '@mui/material/CircularProgress';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import EditIcon from '@mui/icons-material/Edit';
import IosShareIcon from '@mui/icons-material/IosShare';
import DeleteIcon from '@mui/icons-material/Delete';
import { CombinedEvent, PersonalEventClient } from './types';

interface EventListProps {
  selectedDate: Date;
  events: CombinedEvent[];
  personalEvents: PersonalEventClient[];
  loading: boolean;
  showNtuEvents: boolean;
  onToggleNtuEvents: (show: boolean) => void;
  onEdit: (event: PersonalEventClient) => void;
  onDelete: (id: string) => void;
  onExport: (id: string) => void;
}

export default function EventList({
  selectedDate,
  events,
  personalEvents,
  loading,
  showNtuEvents,
  onToggleNtuEvents,
  onEdit,
  onDelete,
  onExport,
}: EventListProps) {
  const formatTimeLabel = (event: CombinedEvent): string => {
    if (event.allDay) return '整日';
    const start = new Date(event.startTime);
    const end = new Date(event.endTime);
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${pad(start.getHours())}:${pad(start.getMinutes())} - ${pad(
      end.getHours()
    )}:${pad(end.getMinutes())}`;
  };

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
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="h6">
              {selectedDate.getMonth() + 1} 月 {selectedDate.getDate()} 日行程
            </Typography>
            {loading && <CircularProgress size={20} />}
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              學校行程
            </Typography>
            <Switch
              size="small"
              checked={showNtuEvents}
              onChange={(e) => onToggleNtuEvents(e.target.checked)}
            />
          </Box>
        </Box>
        {events.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            目前沒有任何行程，點擊「新增行程」來安排吧！
          </Typography>
        ) : (
          <List dense sx={{ overflowY: 'auto', flexGrow: 1, minHeight: 0 }}>
            {events
              .sort(
                (a, b) =>
                  new Date(a.startTime).getTime() -
                  new Date(b.startTime).getTime()
              )
              .map((e) => {
                const isPersonal = e.sourceType === 'personal';

                return (
                  <ListItem
                    key={e.id}
                    alignItems="flex-start"
                    secondaryAction={
                      isPersonal && e.personalId ? (
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                          <IconButton
                            size="small"
                            aria-label="edit"
                            onClick={() => {
                              const target = personalEvents.find(
                                (p) => p._id === e.personalId
                              );
                              if (target) {
                                onEdit(target);
                              }
                            }}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            aria-label="export"
                            onClick={() => onExport(e.personalId!)}
                          >
                            <IosShareIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            aria-label="delete"
                            onClick={() => onDelete(e.personalId!)}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      ) : null
                    }
                  >
                    <ListItemText
                      primary={
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                            flexWrap: 'wrap',
                            maxWidth: 'calc(100% - 120px)',
                          }}
                        >
                          <Typography variant="subtitle2" component="span">
                            {e.title}
                          </Typography>
                          <Chip
                            size="small"
                            label={
                              e.sourceType === 'ntu_official'
                                ? '校內活動'
                                : e.personalSource === 'ntu_imported'
                                ? '我的行程（由校內匯入）'
                                : '我的行程'
                            }
                            color={
                              e.sourceType === 'ntu_official'
                                ? 'secondary'
                                : 'primary'
                            }
                            sx={{ maxWidth: '100%' }}
                          />
                        </Box>
                      }
                      secondary={
                        <>
                          <Typography
                            component="span"
                            variant="body2"
                            color="text.primary"
                          >
                            {formatTimeLabel(e)}
                          </Typography>
                          {e.location && (
                            <>
                              {' ・ '}
                              <Typography
                                component="span"
                                variant="body2"
                                color="text.secondary"
                                sx={{
                                  display: 'inline-block',
                                  maxWidth: 'calc(100% - 120px)',
                                  whiteSpace: 'normal',
                                  wordBreak: 'break-word',
                                }}
                              >
                                {e.location}
                              </Typography>
                            </>
                          )}
                          {e.description && (
                            <Typography
                              component="span"
                              variant="body2"
                              color="text.secondary"
                              sx={{
                                display: 'block',
                                mt: 0.5,
                                maxWidth: 'calc(100% - 120px)',
                                whiteSpace: 'normal',
                                wordBreak: 'break-word',
                              }}
                            >
                              {e.description}
                            </Typography>
                          )}
                        </>
                      }
                      primaryTypographyProps={{ component: 'span' }}
                      secondaryTypographyProps={{ component: 'span' }}
                    />
                  </ListItem>
                );
              })}
          </List>
        )}
      </CardContent>
    </Card>
  );
}

