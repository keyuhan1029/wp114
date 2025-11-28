'use client';

import * as React from 'react';
import Button from '@mui/material/Button';

interface GoogleLoginButtonProps {
  onClick: () => void;
  disabled?: boolean;
}

export default function GoogleLoginButton({ onClick, disabled }: GoogleLoginButtonProps) {
  return (
    <Button
      fullWidth
      variant="outlined"
      onClick={onClick}
      disabled={disabled}
      sx={{
        mb: 3,
        py: 1.5,
        borderRadius: 2,
        borderColor: '#e0e0e0',
        backgroundColor: '#ffffff',
        color: '#212121',
        fontWeight: 500,
        fontSize: '1rem',
        textTransform: 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 1.5,
        '&:hover': {
          borderColor: '#bdbdbd',
          backgroundColor: '#fafafa',
        },
        '&:disabled': {
          borderColor: '#e0e0e0',
          backgroundColor: '#f5f5f5',
          color: '#9e9e9e',
        },
      }}
    >
      {/* Google Logo */}
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          fill="#4285F4"
        />
        <path
          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          fill="#34A853"
        />
        <path
          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          fill="#FBBC05"
        />
        <path
          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          fill="#EA4335"
        />
      </svg>
      以 Google 帳戶登入
    </Button>
  );
}

