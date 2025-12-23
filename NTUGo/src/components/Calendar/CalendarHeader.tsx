'use client';

import * as React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import TodayIcon from '@mui/icons-material/Today';
import AddIcon from '@mui/icons-material/Add';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import InfoIcon from '@mui/icons-material/Info';
import { formatMonthYear } from './utils';

interface CalendarHeaderProps {
  currentMonth: Date;
  onPreviousMonth: () => void;
  onNextMonth: () => void;
  onToday: () => void;
  onCreateEvent: () => void;
  onImportIcs: (file: File) => void;
  onShowImportHelp: () => void;
}

export default function CalendarHeader({
  currentMonth,
  onPreviousMonth,
  onNextMonth,
  onToday,
  onCreateEvent,
  onImportIcs,
  onShowImportHelp,
}: CalendarHeaderProps) {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        mb: 2,
        flexShrink: 0,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <IconButton onClick={onPreviousMonth}>
          <ArrowBackIosNewIcon />
        </IconButton>
        <Typography variant="h6">{formatMonthYear(currentMonth)}</Typography>
        <IconButton onClick={onNextMonth}>
          <ArrowForwardIosIcon />
        </IconButton>
        <Button startIcon={<TodayIcon />} onClick={onToday}>
          今天
        </Button>
        <Button variant="contained" startIcon={<AddIcon />} onClick={onCreateEvent}>
          新增行程
        </Button>
        <Button
          variant="outlined"
          startIcon={<FileUploadIcon />}
          component="label"
        >
          匯入行程
          <input
            type="file"
            accept=".ics,text/calendar"
            hidden
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                onImportIcs(file);
                e.target.value = ''; // 重置以允許再次選擇同一檔案
              }
            }}
          />
        </Button>
        <Tooltip title="如何匯入 NTU COOL 行事曆？">
          <IconButton size="small" onClick={onShowImportHelp} sx={{ ml: 0.5 }}>
            <InfoIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>
    </Box>
  );
}

