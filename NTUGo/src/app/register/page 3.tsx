'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Link from '@mui/material/Link';
import Divider from '@mui/material/Divider';
import LoginPageLayout from '@/components/Auth/LoginPageLayout';
import GoogleLoginButton from '@/components/Auth/GoogleLoginButton';

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [name, setName] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, name }),
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

  return (
    <LoginPageLayout>
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
              mb: 3,
              fontWeight: 700,
              color: '#212121',
              textAlign: 'left',
            }}
          >
            建立帳戶
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
              label="姓名"
              placeholder="姓名"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={loading}
              sx={{
                mb: 2,
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  backgroundColor: '#ffffff',
                },
              }}
            />

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
              {loading ? '註冊中...' : '建立帳戶'}
            </Button>

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

            <GoogleLoginButton onClick={handleGoogleLogin} disabled={loading} />

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
                已有帳戶?{' '}
                <Link
                  href="/login"
                  sx={{
                    color: '#0F4C75',
                    fontWeight: 600,
                    textDecoration: 'none',
                    '&:hover': {
                      textDecoration: 'underline',
                    },
                  }}
                >
                  登入
                </Link>
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </LoginPageLayout>
  );
}

