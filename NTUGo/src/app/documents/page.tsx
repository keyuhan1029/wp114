'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import MainLayout from '@/components/Layout/MainLayout';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import TextField from '@mui/material/TextField';
import CircularProgress from '@mui/material/CircularProgress';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import ListItemSecondaryAction from '@mui/material/ListItemSecondaryAction';
import IconButton from '@mui/material/IconButton';
import DeleteIcon from '@mui/icons-material/Delete';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import DescriptionIcon from '@mui/icons-material/Description';

interface Document {
  id: string;
  title: string;
  description?: string;
  fileUrl: string;
  fileType: string;
  textChunksCount: number;
  createdAt: string;
  updatedAt: string;
}

export default function DocumentsPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [documents, setDocuments] = React.useState<Document[]>([]);
  const [uploading, setUploading] = React.useState(false);
  const [snackbarOpen, setSnackbarOpen] = React.useState(false);
  const [snackbarMessage, setSnackbarMessage] = React.useState('');
  const [snackbarSeverity, setSnackbarSeverity] = React.useState<'success' | 'error'>('success');
  
  const [title, setTitle] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
    setIsAuthenticated(true);
    setLoading(false);
    fetchDocuments();
  }, [router]);

  const fetchDocuments = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/documents', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('獲取文檔列表失敗');
      }

      const data = await response.json();
      setDocuments(data.documents || []);
    } catch (error) {
      console.error('獲取文檔列表錯誤:', error);
      showSnackbar('獲取文檔列表失敗', 'error');
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        showSnackbar('只支援 PDF 檔案', 'error');
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        showSnackbar('檔案大小不能超過 10MB', 'error');
        return;
      }
      setSelectedFile(file);
      if (!title) {
        setTitle(file.name.replace('.pdf', ''));
      }
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      showSnackbar('請選擇要上傳的檔案', 'error');
      return;
    }

    if (!title.trim()) {
      showSnackbar('請輸入文檔標題', 'error');
      return;
    }

    setUploading(true);
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('title', title.trim());
      if (description.trim()) {
        formData.append('description', description.trim());
      }

      const response = await fetch('/api/documents/upload', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      // 检查响应内容类型
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('服务器返回非 JSON 响应:', text.substring(0, 200));
        throw new Error('伺服器回應格式錯誤，請檢查伺服器日誌');
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || '上傳失敗');
      }

      const data = await response.json();
      showSnackbar('文檔上傳成功！', 'success');
      
      // 重置表单
      setSelectedFile(null);
      setTitle('');
      setDescription('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      // 刷新文档列表
      await fetchDocuments();
    } catch (error: any) {
      console.error('上傳文檔錯誤:', error);
      showSnackbar(error.message || '上傳文檔失敗', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (documentId: string) => {
    if (!confirm('確定要刪除此文檔嗎？')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/documents?id=${documentId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('刪除失敗');
      }

      showSnackbar('文檔已刪除', 'success');
      await fetchDocuments();
    } catch (error: any) {
      console.error('刪除文檔錯誤:', error);
      showSnackbar(error.message || '刪除文檔失敗', 'error');
    }
  };

  const showSnackbar = (message: string, severity: 'success' | 'error') => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <MainLayout>
      <Box sx={{ p: 4, maxWidth: 1200, mx: 'auto' }}>
        <Typography variant="h4" sx={{ mb: 4, fontWeight: 700, color: '#1a1a2e' }}>
          文檔管理
        </Typography>
        <Typography variant="body1" sx={{ mb: 4, color: '#757575' }}>
          上傳 PDF 文檔，讓 AI 客服能夠基於這些文檔回答台大相關問題。
        </Typography>

        {/* 上傳表單 */}
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
              上傳新文檔
            </Typography>

            <Box sx={{ mb: 2 }}>
              <input
                type="file"
                ref={fileInputRef}
                accept="application/pdf"
                onChange={handleFileSelect}
                style={{ display: 'none' }}
              />
              <Button
                variant="outlined"
                startIcon={<UploadFileIcon />}
                onClick={() => fileInputRef.current?.click()}
                sx={{ mb: 2 }}
              >
                選擇 PDF 檔案
              </Button>
              {selectedFile && (
                <Typography variant="body2" sx={{ ml: 2, display: 'inline-block', color: '#757575' }}>
                  {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                </Typography>
              )}
            </Box>

            <TextField
              fullWidth
              label="文檔標題"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="例如：台大新生手冊"
              sx={{ mb: 2 }}
              required
            />

            <TextField
              fullWidth
              label="文檔描述（選填）"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="簡短描述此文檔的內容"
              multiline
              rows={3}
              sx={{ mb: 3 }}
            />

            <Button
              variant="contained"
              onClick={handleUpload}
              disabled={!selectedFile || !title.trim() || uploading}
              startIcon={uploading ? <CircularProgress size={20} /> : <UploadFileIcon />}
              sx={{
                backgroundColor: '#0F4C75',
                '&:hover': {
                  backgroundColor: '#0a3a5a',
                },
              }}
            >
              {uploading ? '上傳中...' : '上傳文檔'}
            </Button>
          </CardContent>
        </Card>

        {/* 文檔列表 */}
        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
              已上傳的文檔 ({documents.length})
            </Typography>

            {documents.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <DescriptionIcon sx={{ fontSize: 64, color: '#e0e0e0', mb: 2 }} />
                <Typography variant="body1" color="text.secondary">
                  還沒有上傳任何文檔
                </Typography>
              </Box>
            ) : (
              <List>
                {documents.map((doc) => (
                  <ListItem
                    key={doc.id}
                    sx={{
                      borderBottom: '1px solid #e0e0e0',
                      '&:last-child': {
                        borderBottom: 'none',
                      },
                    }}
                  >
                    <ListItemText
                      primary={
                        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                          {doc.title}
                        </Typography>
                      }
                      secondary={
                        <>
                          {doc.description && (
                            <Typography 
                              component="span" 
                              variant="body2" 
                              color="text.secondary" 
                              sx={{ display: 'block', mb: 0.5 }}
                            >
                              {doc.description}
                            </Typography>
                          )}
                          <Typography 
                            component="span" 
                            variant="caption" 
                            color="text.secondary"
                            sx={{ display: 'block' }}
                          >
                            文本塊數：{doc.textChunksCount} | 
                            上傳時間：{new Date(doc.createdAt).toLocaleString('zh-TW')}
                          </Typography>
                        </>
                      }
                    />
                    <ListItemSecondaryAction>
                      <IconButton
                        edge="end"
                        onClick={() => handleDelete(doc.id)}
                        sx={{ color: '#d32f2f' }}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>
            )}
          </CardContent>
        </Card>
      </Box>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbarOpen(false)}
          severity={snackbarSeverity}
          sx={{ width: '100%' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </MainLayout>
  );
}

