'use client';

import * as React from 'react';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import CloseIcon from '@mui/icons-material/Close';

interface ImportHelpDialogProps {
  open: boolean;
  onClose: () => void;
}

export default function ImportHelpDialog({ open, onClose }: ImportHelpDialogProps) {
  if (!open) return null;

  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 1300,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      onClick={onClose}
    >
      <Card
        sx={{
          maxWidth: 900,
          width: '90%',
          maxHeight: '90vh',
          overflow: 'auto',
          boxShadow: 12,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <CardContent sx={{ position: 'relative', p: 3 }}>
          <IconButton
            size="small"
            onClick={onClose}
            sx={{ position: 'absolute', top: 12, right: 12 }}
          >
            <CloseIcon />
          </IconButton>
          <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
            如何從 NTU COOL 匯入行事曆？
          </Typography>
          <Box
            component="img"
            src="/ntucool_calander_QA.png"
            alt="NTU COOL 行事曆匯入說明"
            sx={{ width: '100%', borderRadius: 1 }}
          />
        </CardContent>
      </Card>
    </Box>
  );
}

