'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import LoginPageLayout from '@/components/Auth/LoginPageLayout';
import RegisterForm from '@/components/Auth/RegisterForm';

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [name, setName] = React.useState('');
  const [verificationCode, setVerificationCode] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const [codeSent, setCodeSent] = React.useState(false);
  const [sendingCode, setSendingCode] = React.useState(false);
  const [countdown, setCountdown] = React.useState(0);
  const [codeError, setCodeError] = React.useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // 檢查是否已發送並輸入驗證碼
      if (!codeSent || !verificationCode) {
        throw new Error('請先發送並輸入驗證碼');
      }

      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, name, verificationCode }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || '註冊失敗');
      }

      // 儲存 token
      if (data.token) {
        localStorage.setItem('token', data.token);
        // 新註冊的用戶需要設定 userId
        router.push(`/setup-userid?token=${data.token}`);
      } else {
        router.push('/');
      }
    } catch (err: any) {
      setError(err.message || '註冊失敗，請稍後再試');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = '/api/auth/google';
  };

  // 發送驗證碼
  const handleSendVerificationCode = async () => {
    if (!email) {
      setCodeError('請先輸入郵箱');
      return;
    }

    try {
      setSendingCode(true);
      setCodeError('');

      const response = await fetch('/api/auth/verify-email/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || '發送驗證碼失敗');
      }

      setCodeSent(true);
      setCountdown(60); // 60 秒倒計時

      // 開始倒計時
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (err: any) {
      setCodeError(err.message || '發送驗證碼失敗');
    } finally {
      setSendingCode(false);
    }
  };

  return (
    <LoginPageLayout>
      <RegisterForm
        email={email}
        password={password}
        name={name}
        verificationCode={verificationCode}
        loading={loading}
        error={error}
        codeSent={codeSent}
        sendingCode={sendingCode}
        countdown={countdown}
        codeError={codeError}
        onEmailChange={setEmail}
        onPasswordChange={setPassword}
        onNameChange={setName}
        onCodeChange={setVerificationCode}
        onSendCode={handleSendVerificationCode}
        onSubmit={handleSubmit}
        onGoogleLogin={handleGoogleLogin}
      />
    </LoginPageLayout>
  );
}
