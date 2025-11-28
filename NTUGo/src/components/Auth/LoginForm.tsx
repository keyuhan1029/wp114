'use client';

import * as React from 'react';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Link from '@mui/material/Link';
import { useRouter } from 'next/navigation';

interface LoginFormProps {
  onSubmit?: (email: string, password: string) => Promise<void>;
}

export default function LoginForm({ onSubmit }: LoginFormProps) {
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // 如果有自定義的 onSubmit，使用它
      if (onSubmit) {
        await onSubmit(email, password);
        router.push('/');
        return;
      }

      // 否則使用默認的登入邏輯
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        // 如果是 provider 錯誤，顯示特殊提示
        if (data.provider === 'google') {
          setError('此帳號使用 Google 登入，請使用 Google 登入按鈕');
        } else {
          setError(data.message || '登入失敗，請檢查您的帳號密碼');
        }
        return;
      }

      // 儲存 token
      if (data.token) {
        localStorage.setItem('token', data.token);
      }

      router.push('/');
    } catch (err: any) {
      setError(err.message || '登入失敗，請檢查您的帳號密碼');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit}>
      {error && (
        <Box
          sx={{
            mb: 2,
            p: 1.5,
            borderRadius: 1,
            backgroundColor: '#ffebee',
            color: '#c62828',
            fontSize: '0.875rem',
          }}
        >
          {error}
        </Box>
      )}

      {/* Email Field */}
      <TextField
        fullWidth
        type="email"
        label="電子郵件"
        placeholder="電子郵件"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        disabled={loading}
        sx={{
          mb: 2,
          '& .MuiOutlinedInput-root': {
            borderRadius: 2,
            backgroundColor: '#ffffff',
          },
        }}
      />

      {/* Password Field */}
      <TextField
        fullWidth
        type="password"
        label="密碼"
        placeholder="密碼"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        disabled={loading}
        sx={{
          mb: 1,
          '& .MuiOutlinedInput-root': {
            borderRadius: 2,
            backgroundColor: '#ffffff',
          },
        }}
      />

      {/* Forgot Password Link */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 3 }}>
        <Link
          href="#"
          sx={{
            fontSize: '0.875rem',
            color: '#757575',
            textDecoration: 'none',
            '&:hover': {
              textDecoration: 'underline',
            },
          }}
        >
          忘記密碼?
        </Link>
      </Box>

      {/* Login Button */}
      <Button
        type="submit"
        fullWidth
        variant="contained"
        disabled={loading}
        sx={{
          mb: 3,
          py: 1.5,
          borderRadius: 2,
          backgroundColor: '#0F4C75',
          color: '#ffffff',
          fontWeight: 600,
          fontSize: '1rem',
          textTransform: 'none',
          '&:hover': {
            backgroundColor: '#0a3a5a',
          },
          '&:disabled': {
            backgroundColor: '#cccccc',
          },
        }}
      >
        {loading ? '登入中...' : '登入'}
      </Button>
    </Box>
  );
}

