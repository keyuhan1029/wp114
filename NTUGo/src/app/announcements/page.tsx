'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import SettingsIcon from '@mui/icons-material/Settings';
import MainLayout from '@/components/Layout/MainLayout';
import AnnouncementList from '@/components/Announcements/AnnouncementList';
import SubscriptionSettings from '@/components/Announcements/SubscriptionSettings';
import type { AnnouncementCategory } from '@/lib/models/Announcement';

interface Announcement {
  _id: string;
  title: string;
  content: string;
  category: AnnouncementCategory;
  publishDate: string;
  sourceUrl: string;
  isPinned: boolean;
}

const CATEGORIES: (AnnouncementCategory | '全部')[] = [
  '全部',
  '社團資訊',
  '國際交流',
  '社會服務',
  '小福/鹿鳴堂',
];

export default function AnnouncementsPage() {
  const router = useRouter();
  const [announcements, setAnnouncements] = React.useState<Announcement[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = React.useState<AnnouncementCategory | '全部'>('全部');
  const [total, setTotal] = React.useState(0);
  const [page, setPage] = React.useState(1);
  const [subscriptionDialogOpen, setSubscriptionDialogOpen] = React.useState(false);
  const limit = 20;

  const loadAnnouncements = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const categoryParam = selectedCategory === '全部' ? '' : `&category=${encodeURIComponent(selectedCategory)}`;
      const skip = (page - 1) * limit;

      const response = await fetch(`/api/announcements?limit=${limit}&skip=${skip}${categoryParam}`);
      
      if (response.ok) {
        const data = await response.json();
        setAnnouncements(data.announcements || []);
        setTotal(data.total || 0);
      } else {
        const errorData = await response.json();
        setError(errorData.message || '加载公告失败');
      }
    } catch (err: any) {
      setError(err.message || '加载公告失败');
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, page]);

  React.useEffect(() => {
    loadAnnouncements();
  }, [loadAnnouncements]);

  const handleCategoryChange = (_event: React.SyntheticEvent, newValue: AnnouncementCategory | '全部') => {
    setSelectedCategory(newValue);
    setPage(1); // 重置到第一页
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  return (
    <MainLayout>
      <Box
        sx={{
          backgroundColor: '#ffffff',
          minHeight: '100%',
          width: '100%',
          p: 3,
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="h4" sx={{ fontWeight: 700, color: '#0F4C75' }}>
              活動
            </Typography>
            <Button
              variant="outlined"
              size="small"
              startIcon={<SettingsIcon />}
              onClick={() => setSubscriptionDialogOpen(true)}
            >
              訂閱設置
            </Button>
          </Box>
        </Box>

        <Tabs
          value={selectedCategory}
          onChange={handleCategoryChange}
          sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}
        >
          {CATEGORIES.map((category) => (
            <Tab key={category} label={category} value={category} />
          ))}
        </Tabs>

        <AnnouncementList
          announcements={announcements}
          loading={loading}
          error={error}
          total={total}
          limit={limit}
          skip={(page - 1) * limit}
          onPageChange={handlePageChange}
          selectedCategory={selectedCategory}
        />

        <Dialog
          open={subscriptionDialogOpen}
          onClose={() => setSubscriptionDialogOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          
          <DialogContent>
            <SubscriptionSettings onClose={() => setSubscriptionDialogOpen(false)} />
          </DialogContent>
        </Dialog>
      </Box>
    </MainLayout>
  );
}

