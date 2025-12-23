'use client';

import * as React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import PushPinIcon from '@mui/icons-material/PushPin';
import type { AnnouncementCategory } from '@/lib/models/Announcement';

interface AnnouncementCardProps {
  id: string;
  title: string;
  content: string;
  category: AnnouncementCategory;
  publishDate: string;
  sourceUrl: string;
  isPinned: boolean;
  onClick?: () => void;
}

const categoryColors: Record<AnnouncementCategory, string> = {
  '社團資訊': '#2196f3',
  '國際交流': '#4caf50',
  '社會服務': '#9c27b0',
  '小福/鹿鳴堂': '#ff9800',
  '一般公告': '#757575',
};

export default function AnnouncementCard({
  id,
  title,
  content,
  category,
  publishDate,
  sourceUrl,
  isPinned,
  onClick,
}: AnnouncementCardProps) {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('zh-TW', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const previewContent = content.length > 150 ? content.substring(0, 150) + '...' : content;

  return (
    <Card
      sx={{
        mb: 2,
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.2s',
        borderLeft: `4px solid ${categoryColors[category] || '#757575'}`,
        '&:hover': onClick ? {
          boxShadow: 4,
          transform: 'translateY(-2px)',
        } : {},
      }}
      onClick={onClick}
    >
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
          <Box sx={{ flex: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              {isPinned && (
                <PushPinIcon sx={{ fontSize: '1rem', color: '#ff9800' }} />
              )}
              <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1rem' }}>
                {title}
              </Typography>
            </Box>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                mb: 1.5,
                lineHeight: 1.6,
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}
            >
              {previewContent}
            </Typography>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <Chip
              label={category}
              size="small"
              sx={{
                backgroundColor: categoryColors[category] || '#757575',
                color: 'white',
                fontWeight: 500,
                fontSize: '0.75rem',
              }}
            />
            <Typography variant="caption" color="text.secondary">
              {formatDate(publishDate)}
            </Typography>
          </Box>
          {sourceUrl && (
            <Typography
              variant="caption"
              component="a"
              href={sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              sx={{
                color: 'primary.main',
                textDecoration: 'none',
                '&:hover': {
                  textDecoration: 'underline',
                },
              }}
              onClick={(e) => e.stopPropagation()}
            >
              查看原文 →
            </Typography>
          )}
        </Box>
      </CardContent>
    </Card>
  );
}

