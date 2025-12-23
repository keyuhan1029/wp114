'use client';

import * as React from 'react';
import Box from '@mui/material/Box';
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
    <Box>
      {/* Title */}
      <Typography
        variant="h4"
        component="h1"
        sx={{
          mb: 1,
          fontWeight: 700,
          color: '#1a1a2e',
          textAlign: 'left',
          fontSize: { xs: '1.75rem', md: '2rem' },
        }}
      >
        登入
      </Typography>
      <Typography
        variant="body2"
        sx={{
          mb: 4,
          color: '#757575',
          textAlign: 'left',
        }}
      >
        Sign in to your account
      </Typography>

      {/* Login Form */}
      <LoginForm onSubmit={onEmailLogin} />

      {/* Divider */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          mb: 3,
          mt: 3,
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
          mt: 3,
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
    </Box>
  );
}


