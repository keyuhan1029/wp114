'use client';

import * as React from 'react';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Link from '@mui/material/Link';
import Divider from '@mui/material/Divider';
import GoogleLoginButton from '@/components/Auth/GoogleLoginButton';
import VerificationCodeInput from '@/components/Auth/VerificationCodeInput';

interface RegisterFormProps {
  email: string;
  password: string;
  name: string;
  verificationCode: string;
  loading: boolean;
  error: string;
  codeSent: boolean;
  sendingCode: boolean;
  countdown: number;
  codeError: string;
  onEmailChange: (email: string) => void;
  onPasswordChange: (password: string) => void;
  onNameChange: (name: string) => void;
  onCodeChange: (code: string) => void;
  onSendCode: () => void;
  onSubmit: (e: React.FormEvent) => void;
  onGoogleLogin: () => void;
}

export default function RegisterForm({
  email,
  password,
  name,
  verificationCode,
  loading,
  error,
  codeSent,
  sendingCode,
  countdown,
  codeError,
  onEmailChange,
  onPasswordChange,
  onNameChange,
  onCodeChange,
  onSendCode,
  onSubmit,
  onGoogleLogin,
}: RegisterFormProps) {
  return (
    <Box>
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
        註冊
      </Typography>
      <Typography
        variant="body2"
        sx={{
          mb: 4,
          color: '#757575',
          textAlign: 'left',
        }}
      >
        Create your free account
      </Typography>

        <Box component="form" onSubmit={onSubmit}>
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
            label="Name:"
            placeholder="Your name"
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
            disabled={loading}
            sx={{
              mb: 2,
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
                backgroundColor: '#ffffff',
              },
              '& .MuiInputLabel-root': {
                fontSize: '0.875rem',
                fontWeight: 500,
              },
            }}
          />

          <TextField
            fullWidth
            type="email"
            label="E-mail address:"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => onEmailChange(e.target.value)}
            required
            disabled={loading}
            error={!!codeError && email.length > 0}
            helperText={codeError || ''}
            sx={{
              mb: 2,
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
                backgroundColor: '#ffffff',
              },
              '& .MuiInputLabel-root': {
                fontSize: '0.875rem',
                fontWeight: 500,
              },
            }}
          />

          <VerificationCodeInput
            email={email}
            code={verificationCode}
            codeSent={codeSent}
            sendingCode={sendingCode}
            countdown={countdown}
            codeError={codeError}
            loading={loading}
            onCodeChange={onCodeChange}
            onSendCode={onSendCode}
          />

          <TextField
            fullWidth
            type="password"
            label="Password:"
            placeholder="Enter 8 characters or more"
            value={password}
            onChange={(e) => onPasswordChange(e.target.value)}
            required
            disabled={loading}
            sx={{
              mb: 3,
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
                backgroundColor: '#ffffff',
              },
              '& .MuiInputLabel-root': {
                fontSize: '0.875rem',
                fontWeight: 500,
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
            {loading ? '註冊中...' : 'CREATE ACCOUNT'}
          </Button>

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

          <GoogleLoginButton onClick={onGoogleLogin} disabled={loading} />

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
    </Box>
  );
}

