'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import CircularProgress from '@mui/material/CircularProgress';
import MainLayout from '@/components/Layout/MainLayout';
import { CalendarEvent } from '@/lib/calendar/CalendarEvent';
import CalendarHeader from '@/components/Calendar/CalendarHeader';
import CalendarGrid from '@/components/Calendar/CalendarGrid';
import EventList from '@/components/Calendar/EventList';
import RecommendedEventsList from '@/components/Calendar/RecommendedEventsList';
import EventEditDialog from '@/components/Calendar/EventEditDialog';
import ImportHelpDialog from '@/components/Calendar/ImportHelpDialog';
import {
  PersonalEventClient,
  CombinedEvent,
  EditDialogState,
} from '@/components/Calendar/types';
import {
  getMonthRange,
  isSameDay,
  toLocalInputValue,
} from '@/components/Calendar/utils';
import { parseIcsFile } from '@/components/Calendar/icsParser';

export default function CalendarPage() {
  const router = useRouter();
  const routerRef = React.useRef(router);
  const [isAuthenticated, setIsAuthenticated] = React.useState<boolean | null>(
    null
  );

  // 更新 router ref
  React.useEffect(() => {
    routerRef.current = router;
  }, [router]);

  const [currentMonth, setCurrentMonth] = React.useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = React.useState<Date>(new Date());
  const [ntuEvents, setNtuEvents] = React.useState<CalendarEvent[]>([]);
  const [personalEvents, setPersonalEvents] = React.useState<
    PersonalEventClient[]
  >([]);
  const [loading, setLoading] = React.useState(false);
  const [showNtuEvents, setShowNtuEvents] = React.useState(true);
  const [showImportHelp, setShowImportHelp] = React.useState(false);
  const [editDialog, setEditDialog] = React.useState<EditDialogState>({
    open: false,
    mode: 'create',
    title: '',
    description: '',
    location: '',
    startTime: '',
    endTime: '',
    allDay: false,
  });

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
      } catch {
        localStorage.removeItem('token');
        routerRef.current.push('/login');
      }
    };

    checkAuth();
  }, []);

  // 載入當月 NTU 活動與個人行程
  React.useEffect(() => {
    if (!isAuthenticated) return;

    const loadEvents = async () => {
      setLoading(true);
      const { start, end } = getMonthRange(currentMonth);
      const fromIso = start.toISOString();
      const toIso = end.toISOString();

      try {
        // 官方活動
        const ntuRes = await fetch(
          `/api/calendar/events?from=${encodeURIComponent(
            fromIso
          )}&to=${encodeURIComponent(toIso)}`
        );
        if (ntuRes.ok) {
          const data = await ntuRes.json();
          setNtuEvents(data.events || []);
        } else {
          setNtuEvents([]);
        }

        // 個人行程
        const token = localStorage.getItem('token');
        if (token) {
          const personalRes = await fetch(
            `/api/calendar/personal?from=${encodeURIComponent(
              fromIso
            )}&to=${encodeURIComponent(toIso)}`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );
          if (personalRes.ok) {
            const data = await personalRes.json();
            setPersonalEvents(data.events || []);
          } else {
            setPersonalEvents([]);
          }
        }
      } catch (e) {
        console.error('載入行事曆資料失敗', e);
      } finally {
        setLoading(false);
      }
    };

    loadEvents();
  }, [isAuthenticated, currentMonth]);

  if (isAuthenticated === null) {
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

  // 合併事件
  const combinedEvents: CombinedEvent[] = [
    ...(showNtuEvents
      ? ntuEvents.map((e) => ({
          id: e.id,
          title: e.title,
          description: e.description,
          location: e.location,
          startTime: e.startTime,
          endTime: e.endTime,
          allDay: e.allDay,
          sourceType: 'ntu_official' as const,
        }))
      : []),
    ...personalEvents.map((e) => ({
      id: `personal_${e._id}`,
      title: e.title,
      description: e.description,
      location: e.location,
      startTime: e.startTime,
      endTime: e.endTime,
      allDay: e.allDay,
      sourceType: 'personal' as const,
      personalId: e._id,
      personalSource: e.source,
    })),
  ];

  const eventsForSelectedDay = combinedEvents.filter((e) =>
    isSameDay(new Date(e.startTime), selectedDate)
  );

  const recommendedNtuEvents = ntuEvents
    .filter((e) => new Date(e.startTime) >= new Date())
    .sort(
      (a, b) =>
        new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
    )
    .slice(0, 5);

  // 事件處理函數
  const openCreateDialog = () => {
    const base = new Date(selectedDate);
    base.setHours(10, 0, 0, 0);
    const end = new Date(base);
    end.setHours(base.getHours() + 1);

    setEditDialog({
      open: true,
      mode: 'create',
      targetId: undefined,
      title: '',
      description: '',
      location: '',
      startTime: toLocalInputValue(base),
      endTime: toLocalInputValue(end),
      allDay: false,
    });
  };

  const openEditDialog = (event: PersonalEventClient) => {
    setEditDialog({
      open: true,
      mode: 'edit',
      targetId: event._id,
      title: event.title,
      description: event.description || '',
      location: event.location || '',
      startTime: toLocalInputValue(new Date(event.startTime)),
      endTime: toLocalInputValue(new Date(event.endTime)),
      allDay: !!event.allDay,
    });
  };

  const closeDialog = () => {
    setEditDialog((prev) => ({ ...prev, open: false }));
  };

  const handleDialogFieldChange = (
    field: keyof EditDialogState,
    value: any
  ) => {
    setEditDialog((prev) => ({ ...prev, [field]: value }));
  };

  const handleDialogSubmit = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    const payload = {
      title: editDialog.title,
      description: editDialog.description || undefined,
      location: editDialog.location || undefined,
      startTime: new Date(editDialog.startTime).toISOString(),
      endTime: new Date(editDialog.endTime).toISOString(),
      allDay: editDialog.allDay,
    };

    try {
      if (editDialog.mode === 'create') {
        const res = await fetch('/api/calendar/personal', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          const data = await res.json();
          setPersonalEvents((prev) => [...prev, data.event]);
          closeDialog();
        }
      } else if (editDialog.mode === 'edit' && editDialog.targetId) {
        const res = await fetch(
          `/api/calendar/personal/${encodeURIComponent(editDialog.targetId)}`,
          {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(payload),
          }
        );
        if (res.ok) {
          const data = await res.json();
          setPersonalEvents((prev) =>
            prev.map((e) => (e._id === data.event._id ? data.event : e))
          );
          closeDialog();
        }
      }
    } catch (e) {
      console.error('儲存行程失敗', e);
    }
  };

  const handleDeletePersonal = async (id: string) => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    if (!window.confirm('確定要刪除此行程嗎？')) return;

    try {
      const res = await fetch(
        `/api/calendar/personal/${encodeURIComponent(id)}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (res.ok) {
        setPersonalEvents((prev) => prev.filter((e) => e._id !== id));
      }
    } catch (e) {
      console.error('刪除行程失敗', e);
    }
  };

  const handleExportPersonalIcs = async (id: string) => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    try {
      const res = await fetch(
        `/api/calendar/personal/${encodeURIComponent(id)}/ics`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (!res.ok) {
        console.error('匯出 .ics 失敗');
        return;
      }

      const text = await res.text();
      const blob = new Blob([text], { type: 'text/calendar' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'ntugo-event.ics';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('匯出 .ics 失敗', e);
    }
  };

  const handleAddNtuToPersonal = async (event: CalendarEvent) => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    try {
      const res = await fetch('/api/calendar/personal/from-ntu', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ntuEventId: event.id,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setPersonalEvents((prev) => [...prev, data.event]);
      }
    } catch (e) {
      console.error('加入個人行事曆失敗', e);
    }
  };

  const handleImportIcs = async (file: File) => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    try {
      const text = await file.text();
      const events = parseIcsFile(text);

      if (events.length === 0) {
        alert('無法從此 .ics 檔案中解析出任何事件');
        return;
      }

      let successCount = 0;
      for (const evt of events) {
        const res = await fetch('/api/calendar/personal', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            title: evt.title,
            description: evt.description,
            location: evt.location,
            startTime: evt.startTime,
            endTime: evt.endTime,
            allDay: evt.allDay,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          setPersonalEvents((prev) => [...prev, data.event]);
          successCount++;
        }
      }

      alert(`成功匯入 ${successCount} 筆行程`);
    } catch (e) {
      console.error('匯入 .ics 失敗', e);
      alert('匯入失敗，請確認檔案格式正確');
    }
  };

  return (
    <MainLayout>
      <Box
        sx={{
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
          height: '100%',
          p: 3,
          pt: 10,
          boxSizing: 'border-box',
          overflowY: 'auto',
          backgroundColor: '#ffffff',
          zIndex: 100,
        }}
      >
        <CalendarHeader
          currentMonth={currentMonth}
          onPreviousMonth={() => {
            const d = new Date(currentMonth);
            d.setMonth(d.getMonth() - 1);
            setCurrentMonth(d);
          }}
          onNextMonth={() => {
            const d = new Date(currentMonth);
            d.setMonth(d.getMonth() + 1);
            setCurrentMonth(d);
          }}
          onToday={() => {
            const today = new Date();
            setCurrentMonth(today);
            setSelectedDate(today);
          }}
          onCreateEvent={openCreateDialog}
          onImportIcs={handleImportIcs}
          onShowImportHelp={() => setShowImportHelp(true)}
        />

        <ImportHelpDialog
          open={showImportHelp}
          onClose={() => setShowImportHelp(false)}
        />

        <CalendarGrid
          currentMonth={currentMonth}
          selectedDate={selectedDate}
          events={combinedEvents}
          onDateSelect={setSelectedDate}
        />

        <Grid container spacing={2} sx={{ flexShrink: 0 }}>
          <Grid size={6}>
            <EventList
              selectedDate={selectedDate}
              events={eventsForSelectedDay}
              personalEvents={personalEvents}
              loading={loading}
              showNtuEvents={showNtuEvents}
              onToggleNtuEvents={setShowNtuEvents}
              onEdit={openEditDialog}
              onDelete={handleDeletePersonal}
              onExport={handleExportPersonalIcs}
            />
          </Grid>

          <Grid size={6}>
            <RecommendedEventsList
              events={recommendedNtuEvents}
              onAddToPersonal={handleAddNtuToPersonal}
            />
          </Grid>
        </Grid>

        <EventEditDialog
          open={editDialog.open}
          dialogState={editDialog}
          onClose={closeDialog}
          onSubmit={handleDialogSubmit}
          onFieldChange={handleDialogFieldChange}
        />
      </Box>
    </MainLayout>
  );
}
