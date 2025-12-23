'use client';

import * as React from 'react';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';

interface VerificationCodeInputProps {
  email: string;
  code: string;
  codeSent: boolean;
  sendingCode: boolean;
  countdown: number;
  codeError: string;
  loading: boolean;
  onCodeChange: (code: string) => void;
  onSendCode: () => void;
}

export default function VerificationCodeInput({
  email,
  code,
  codeSent,
  sendingCode,
  countdown,
  codeError,
  loading,
  onCodeChange,
  onSendCode,
}: VerificationCodeInputProps) {
  if (!email) return null;

  return (
    <Box sx={{ mb: 2 }}>
      <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
        <TextField
          fullWidth
          label="驗證碼"
          placeholder="請輸入 6 位數字驗證碼"
          value={code}
          onChange={(e) => {
            const value = e.target.value.replace(/\D/g, '').slice(0, 6);
            onCodeChange(value);
          }}
          disabled={loading || !codeSent}
          required
          error={!!codeError}
          helperText={codeError}
          inputProps={{
            maxLength: 6,
            pattern: '[0-9]*',
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: 2,
              backgroundColor: '#ffffff',
            },
          }}
        />
        <Button
          type="button"
          variant="outlined"
          onClick={onSendCode}
          disabled={loading || sendingCode || countdown > 0 || !email}
          sx={{
            minWidth: 120,
            borderRadius: 2,
            textTransform: 'none',
            borderColor: '#0F4C75',
            color: '#0F4C75',
            '&:hover': {
              borderColor: '#0a3a5a',
              backgroundColor: 'rgba(15, 76, 117, 0.04)',
            },
          }}
        >
          {sendingCode
            ? '發送中...'
            : countdown > 0
            ? `${countdown}秒`
            : codeSent
            ? '重新發送'
            : '發送驗證碼'}
        </Button>
      </Box>
      {codeSent && (
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', ml: 1 }}>
          驗證碼已發送到 {email}，請檢查您的郵箱
        </Typography>
      )}
    </Box>
  );
}

