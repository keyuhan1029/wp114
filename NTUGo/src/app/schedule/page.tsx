'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import Card from '@mui/material/Card';
import MainLayout from '@/components/Layout/MainLayout';
import ScheduleGrid from '@/components/Schedule/ScheduleGrid';
import ScheduleSidebar from '@/components/Schedule/ScheduleSidebar';
import CourseDialog, { CourseFormData } from '@/components/Schedule/CourseDialog';
import { ScheduleItem } from '@/lib/models/ScheduleItem';

interface Schedule {
  _id: string;
  name: string;
  isDefault?: boolean;
}

interface ScheduleItemClient extends ScheduleItem {
  _id: string;
  scheduleId: string;
}

export default function SchedulePage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = React.useState<boolean | null>(
    null
  );
  const [loading, setLoading] = React.useState(true);
  const [schedules, setSchedules] = React.useState<Schedule[]>([]);
  const [currentScheduleId, setCurrentScheduleId] = React.useState<string | null>(null);
  const [items, setItems] = React.useState<ScheduleItemClient[]>([]);
  const [courseDialogOpen, setCourseDialogOpen] = React.useState(false);
  const [courseDialogData, setCourseDialogData] = React.useState<{
    dayOfWeek: number;
    periodStart: number;
    initialData?: CourseFormData | null;
    editingItemId?: string | null;
  } | null>(null);

  React.useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');

      if (!token) {
        router.push('/login');
        return;
      }

      try {
        const response = await fetch('/api/auth/me', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          localStorage.removeItem('token');
          router.push('/login');
          return;
        }

        setIsAuthenticated(true);
        loadSchedules();
      } catch {
        localStorage.removeItem('token');
        router.push('/login');
      }
    };

    checkAuth();
  }, [router]);

  const loadSchedules = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/schedule', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('載入課表失敗');
      }

      const data = await response.json();
      const schedulesList = data.schedules || [];

      if (schedulesList.length === 0) {
        // 如果沒有課表，創建一個默認課表
        const createResponse = await fetch('/api/schedule', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ name: '我的課表' }),
        });

        if (createResponse.ok) {
          const newSchedule = await createResponse.json();
          setSchedules([newSchedule.schedule]);
          setCurrentScheduleId(newSchedule.schedule._id);
          await loadScheduleItems(newSchedule.schedule._id);
        }
      } else {
        setSchedules(schedulesList);
        const defaultSchedule =
          schedulesList.find((s: Schedule) => s.isDefault) || schedulesList[0];
        setCurrentScheduleId(defaultSchedule._id);
        await loadScheduleItems(defaultSchedule._id);
      }
    } catch (error) {
      console.error('載入課表失敗:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadScheduleItems = async (scheduleId: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/schedule/${scheduleId}/items`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('載入課程項目失敗');
      }

      const data = await response.json();
      setItems(data.items || []);
    } catch (error) {
      console.error('載入課程項目失敗:', error);
    }
  };

  const handleSelectSchedule = async (scheduleId: string) => {
    setCurrentScheduleId(scheduleId);
    await loadScheduleItems(scheduleId);
  };

  const handleAddSchedule = async (name: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/schedule', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name }),
      });

      if (!response.ok) {
        throw new Error('創建課表失敗');
      }

      const data = await response.json();
      setSchedules([...schedules, data.schedule]);
      setCurrentScheduleId(data.schedule._id);
      await loadScheduleItems(data.schedule._id);
    } catch (error) {
      console.error('創建課表失敗:', error);
      alert('創建課表失敗');
    }
  };

  const handleDeleteSchedule = async (scheduleId: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/schedule/${scheduleId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('刪除課表失敗');
      }

      const newSchedules = schedules.filter((s) => s._id !== scheduleId);
      setSchedules(newSchedules);

      if (currentScheduleId === scheduleId) {
        if (newSchedules.length > 0) {
          setCurrentScheduleId(newSchedules[0]._id);
          await loadScheduleItems(newSchedules[0]._id);
        } else {
          setCurrentScheduleId(null);
          setItems([]);
        }
      }
    } catch (error) {
      console.error('刪除課表失敗:', error);
      alert('刪除課表失敗');
    }
  };

  const handleCellClick = (dayOfWeek: number, period: number) => {
    if (!currentScheduleId) return;
    setCourseDialogData({ dayOfWeek, periodStart: period, initialData: null });
    setCourseDialogOpen(true);
  };

  const handleItemClick = (item: ScheduleItemClient) => {
    setCourseDialogData({
      dayOfWeek: item.dayOfWeek,
      periodStart: item.periodStart,
      editingItemId: item._id,
      initialData: {
        courseName: item.courseName,
        location: item.location || '',
        teacher: item.teacher || '',
        dayOfWeek: item.dayOfWeek,
        periodStart: item.periodStart,
        periodEnd: item.periodEnd,
        color: item.color,
      },
    });
    setCourseDialogOpen(true);
  };

  const handleCourseSubmit = async (formDataList: CourseFormData[]) => {
    if (!currentScheduleId) return;

    try {
      const token = localStorage.getItem('token');
      const isEdit = courseDialogData?.editingItemId != null;

      if (isEdit && courseDialogData?.editingItemId) {
        // 編輯模式：先刪除原項目，再創建新項目
        await fetch(
          `/api/schedule/items/${courseDialogData.editingItemId}`,
          {
            method: 'DELETE',
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        // 創建新項目
        for (const formData of formDataList) {
          const response = await fetch(`/api/schedule/${currentScheduleId}/items`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(formData),
          });

          if (!response.ok) {
            throw new Error('更新課程失敗');
          }
        }
      } else {
        // 新增模式：為每個時間段創建一個項目
        for (const formData of formDataList) {
          const response = await fetch(`/api/schedule/${currentScheduleId}/items`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(formData),
          });

          if (!response.ok) {
            throw new Error('新增課程失敗');
          }
        }
      }

      await loadScheduleItems(currentScheduleId);
      setCourseDialogOpen(false);
      setCourseDialogData(null);
    } catch (error) {
      console.error('保存課程失敗:', error);
      alert('保存課程失敗');
    }
  };

  const handleCourseDelete = async () => {
    if (!currentScheduleId || !courseDialogData?.editingItemId) return;

    if (!window.confirm('確定要刪除此課程嗎？')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `/api/schedule/items/${courseDialogData.editingItemId}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('刪除課程失敗');
      }

      await loadScheduleItems(currentScheduleId);
      setCourseDialogOpen(false);
      setCourseDialogData(null);
    } catch (error) {
      console.error('刪除課程失敗:', error);
      alert('刪除課程失敗');
    }
  };

  if (isAuthenticated === null || loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          width: '100vw',
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
      <Box
        sx={{
          display: 'flex',
          height: '100%',
          pt: 10, // 避免被 TopBar 擋住
          px: 3,
          pb: 3,
          gap: 3,
          overflow: 'hidden',
          boxSizing: 'border-box',
        }}
      >
        {/* 左側課表區域 */}
        <Card
          sx={{
            flexGrow: 1,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            borderRadius: 2,
          }}
        >
          <Box sx={{ flexGrow: 1, overflow: 'auto', p: 2 }}>
            {currentScheduleId ? (
              <ScheduleGrid
                items={items}
                onCellClick={handleCellClick}
                onItemClick={handleItemClick}
              />
            ) : (
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  height: '100%',
                }}
              >
                <Typography variant="body1" color="text.secondary">
                  請先創建一個課表
                </Typography>
              </Box>
            )}
          </Box>
        </Card>

        {/* 右側課表列表 */}
        <Card
          sx={{
            width: 160,
            flexShrink: 0,
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            borderRadius: 2,
            overflow: 'hidden',
          }}
        >
          <ScheduleSidebar
            schedules={schedules}
            currentScheduleId={currentScheduleId}
            onSelectSchedule={handleSelectSchedule}
            onAddSchedule={handleAddSchedule}
            onDeleteSchedule={handleDeleteSchedule}
          />
        </Card>
      </Box>
      {courseDialogData && (
        <CourseDialog
          open={courseDialogOpen}
          onClose={() => {
            setCourseDialogOpen(false);
            setCourseDialogData(null);
          }}
          onSubmit={handleCourseSubmit}
          onDelete={courseDialogData.editingItemId ? handleCourseDelete : undefined}
          initialData={courseDialogData.initialData}
          dayOfWeek={courseDialogData.dayOfWeek}
          periodStart={courseDialogData.periodStart}
          occupiedSlots={items.map(item => ({
            dayOfWeek: item.dayOfWeek,
            periodStart: item.periodStart,
            periodEnd: item.periodEnd,
          }))}
          editingItemId={courseDialogData.editingItemId}
        />
      )}
    </MainLayout>
  );
}
