'use client';

import * as React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import type { MetroFirstLastTimetable, MetroStationTimeTable } from '@/services/metroApi';

interface MetroInfoContentProps {
  stationName: string;
  metroTimetable: MetroFirstLastTimetable[];
  metroLoading: boolean;
  metroError: string | null;
  metroStationTimeTable?: MetroStationTimeTable[];
  metroStationTimeTableLoading?: boolean;
  metroStationTimeTableError?: string | null;
}

export default function MetroInfoContent({
  stationName,
  metroTimetable,
  metroLoading,
  metroError,
  metroStationTimeTable = [],
  metroStationTimeTableLoading = false,
  metroStationTimeTableError = null,
}: MetroInfoContentProps) {
  // 處理時刻表資料，按目的地方向分組
  const timetableByDirection = React.useMemo(() => {
    const result: { [key: string]: MetroFirstLastTimetable[] } = {};
    
    metroTimetable.forEach((item) => {
      // 確保數據有效
      if (!item || !item.FirstTrainTime || !item.LastTrainTime) {
        console.warn('無效的首末班車數據:', item);
        return;
      }
      
      // 使用 TripHeadSign 作為分組鍵（如"往松山"）
      const directionKey = item.TripHeadSign || item.DestinationStationName?.Zh_tw || '未知方向';
      
      // 根據站名過濾掉明顯錯誤的方向
      // 公館站、台電大樓站、萬隆站在松山新店線（G線），只有往松山和往新店
      // 科技大樓站在文湖線（BR線）
      // 大安站和古亭站是交界站，可能有多個方向
      if (stationName.includes('公館') || stationName.includes('台電大樓') || stationName.includes('萬隆')) {
        // 松山新店線的站，只應該有往松山和往新店
        if (!directionKey.includes('松山') && !directionKey.includes('新店')) {
          console.warn(`過濾掉無效方向: ${directionKey} (站名: ${stationName}, 線路: ${item.LineID})`);
          return;
        }
      } else if (stationName.includes('科技大樓')) {
        // 文湖線的站，只應該有文湖線的方向
        if (item.LineID && !item.LineID.includes('BR')) {
          console.warn(`過濾掉無效方向: ${directionKey} (站名: ${stationName}, 線路: ${item.LineID})`);
          return;
        }
      }
      
      if (!result[directionKey]) {
        result[directionKey] = [];
      }
      result[directionKey].push(item);
    });
    
    return result;
  }, [metroTimetable, stationName]);

  // 格式化時間（從 HH:mm 轉換為更易讀的格式）
  const formatTime = (time: string | undefined) => {
    if (!time || time === '00:00' || time.trim() === '') return '--';
    // 確保時間格式正確 (HH:mm)
    if (time.match(/^\d{2}:\d{2}$/)) {
      return time;
    }
    return '--';
  };

  // 獲取方向顯示名稱
  const getDirectionDisplayName = (tripHeadSign: string) => {
    // 如果 TripHeadSign 已經包含"往"，直接使用
    if (tripHeadSign.includes('往')) {
      return tripHeadSign;
    }
    // 否則加上"往"
    return `往${tripHeadSign}`;
  };

  // 計算下一班車時間和剩餘時間
  const getNextTrainInfo = React.useMemo(() => {
    const result: { [key: string]: { nextTime: string; minutesLeft: number | null } } = {};
    
    if (metroStationTimeTable.length === 0) {
      return result;
    }
    
    console.log(`[${stationName}] 抓到的時刻表數據 (共 ${metroStationTimeTable.length} 筆):`, metroStationTimeTable);
    
    // 詳細檢查第一筆數據的所有字段
    if (metroStationTimeTable.length > 0) {
      const firstTrain = metroStationTimeTable[0] as any;
      console.log(`[${stationName}] 第一筆數據的完整結構:`, {
        allKeys: Object.keys(firstTrain),
        fullObject: firstTrain,
        Timetables: firstTrain.Timetables,
        TimetablesType: Array.isArray(firstTrain.Timetables) ? 'array' : typeof firstTrain.Timetables,
        TimetablesLength: Array.isArray(firstTrain.Timetables) ? firstTrain.Timetables.length : 0,
        firstTimetable: Array.isArray(firstTrain.Timetables) && firstTrain.Timetables.length > 0 ? firstTrain.Timetables[0] : null,
      });
    }
    
    const now = new Date();
    // 使用台灣時區（UTC+8）
    const taiwanTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Taipei' }));
    const currentHours = taiwanTime.getHours();
    const currentMinutes = taiwanTime.getMinutes();
    const currentTime = currentHours * 60 + currentMinutes; // 當前時間（分鐘）

    // 按 DestinationStationName 分組（根據用戶要求）
    const trainsByDirection: { [key: string]: MetroStationTimeTable[] } = {};
    metroStationTimeTable.forEach((train) => {
      const trainAny = train as any;
      // 優先使用 DestinationStationName 來決定方向
      // 如果沒有，嘗試使用 Direction 字段（StationTimeTable API 可能有這個字段）
      const directionKey = train.DestinationStationName?.Zh_tw 
        || trainAny.Direction 
        || train.TripHeadSign 
        || '未知方向';
      
      // 根據站名過濾掉明顯錯誤的方向（與首末班車時刻表相同的邏輯）
      if (stationName.includes('公館') || stationName.includes('台電大樓') || stationName.includes('萬隆')) {
        // 松山新店線的站，只應該有往松山和往新店
        if (!directionKey.includes('松山') && !directionKey.includes('新店')) {
          return;
        }
      } else if (stationName.includes('科技大樓')) {
        // 文湖線的站，只應該有文湖線的方向
        // 檢查 LineID 是否為文湖線（BR）
        const lineID = (train as any).LineID;
        const routeID = (train as any).RouteID;
        
        // 如果 LineID 或 RouteID 存在且不是文湖線，則過濾
        if (lineID && !lineID.includes('BR') && !lineID.startsWith('BR')) {
          console.log(`[${stationName}] 過濾掉非文湖線方向: ${directionKey} (LineID: ${lineID})`);
          return;
        }
        if (routeID && !routeID.includes('BR') && !routeID.startsWith('BR')) {
          console.log(`[${stationName}] 過濾掉非文湖線方向: ${directionKey} (RouteID: ${routeID})`);
          return;
        }
        // 如果 LineID 和 RouteID 都不存在，允許通過（可能是數據結構不同）
      }
      
      if (!trainsByDirection[directionKey]) {
        trainsByDirection[directionKey] = [];
      }
      trainsByDirection[directionKey].push(train);
    });
    
    console.log(`[${stationName}] 按方向分組後的時刻表:`, trainsByDirection);
    console.log(`[${stationName}] 分組後的 directions:`, Object.keys(trainsByDirection));
    
    // 如果是科技大樓站，額外記錄原始數據
    if (stationName.includes('科技大樓')) {
      console.log(`[${stationName}] 原始數據檢查:`, metroStationTimeTable.map((t: any) => ({
        LineID: t.LineID,
        DestinationStationName: t.DestinationStationName?.Zh_tw,
        TripHeadSign: t.TripHeadSign,
        Direction: t.Direction,
        hasTimetables: Array.isArray(t.Timetables),
        timetablesLength: Array.isArray(t.Timetables) ? t.Timetables.length : 0,
      })));
    }

    // 找出每個方向的下一班車
    Object.entries(trainsByDirection).forEach(([direction, trains]) => {
      // 時間信息在 Timetables 數組中
      // 需要從每個 train 的 Timetables 數組中提取所有時間
      const trainTimes: number[] = [];
      
      trains.forEach((train) => {
        const trainAny = train as any;
        const timetables = trainAny.Timetables;
        
        if (!Array.isArray(timetables)) {
          return;
        }
        
        // 從 Timetables 數組中提取時間
        timetables.forEach((timetable: any) => {
          // 嘗試多個可能的時間字段名
          const timeField = timetable.ArrivalTime 
            || timetable.arrivalTime 
            || timetable.ArrivalTime1 
            || timetable.ArrivalTime2
            || timetable.Time
            || timetable.DepartureTime
            || timetable.departureTime
            || timetable.ArrivalTime1
            || timetable.ArrivalTime2;
          
          if (!timeField || typeof timeField !== 'string') {
            // 如果第一個 timetable 找不到時間字段，記錄所有可用的鍵
            if (timetables.indexOf(timetable) === 0 && trains.indexOf(train) === 0) {
              console.warn(`[${stationName}] 方向 "${direction}" Timetable 找不到時間字段，可用字段:`, Object.keys(timetable));
            }
            return;
          }
          
          const timeParts = timeField.split(':');
          if (timeParts.length !== 2) {
            return;
          }
          
          const [hours, minutes] = timeParts.map(Number);
          if (isNaN(hours) || isNaN(minutes)) {
            return;
          }
          
          trainTimes.push(hours * 60 + minutes);
        });
      });
      
      // 排序時間列表
      trainTimes.sort((a, b) => a - b);
      
      console.log(`[${stationName}] 方向 "${direction}" 的列車時間列表:`, {
        列車數量: trains.length,
        有效時間數量: trainTimes.length,
        時間列表: trainTimes.map(t => `${Math.floor(t / 60)}:${(t % 60).toString().padStart(2, '0')}`),
        原始數據: trains.map(t => ({
          DestinationStationName: t.DestinationStationName?.Zh_tw,
          Timetables: (t as any).Timetables,
          TimetablesLength: Array.isArray((t as any).Timetables) ? (t as any).Timetables.length : 0,
        })),
      });

      // 如果沒有有效時間，跳過
      if (trainTimes.length === 0) {
        return;
      }

      // 根據現在的時間找下一班車（時間大於等於當前時間）
      // 如果所有時間都小於當前時間，說明今天沒有下一班車了，找明天第一班
      const nextTrainTime = trainTimes.find((time) => time >= currentTime);
      
      if (nextTrainTime !== undefined) {
        // 找到下一班車
        const [hours, minutes] = [Math.floor(nextTrainTime / 60), nextTrainTime % 60];
        const nextTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
        const minutesLeft = nextTrainTime - currentTime;
        
        result[direction] = {
          nextTime,
          minutesLeft: minutesLeft >= 0 ? minutesLeft : null,
        };
      } else {
        // 如果今天沒有下一班車，找明天第一班
        const firstTrainTime = trainTimes[0];
        if (firstTrainTime !== undefined) {
          const [hours, minutes] = [Math.floor(firstTrainTime / 60), firstTrainTime % 60];
          const nextTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
          result[direction] = {
            nextTime,
            minutesLeft: null, // 明天第一班，不顯示剩餘時間
          };
        }
      }
    });

    return result;
  }, [metroStationTimeTable, stationName]);


  return (
    <Box>
      {(metroLoading || metroStationTimeTableLoading) && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2, py: 1 }}>
          <CircularProgress size={20} sx={{ color: '#4caf50' }} />
          <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
            載入中...
          </Typography>
        </Box>
      )}
      
      {metroStationTimeTableError && (
        <Alert severity="warning" sx={{ mb: 1, fontSize: '0.75rem', py: 0.5 }}>
          列車時刻表錯誤: {metroStationTimeTableError}
        </Alert>
      )}
      
      {(metroError || metroStationTimeTableError) && !metroTimetable.length && !metroStationTimeTable.length && (
        <Alert severity="info" sx={{ mb: 1, fontSize: '0.75rem', py: 0.5 }}>
          {(metroError || metroStationTimeTableError)?.includes('API Key') ? (
            <>
              需要設定 TDX API Key 才能顯示捷運資訊
              <br />
              <Typography variant="caption" component="span">
                請在 .env.local 中設定 TDX_CLIENT_ID 和 TDX_CLIENT_SECRET
              </Typography>
            </>
          ) : (
            metroError || metroStationTimeTableError
          )}
        </Alert>
      )}


      {/* 顯示下一班車資訊 */}
      {Object.keys(getNextTrainInfo).length > 0 && (
        <Box sx={{ mb: 2 }}>
          <Typography 
            variant="body2" 
            sx={{ 
              fontWeight: 700, 
              mb: 1.5,
              color: '#4caf50',
              fontSize: '0.875rem',
              textTransform: 'uppercase',
              letterSpacing: 0.5,
            }}
          >
            下一班車
          </Typography>
          
          {Object.entries(getNextTrainInfo).map(([direction, info]) => (
            <Box 
              key={direction}
              sx={{ 
                mb: 1.5, 
                p: 1.5, 
                bgcolor: 'rgba(76, 175, 80, 0.12)', 
                borderRadius: 2,
                borderLeft: '4px solid #4caf50',
                transition: 'all 0.2s',
                '&:hover': {
                  bgcolor: 'rgba(76, 175, 80, 0.16)',
                  transform: 'translateX(2px)',
                },
              }}
            >
              <Typography 
                variant="body2" 
                sx={{ 
                  fontWeight: 600, 
                  mb: 1,
                  color: '#2e7d32',
                  fontSize: '0.8rem',
                }}
              >
                {getDirectionDisplayName(direction)}
              </Typography>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                    到站時間
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: '#2e7d32' }}>
                    {info.nextTime}
                  </Typography>
                </Box>
                {info.minutesLeft !== null && (
                  <Box sx={{ textAlign: 'right' }}>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                      剩餘時間
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: '#f57c00' }}>
                      {info.minutesLeft === 0 ? '即將進站' : `${info.minutesLeft} 分鐘`}
                    </Typography>
                  </Box>
                )}
              </Box>
            </Box>
          ))}
        </Box>
      )}
      
      {metroTimetable.length > 0 ? (
        <Box>
          <Typography 
            variant="body2" 
            sx={{ 
              fontWeight: 700, 
              mb: 1.5,
              color: '#4caf50',
              fontSize: '0.875rem',
              textTransform: 'uppercase',
              letterSpacing: 0.5,
            }}
          >
            首末班車時刻表
          </Typography>
          
          {Object.entries(timetableByDirection).map(([direction, items]) => (
            <Box key={direction} sx={{ mb: 2 }}>
              <Typography 
                variant="body2" 
                sx={{ 
                  fontWeight: 600, 
                  mb: 1,
                  color: '#2e7d32',
                  fontSize: '0.8rem',
                }}
              >
                {getDirectionDisplayName(direction)}
              </Typography>
              
              {items
                .filter((item) => item && item.FirstTrainTime && item.LastTrainTime) // 過濾無效數據
                .map((item, index) => (
                  <Box 
                    key={`${direction}-${index}`} 
                    sx={{ 
                      mb: 1.5, 
                      p: 1.5, 
                      bgcolor: 'rgba(76, 175, 80, 0.08)', 
                      borderRadius: 2,
                      borderLeft: '4px solid #4caf50',
                      transition: 'all 0.2s',
                      '&:hover': {
                        bgcolor: 'rgba(76, 175, 80, 0.12)',
                        transform: 'translateX(2px)',
                      },
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                          首班車
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: '#2e7d32' }}>
                          {formatTime(item.FirstTrainTime)}
                        </Typography>
                      </Box>
                      <Box sx={{ textAlign: 'right' }}>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                          末班車
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: '#2e7d32' }}>
                          {formatTime(item.LastTrainTime)}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                ))}
            </Box>
          ))}
        </Box>
      ) : !metroLoading && (
        <Typography variant="body2" color="text.secondary">
          目前無時刻表資訊
        </Typography>
      )}
    </Box>
  );
}

