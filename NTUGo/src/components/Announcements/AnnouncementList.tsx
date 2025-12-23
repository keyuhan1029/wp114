'use client';

import * as React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import Pagination from '@mui/material/Pagination';
import IconButton from '@mui/material/IconButton';
import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import AnnouncementCard from './AnnouncementCard';
import { useRouter } from 'next/navigation';
import type { AnnouncementCategory } from '@/lib/models/Announcement';

interface Announcement {
  _id: string;
  title: string;
  content: string;
  category: AnnouncementCategory;
  publishDate: string;
  sourceUrl: string;
  isPinned: boolean;
}

interface AnnouncementListProps {
  announcements: Announcement[];
  loading?: boolean;
  error?: string | null;
  total?: number;
  limit?: number;
  skip?: number;
  onPageChange?: (page: number) => void;
  selectedCategory?: AnnouncementCategory | '全部';
}

// 解析小福/鹿鳴堂活動內容
function AlumniWeekTable({ announcements }: { announcements: Array<{ _id: string; title: string; content: string; publishDate: string }> }) {
  // 按學期分組公告
  const announcementsBySemester: Record<string, Array<{ _id: string; title: string; content: string; publishDate: string; weeks: Array<{ dateRange: string; events: Array<{ location: string; club: string }> }> }>> = {};
  
  announcements.forEach(announcement => {
    // 從標題提取學期（例如：114-1 或 114-2）
    const semesterMatch = announcement.title.match(/(\d{3}-\d)/);
    const semester = semesterMatch ? semesterMatch[1] : '未知學期';
    
    // 解析內容，提取每週的活動
    const weeks: Array<{ dateRange: string; events: Array<{ location: string; club: string }> }> = [];
    const lines = announcement.content.split('\n');
    let currentDateRange: string | null = null;
    let currentEvents: Array<{ location: string; club: string }> = [];
    
    for (const line of lines) {
      const trimmed = line.trim();
      
      // 檢查是否是日期範圍行（格式：### 3月2日-3月6日）
      const dateMatch = trimmed.match(/###\s*(\d{1,2})月(\d{1,2})日-(\d{1,2})月(\d{1,2})日/);
      if (dateMatch) {
        // 保存之前的週
        if (currentDateRange) {
          weeks.push({
            dateRange: currentDateRange,
            events: [...currentEvents],
          });
        }
        
        // 開始新的週，轉換格式：9月1日-9月5日 -> 9/1-9/5
        currentDateRange = `${dateMatch[1]}/${dateMatch[2]}-${dateMatch[3]}/${dateMatch[4]}`;
        currentEvents = [];
        continue;
      }
      
      // 檢查是否是活動行
      // 格式1：- **小福1**：客家社（markdown 格式）
      // 格式2：小福1【客家社】（原始格式，如果內容還沒格式化）
      if (currentDateRange) {
        // 格式1：markdown 格式（- **位置**：社團名稱）
        if (trimmed.startsWith('- **')) {
          const eventMatch = trimmed.match(/\*\*([^*]+)\*\*[：:]\s*(.+)/);
          if (eventMatch) {
            const location = eventMatch[1].trim();
            const club = eventMatch[2].trim();
            // 判斷是小福還是鹿鳴
            if (location.startsWith('小福') || location.startsWith('鹿鳴')) {
              currentEvents.push({ location, club });
            }
          }
        }
        // 格式2：直接解析原始內容中的格式（小福1【客家社】）
        else if (trimmed.includes('小福') || trimmed.includes('鹿鳴')) {
          // 匹配所有 "位置【社團】" 格式（支持同一行多個）
          const bracketMatches = trimmed.matchAll(/(小福\d+|鹿鳴\d+)\s*【([^】]+)】/g);
          for (const match of bracketMatches) {
            const location = match[1].trim();
            const club = match[2].trim();
            if (club && club.length > 0) {
              currentEvents.push({ location, club });
            }
          }
        }
      }
    }
    
    // 保存最後一週
    if (currentDateRange) {
      weeks.push({
        dateRange: currentDateRange,
        events: [...currentEvents],
      });
    }
    
    if (!announcementsBySemester[semester]) {
      announcementsBySemester[semester] = [];
    }
    
    announcementsBySemester[semester].push({
      ...announcement,
      weeks,
    });
  });
  
  const [selectedSemester, setSelectedSemester] = React.useState<string>(
    Object.keys(announcementsBySemester).sort().reverse()[0] || ''
  );
  
  const selectedAnnouncement = selectedSemester && announcementsBySemester[selectedSemester] 
    ? announcementsBySemester[selectedSemester][0] 
    : null;
  const weeks = selectedAnnouncement?.weeks || [];
  
  if (weeks.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography variant="body1" color="text.secondary">
          暫無活動安排
        </Typography>
      </Box>
    );
  }
  
  return (
    <Box sx={{ maxWidth: '1200px', mx: 'auto', px: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', mb: 2 }}>
        {/* 學期選擇器 - 使用箭號 */}
        {Object.keys(announcementsBySemester).length > 1 && (() => {
          const semesters = Object.keys(announcementsBySemester).sort().reverse();
          const currentIndex = semesters.indexOf(selectedSemester);
          const canGoPrev = currentIndex > 0;
          const canGoNext = currentIndex < semesters.length - 1;
          
          return (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <span>
                <IconButton
                  onClick={() => {
                    if (canGoPrev) {
                      setSelectedSemester(semesters[currentIndex - 1]);
                    }
                  }}
                  disabled={!canGoPrev}
                  sx={{
                    color: canGoPrev ? '#5c5c5c' : '#ddd',
                    '&:hover': {
                      backgroundColor: canGoPrev ? 'rgba(92, 92, 92, 0.08)' : 'transparent',
                    },
                  }}
                >
                  <ArrowBackIosIcon />
                </IconButton>
              </span>
              
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 600,
                  color: '#4a4a4a',
                  minWidth: '80px',
                  textAlign: 'center',
                }}
              >
                {selectedSemester}
              </Typography>
              
              <span>
                <IconButton
                  onClick={() => {
                    if (canGoNext) {
                      setSelectedSemester(semesters[currentIndex + 1]);
                    }
                  }}
                  disabled={!canGoNext}
                  sx={{
                    color: canGoNext ? '#5c5c5c' : '#ddd',
                    '&:hover': {
                      backgroundColor: canGoNext ? 'rgba(92, 92, 92, 0.08)' : 'transparent',
                    },
                  }}
                >
                  <ArrowForwardIosIcon />
                </IconButton>
              </span>
            </Box>
          );
        })()}
      </Box>
      
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
        {weeks.map((week, index) => {
          // 將活動按照「小福」和「鹿鳴堂」分組
          const xiaofuEvents = week.events.filter(e => e.location.startsWith('小福'));
          const lumingEvents = week.events.filter(e => e.location.startsWith('鹿鳴'));
          
          return (
            <Box 
              key={index}
              sx={{
                pb: 4,
                borderBottom: index < weeks.length - 1 ? '1px solid #e0e0e0' : 'none',
              }}
            >
              <Typography
                variant="h5"
                sx={{
                  fontWeight: 700,
                  mb: 3,
                  color: '#0F4C75',
                  fontSize: '1.5rem',
                  letterSpacing: '0.5px',
                }}
              >
                {week.dateRange}
              </Typography>
              
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: {
                    xs: '1fr',
                    md: 'repeat(2, 1fr)',
                  },
                  gap: 4,
                }}
              >
                {/* 小福區域 */}
                <Box>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      mb: 2,
                    }}
                  >
                    <Box
                      sx={{
                        width: 4,
                        height: 24,
                        backgroundColor: '#8b7355',
                        borderRadius: 2,
                        mr: 1.5,
                      }}
                    />
                    <Typography
                      variant="h6"
                      sx={{
                        fontWeight: 600,
                        color: '#6b5d4f',
                        fontSize: '1.1rem',
                      }}
                    >
                      小福
                    </Typography>
                  </Box>
                  {xiaofuEvents.length > 0 && (
                    <Box 
                      sx={{ 
                        display: 'flex', 
                        flexWrap: 'wrap', 
                        gap: 1.5,
                        pl: 5.5,
                      }}
                    >
                      {xiaofuEvents.map((event, eventIndex) => (
                        <Box
                          key={eventIndex}
                          sx={{
                            px: 2,
                            py: 1,
                            backgroundColor: '#f5f3f0',
                            borderRadius: 2,
                            border: '1px solid #e8e0d8',
                            transition: 'all 0.2s ease',
                            '&:hover': {
                              backgroundColor: '#ede8e1',
                              borderColor: '#d4c9bb',
                              transform: 'translateY(-1px)',
                            },
                          }}
                        >
                          <Typography
                            variant="body1"
                            sx={{
                              color: '#5a4f42',
                              fontWeight: 500,
                              fontSize: '0.95rem',
                            }}
                          >
                            {event.club}
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                  )}
                </Box>
                
                {/* 鹿鳴堂區域 */}
                <Box>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      mb: 2,
                    }}
                  >
                    <Box
                      sx={{
                        width: 4,
                        height: 24,
                        backgroundColor: '#5a6b7a',
                        borderRadius: 2,
                        mr: 1.5,
                      }}
                    />
                    <Typography
                      variant="h6"
                      sx={{
                        fontWeight: 600,
                        color: '#4a5a6a',
                        fontSize: '1.1rem',
                      }}
                    >
                      鹿鳴堂
                    </Typography>
                  </Box>
                  {lumingEvents.length > 0 && (
                    <Box 
                      sx={{ 
                        display: 'flex', 
                        flexWrap: 'wrap', 
                        gap: 1.5,
                        pl: 5.5,
                      }}
                    >
                      {lumingEvents.map((event, eventIndex) => (
                        <Box
                          key={eventIndex}
                          sx={{
                            px: 2,
                            py: 1,
                            backgroundColor: '#f0f2f4',
                            borderRadius: 2,
                            border: '1px solid #d8dde2',
                            transition: 'all 0.2s ease',
                            '&:hover': {
                              backgroundColor: '#e8ebef',
                              borderColor: '#c4cbd2',
                              transform: 'translateY(-1px)',
                            },
                          }}
                        >
                          <Typography
                            variant="body1"
                            sx={{
                              color: '#4a5a6a',
                              fontWeight: 500,
                              fontSize: '0.95rem',
                            }}
                          >
                            {event.club}
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                  )}
                </Box>
              </Box>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}

export default function AnnouncementList({
  announcements,
  loading,
  error,
  total = 0,
  limit = 20,
  skip = 0,
  onPageChange,
  selectedCategory,
}: AnnouncementListProps) {
  const router = useRouter();

  const handleCardClick = (id: string) => {
    router.push(`/announcements/${id}`);
  };

  const currentPage = Math.floor(skip / limit) + 1;
  const totalPages = Math.ceil(total / limit);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    );
  }

  if (announcements.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography variant="body1" color="text.secondary">
          暫無公告
        </Typography>
      </Box>
    );
  }

  // 如果是「小福/鹿鳴堂」分類，直接顯示表格
  if (selectedCategory === '小福/鹿鳴堂' && announcements.length > 0) {
    // 找到所有小福/鹿鳴堂的公告（可能有多個學期）
    const alumniWeekAnnouncements = announcements.filter(a => a.category === '小福/鹿鳴堂');
    
    if (alumniWeekAnnouncements.length > 0) {
      return (
        <Box>
          <AlumniWeekTable announcements={alumniWeekAnnouncements} />
        </Box>
      );
    }
  }

  return (
    <Box>
      {announcements.map((announcement) => (
        <AnnouncementCard
          key={announcement._id}
          id={announcement._id}
          title={announcement.title}
          content={announcement.content}
          category={announcement.category}
          publishDate={announcement.publishDate}
          sourceUrl={announcement.sourceUrl}
          isPinned={announcement.isPinned}
          onClick={() => handleCardClick(announcement._id)}
        />
      ))}
      {totalPages > 1 && onPageChange && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
          <Pagination
            count={totalPages}
            page={currentPage}
            onChange={(_, page) => onPageChange(page)}
            color="primary"
          />
        </Box>
      )}
    </Box>
  );
}

