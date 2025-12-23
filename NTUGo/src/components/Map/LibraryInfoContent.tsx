'use client';

import * as React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';

interface StudyRoomInfo {
  occupied: number;
  available: number;
  total: number;
}

interface LibraryInfo {
  openingHours: {
    today: string;
    status: string;
    hours: string;
  };
  studyRoom: StudyRoomInfo;
  socialScienceStudyRoom?: StudyRoomInfo;
  lastUpdated: string;
}

interface LibraryInfoContentProps {
  libraryInfo: LibraryInfo | null;
  libraryLoading: boolean;
  libraryError: string | null;
}

export default function LibraryInfoContent({
  libraryInfo,
  libraryLoading,
  libraryError,
}: LibraryInfoContentProps) {
  return (
    <Box>
      {libraryLoading && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2, py: 2 }}>
          <CircularProgress size={20} sx={{ color: '#0F4C75' }} />
          <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
            載入中...
          </Typography>
        </Box>
      )}
      
      {libraryError && !libraryLoading && !libraryInfo && (
        <Alert severity="warning" sx={{ mb: 2, borderRadius: 2 }}>
          {libraryError}
        </Alert>
      )}
      
      {libraryInfo && (
        <Box>
          {/* 開館時間卡片 */}
          <Box
            sx={{
              mb: 2,
              p: 1.5,
              backgroundColor: libraryInfo.openingHours.status === '開館中' 
                ? '#e8f5e9' 
                : libraryInfo.openingHours.status === '閉館'
                ? '#ffebee'
                : '#f5f5f5',
              borderRadius: 2,
              border: `2px solid ${
                libraryInfo.openingHours.status === '開館中' 
                  ? '#4caf50' 
                  : libraryInfo.openingHours.status === '閉館'
                  ? '#f44336'
                  : '#9e9e9e'
              }`,
              textAlign: 'center',
            }}
          >
            <Typography variant="caption" sx={{ display: 'block', mb: 0.5, fontWeight: 600, color: 'text.secondary' }}>
              今日開館狀態
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
              {libraryInfo.openingHours.status}
            </Typography>
            {libraryInfo.openingHours.hours && (
              <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                {libraryInfo.openingHours.hours}
              </Typography>
            )}
            {libraryInfo.openingHours.today && (
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem', mt: 0.5, display: 'block' }}>
                {libraryInfo.openingHours.today}
              </Typography>
            )}
          </Box>
          
          {/* 總圖自習室座位資訊卡片 */}
          {libraryInfo.studyRoom.total > 0 && (
            <Box
              sx={{
                mb: 2,
                p: 1.5,
                backgroundColor: '#e3f2fd',
                borderRadius: 2,
                borderLeft: '4px solid #2196f3',
              }}
            >
              <Typography variant="body2" sx={{ fontWeight: 700, mb: 1, color: '#1976d2' }}>
                📚 總圖自習室
              </Typography>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem' }}>
                  已佔座位
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {libraryInfo.studyRoom.occupied} 席
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem' }}>
                  尚有座位
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#2e7d32' }}>
                  {libraryInfo.studyRoom.available} 席
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem' }}>
                  總座位數
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {libraryInfo.studyRoom.total} 席
                </Typography>
              </Box>
            </Box>
          )}

          
          {/* 最後更新時間 */}
          <Box
            sx={{
              mt: 1.5,
              pt: 1.5,
              borderTop: '1px solid #e0e0e0',
              textAlign: 'center',
            }}
          >
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem', fontWeight: 500 }}>
              🕐 最後更新: {libraryInfo.lastUpdated || '未知'}
            </Typography>
          </Box>
        </Box>
      )}
    </Box>
  );
}

