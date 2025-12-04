'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Grid from '@mui/material/Grid';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Switch from '@mui/material/Switch';
import Tooltip from '@mui/material/Tooltip';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import TodayIcon from '@mui/icons-material/Today';
import EditIcon from '@mui/icons-material/Edit';
import IosShareIcon from '@mui/icons-material/IosShare';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import InfoIcon from '@mui/icons-material/Info';
import CloseIcon from '@mui/icons-material/Close';
import MainLayout from '@/components/Layout/MainLayout';
import { CalendarEvent } from '@/lib/calendar/CalendarEvent';

interface PersonalEventClient {
  _id: string;
  title: string;
  description?: string;
  location?: string;
  startTime: string;
  endTime: string;
  allDay?: boolean;
  source: 'manual' | 'ntu_imported';
}

interface CombinedEvent {
  id: string;
  title: string;
  description?: string;
  location?: string;
  startTime: string;
  endTime: string;
  allDay?: boolean;
  sourceType: 'ntu_official' | 'personal';
  personalId?: string; // 若是個人事件，對應 PersonalEvent _id
  personalSource?: 'manual' | 'ntu_imported';
}

interface EditDialogState {
  open: boolean;
  mode: 'create' | 'edit';
  targetId?: string;
  title: string;
  description: string;
  location: string;
  startTime: string; // yyyy-MM-ddTHH:mm
  endTime: string; // yyyy-MM-ddTHH:mm
  allDay: boolean;
}

function formatMonthYear(date: Date) {
  return `${date.getFullYear()} 年 ${date.getMonth() + 1} 月`;
}

function getMonthRange(date: Date) {
  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59);
  return { start, end };
}

