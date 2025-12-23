'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Chip from '@mui/material/Chip';
import MainLayout from '@/components/Layout/MainLayout';
import MapComponent from '@/components/Map/MapComponent';
import type { CalendarEvent } from '@/lib/calendar/CalendarEvent';
import type { AnnouncementCategory } from '@/lib/models/Announcement';

function OverlayCard({
  title,
  items,
}: {
  title: string;
  items: React.ReactNode[];
}) {
  return (
    <Card
      sx={{
        mb: 2,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        color: 'white',
        borderRadius: 4,
        width: 300,
        backdropFilter: 'blur(4px)',
      }}
    >
      <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
        <Typography variant="subtitle2" component="div" sx={{ mb: 1, fontWeight: 'bold', fontSize: '0.9rem' }}>
          {title}
        </Typography>
        <List dense disablePadding sx={{ '& .MuiListItem-root': { py: 0.25 } }}>
          {items.map((item, index) => (
            <ListItem key={index} disablePadding>
              <Box component="span" sx={{ mr: 1 }}>•</Box>
              <Box component="span" sx={{ display: 'inline-flex', flex: 1 }}>
                {item}
              </Box>
            </ListItem>
          ))}
        </List>
      </CardContent>
    </Card>
  );
}

export default function Home() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = React.useState<boolean | null>(null);
  const [ntuEvents, setNtuEvents] = React.useState<CalendarEvent[]>([]);
  const [hotAnnouncements, setHotAnnouncements] = React.useState<any[]>([]);

  React.useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      
      if (!token) {
        router.push('/login');
        return;
      }

      try {
        const response = await fetch('/api/auth/me', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          // Token 無效，清除並重定向
          localStorage.removeItem('token');
          router.push('/login');
          return;
        }

        // 認證成功
        setIsAuthenticated(true);
      } catch (error) {
        // 發生錯誤，清除 token 並重定向
        localStorage.removeItem('token');
        router.push('/login');
      }
    };

    checkAuth();
  }, [router]);

  // 載入近期 NTU 活動作為主頁推薦
  React.useEffect(() => {
    if (!isAuthenticated) return;

    const loadNtuEvents = async () => {
      try {
        const now = new Date();
        const to = new Date();
        to.setDate(now.getDate() + 7); // 預設抓未來 7 天

        const res = await fetch(
          `/api/calendar/events?from=${encodeURIComponent(
            now.toISOString()
          )}&to=${encodeURIComponent(to.toISOString())}`
        );
        if (res.ok) {
          const data = await res.json();
          setNtuEvents(data.events || []);
        } else {
          setNtuEvents([]);
        }
      } catch (e) {
        console.error('載入 NTU 活動列表失敗', e);
        setNtuEvents([]);
      }
    };

    loadNtuEvents();
  }, [isAuthenticated]);

  // 載入活動公告（隨機推播）
  React.useEffect(() => {
    if (!isAuthenticated) return;

    const loadHotAnnouncements = async () => {
      try {
        const res = await fetch('/api/announcements?limit=50');
        if (res.ok) {
          const data = await res.json();
          const announcements = data.announcements || [];
          
          // 隨機選擇 3 個活動
          const shuffled = [...announcements].sort(() => Math.random() - 0.5);
          setHotAnnouncements(shuffled.slice(0, 3));
        } else {
          setHotAnnouncements([]);
        }
      } catch (e) {
        console.error('載入活動公告失敗', e);
        setHotAnnouncements([]);
      }
    };

    loadHotAnnouncements();
  }, [isAuthenticated]);

  const handleAddNtuToPersonal = async (event: CalendarEvent) => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    try {
      const res = await fetch('/api/calendar/personal/from-ntu', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ntuEventId: event.id,
        }),
      });

      if (!res.ok) {
        console.error('加入個人行事曆失敗');
      }
    } catch (e) {
      console.error('加入個人行事曆失敗', e);
    }
  };

  // 顯示載入中或未認證時不顯示內容
  if (isAuthenticated === null) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          width: '100vw',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!isAuthenticated) {
    return null; // 重定向中，不顯示內容
  }

  return (
    <MainLayout>
      {/* Map Background */}
      <Box sx={{ 
        width: '100%', 
        height: '100%', 
        position: 'absolute', 
        top: 0, 
        left: 0, 
        right: 0,
        bottom: 0,
        zIndex: 0 
      }}>
        <MapComponent />
      </Box>

      {/* Overlays - Right Side Stack - 貼底 */}
      <Box
        sx={{
          position: 'absolute',
          bottom: 16, // 貼底
          right: 16,
          zIndex: 1000,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
          pointerEvents: 'none',
        }}
      >
        <Box sx={{ pointerEvents: 'auto' }}>
          <OverlayCard
            title="活動列表"
            items={
              ntuEvents.length === 0
                ? ['近期沒有可推薦的活動'].map((text) => (
                    <Typography key={text} variant="body2" component="span">
                      {text}
                    </Typography>
                  ))
                : ntuEvents
                    .slice(0, 3)
                    .map((event) => {
                      const start = new Date(event.startTime);
                      const dateStr = `${start.getMonth() + 1}/${start.getDate()}`;
                      // 截斷過長的標題
                      const shortTitle = event.title.length > 15
                        ? event.title.slice(0, 8) + '...' 
                        : event.title;
                      return (
                        <Box
                          key={event.id}
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            width: '100%',
                            gap: 0.5,
                          }}
                        >
                          <Typography
                            variant="caption"
                            component="span"
                            sx={{ 
                              flex: 1,
                              fontSize: '0.7rem',
                              lineHeight: 1.3,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {dateStr} {shortTitle}
                          </Typography>
                          <Button
                            size="small"
                            variant="contained"
                            onClick={() => handleAddNtuToPersonal(event)}
                            sx={{
                              backgroundColor: '#ffffff',
                              color: '#000000',
                              fontWeight: 600,
                              minWidth: 'auto',
                              px: 1,
                              py: 0.25,
                              fontSize: '0.65rem',
                              flexShrink: 0,
                              '&:hover': {
                                backgroundColor: '#e0e0e0',
                              },
                            }}
                          >
                            加入
                          </Button>
                        </Box>
                      );
                    })
            }
          />
          <OverlayCard
            title="活動熱門"
            items={
              hotAnnouncements.length === 0
                ? ['暫無活動公告'].map((text) => (
                    <Typography key={text} variant="body2" component="span" sx={{ fontSize: '0.7rem' }}>
                      {text}
                    </Typography>
                  ))
                : hotAnnouncements.map((announcement) => {
                    // 分類顏色映射
                    const categoryColors: Record<AnnouncementCategory, string> = {
                      '社團資訊': '#2196f3',
                      '國際交流': '#4caf50',
                      '社會服務': '#9c27b0',
                      '小福/鹿鳴堂': '#ff9800',
                      '一般公告': '#757575',
                    };
                    
                    const categoryColor = categoryColors[announcement.category as AnnouncementCategory] || '#757575';
                    
                    // 截斷過長的標題
                    const shortTitle = announcement.title.length > 18
                      ? announcement.title.slice(0, 15) + '...'
                      : announcement.title;
                    
                    return (
                      <Box
                        key={announcement._id}
                        onClick={() => router.push(`/announcements/${announcement._id}`)}
                        sx={{
                          cursor: 'pointer',
                          mb: 0.5,
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'flex-start',
                          gap: 1,
                          p: 0.5,
                          borderRadius: 1,
                          transition: 'all 0.3s ease',
                          position: 'relative',
                          '&:hover': {
                            backgroundColor: 'rgba(255, 255, 255, 0.1)',
                            transform: 'scale(1.02)',
                            zIndex: 10,
                            '& .announcement-title': {
                              whiteSpace: 'normal',
                              overflow: 'visible',
                              textOverflow: 'clip',
                              wordBreak: 'break-word',
                            },
                            '& .announcement-chip': {
                              flexShrink: 0,
                            },
                          },
                        }}
                      >
                        <Typography
                          variant="caption"
                          component="span"
                          className="announcement-title"
                          sx={{
                            fontSize: '0.7rem',
                            lineHeight: 1.3,
                            color: 'rgba(255, 255, 255, 0.9)',
                            flex: 1,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            transition: 'all 0.3s ease',
                            minWidth: 0,
                          }}
                        >
                          {announcement.title}
                        </Typography>
                        <Chip
                          label={announcement.category}
                          size="small"
                          className="announcement-chip"
                          sx={{
                            height: '16px',
                            fontSize: '0.6rem',
                            backgroundColor: '#ffffff',
                            color: categoryColor,
                            border: `1px solid ${categoryColor}`,
                            fontWeight: 500,
                            flexShrink: 0,
                            transition: 'all 0.3s ease',
                            '& .MuiChip-label': {
                              px: 0.75,
                              py: 0,
                            },
                          }}
                        />
                      </Box>
                    );
                  })
            }
          />
        </Box>
      </Box>
    </MainLayout>
  );
}
