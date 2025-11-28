'use client';

import * as React from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import Link from '@mui/material/Link';
import LoginForm from './LoginForm';
import GoogleLoginButton from './GoogleLoginButton';

interface LoginCardProps {
  onEmailLogin: (email: string, password: string) => Promise<void>;
  onGoogleLogin: () => void;
  isLoading?: boolean;
}

export default function LoginCard({ onEmailLogin, onGoogleLogin, isLoading }: LoginCardProps) {
  return (
    <Card
      sx={{
        width: '100%',
        maxWidth: 450,
        borderRadius: 3,
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
        backgroundColor: '#ffffff',
      }}
    >
      <CardContent sx={{ p: 4 }}>
        {/* Title */}
        <Typography
          variant="h4"
          component="h1"
          sx={{
            mb: 3,
            fontWeight: 700,
            color: '#212121',
            textAlign: 'left',
          }}
        >
          登入
        </Typography>

        {/* Login Form */}
        <LoginForm onSubmit={onEmailLogin} />

        {/* Divider */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            mb: 3,
          }}
        >
          <Divider sx={{ flexGrow: 1 }} />
          <Typography
            variant="body2"
            sx={{
              px: 2,
              color: '#757575',
            }}
          >
            或
          </Typography>
          <Divider sx={{ flexGrow: 1 }} />
        </Box>

        {/* Google Login Button */}
        <GoogleLoginButton onClick={onGoogleLogin} disabled={isLoading} />

        {/* Create Account Link */}
        <Box
          sx={{
            textAlign: 'center',
            mt: 2,
          }}
        >
          <Typography
            variant="body2"
            sx={{
              color: '#757575',
            }}
          >
            沒有帳戶?{' '}
            <Link
              href="/register"
              sx={{
                color: '#0F4C75',
                fontWeight: 600,
                textDecoration: 'none',
                '&:hover': {
                  textDecoration: 'underline',
                },
              }}
            >
              建立帳戶
            </Link>
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
}