function getCalendarMatrix(current: Date): Date[] {
  const { start } = getMonthRange(current);
  const firstDayOfWeek = start.getDay(); // 0 (Sun) - 6 (Sat)
  const days: Date[] = [];

  // 從本月第一天所在週的星期日開始
  const firstCell = new Date(start);
  firstCell.setDate(start.getDate() - firstDayOfWeek);

  for (let i = 0; i < 42; i++) {
    const d = new Date(firstCell);
    d.setDate(firstCell.getDate() + i);
    days.push(d);
  }

  return days;
}

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function toLocalInputValue(date: Date) {
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate()
  )}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export default function CalendarPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = React.useState<boolean | null>(
    null
  );
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
      } catch {
        localStorage.removeItem('token');
        router.push('/login');
      }
    };

    checkAuth();
  }, [router]);

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

  const days = getCalendarMatrix(currentMonth);

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

  /**
   * 簡易 ICS 解析器，從 .ics 文字中提取 VEVENT
   */
  function parseIcsFile(
    icsText: string
  ): {
    title: string;
    description?: string;
    location?: string;
    startTime: string;
    endTime: string;
    allDay: boolean;
  }[] {
    const results: {
      title: string;
      description?: string;
      location?: string;
      startTime: string;
      endTime: string;
      allDay: boolean;
    }[] = [];

    // 展開折行（ICS 標準：以空白或 tab 開頭的行是前一行的延續）
    const unfoldedText = icsText.replace(/\r\n[ \t]/g, '').replace(/\n[ \t]/g, '');
    const lines = unfoldedText.split(/\r?\n/);

    let inEvent = false;
    let currentEvent: {
      summary?: string;
      description?: string;
      location?: string;
      dtstart?: string;
      dtend?: string;
      allDay?: boolean;
    } = {};

    for (const line of lines) {
      if (line.startsWith('BEGIN:VEVENT')) {
        inEvent = true;
        currentEvent = {};
        continue;
      }
      if (line.startsWith('END:VEVENT')) {
        inEvent = false;
        if (currentEvent.summary && currentEvent.dtstart) {
          const start = parseIcsDate(currentEvent.dtstart);
          const end = currentEvent.dtend
            ? parseIcsDate(currentEvent.dtend)
            : start;
          if (start) {
            results.push({
              title: currentEvent.summary,
              description: currentEvent.description,
              location: currentEvent.location,
              startTime: start.toISOString(),
              endTime: (end || start).toISOString(),
              allDay: !!currentEvent.allDay,
            });
          }
        }
        continue;
      }
      if (!inEvent) continue;

      // 解析屬性
      const colonIdx = line.indexOf(':');
      if (colonIdx === -1) continue;
      const keyPart = line.substring(0, colonIdx);
      const value = line.substring(colonIdx + 1);

      // keyPart 可能包含參數，例如 DTSTART;VALUE=DATE
      const keyName = keyPart.split(';')[0].toUpperCase();

      switch (keyName) {
        case 'SUMMARY':
          currentEvent.summary = value;
          break;
        case 'DESCRIPTION':
          currentEvent.description = value.replace(/\\n/g, '\n').replace(/\\,/g, ',');
          break;
        case 'LOCATION':
          currentEvent.location = value;
          break;
        case 'DTSTART':
          currentEvent.dtstart = line; // 保留完整行以便解析參數
          if (keyPart.includes('VALUE=DATE')) {
            currentEvent.allDay = true;
          }
          break;
        case 'DTEND':
          currentEvent.dtend = line;
          break;
      }
    }

    return results;
  }

  function parseIcsDate(line: string): Date | null {
    // line 格式如：DTSTART;VALUE=DATE:20241202 或 DTSTART:20241202T100000Z
    const colonIdx = line.indexOf(':');
    if (colonIdx === -1) return null;
    const value = line.substring(colonIdx + 1).trim();

    // 全天格式：YYYYMMDD
    if (/^\d{8}$/.test(value)) {
      const y = parseInt(value.substring(0, 4), 10);
      const m = parseInt(value.substring(4, 6), 10) - 1;
      const d = parseInt(value.substring(6, 8), 10);
      return new Date(y, m, d);
    }

    // 日期時間格式：YYYYMMDDTHHMMSS 或 YYYYMMDDTHHMMSSZ
    const match = value.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z?$/);
    if (match) {
      const [, y, mo, d, h, mi, s] = match;
      if (value.endsWith('Z')) {
        return new Date(
          Date.UTC(
            parseInt(y, 10),
            parseInt(mo, 10) - 1,
            parseInt(d, 10),
            parseInt(h, 10),
            parseInt(mi, 10),
            parseInt(s, 10)
          )
        );
      } else {
        return new Date(
          parseInt(y, 10),
          parseInt(mo, 10) - 1,
          parseInt(d, 10),
          parseInt(h, 10),
          parseInt(mi, 10),
          parseInt(s, 10)
        );
      }
    }

    return null;
  }

  return (
    <MainLayout>
      <Box
        sx={{
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          p: 3,
          boxSizing: 'border-box',
          overflowY: 'auto',
        }}
      >
        {/* 上方控制列 */}
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
            <IconButton
              onClick={() => {
                const d = new Date(currentMonth);
                d.setMonth(d.getMonth() - 1);
                setCurrentMonth(d);
              }}
            >
              <ArrowBackIosNewIcon />
            </IconButton>
            <Typography variant="h6">{formatMonthYear(currentMonth)}</Typography>
            <IconButton
              onClick={() => {
                const d = new Date(currentMonth);
                d.setMonth(d.getMonth() + 1);
                setCurrentMonth(d);
              }}
            >
              <ArrowForwardIosIcon />
            </IconButton>
            <Button
              startIcon={<TodayIcon />}
              onClick={() => {
                const today = new Date();
                setCurrentMonth(today);
                setSelectedDate(today);
              }}
            >
              今天
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={openCreateDialog}
            >
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
                    handleImportIcs(file);
                    e.target.value = ''; // 重置以允許再次選擇同一檔案
                  }
                }}
              />
            </Button>
            <Tooltip title="如何匯入 NTU COOL 行事曆？">
              <IconButton
                size="small"
                onClick={() => setShowImportHelp(true)}
                sx={{ ml: 0.5 }}
              >
                <InfoIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {/* 匯入說明 Card（居中遮罩） */}
        {showImportHelp && (
          <Box
            sx={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 1300,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            onClick={() => setShowImportHelp(false)}
          >
            <Card
              sx={{
                maxWidth: 900,
                width: '90%',
                maxHeight: '90vh',
                overflow: 'auto',
                boxShadow: 12,
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <CardContent sx={{ position: 'relative', p: 3 }}>
                <IconButton
                  size="small"
                  onClick={() => setShowImportHelp(false)}
                  sx={{ position: 'absolute', top: 12, right: 12 }}
                >
                  <CloseIcon />
                </IconButton>
                <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
                  如何從 NTU COOL 匯入行事曆？
                </Typography>
                <Box
                  component="img"
                  src="/ntucool_calander_QA.png"
                  alt="NTU COOL 行事曆匯入說明"
                  sx={{ width: '100%', borderRadius: 1 }}
                />
              </CardContent>
            </Card>
          </Box>
        )}

        {/* 月曆區塊（全寬、固定高度） */}
        <Card
          sx={{
            width: '100%',
            flexShrink: 0,
            mb: 2,
          }}
        >
          <CardContent>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: 'repeat(7, 1fr)',
                mb: 1,
                gap: 0.5,
              }}
            >
              {['日', '一', '二', '三', '四', '五', '六'].map((d) => (
                <Typography
                  key={d}
                  variant="subtitle2"
                  align="center"
                  sx={{ fontWeight: 'bold' }}
                >
                  {d}
                </Typography>
              ))}
            </Box>

            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: 'repeat(7, 1fr)',
                gridTemplateRows: 'repeat(6, 56px)', // 固定每列高度
                gap: 0.5,
              }}
            >
              {days.map((day) => {
                const inCurrentMonth =
                  day.getMonth() === currentMonth.getMonth();
                const isSelected = isSameDay(day, selectedDate);
                const hasEvent = combinedEvents.some((e) =>
                  isSameDay(new Date(e.startTime), day)
                );

                return (
                  <Box
                    key={day.toISOString()}
                    onClick={() => setSelectedDate(day)}
                    sx={{
                      borderRadius: 2,
                      border: '1px solid',
                      borderColor: isSelected
                        ? 'primary.main'
                        : 'rgba(0,0,0,0.08)',
                      backgroundColor: isSelected
                        ? 'primary.main'
                        : 'background.paper',
                      color: isSelected ? 'primary.contrastText' : 'inherit',
                      padding: 0.5,
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'flex-start',
                      overflow: 'hidden',
                    }}
                  >
                    <Typography
                      variant="subtitle2"
                      sx={{
                        opacity: inCurrentMonth ? 1 : 0.4,
                        fontWeight: isSelected ? 'bold' : 'normal',
                      }}
                    >
                      {day.getDate()}
                    </Typography>
                    {hasEvent && (
                      <Box
                        sx={{
                          mt: 0.25,
                          display: 'flex',
                          gap: 0.25,
                          flexWrap: 'wrap',
                          overflow: 'hidden',
                        }}
                      >
                        {(() => {
                          const dayEvents = combinedEvents.filter((e) =>
                            isSameDay(new Date(e.startTime), day)
                          );
                          const maxVisible = 6;
                          const visible = dayEvents.slice(0, maxVisible);
                          const hasMore = dayEvents.length > maxVisible;

                          return (
                            <>
                              {visible.map((e) => (
                                <Chip
                                  key={e.id}
                                  size="small"
                                  label={
                                    e.sourceType === 'ntu_official'
                                      ? '校'
                                      : '個'
                                  }
                                  color={
                                    e.sourceType === 'ntu_official'
                                      ? 'secondary'
                                      : 'primary'
                                  }
                                  sx={{ height: 18, fontSize: 10 }}
                                />
                              ))}
                              {hasMore && (
                                <Chip
                                  size="small"
                                  label="..."
                                  sx={{
                                    fontWeight: 'bold',
                                    height: 18,
                                    fontSize: 10,
                                    color: 'inherit',
                                  }}
                                />
                              )}
                            </>
                          );
                        })()}
                      </Box>
                    )}
                  </Box>
                );
              })}
            </Box>
          </CardContent>
        </Card>

        {/* 下方：當日行程 + 推薦活動（橫向並排） */}
        <Grid container spacing={2} sx={{ flexShrink: 0 }}>
          {/* 當日行程 */}
          <Grid size={6}>
            <Card sx={{ height: 400 }}>
              <CardContent
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  height: '100%',
                  boxSizing: 'border-box',
                }}
              >
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    mb: 1,
                    flexShrink: 0,
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="h6">
                      {selectedDate.getMonth() + 1} 月 {selectedDate.getDate()} 日行程
                    </Typography>
                    {loading && <CircularProgress size={20} />}
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Typography variant="body2" color="text.secondary">
                      學校行程
                    </Typography>
                    <Switch
                      size="small"
                      checked={showNtuEvents}
                      onChange={(e) => setShowNtuEvents(e.target.checked)}
                    />
                  </Box>
                </Box>
                {eventsForSelectedDay.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    目前沒有任何行程，點擊「新增行程」來安排吧！
                  </Typography>
                ) : (
                  <List
                    dense
                    sx={{ overflowY: 'auto', flexGrow: 1, minHeight: 0 }}
                  >
                    {eventsForSelectedDay
                      .sort(
                        (a, b) =>
                          new Date(a.startTime).getTime() -
                          new Date(b.startTime).getTime()
                      )
                      .map((e) => {
                        const start = new Date(e.startTime);
                        const end = new Date(e.endTime);
                        const timeLabel = e.allDay
                          ? '整日'
                          : `${start.getHours().toString().padStart(2, '0')}:${start
                              .getMinutes()
                              .toString()
                              .padStart(2, '0')} - ${end
                              .getHours()
                              .toString()
                              .padStart(2, '0')}:${end
                              .getMinutes()
                              .toString()
                              .padStart(2, '0')}`;

                        const isPersonal = e.sourceType === 'personal';

                        return (
                          <ListItem
                            key={e.id}
                            alignItems="flex-start"
                            secondaryAction={
                              isPersonal && e.personalId ? (
                                <Box sx={{ display: 'flex', gap: 0.5 }}>
                                  <IconButton
                                    size="small"
                                    aria-label="edit"
                                    onClick={() => {
                                      const target = personalEvents.find(
                                        (p) => p._id === e.personalId
                                      );
                                      if (target) {
                                        openEditDialog(target);
                                      }
                                    }}
                                  >
                                    <EditIcon fontSize="small" />
                                  </IconButton>
                                  <IconButton
                                    size="small"
                                    aria-label="export"
                                    onClick={() =>
                                      handleExportPersonalIcs(e.personalId!)
                                    }
                                  >
                                    <IosShareIcon fontSize="small" />
                                  </IconButton>
                                  <IconButton
                                    size="small"
                                    aria-label="delete"
                                    onClick={() =>
                                      handleDeletePersonal(e.personalId!)
                                    }
                                  >
                                    <DeleteIcon fontSize="small" />
                                  </IconButton>
                                </Box>
                              ) : null
                            }
                          >
                            <ListItemText
                              primary={
                                <Box
                                  sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 1,
                                    flexWrap: 'wrap',
                                    maxWidth: 'calc(100% - 120px)', // 預留右側按鈕空間
                                  }}
                                >
                                  <Typography variant="subtitle2" component="span">
                                    {e.title}
                                  </Typography>
                                  <Chip
                                    size="small"
                                    label={
                                      e.sourceType === 'ntu_official'
                                        ? '校內活動'
                                        : e.personalSource === 'ntu_imported'
                                        ? '我的行程（由校內匯入）'
                                        : '我的行程'
                                    }
                                    color={
                                      e.sourceType === 'ntu_official'
                                        ? 'secondary'
                                        : 'primary'
                                    }
                                    sx={{
                                      maxWidth: '100%',
                                    }}
                                  />
                                </Box>
                              }
                              secondary={
                                <>
                                  <Typography
                                    component="span"
                                    variant="body2"
                                    color="text.primary"
                                  >
                                    {timeLabel}
                                  </Typography>
                                  {e.location && (
                                    <>
                                      {' ・ '}
                                      <Typography
                                        component="span"
                                        variant="body2"
                                        color="text.secondary"
                                        sx={{
                                          display: 'inline-block',
                                          maxWidth: 'calc(100% - 120px)',
                                          whiteSpace: 'normal',
                                          wordBreak: 'break-word',
                                        }}
                                      >
                                        {e.location}
                                      </Typography>
                                    </>
                                  )}
                                  {e.description && (
                                    <Typography
                                      component="span"
                                      variant="body2"
                                      color="text.secondary"
                                      sx={{
                                        display: 'block',
                                        mt: 0.5,
                                        maxWidth: 'calc(100% - 120px)',
                                        whiteSpace: 'normal',
                                        wordBreak: 'break-word',
                                      }}
                                    >
                                      {e.description}
                                    </Typography>
                                  )}
                                </>
                              }
                              primaryTypographyProps={{ component: 'span' }}
                              secondaryTypographyProps={{ component: 'span' }}
                            />
                          </ListItem>
                        );
                      })}
                  </List>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* 推薦活動 */}
          <Grid size={6}>
            <Card sx={{ height: 400 }}>
              <CardContent
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  height: '100%',
                  boxSizing: 'border-box',
                }}
              >
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    mb: 1,
                    flexShrink: 0,
                  }}
                >
                  <Typography variant="subtitle1">
                    近期推薦活動（來自台大行事曆）
                  </Typography>
                </Box>
                {recommendedNtuEvents.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    近期沒有可推薦的活動。
                  </Typography>
                ) : (
                  <List dense sx={{ overflowY: 'auto', flexGrow: 1, minHeight: 0 }}>
                    {recommendedNtuEvents.map((e) => {
                      const start = new Date(e.startTime);
                      const label = `${start.getMonth() + 1}/${start.getDate()} ${
                        start.getHours().toString().padStart(2, '0')
                      }:${start
                        .getMinutes()
                        .toString()
                        .padStart(2, '0')} - ${e.title}`;
                      return (
                        <ListItem
                          key={e.id}
                          alignItems="flex-start"
                          sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}
                        >
                          <Box
                            sx={{
                              display: 'flex',
                              flexDirection: 'column',
                              flexGrow: 1,
                              minWidth: 0,
                              gap: 0.5,
                            }}
                          >
                            <Typography
                              variant="body2"
                              sx={{
                                display: 'block',
                                whiteSpace: 'normal',
                                wordBreak: 'break-word',
                              }}
                            >
                              {label}
                            </Typography>
                            {e.location && (
                              <Typography
                                variant="body2"
                                color="text.secondary"
                                sx={{
                                  display: 'block',
                                  whiteSpace: 'normal',
                                  wordBreak: 'break-word',
                                }}
                              >
                                {e.location}
                              </Typography>
                            )}
                          </Box>
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => handleAddNtuToPersonal(e)}
                            sx={{ flexShrink: 0 }}
                          >
                            加入行事曆
                          </Button>
                        </ListItem>
                      );
                    })}
                  </List>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* 編輯 / 新增行程 Dialog */}
        <Dialog open={editDialog.open} onClose={closeDialog} maxWidth="sm" fullWidth>
          <DialogTitle>
            {editDialog.mode === 'create' ? '新增行程' : '編輯行程'}
          </DialogTitle>
          <DialogContent dividers>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
              <TextField
                label="標題"
                value={editDialog.title}
                onChange={(e) =>
                  setEditDialog((prev) => ({ ...prev, title: e.target.value }))
                }
                fullWidth
                required
              />
              <TextField
                label="地點"
                value={editDialog.location}
                onChange={(e) =>
                  setEditDialog((prev) => ({
                    ...prev,
                    location: e.target.value,
                  }))
                }
                fullWidth
              />
              <TextField
                label="開始時間"
                type="datetime-local"
                value={editDialog.startTime}
                onChange={(e) =>
                  setEditDialog((prev) => ({
                    ...prev,
                    startTime: e.target.value,
                  }))
                }
                fullWidth
                InputLabelProps={{ shrink: true }}
                required
              />
              <TextField
                label="結束時間"
                type="datetime-local"
                value={editDialog.endTime}
                onChange={(e) =>
                  setEditDialog((prev) => ({
                    ...prev,
                    endTime: e.target.value,
                  }))
                }
                fullWidth
                InputLabelProps={{ shrink: true }}
                required
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={editDialog.allDay}
                    onChange={(e) =>
                      setEditDialog((prev) => ({
                        ...prev,
                        allDay: e.target.checked,
                      }))
                    }
                  />
                }
                label="整日活動"
              />
              <TextField
                label="備註"
                value={editDialog.description}
                onChange={(e) =>
                  setEditDialog((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                fullWidth
                multiline
                minRows={2}
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={closeDialog}>取消</Button>
            <Button variant="contained" onClick={handleDialogSubmit}>
              儲存
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </MainLayout>
  );
}


