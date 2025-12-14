'use client';

import * as React from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import ImageIcon from '@mui/icons-material/Image';
import CloseIcon from '@mui/icons-material/Close';
import IconButton from '@mui/material/IconButton';

interface BikeMarkerPhotoDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (imageUrl: string | null, imagePublicId: string | null) => void;
}

export default function BikeMarkerPhotoDialog({
  open,
  onClose,
  onConfirm,
}: BikeMarkerPhotoDialogProps) {
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);
  const [uploading, setUploading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // 當對話框關閉時重置狀態
  React.useEffect(() => {
    if (!open) {
      setSelectedFile(null);
      setPreviewUrl(null);
      setUploading(false);
      setError(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }, [open]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 驗證文件類型
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setError('不支援的圖片格式，請選擇 JPEG、PNG、GIF 或 WebP');
      return;
    }

    // 驗證文件大小 (10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      setError('圖片大小不能超過 10MB');
      return;
    }

    setError(null);
    setSelectedFile(file);

    // 創建預覽 URL
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleConfirm = async () => {
    if (!selectedFile) {
      // 沒有選擇照片，直接確認（跳過上傳）
      onConfirm(null, null);
      return;
    }

    // 上傳照片
    setUploading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('請先登入');
      }

      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('folder', 'bike-markers'); // 指定文件夹

      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || '上傳失敗');
      }

      const data = await response.json();
      if (data.success && data.file) {
        onConfirm(data.file.url, data.file.publicId);
      } else {
        throw new Error('上傳失敗');
      }
    } catch (err: any) {
      console.error('上傳照片失敗:', err);
      setError(err.message || '上傳照片失敗，請稍後再試');
      setUploading(false);
    }
  };

  const handleCancel = () => {
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleCancel}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
        },
      }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <ImageIcon />
          <Typography variant="h6">上傳腳踏車位置照片</Typography>
        </Box>
        <IconButton onClick={handleCancel} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            您可以選擇上傳一張照片來記錄腳踏車位置（可選）
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          {!previewUrl ? (
            <Box
              sx={{
                border: '2px dashed',
                borderColor: 'divider',
                borderRadius: 2,
                p: 4,
                textAlign: 'center',
                cursor: 'pointer',
                '&:hover': {
                  borderColor: 'primary.main',
                  backgroundColor: 'action.hover',
                },
              }}
              onClick={() => fileInputRef.current?.click()}
            >
              <ImageIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
              <Typography variant="body1" sx={{ mb: 1 }}>
                點擊選擇照片
              </Typography>
              <Typography variant="body2" color="text.secondary">
                支援 JPEG、PNG、GIF、WebP，最大 10MB
              </Typography>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                onChange={handleFileSelect}
                style={{ display: 'none' }}
              />
            </Box>
          ) : (
            <Box sx={{ position: 'relative' }}>
              <Box
                component="img"
                src={previewUrl}
                alt="預覽"
                sx={{
                  width: '100%',
                  maxHeight: 400,
                  objectFit: 'contain',
                  borderRadius: 2,
                  border: '1px solid',
                  borderColor: 'divider',
                }}
              />
              <IconButton
                onClick={handleRemovePhoto}
                sx={{
                  position: 'absolute',
                  top: 8,
                  right: 8,
                  backgroundColor: 'rgba(0, 0, 0, 0.5)',
                  color: 'white',
                  '&:hover': {
                    backgroundColor: 'rgba(0, 0, 0, 0.7)',
                  },
                }}
              >
                <CloseIcon />
              </IconButton>
            </Box>
          )}

          {uploading && (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mt: 2 }}>
              <CircularProgress size={24} sx={{ mr: 1 }} />
              <Typography variant="body2" color="text.secondary">
                上傳中...
              </Typography>
            </Box>
          )}
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button onClick={handleCancel} disabled={uploading}>
          取消
        </Button>
        <Button
          onClick={handleConfirm}
          variant="contained"
          disabled={uploading}
          sx={{ textTransform: 'none' }}
        >
          {selectedFile ? '確認並上傳' : '跳過（不上傳照片）'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

