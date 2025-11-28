'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import LoginPageLayout from '@/components/Auth/LoginPageLayout';
import LoginCard from '@/components/Auth/LoginCard';

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = React.useState(false);

  const handleEmailLogin = async (email: string, password: string) => {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      // 如果是 provider 錯誤，拋出特殊錯誤
      if (data.provider === 'google') {
        throw new Error('此帳號使用 Google 登入，請使用 Google 登入按鈕');
      }
      throw new Error(data.message || '登入失敗');
    }

    // 儲存 token
    if (data.token) {
      localStorage.setItem('token', data.token);
    }
  };

  const handleGoogleLogin = () => {
    setIsLoading(true);
    // 重定向到 Google OAuth 端點
    window.location.href = '/api/auth/google';
  };

  return (
    <LoginPageLayout>
      <LoginCard
        onEmailLogin={handleEmailLogin}
        onGoogleLogin={handleGoogleLogin}
        isLoading={isLoading}
      />
    </LoginPageLayout>
  );
}

