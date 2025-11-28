'use client';

import * as React from 'react';
import Box from '@mui/material/Box';
import Image from 'next/image';

interface LoginPageLayoutProps {
  children: React.ReactNode;
}

export default function LoginPageLayout({ children }: LoginPageLayoutProps) {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f5f5f5',
        padding: 3,
      }}
    >
      {/* Logo */}
      <Box
        sx={{
          mb: 4,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Image
          src="/logo.svg"
          alt="NTUGo Logo"
          width={300}
          height={90}
          priority
          style={{ maxWidth: '100%', height: 'auto' }}
        />
      </Box>

      {/* Content */}
      {children}
    </Box>
  );
}

