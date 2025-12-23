'use client';

import * as React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import DeleteIcon from '@mui/icons-material/Delete';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';

// 取得縮圖 URL（客戶端版本）
const getThumbnailUrl = (url: string, width: number = 200, height: number = 200): string => {
  // 如果是 Cloudinary URL，添加轉換參數
  if (url && url.includes('cloudinary.com')) {
    // 檢查是否已經有轉換參數
    if (url.includes('/upload/c_')) {
      return url; // 已經有轉換參數，直接返回
    }
    // 添加轉換參數
    return url.replace('/upload/', `/upload/c_fill,w_${width},h_${height}/`);
  }
  return url;
};

interface UserBikeMarkerContentProps {
  markerId: string;
  note?: string;
  lat: number;
  lng: number;
  imageUrl?: string;
  createdAt?: Date | string;
  onDelete: (markerId: string) => void;
}

export default function UserBikeMarkerContent({
  markerId,
  note,
  lat,
  lng,
  imageUrl,
  createdAt,
  onDelete,
}: UserBikeMarkerContentProps) {
  const [imageDialogOpen, setImageDialogOpen] = React.useState(false);

  // 格式化日期時間
  const formatDateTime = (date: Date | string | undefined) => {
    if (!date) return null;
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleString('zh-TW', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };
  return (
    <Box>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          mb: 2,
          p: 1.5,
          backgroundColor: '#e8f5e9',
          borderRadius: 2,
        }}
      >
        <LocationOnIcon sx={{ color: '#4caf50' }} />
        <Typography variant="body1" sx={{ fontWeight: 600, color: '#2e7d32' }}>
          我的腳踏車位置
        </Typography>
      </Box>

      {note && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
            備註：
          </Typography>
          <Typography variant="body1">{note}</Typography>
        </Box>
      )}

      {imageUrl && imageUrl.trim() !== '' && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
            照片：
          </Typography>
          <Box
            sx={{
              width: '100%',
              maxHeight: 200,
              borderRadius: 2,
              border: '1px solid',
              borderColor: 'divider',
              overflow: 'hidden',
              position: 'relative',
              backgroundColor: '#f5f5f5',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: 150,
            }}
          >
            <Box
              component="img"
              src={getThumbnailUrl(imageUrl, 300, 300)}
              alt="腳踏車位置照片"
              onClick={() => setImageDialogOpen(true)}
              onError={(e) => {
                console.error('圖片載入失敗:', imageUrl, e);
              }}
              sx={{
                width: '100%',
                height: 'auto',
                maxHeight: 200,
                objectFit: 'contain',
                cursor: 'pointer',
                display: 'block',
                '&:hover': {
                  opacity: 0.8,
                },
              }}
            />
          </Box>
        </Box>
      )}

      <Box sx={{ mb: 2 }}>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
          位置：
        </Typography>
        <Typography variant="body2">
          緯度: {lat.toFixed(6)}, 經度: {lng.toFixed(6)}
        </Typography>
      </Box>

      {createdAt && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
            標記時間：
          </Typography>
          <Typography variant="body2">
            {formatDateTime(createdAt)}
          </Typography>
        </Box>
      )}

      <Button
        variant="outlined"
        color="error"
        startIcon={<DeleteIcon />}
        onClick={() => onDelete(markerId)}
        fullWidth
        sx={{
          textTransform: 'none',
        }}
      >
        刪除此標記
      </Button>

      {/* 照片放大查看對話框 */}
      <Dialog
        open={imageDialogOpen}
        onClose={() => setImageDialogOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            backgroundColor: 'transparent',
            boxShadow: 'none',
          },
        }}
      >
        <DialogContent sx={{ p: 0, position: 'relative' }}>
          <IconButton
            onClick={() => setImageDialogOpen(false)}
            sx={{
              position: 'absolute',
              top: 8,
              right: 8,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              color: 'white',
              zIndex: 1,
              '&:hover': {
                backgroundColor: 'rgba(0, 0, 0, 0.7)',
              },
            }}
          >
            <CloseIcon />
          </IconButton>
          <Box
            component="img"
            src={imageUrl}
            alt="腳踏車位置照片"
            sx={{
              width: '100%',
              height: 'auto',
              maxHeight: '80vh',
              objectFit: 'contain',
              borderRadius: 2,
            }}
          />
        </DialogContent>
      </Dialog>
    </Box>
  );
}

