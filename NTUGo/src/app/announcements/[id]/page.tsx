'use client';

import * as React from 'react';
import { useRouter, useParams } from 'next/navigation';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import Chip from '@mui/material/Chip';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import MainLayout from '@/components/Layout/MainLayout';
import type { AnnouncementCategory } from '@/lib/models/Announcement';

const categoryColors: Record<AnnouncementCategory, string> = {
  '社團資訊': '#2196f3',
  '國際交流': '#4caf50',
  '社會服務': '#9c27b0',
  '小福/鹿鳴堂': '#ff9800',
  '一般公告': '#757575',
};

// 解析系友周活動內容
function AlumniWeekContent({ content }: { content: string }) {
  const weeks: Array<{ dateRange: string; events: Array<{ location: string; club: string }> }> = [];
  
  // 解析內容，提取每週的活動
  const lines = content.split('\n');
  let currentDateRange: string | null = null;
  let currentEvents: Array<{ location: string; club: string }> = [];
  
  for (const line of lines) {
    const trimmed = line.trim();
    
    // 檢查是否是日期範圍行（格式：### 3月2日-3月6日）
    const dateMatch = trimmed.match(/###\s*(\d{1,2})月(\d{1,2})日-(\d{1,2})月(\d{1,2})日/);
    if (dateMatch) {
      // 保存之前的週
      if (currentDateRange && currentEvents.length > 0) {
        weeks.push({
          dateRange: currentDateRange,
          events: [...currentEvents],
        });
      }
      
      // 開始新的週
      currentDateRange = `${dateMatch[1]}月${dateMatch[2]}日-${dateMatch[3]}月${dateMatch[4]}日`;
      currentEvents = [];
      continue;
    }
    
    // 檢查是否是活動行（格式：- **鹿鳴1**：社團名稱）
    if (currentDateRange && trimmed.startsWith('- **')) {
      const eventMatch = trimmed.match(/\*\*([^*]+)\*\*[：:]\s*(.+)/);
      if (eventMatch) {
        currentEvents.push({
          location: eventMatch[1].trim(),
          club: eventMatch[2].trim(),
        });
      }
    }
  }
  
  // 保存最後一週
  if (currentDateRange && currentEvents.length > 0) {
    weeks.push({
      dateRange: currentDateRange,
      events: [...currentEvents],
    });
  }
  
  if (weeks.length === 0) {
    // 如果解析失敗，顯示原始內容
    return <Typography variant="body1" component="div">{content}</Typography>;
  }
  
  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
        活動安排
      </Typography>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            sm: 'repeat(2, 1fr)',
            md: 'repeat(3, 1fr)',
          },
          gap: 2,
        }}
      >
        {weeks.map((week, index) => (
          <Card
            key={index}
            sx={{
              height: '100%',
              backgroundColor: '#ffffff',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              '&:hover': {
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              },
            }}
            >
              <CardContent>
                <Typography
                  variant="subtitle1"
                  sx={{
                    fontWeight: 600,
                    mb: 2,
                    color: '#ff9800',
                    borderBottom: '2px solid #ff9800',
                    pb: 1,
                  }}
                >
                  {week.dateRange}
                </Typography>
                {week.events.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    暫無活動安排
                  </Typography>
                ) : (
                  <Box>
                    {week.events.map((event, eventIndex) => (
                      <Box
                        key={eventIndex}
                        sx={{
                          mb: 1.5,
                          p: 1,
                          backgroundColor: '#f9f9f9',
                          borderRadius: 1,
                        }}
                      >
                        <Typography
                          variant="body2"
                          sx={{
                            fontWeight: 600,
                            color: '#2196f3',
                            mb: 0.5,
                          }}
                        >
                          {event.location}
                        </Typography>
                        <Typography variant="body2" color="text.primary">
                          {event.club}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                )}
              </CardContent>
            </Card>
        ))}
      </Box>
    </Box>
  );
}

export default function AnnouncementDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const [announcement, setAnnouncement] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!id) return;

    const loadAnnouncement = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/announcements/${id}`);
        
        if (response.ok) {
          const data = await response.json();
          setAnnouncement(data.announcement);
        } else {
          const errorData = await response.json();
          setError(errorData.message || '加载公告失败');
        }
      } catch (err: any) {
        setError(err.message || '加载公告失败');
      } finally {
        setLoading(false);
      }
    };

    loadAnnouncement();
  }, [id]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('zh-TW', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <MainLayout>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100%' }}>
          <CircularProgress />
        </Box>
      </MainLayout>
    );
  }

  if (error || !announcement) {
    return (
      <MainLayout>
        <Box sx={{ p: 3 }}>
          <Alert severity="error">{error || '公告不存在'}</Alert>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => router.push('/announcements')}
            sx={{ mt: 2 }}
          >
            返回列表
          </Button>
        </Box>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <Box
        sx={{
          backgroundColor: '#ffffff',
          minHeight: '100%',
          width: '100%',
          p: 3,
          maxWidth: '900px',
          mx: 'auto',
        }}
      >
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => router.push('/announcements')}
          sx={{ mb: 3 }}
        >
          返回列表
        </Button>

        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <Chip
              label={announcement.category}
              sx={{
                backgroundColor: categoryColors[announcement.category as AnnouncementCategory] || '#757575',
                color: 'white',
                fontWeight: 500,
              }}
            />
            <Typography variant="body2" color="text.secondary">
              {formatDate(announcement.publishDate)}
            </Typography>
          </Box>

          <Typography variant="h4" sx={{ fontWeight: 700, mb: 3 }}>
            {announcement.title}
          </Typography>
        </Box>

        <Box
          sx={{
            mb: 3,
            p: 3,
            backgroundColor: '#f5f5f5',
            borderRadius: 2,
            whiteSpace: 'pre-wrap',
            lineHeight: 1.8,
          }}
        >
          {announcement.category === '小福/鹿鳴堂' ? (
            <AlumniWeekContent content={announcement.content} />
          ) : (
            <Typography variant="body1" component="div">
              {announcement.content}
            </Typography>
          )}
        </Box>

        {announcement.sourceUrl && (
          <Box>
            <Button
              variant="outlined"
              startIcon={<OpenInNewIcon />}
              href={announcement.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              查看原文
            </Button>
          </Box>
        )}
      </Box>
    </MainLayout>
  );
}

