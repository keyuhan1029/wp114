'use client';

import * as React from 'react';
import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import LoginPageLayout from '@/components/Auth/LoginPageLayout';

function SetupUserIdContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [userId, setUserId] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const token = searchParams.get('token');

  React.useEffect(() => {
    if (!token) {
      router.push('/login');
    }
  }, [token, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!userId.trim()) {
      setError('請輸入用戶 ID');
      return;
    }

    // 驗證用戶 ID 格式（可選：只允許字母、數字、底線）
    if (!/^[a-zA-Z0-9_]+$/.test(userId)) {
      setError('用戶 ID 只能包含字母、數字和底線');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/auth/setup-userid', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ userId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || '設定失敗');
      }

      // 設定成功，重定向到教学页面
      router.push('/tutorial');
    } catch (err: any) {
      setError(err.message || '設定失敗，請稍後再試');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return null;
  }

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
        <Typography
          variant="h4"
          component="h1"
          sx={{
            mb: 1,
            fontWeight: 700,
            color: '#212121',
            textAlign: 'left',
          }}
        >
          設定用戶 ID
        </Typography>
        
        <Typography
          variant="body2"
          sx={{
            mb: 3,
            color: '#757575',
          }}
        >
          請輸入一個唯一的用戶 ID，用於識別您的帳號
        </Typography>

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

          <TextField
            fullWidth
            label="用戶 ID"
            placeholder="例如: john_doe_123"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            required
            disabled={loading}
            helperText="只能包含字母、數字和底線"
            sx={{
              mb: 3,
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
                backgroundColor: '#ffffff',
              },
            }}
          />

          <Button
            type="submit"
            fullWidth
            variant="contained"
            disabled={loading}
            sx={{
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
            {loading ? '設定中...' : '完成設定'}
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
}

function LoadingFallback() {
  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: 200,
      }}
    >
      <CircularProgress />
    </Box>
  );
}

export default function SetupUserIdPage() {
  return (
    <LoginPageLayout>
      <Suspense fallback={<LoadingFallback />}>
        <SetupUserIdContent />
      </Suspense>
    </LoginPageLayout>
  );
}
