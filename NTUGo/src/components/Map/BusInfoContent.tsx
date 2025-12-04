'use client';

import * as React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import type { BusStop, BusRealTimeInfo } from '@/services/busApi';

interface BusInfoContentProps {
  selectedBusStop: BusStop | null;
  busRealTimeInfo: BusRealTimeInfo[];
  busRealTimeLoading: boolean;
  busError: string | null;
}

// 路線卡片組件（單獨 memo 化以減少重新渲染）
const RouteCard = React.memo(({ routeInfos }: { routeInfos: BusRealTimeInfo[] }) => {
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
      <Typography variant="body2" sx={{ fontWeight: 700, mb: 0.5, color: '#1976d2' }}>
        {info.RouteName.Zh_tw}
        <Typography component="span" sx={{ fontWeight: 400, fontSize: '0.75rem', ml: 0.5, color: 'text.secondary' }}>
          {info.Direction === 0 ? '(去程)' : '(返程)'}
          {busCount}
        </Typography>
      </Typography>
      {estimateMinutes !== null && estimateMinutes >= 0 ? (
        <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
          ⏱️ 預估 {estimateMinutes} 分鐘後到站
          {secondBusTime !== null && (
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
  );
});

RouteCard.displayName = 'RouteCard';

function BusInfoContent({
  selectedBusStop,
  busRealTimeInfo,
  busRealTimeLoading,
  busError,
}: BusInfoContentProps) {
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
                  共 {uniqueRouteCount} 條路線
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
                {groupedRoutes.map((routeInfos, groupIndex) => {
                  const info = routeInfos[0];
                  return (
                    <RouteCard
                      key={`${info.RouteUID}_${info.Direction}_${groupIndex}`}
                      routeInfos={routeInfos}
                    />
                  );
                })}
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
