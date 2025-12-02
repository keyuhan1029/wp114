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
import MainLayout from '@/components/Layout/MainLayout';
import MapComponent from '@/components/Map/MapComponent';
import type { CalendarEvent } from '@/lib/calendar/CalendarEvent';

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
        minWidth: 250,
        backdropFilter: 'blur(4px)',
      }}
    >
      <CardContent>
        <Typography variant="h6" component="div" sx={{ mb: 1, fontWeight: 'bold' }}>
          {title}
        </Typography>
        <List dense disablePadding>
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
      <Box sx={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }}>
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
                      const label = `${start.getMonth() + 1}/${
                        start.getDate()
                      } ${start
                        .getHours()
                        .toString()
                        .padStart(2, '0')}:${start
                        .getMinutes()
                        .toString()
                        .padStart(2, '0')} - ${event.title}`;
                      return (
                        <Box
                          key={event.id}
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: 1,
                          }}
                        >
                          <Typography
                            variant="body2"
                            component="span"
                            sx={{ mr: 1 }}
                          >
                            {label}
                          </Typography>
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => handleAddNtuToPersonal(event)}
                          >
                            加入
                          </Button>
                        </Box>
                      );
                    })
            }
          />
          <OverlayCard
            title="論壇熱門"
            items={[
              <Typography key="forum-1" variant="body2" component="span">
                XXXXXXXXXXXXXXX
              </Typography>,
              <Typography key="forum-2" variant="body2" component="span">
                XXXXXXXXXXXXXXX
              </Typography>,
              <Typography key="forum-3" variant="body2" component="span">
                XXXXXXXXXXXXXXX
              </Typography>,
            ]}
          />
          <OverlayCard
            title="交流版最新消息"
            items={[
              <Typography key="exchange-1" variant="body2" component="span">
                XXXXXXXXXXXXXXX
              </Typography>,
              <Typography key="exchange-2" variant="body2" component="span">
                XXXXXXXXXXXXXXX
              </Typography>,
              <Typography key="exchange-3" variant="body2" component="span">
                XXXXXXXXXXXXXXX
              </Typography>,
            ]}
          />
        </Box>
      </Box>
    </MainLayout>
  );
}
