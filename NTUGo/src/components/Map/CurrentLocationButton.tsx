'use client';

import * as React from 'react';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import CircularProgress from '@mui/material/CircularProgress';
import MyLocationIcon from '@mui/icons-material/MyLocation';

interface CurrentLocationButtonProps {
  currentLocation: { lat: number; lng: number } | null;
  isGettingLocation: boolean;
  onGetLocation: () => void;
  onReturnToLocation: () => void;
}

export default function CurrentLocationButton({
  currentLocation,
  isGettingLocation,
  onGetLocation,
  onReturnToLocation,
}: CurrentLocationButtonProps) {
  return (
    <Box
      sx={{
        position: 'absolute',
        bottom: 16,
        left: 16,
        zIndex: 1100,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        borderRadius: '50%',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
        backdropFilter: 'blur(4px)',
      }}
    >
      <Tooltip title={currentLocation ? '返回當前位置' : '顯示當前位置'}>
        <span>
          <IconButton
            onClick={currentLocation ? onReturnToLocation : onGetLocation}
            disabled={isGettingLocation}
            sx={{
              color: currentLocation ? '#0F4C75' : '#666',
              '&:hover': {
                backgroundColor: 'rgba(15, 76, 117, 0.1)',
              },
              '&:disabled': {
                color: '#999',
              },
            }}
          >
            {isGettingLocation ? (
              <CircularProgress size={24} />
            ) : (
              <MyLocationIcon />
            )}
          </IconButton>
        </span>
      </Tooltip>
    </Box>
  );
}



