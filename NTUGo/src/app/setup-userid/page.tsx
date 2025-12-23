'use client';

import * as React from 'react';
import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import LoginPageLayout from '@/components/Auth/LoginPageLayout';
import SetupUserIdForm from '@/components/Auth/SetupUserIdForm';

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
    <SetupUserIdForm
      userId={userId}
      loading={loading}
      error={error}
      onUserIdChange={setUserId}
      onSubmit={handleSubmit}
    />
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
