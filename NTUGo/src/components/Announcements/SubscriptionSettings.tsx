'use client';

import * as React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import FormGroup from '@mui/material/FormGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import type { AnnouncementCategory } from '@/lib/models/Announcement';

const CATEGORIES: AnnouncementCategory[] = [
  '社團資訊',
  '國際交流',
  '社會服務',
  '小福/鹿鳴堂',
  '一般公告',
];

interface SubscriptionSettingsProps {
  onClose?: () => void;
}

export default function SubscriptionSettings({ onClose }: SubscriptionSettingsProps) {
  const [selectedCategories, setSelectedCategories] = React.useState<AnnouncementCategory[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState(false);

  // 加载当前订阅设置
  React.useEffect(() => {
    const loadSubscription = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;

      try {
        setLoading(true);
        const response = await fetch('/api/announcements/subscriptions', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          if (data.subscription && data.subscription.categories) {
            setSelectedCategories(data.subscription.categories);
          }
        }
      } catch (err) {
        console.error('加载订阅设置失败:', err);
      } finally {
        setLoading(false);
      }
    };

    loadSubscription();
  }, []);

  const handleCategoryToggle = (category: AnnouncementCategory) => {
    setSelectedCategories((prev) => {
      if (prev.includes(category)) {
        return prev.filter((c) => c !== category);
      } else {
        return [...prev, category];
      }
    });
  };

  const handleSave = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setError('請先登入');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      setSuccess(false);

      const response = await fetch('/api/announcements/subscriptions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          categories: selectedCategories,
        }),
      });

      if (response.ok) {
        setSuccess(true);
        setTimeout(() => {
          setSuccess(false);
          if (onClose) onClose();
        }, 1500);
      } else {
        const data = await response.json();
        setError(data.message || '儲存失敗');
      }
    } catch (err: any) {
      setError(err.message || '儲存失敗');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
        訂閱設定
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        選擇您想要接收的活動公告類型
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          訂閱設定已儲存
        </Alert>
      )}

      <FormGroup>
        {CATEGORIES.map((category) => (
          <FormControlLabel
            key={category}
            control={
              <Checkbox
                checked={selectedCategories.includes(category)}
                onChange={() => handleCategoryToggle(category)}
              />
            }
            label={category}
          />
        ))}
      </FormGroup>

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 3 }}>
        {onClose && (
          <Button onClick={onClose} disabled={saving}>
            取消
          </Button>
        )}
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? <CircularProgress size={20} /> : '儲存'}
        </Button>
      </Box>
    </Box>
  );
}

