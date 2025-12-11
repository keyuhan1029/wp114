'use client';

import * as React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import DeleteIcon from '@mui/icons-material/Delete';
import LocationOnIcon from '@mui/icons-material/LocationOn';

interface UserBikeMarkerContentProps {
  markerId: string;
  note?: string;
  lat: number;
  lng: number;
  onDelete: (markerId: string) => void;
}

export default function UserBikeMarkerContent({
  markerId,
  note,
  lat,
  lng,
  onDelete,
}: UserBikeMarkerContentProps) {
  return (
    <Box>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          mb: 2,
          p: 1.5,
          backgroundColor: '#e8f5e9',
          borderRadius: 2,
        }}
      >
        <LocationOnIcon sx={{ color: '#4caf50' }} />
        <Typography variant="body1" sx={{ fontWeight: 600, color: '#2e7d32' }}>
          我的腳踏車位置
        </Typography>
      </Box>

      {note && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
            備註：
          </Typography>
          <Typography variant="body1">{note}</Typography>
        </Box>
      )}

      <Box sx={{ mb: 2 }}>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
          位置：
        </Typography>
        <Typography variant="body2">
          緯度: {lat.toFixed(6)}, 經度: {lng.toFixed(6)}
        </Typography>
      </Box>

      <Button
        variant="outlined"
        color="error"
        startIcon={<DeleteIcon />}
        onClick={() => onDelete(markerId)}
        fullWidth
        sx={{
          textTransform: 'none',
        }}
      >
        刪除此標記
      </Button>
    </Box>
  );
}

