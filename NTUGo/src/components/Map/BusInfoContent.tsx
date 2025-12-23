'use client';

import * as React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Button from '@mui/material/Button';
import NotificationsIcon from '@mui/icons-material/Notifications';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import type { BusStop, BusRealTimeInfo } from '@/services/busApi';

interface BusInfoContentProps {
  selectedBusStop: BusStop | null;
  busRealTimeInfo: BusRealTimeInfo[];
  busRealTimeLoading: boolean;
  busError: string | null;
}

// 路線卡片組件（單獨 memo 化以減少重新渲染）
const RouteCard = React.memo(({ 
  routeInfos, 
  stopUID, 
  stopName,
  hasReminder,
  onToggleReminder,
  isReminderLoading,
  destinationStopName,
}: { 
  routeInfos: BusRealTimeInfo[];
  stopUID: string;
  stopName: string;
  hasReminder: boolean;
  onToggleReminder: () => void;
  isReminderLoading: boolean;
  destinationStopName?: string;
}) => {
  const info = routeInfos[0];
  const estimateMinutes = info.EstimateTime 
    ? Math.floor(info.EstimateTime / 60) 
    : null;
  const statusText = 
    info.StopStatus === 0 ? '即將進站' :
    info.StopStatus === 1 ? '尚未發車' :
    info.StopStatus === 2 ? '交管不停靠' :
    info.StopStatus === 3 ? '末班車已過' :
    info.StopStatus === 4 ? '今日未營運' : '未知';
  
  const busCount = routeInfos.length > 1 ? ` (${routeInfos.length}班)` : '';
  const secondBusTime = routeInfos.length > 1 && routeInfos[1].EstimateTime
    ? Math.floor(routeInfos[1].EstimateTime / 60)
    : null;

  const canSetReminder = estimateMinutes !== null && estimateMinutes >= 0 && estimateMinutes >= 5;

  // 顯示方向：如果有終點站名稱則顯示，否則顯示去程/返程
  const directionText = destinationStopName 
    ? `(往${destinationStopName})`
    : (info.Direction === 0 ? '(去程)' : '(返程)');

  return (
    <Box 
      sx={{ 
        mb: 1.5, 
        p: 1.5, 
        bgcolor: 'rgba(33, 150, 243, 0.08)', 
        borderRadius: 2,
        borderLeft: '4px solid #2196f3',
        transition: 'all 0.2s',
        '&:hover': {
          bgcolor: 'rgba(33, 150, 243, 0.12)',
          transform: 'translateX(2px)',
        },
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box sx={{ flex: 1 }}>
          <Typography variant="body2" sx={{ fontWeight: 700, mb: 0.5, color: '#1976d2' }}>
            {info.RouteName.Zh_tw}
            <Typography component="span" sx={{ fontWeight: 400, fontSize: '0.75rem', ml: 0.5, color: 'text.secondary' }}>
              {directionText}
              {busCount}
            </Typography>
          </Typography>
          {estimateMinutes !== null && estimateMinutes >= 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
              ⏱️ {estimateMinutes === 0 ? '即將進站' : `預估 ${estimateMinutes} 分鐘後到站`}
              {secondBusTime !== null && secondBusTime > 0 && (
                <Typography component="span" sx={{ ml: 1, fontSize: '0.85rem' }}>
                  / {secondBusTime} 分鐘
                </Typography>
              )}
            </Typography>
          ) : (
            <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
              {statusText}
            </Typography>
          )}
          {info.PlateNumb && (
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5, fontSize: '0.7rem' }}>
              車牌：{info.PlateNumb}
            </Typography>
          )}
        </Box>
        {canSetReminder && (
          <Tooltip title={hasReminder ? '取消提醒' : '設定提醒（到站前5分鐘通知）'}>
            <span>
              <IconButton
                size="small"
                onClick={onToggleReminder}
                disabled={isReminderLoading}
                sx={{
                  color: hasReminder ? '#ff9800' : 'text.secondary',
                  '&:hover': {
                    color: hasReminder ? '#f57c00' : '#1976d2',
                  },
                }}
              >
                {hasReminder ? <NotificationsActiveIcon fontSize="small" /> : <NotificationsIcon fontSize="small" />}
              </IconButton>
            </span>
          </Tooltip>
        )}
      </Box>
    </Box>
  );
});

RouteCard.displayName = 'RouteCard';

const ITEMS_PER_PAGE = 5; // 每页显示5班

