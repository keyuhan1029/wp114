'use client';

import * as React from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import { EditDialogState } from './types';

interface EventEditDialogProps {
  open: boolean;
  dialogState: EditDialogState;
  onClose: () => void;
  onSubmit: () => void;
  onFieldChange: (field: keyof EditDialogState, value: any) => void;
}

export default function EventEditDialog({
  open,
  dialogState,
  onClose,
  onSubmit,
  onFieldChange,
}: EventEditDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {dialogState.mode === 'create' ? '新增行程' : '編輯行程'}
      </DialogTitle>
      <DialogContent dividers>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          <TextField
            label="標題"
            value={dialogState.title}
            onChange={(e) => onFieldChange('title', e.target.value)}
            fullWidth
            required
          />
          <TextField
            label="地點"
            value={dialogState.location}
            onChange={(e) => onFieldChange('location', e.target.value)}
            fullWidth
          />
          <TextField
            label="開始時間"
            type="datetime-local"
            value={dialogState.startTime}
            onChange={(e) => onFieldChange('startTime', e.target.value)}
            fullWidth
            InputLabelProps={{ shrink: true }}
            required
          />
          <TextField
            label="結束時間"
            type="datetime-local"
            value={dialogState.endTime}
            onChange={(e) => onFieldChange('endTime', e.target.value)}
            fullWidth
            InputLabelProps={{ shrink: true }}
            required
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={dialogState.allDay}
                onChange={(e) => onFieldChange('allDay', e.target.checked)}
              />
            }
            label="整日活動"
          />
          <TextField
            label="備註"
            value={dialogState.description}
            onChange={(e) => onFieldChange('description', e.target.value)}
            fullWidth
            multiline
            minRows={2}
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>取消</Button>
        <Button variant="contained" onClick={onSubmit}>
          儲存
        </Button>
      </DialogActions>
    </Dialog>
  );
}

