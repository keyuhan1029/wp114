'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import Card from '@mui/material/Card';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import DownloadIcon from '@mui/icons-material/Download';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import MainLayout from '@/components/Layout/MainLayout';
import ScheduleGrid from '@/components/Schedule/ScheduleGrid';
import ScheduleSidebar from '@/components/Schedule/ScheduleSidebar';
import FriendSchedulesList from '@/components/Schedule/FriendSchedulesList';
import CourseDialog, { CourseFormData } from '@/components/Schedule/CourseDialog';
import { ScheduleItem } from '@/lib/models/ScheduleItem';
import html2canvas from 'html2canvas';

interface Schedule {
  _id: string;
  name: string;
  isDefault?: boolean;
}

interface ScheduleItemClient extends ScheduleItem {
  _id: string;
  scheduleId: string;
  isFriendSchedule?: boolean; // 標記是否為好友的課程
  friendName?: string; // 好友名稱（用於顯示）
}

interface SharedSchedule {
  shareId: string;
  friend: {
    id: string;
    userId?: string | null;
    name?: string | null;
    avatar?: string | null;
    department?: string | null;
  };
  schedule: {
    _id: string;
    name: string;
    items: ScheduleItemClient[];
  };
}

export default function SchedulePage() {
  const router = useRouter();
  const routerRef = React.useRef(router);
  const scheduleGridRef = React.useRef<HTMLDivElement>(null);
  const loadSchedulesRef = React.useRef<(() => Promise<void>) | null>(null);
  const [isAuthenticated, setIsAuthenticated] = React.useState<boolean | null>(
    null
  );

  // 更新 router ref
  React.useEffect(() => {
    routerRef.current = router;
  }, [router]);
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
  const [exporting, setExporting] = React.useState(false);
  const [sharedSchedules, setSharedSchedules] = React.useState<SharedSchedule[]>([]);
  const [selectedFriendIds, setSelectedFriendIds] = React.useState<Set<string>>(new Set());
  const [loadingSharedSchedules, setLoadingSharedSchedules] = React.useState(false);
  const [deleteMode, setDeleteMode] = React.useState(false);
  const [deletingShareIds, setDeletingShareIds] = React.useState<Set<string>>(new Set());
  const [snackbarOpen, setSnackbarOpen] = React.useState(false);
  const [snackbarMessage, setSnackbarMessage] = React.useState('');
  const [snackbarSeverity, setSnackbarSeverity] = React.useState<'success' | 'error' | 'info' | 'warning'>('info');

  const showSnackbar = (message: string, severity: 'success' | 'error' | 'info' | 'warning' = 'info') => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
  };

  const loadScheduleItems = React.useCallback(async (scheduleId: string) => {
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
  }, []);

  const loadSchedules = React.useCallback(async () => {
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
  }, [loadScheduleItems]);

  // 更新 loadSchedules ref
  React.useEffect(() => {
    loadSchedulesRef.current = loadSchedules;
  }, [loadSchedules]);

  // 載入已接受的好友課表分享
  const loadSharedSchedules = React.useCallback(async () => {
    try {
      setLoadingSharedSchedules(true);
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch('/api/schedule/shared', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('載入好友課表失敗');
      }

      const data = await response.json();
      setSharedSchedules(data.sharedSchedules || []);
    } catch (error) {
      console.error('載入好友課表失敗:', error);
    } finally {
      setLoadingSharedSchedules(false);
    }
  }, []);

  // 在認證後載入好友課表
  React.useEffect(() => {
    if (isAuthenticated) {
      loadSharedSchedules();
    }
  }, [isAuthenticated, loadSharedSchedules]);

  // 驗證登入
  React.useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');

      if (!token) {
        routerRef.current.push('/login');
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
          routerRef.current.push('/login');
          return;
        }

        setIsAuthenticated(true);
        if (loadSchedulesRef.current) {
          loadSchedulesRef.current();
        }
      } catch {
        localStorage.removeItem('token');
        routerRef.current.push('/login');
      }
    };

    checkAuth();
  }, []);

  const handleSelectSchedule = async (scheduleId: string) => {
    setCurrentScheduleId(scheduleId);
    await loadScheduleItems(scheduleId);
  };

  const handleAddSchedule = async (name: string) => {
    try {
      // 前端檢查：是否已有相同名稱的課表
      const trimmedName = name.trim();
      const duplicateSchedule = schedules.find(
        (s) => s.name.trim().toLowerCase() === trimmedName.toLowerCase()
      );
      if (duplicateSchedule) {
        showSnackbar('已存在相同名稱的課表，請使用不同的名稱', 'error');
        return;
      }

      const token = localStorage.getItem('token');
      const response = await fetch('/api/schedule', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: trimmedName }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || '創建課表失敗');
      }

      const data = await response.json();
      setSchedules([...schedules, data.schedule]);
      setCurrentScheduleId(data.schedule._id);
      await loadScheduleItems(data.schedule._id);
    } catch (error: any) {
      console.error('創建課表失敗:', error);
      showSnackbar(error.message || '創建課表失敗', 'error');
    }
  };

  const handleUpdateSchedule = async (scheduleId: string, name: string, isDefault: boolean) => {
    try {
      // 前端檢查：是否已有相同名稱的課表（排除當前課表）
      const trimmedName = name.trim();
      const duplicateSchedule = schedules.find(
        (s) => s._id !== scheduleId && s.name.trim().toLowerCase() === trimmedName.toLowerCase()
      );
      if (duplicateSchedule) {
        showSnackbar('已存在相同名稱的課表，請使用不同的名稱', 'error');
        return;
      }

      const token = localStorage.getItem('token');
      const response = await fetch(`/api/schedule/${scheduleId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: trimmedName, isDefault }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || '更新課表失敗');
      }

      const data = await response.json();
      
      // 更新課表列表
      const updatedSchedules = schedules.map((s) =>
        s._id === scheduleId ? { ...s, name: data.schedule.name, isDefault: data.schedule.isDefault } : s
      );
      
      // 如果設為默認，確保其他課表不是默認
      if (isDefault) {
        const finalSchedules = updatedSchedules.map((s) =>
          s._id !== scheduleId ? { ...s, isDefault: false } : s
        );
        setSchedules(finalSchedules);
      } else {
        setSchedules(updatedSchedules);
      }
    } catch (error: any) {
      console.error('更新課表失敗:', error);
      showSnackbar(error.message || '更新課表失敗', 'error');
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
      showSnackbar('刪除課表失敗', 'error');
    }
  };

  const handleCellClick = (dayOfWeek: number, period: number) => {
    if (!currentScheduleId) return;
    setCourseDialogData({ dayOfWeek, periodStart: period, initialData: null });
    setCourseDialogOpen(true);
  };

  const handleItemClick = (item: ScheduleItem) => {
    // 如果是好友的課程，不允許編輯
    const itemClient = item as ScheduleItemClient;
    if (itemClient.isFriendSchedule) {
      return; // 不打開編輯對話框
    }

    setCourseDialogData({
      dayOfWeek: item.dayOfWeek,
      periodStart: item.periodStart,
      editingItemId: item._id?.toString(),
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
      showSnackbar('保存課程失敗', 'error');
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
      showSnackbar('刪除課程失敗', 'error');
    }
  };

  const handleExportImage = async () => {
    if (!scheduleGridRef.current) {
      showSnackbar('無法找到課表內容', 'error');
      return;
    }

    setExporting(true);
    try {
      const canvas = await html2canvas(scheduleGridRef.current, {
        backgroundColor: '#ffffff',
        scale: 2, // 提高圖片清晰度
        logging: false,
        useCORS: true,
      });

      // 創建下載連結
      const link = document.createElement('a');
      const currentSchedule = schedules.find((s) => s._id === currentScheduleId);
      const fileName = currentSchedule
        ? `${currentSchedule.name}_${new Date().toISOString().split('T')[0]}.png`
        : `課表_${new Date().toISOString().split('T')[0]}.png`;
      
      link.download = fileName;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (error) {
      console.error('匯出圖片失敗:', error);
      showSnackbar('匯出圖片失敗，請稍後再試', 'error');
    } finally {
      setExporting(false);
    }
  };

  // 處理好友課表選擇
  const handleFriendScheduleToggle = (friendId: string) => {
    if (deleteMode) return; // 刪除模式下不允許切換選擇
    setSelectedFriendIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(friendId)) {
        newSet.delete(friendId);
      } else {
        newSet.add(friendId);
      }
      return newSet;
    });
  };

  // 刪除好友課表分享
  const handleDeleteSharedSchedule = async (shareId: string) => {
    try {
      setDeletingShareIds((prev) => new Set(prev).add(shareId));
      const token = localStorage.getItem('token');

      const response = await fetch(`/api/community/schedule-share/${shareId}?action=delete`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || '刪除課表分享失敗');
      }

      // 從列表中移除
      setSharedSchedules((prev) => prev.filter((s) => s.shareId !== shareId));
      // 如果該好友的課表正在顯示，從選中列表中移除
      const deletedShare = sharedSchedules.find((s) => s.shareId === shareId);
      if (deletedShare) {
        setSelectedFriendIds((prev) => {
          const newSet = new Set(prev);
          newSet.delete(deletedShare.friend.id);
          return newSet;
        });
      }
    } catch (error: any) {
      console.error('刪除課表分享失敗:', error);
      showSnackbar(error.message || '刪除課表分享失敗', 'error');
    } finally {
      setDeletingShareIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(shareId);
        return newSet;
      });
    }
  };

  // 為好友分配不同的顏色（用於區分）
  const friendColors = React.useMemo(() => {
    const colors = [
      '#9c27b0', // 紫色
      '#f44336', // 紅色
      '#ff9800', // 橙色
      '#4caf50', // 綠色
      '#2196f3', // 藍色
      '#00bcd4', // 青色
      '#e91e63', // 粉紅色
      '#795548', // 棕色
    ];
    const colorMap = new Map<string, string>();
    sharedSchedules.forEach((shared, index) => {
      if (selectedFriendIds.has(shared.friend.id)) {
        colorMap.set(shared.friend.id, colors[index % colors.length]);
      }
    });
    return colorMap;
  }, [sharedSchedules, selectedFriendIds]);

  // 合併自己的課表和選中好友的課表
  const mergedItems = React.useMemo(() => {
    let allItems: ScheduleItemClient[] = [...items];
    
    // 添加選中好友的課表項目
    sharedSchedules.forEach((shared) => {
      if (selectedFriendIds.has(shared.friend.id)) {
        // 為好友的課表項目添加標記，標記為好友課程
        const friendItems = shared.schedule.items.map((item) => ({
          ...item,
          isFriendSchedule: true,
          friendName: shared.friend.name || shared.friend.userId || '好友',
          // 好友的課程使用透明背景，保留原顏色作為邊框顏色
        }));
        allItems = [...allItems, ...friendItems];
      }
    });

    return allItems;
  }, [items, sharedSchedules, selectedFriendIds]);

  if (isAuthenticated === null || loading) {
    return (
      <MainLayout>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100%',
            width: '100%',
            backgroundColor: '#ffffff',
            zIndex: 10,
          }}
        >
          <CircularProgress />
        </Box>
      </MainLayout>
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
          width: '100%',
          height: '100%',
          pt: 10, // 避免被 TopBar 擋住
          px: 3,
          pb: 3,
          gap: 3,
          overflow: 'hidden',
          boxSizing: 'border-box',
          backgroundColor: '#ffffff',
          position: 'relative',
          zIndex: 100,
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
          {/* 匯出按鈕 */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'flex-end',
              alignItems: 'center',
              p: 1.5,
              borderBottom: '1px solid #eee',
            }}
          >
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={handleExportImage}
              disabled={!currentScheduleId || exporting || items.length === 0}
              sx={{
                textTransform: 'none',
              }}
            >
              {exporting ? '匯出中...' : '匯出課表圖片'}
            </Button>
          </Box>
          <Box sx={{ flexGrow: 1, overflow: 'auto', p: 2 }}>
            {currentScheduleId ? (
              <ScheduleGrid
                ref={scheduleGridRef}
                items={mergedItems}
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

        {/* 右側課表列表和好友課表 */}
        <Box
          sx={{
            width: 280,
            flexShrink: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
          }}
        >
          {/* 我的課表 */}
          <Card
            sx={{
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
              onUpdateSchedule={handleUpdateSchedule}
            />
          </Card>

          {/* 好友課表 */}
          <FriendSchedulesList
            sharedSchedules={sharedSchedules}
            selectedFriendIds={selectedFriendIds}
            deleteMode={deleteMode}
            loading={loadingSharedSchedules}
            deletingShareIds={deletingShareIds}
            onToggleFriend={handleFriendScheduleToggle}
            onToggleDeleteMode={() => setDeleteMode(!deleteMode)}
            onDeleteSharedSchedule={handleDeleteSharedSchedule}
          />
        </Box>
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
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbarSeverity} sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </MainLayout>
  );
}