function BusInfoContent({
  selectedBusStop,
  busRealTimeInfo,
  busRealTimeLoading,
  busError,
}: BusInfoContentProps) {
  const [reminders, setReminders] = React.useState<Map<string, string>>(new Map()); // routeKey -> reminderId
  const [reminderLoading, setReminderLoading] = React.useState<Map<string, boolean>>(new Map()); // routeKey -> loading
  const [loadingReminders, setLoadingReminders] = React.useState(false);
  const [displayedPage, setDisplayedPage] = React.useState(1); // 当前显示的页数
  const [routeStopNames, setRouteStopNames] = React.useState<Map<string, string>>(new Map()); // routeKey -> destinationStopName
  const loadedRoutesRef = React.useRef<Set<string>>(new Set()); // 跟踪已加载的路由键

  // 加载用户的提醒列表（在组件挂载时和公车信息变化时重新加载）
  const loadReminders = React.useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      setLoadingReminders(true);
      const response = await fetch('/api/bus/reminders', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        const reminderMap = new Map<string, string>();
        data.reminders.forEach((reminder: any) => {
          if (reminder.isActive && !reminder.isNotified) {
            const key = `${reminder.routeUID}_${reminder.direction}`;
            reminderMap.set(key, reminder._id);
          }
        });
        setReminders(reminderMap);
      }
    } catch (error) {
      console.error('載入提醒列表失敗:', error);
    } finally {
      setLoadingReminders(false);
    }
  }, []);

  // 组件挂载时加载提醒列表
  React.useEffect(() => {
    loadReminders();
  }, [loadReminders]);

  // 当公车信息变化时，重新加载提醒列表（确保提醒状态正确显示）
  React.useEffect(() => {
    if (busRealTimeInfo.length > 0) {
      loadReminders();
    }
  }, [busRealTimeInfo.length, loadReminders]);

  // 加载路线信息（起点站和终点站）- 带重试和速率限制
  const loadRouteInfo = React.useCallback(async (routeUID: string, direction: number, retryCount = 0) => {
    const routeKey = `${routeUID}_${direction}`;

    // 如果已经加载过，跳过
    if (loadedRoutesRef.current.has(routeKey)) {
      return;
    }

    // 标记为正在加载
    loadedRoutesRef.current.add(routeKey);

    try {
      const response = await fetch(`/api/tdx/bus-route?routeUID=${encodeURIComponent(routeUID)}&direction=${direction}`);
      
      // 处理 429 错误（Too Many Requests）
      if (response.status === 429) {
        // 如果重试次数少于 3 次，等待后重试
        if (retryCount < 3) {
          const waitTime = (retryCount + 1) * 2000; // 2秒、4秒、6秒
          // 請求被限流，等待後重試
          loadedRoutesRef.current.delete(routeKey); // 允许重试
          await new Promise(resolve => setTimeout(resolve, waitTime));
          return loadRouteInfo(routeUID, direction, retryCount + 1);
        } else {
          console.error(`路線資訊請求失敗: 超過重試次數 (${routeUID})`);
          loadedRoutesRef.current.delete(routeKey);
          return;
        }
      }
      
      if (response.ok) {
        const data = await response.json();
        if (data.destinationStopName) {
          setRouteStopNames((prev) => {
            // 如果已经存在，不更新
            if (prev.has(routeKey)) {
              return prev;
            }
            const newMap = new Map(prev);
            newMap.set(routeKey, data.destinationStopName);
            return newMap;
          });
        }
      } else {
        console.error(`載入路線資訊失敗: ${response.status} ${response.statusText}`);
        loadedRoutesRef.current.delete(routeKey);
      }
    } catch (error) {
      console.error('載入路線資訊失敗:', error);
      // 如果加载失败，从 ref 中移除，允许重试
      loadedRoutesRef.current.delete(routeKey);
    }
  }, []);

  // 当公车信息变化时，加载所有路线的起点站和终点站信息（带速率限制）
  React.useEffect(() => {
    if (busRealTimeInfo.length === 0) return;

    // 获取所有唯一的路线
    const uniqueRoutes: Array<{ routeUID: string; direction: number }> = [];
    const routeKeys = new Set<string>();
    
    for (const info of busRealTimeInfo) {
      const routeKey = `${info.RouteUID}_${info.Direction}`;
      // 如果还没有加载过，才加入队列
      if (!routeKeys.has(routeKey) && !loadedRoutesRef.current.has(routeKey)) {
        routeKeys.add(routeKey);
        uniqueRoutes.push({ routeUID: info.RouteUID, direction: info.Direction });
      }
    }

    // 逐個加載路線資訊，避免並發請求過多（每 300ms 一個）
    if (uniqueRoutes.length > 0) {
      uniqueRoutes.forEach((route, index) => {
        setTimeout(() => {
          loadRouteInfo(route.routeUID, route.direction);
        }, index * 300); // 每個請求間隔 300ms
      });
    }
  }, [busRealTimeInfo, loadRouteInfo]);

  // 切换提醒状态
  const handleToggleReminder = React.useCallback(async (
    routeUID: string,
    routeName: string,
    direction: number,
    stopUID: string,
    stopName: string,
    estimateTime: number
  ) => {
    const key = `${routeUID}_${direction}`;
    const reminderId = reminders.get(key);

    const token = localStorage.getItem('token');
    if (!token) {
      alert('請先登入');
      return;
    }

    setReminderLoading((prev) => new Map(prev).set(key, true));

    try {
      if (reminderId) {
        // 删除提醒
        const response = await fetch(`/api/bus/reminders/${reminderId}`, {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          setReminders((prev) => {
            const newMap = new Map(prev);
            newMap.delete(key);
            return newMap;
          });
          // 重新加载提醒列表，确保数据同步
          await loadReminders();
        } else {
          const errorData = await response.json();
          alert(errorData.message || '取消提醒失敗');
        }
      } else {
        // 创建提醒
        const response = await fetch('/api/bus/reminders', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            stopUID,
            stopName,
            routeUID,
            routeName,
            direction,
            estimateTime,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          setReminders((prev) => {
            const newMap = new Map(prev);
            newMap.set(key, data.reminder._id);
            return newMap;
          });
          // 重新加载提醒列表，确保数据同步
          await loadReminders();
        } else {
          const errorData = await response.json();
          alert(errorData.message || '設定提醒失敗');
        }
      }
    } catch (error) {
      console.error('切換提醒失敗:', error);
      alert('操作失敗，請稍後再試');
    } finally {
      setReminderLoading((prev) => {
        const newMap = new Map(prev);
        newMap.set(key, false);
        return newMap;
      });
    }
  }, [reminders, loadReminders]);
  // 優化：按路線分組並排序（使用 useMemo 避免重複計算）
  const groupedRoutes = React.useMemo(() => {
    if (busRealTimeInfo.length === 0) return [];
    
    const groups = new Map<string, BusRealTimeInfo[]>();
    
    // 一次遍歷完成分組和排序
    for (const info of busRealTimeInfo) {
      const key = `${info.RouteUID}_${info.Direction}`;
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(info);
    }
    
    // 對每組內的資訊按 EstimateTime 排序（時間越短越前面）
    const sortedGroups: BusRealTimeInfo[][] = [];
    for (const [key, infos] of groups) {
      infos.sort((a, b) => {
        const timeA = a.EstimateTime ?? Infinity;
        const timeB = b.EstimateTime ?? Infinity;
        return timeA - timeB;
      });
      sortedGroups.push(infos);
    }
    
    // 按第一班車的時間排序（時間越短越前面）
    sortedGroups.sort((a, b) => {
      const timeA = a[0]?.EstimateTime ?? Infinity;
      const timeB = b[0]?.EstimateTime ?? Infinity;
      return timeA - timeB;
    });
    
    return sortedGroups;
  }, [busRealTimeInfo]);

  // 当数据变化时，重置到第一页
  React.useEffect(() => {
    setDisplayedPage(1);
  }, [busRealTimeInfo.length]);

  // 计算当前页显示的路線（累积显示：第1页显示5条，第2页显示10条，以此类推）
  const displayedRoutes = React.useMemo(() => {
    const endIndex = displayedPage * ITEMS_PER_PAGE;
    return groupedRoutes.slice(0, endIndex);
  }, [groupedRoutes, displayedPage]);

  // 是否还有更多路线
  const hasMore = groupedRoutes.length > displayedPage * ITEMS_PER_PAGE;
  const totalPages = Math.ceil(groupedRoutes.length / ITEMS_PER_PAGE);

  // 計算唯一路線數量
  const uniqueRouteCount = groupedRoutes.length;
  
  // 記憶化錯誤訊息
  const errorMessage = React.useMemo(() => {
    if (!busError) return null;
    return busError.includes('API Key') ? (
      <>
        需要設定 TDX API Key 才能顯示公車資訊
        <br />
        <Typography variant="caption" component="span">
          請在 .env.local 中設定 TDX_CLIENT_ID 和 TDX_CLIENT_SECRET
        </Typography>
      </>
    ) : busError;
  }, [busError]);

  return (
    <Box>
      {busRealTimeLoading && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2, py: 1 }}>
          <CircularProgress size={20} sx={{ color: '#0F4C75' }} />
          <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
            載入中...
          </Typography>
        </Box>
      )}
      
      {errorMessage && !busRealTimeInfo.length && (
        <Alert severity="info" sx={{ mb: 1, fontSize: '0.75rem', py: 0.5 }}>
          {errorMessage}
        </Alert>
      )}
      
      {selectedBusStop && (
        <Box>
          {selectedBusStop.StopAddress && (
            <Box
              sx={{
                mb: 2,
                p: 1.5,
                backgroundColor: '#f5f5f5',
                borderRadius: 1,
                borderLeft: '3px solid #2196f3',
              }}
            >
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
                📍 {selectedBusStop.StopAddress}
              </Typography>
            </Box>
          )}
          
          {busRealTimeInfo.length > 0 ? (
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    fontWeight: 700, 
                    color: '#0F4C75',
                    fontSize: '0.875rem',
                    textTransform: 'uppercase',
                    letterSpacing: 0.5,
                  }}
                >
                  即時到站資訊
                </Typography>
                <Typography 
                  variant="caption" 
                  sx={{ 
                    color: 'text.secondary',
                    fontWeight: 500,
                    fontSize: '0.75rem',
                  }}
                >
                  顯示 {displayedRoutes.length} / {uniqueRouteCount} 條路線
                  {totalPages > 1 && ` (第 ${displayedPage} / ${totalPages} 頁)`}
                </Typography>
              </Box>
              <Box
                sx={{
                  maxHeight: '400px',
                  overflowY: 'auto',
                  overflowX: 'hidden',
                  pr: 1,
                  // 自訂滾動條樣式
                  '&::-webkit-scrollbar': {
                    width: '6px',
                  },
                  '&::-webkit-scrollbar-track': {
                    backgroundColor: '#f1f1f1',
                    borderRadius: '3px',
                  },
                  '&::-webkit-scrollbar-thumb': {
                    backgroundColor: '#888',
                    borderRadius: '3px',
                    '&:hover': {
                      backgroundColor: '#555',
                    },
                  },
                }}
              >
                {displayedRoutes.map((routeInfos, groupIndex) => {
                  const info = routeInfos[0];
                  const routeKey = `${info.RouteUID}_${info.Direction}`;
                  const hasReminder = reminders.has(routeKey);
                  const isReminderLoading = reminderLoading.get(routeKey) || false;
                  const destinationStopName = routeStopNames.get(routeKey);

                  return (
                    <RouteCard
                      key={`${info.RouteUID}_${info.Direction}_${groupIndex}`}
                      routeInfos={routeInfos}
                      stopUID={info.StopUID}
                      stopName={info.StopName.Zh_tw}
                      hasReminder={hasReminder}
                      onToggleReminder={() => {
                        if (selectedBusStop && info.EstimateTime !== undefined) {
                          handleToggleReminder(
                            info.RouteUID,
                            info.RouteName.Zh_tw,
                            info.Direction,
                            info.StopUID,
                            info.StopName.Zh_tw,
                            info.EstimateTime
                          );
                        }
                      }}
                      isReminderLoading={isReminderLoading}
                      destinationStopName={destinationStopName}
                    />
                  );
                })}
                
                {hasMore && (
                  <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2, mb: 1 }}>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => setDisplayedPage(prev => prev + 1)}
                      endIcon={<ExpandMoreIcon />}
                      sx={{
                        textTransform: 'none',
                        borderColor: '#2196f3',
                        color: '#2196f3',
                        '&:hover': {
                          borderColor: '#1976d2',
                          backgroundColor: 'rgba(33, 150, 243, 0.04)',
                        },
                      }}
                    >
                      載入更多 ({groupedRoutes.length - displayedRoutes.length} 條路線)
                    </Button>
                  </Box>
                )}
                
                {displayedPage > 1 && (
                  <Box sx={{ display: 'flex', justifyContent: 'center', mt: 1, mb: 1 }}>
                    <Button
                      variant="text"
                      size="small"
                      onClick={() => setDisplayedPage(1)}
                      sx={{
                        textTransform: 'none',
                        color: 'text.secondary',
                        fontSize: '0.75rem',
                      }}
                    >
                      回到第一頁
                    </Button>
                  </Box>
                )}
              </Box>
            </Box>
          ) : !busRealTimeLoading && (
            <Typography variant="body2" color="text.secondary">
              目前無公車資訊
            </Typography>
          )}
        </Box>
      )}
    </Box>
  );
}

// 使用 React.memo 優化組件，避免不必要的重新渲染
export default React.memo(BusInfoContent);
