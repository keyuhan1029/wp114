'use client';

import * as React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import type { YouBikeStation } from '@/services/youbikeApi';

interface BikeInfoContentProps {
  selectedYouBikeStation: YouBikeStation | null;
  youbikeLoading: boolean;
  youbikeError: string | null;
}

export default function BikeInfoContent({
  selectedYouBikeStation,
  youbikeLoading,
  youbikeError,
}: BikeInfoContentProps) {
  return (
    <Box>
      {youbikeLoading && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2, py: 1 }}>
          <CircularProgress size={20} sx={{ color: '#0F4C75' }} />
          <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
            載入中...
          </Typography>
        </Box>
      )}
      
      {youbikeError && !selectedYouBikeStation && (
        <Alert severity="warning" sx={{ mb: 2, borderRadius: 2 }}>
          {youbikeError}
        </Alert>
      )}
      
      {selectedYouBikeStation ? (
        <Box>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 1.5,
              mb: 2,
            }}
          >
            <Box
              sx={{
                p: 1.5,
                backgroundColor: '#e8f5e9',
                borderRadius: 2,
                textAlign: 'center',
                border: '1px solid #c8e6c9',
              }}
            >
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5, fontWeight: 600 }}>
                可借車輛
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#2e7d32' }}>
                {selectedYouBikeStation.sbi}
              </Typography>
            </Box>
            <Box
              sx={{
                p: 1.5,
                backgroundColor: '#e3f2fd',
                borderRadius: 2,
                textAlign: 'center',
                border: '1px solid #bbdefb',
              }}
            >
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5, fontWeight: 600 }}>
                可還車位
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#1976d2' }}>
                {selectedYouBikeStation.bemp}
              </Typography>
            </Box>
            <Box
              sx={{
                p: 1.5,
                backgroundColor: '#f3e5f5',
                borderRadius: 2,
                textAlign: 'center',
                border: '1px solid #e1bee7',
              }}
            >
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5, fontWeight: 600 }}>
                總停車格
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#7b1fa2' }}>
                {selectedYouBikeStation.tot}
              </Typography>
            </Box>
          </Box>
          {selectedYouBikeStation.act === '1' ? (
            <Box
              sx={{
                p: 1,
                backgroundColor: '#e8f5e9',
                borderRadius: 1,
                textAlign: 'center',
              }}
            >
              <Typography variant="body2" color="success.main" sx={{ fontWeight: 600 }}>
                ✓ 正常服務中
              </Typography>
            </Box>
          ) : (
            <Box
              sx={{
                p: 1,
                backgroundColor: '#ffebee',
                borderRadius: 1,
                textAlign: 'center',
              }}
            >
              <Typography variant="body2" color="error.main" sx={{ fontWeight: 600 }}>
                ⚠ 暫停服務
              </Typography>
            </Box>
          )}
          {selectedYouBikeStation.ar && (
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1.5, fontSize: '0.75rem' }}>
              📍 {selectedYouBikeStation.ar}
            </Typography>
          )}
        </Box>
      ) : !youbikeLoading && !youbikeError && (
        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
          找不到對應的站點資訊
        </Typography>
      )}
    </Box>
  );
}




