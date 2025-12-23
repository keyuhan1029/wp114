'use client';

import * as React from 'react';
import Box from '@mui/material/Box';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import { MapProvider } from '@/contexts/MapContext';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <MapProvider>
      <Box sx={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
        <Sidebar />
        <Box 
          component="main" 
          sx={{ 
            flexGrow: 1, 
            position: 'relative', 
            height: '100%',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <TopBar />
          <Box
            sx={{
              flex: 1,
              position: 'relative',
              width: '100%',
              height: '100%',
              overflow: 'auto',
              minHeight: 0,
            }}
          >
            {children}
          </Box>
        </Box>
      </Box>
    </MapProvider>
  );
}


