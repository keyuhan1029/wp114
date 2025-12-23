'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import LoginPageLayout from '@/components/Auth/LoginPageLayout';
import LoginCard from '@/components/Auth/LoginCard';

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // 檢查 URL 參數中的錯誤
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const errorParam = params.get('error');
    if (errorParam) {
      const errorMessages: Record<string, string> = {
        no_code: '未收到 Google 授權碼，請重試',
        oauth_not_configured: 'Google OAuth 未配置，請聯繫管理員',
        token_exchange_failed: 'Google 授權驗證失敗，請重試',
        user_info_failed: '無法獲取 Google 用戶資訊，請重試',
        email_not_verified: '您的 Google 帳號未驗證電子郵件',
        user_creation_failed: '創建用戶失敗，請重試',
        oauth_error: 'Google 登入發生錯誤，請重試',
      };
      setError(errorMessages[errorParam] || '登入失敗，請重試');
      // 清除 URL 參數
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

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
        error={error}
      />
    </LoginPageLayout>
  );
}

