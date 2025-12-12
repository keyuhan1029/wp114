'use client';

import * as React from 'react';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import AddLocationIcon from '@mui/icons-material/AddLocation';
import AddLocationAltIcon from '@mui/icons-material/AddLocationAlt';
import Box from '@mui/material/Box';

interface BikeMarkerButtonProps {
  isMarkingMode: boolean;
  onToggleMarkingMode: () => void;
}

export default function BikeMarkerButton({
  isMarkingMode,
  onToggleMarkingMode,
}: BikeMarkerButtonProps) {
  return (
    <Box
      sx={{
        position: 'absolute',
        bottom: 70, // 在「當前位置」按鈕上方
        left: 16,
        zIndex: 1200,
        pointerEvents: 'auto',
      }}
    >
      <Tooltip title={isMarkingMode ? '取消標記模式' : '標記腳踏車位置'}>
        <span>
          <IconButton
            onClick={onToggleMarkingMode}
            sx={{
              backgroundColor: isMarkingMode ? '#f44336' : '#ffffff',
              color: isMarkingMode ? '#ffffff' : '#333333',
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
              pointerEvents: 'auto',
              '&:hover': {
                backgroundColor: isMarkingMode ? '#d32f2f' : '#f5f5f5',
              },
            }}
          >
            {isMarkingMode ? <AddLocationAltIcon /> : <AddLocationIcon />}
          </IconButton>
        </span>
      </Tooltip>
    </Box>
  );
}

