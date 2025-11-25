'use client';

import * as React from 'react';
import Box from '@mui/material/Box';
import Avatar from '@mui/material/Avatar';
import IconButton from '@mui/material/IconButton';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import Tooltip from '@mui/material/Tooltip';

export default function TopBar() {
  return (
    <Box
      sx={{
        position: 'absolute',
        top: 16,
        right: 16,
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        zIndex: 1100, // Above map
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        padding: '8px 16px',
        borderRadius: '24px',
        backdropFilter: 'blur(4px)',
      }}
    >
      <Tooltip title="個人行事曆 (Coming Soon)">
        <IconButton>
          <CalendarMonthIcon sx={{ color: 'black' }} />
        </IconButton>
      </Tooltip>
      <Tooltip title="個人主頁">
        <IconButton sx={{ p: 0 }}>
          <Avatar alt="User Avatar" src="/static/images/avatar/1.jpg" sx={{ bgcolor: 'black' }}>
            U
          </Avatar>
        </IconButton>
      </Tooltip>
    </Box>
  );
}


