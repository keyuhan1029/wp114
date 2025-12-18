'use client';

import * as React from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';

interface SetupUserIdFormProps {
  userId: string;
  loading: boolean;
  error: string;
  onUserIdChange: (userId: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export default function SetupUserIdForm({
  userId,
  loading,
  error,
  onUserIdChange,
  onSubmit,
}: SetupUserIdFormProps) {
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
            label="用戶 ID"
            placeholder="例如: john_doe_123"
            value={userId}
            onChange={(e) => onUserIdChange(e.target.value)}
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

