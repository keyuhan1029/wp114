// 捷運 API 服務層
// 使用 TDX (Transport Data eXchange) API

export interface MetroStation {
  StationID: string;        // 車站編號
  StationName: {
    Zh_tw: string;          // 中文站名
    En?: string;            // 英文站名
  };
  StationPosition: {
    PositionLat: number;   // 緯度
    PositionLon: number;    // 經度
  };
}

export interface MetroFirstLastTimetable {
  LineNo: string;           // 路線編號
  LineID: string;           // 路線ID
  StationID: string;        // 車站編號
  StationName: {
    Zh_tw: string;          // 中文站名
    En?: string;            // 英文站名
  };
  TripHeadSign: string;     // 目的地（如"往南港展覽館"）
  DestinationStaionID?: string;  // 目的地車站ID
  DestinationStationName?: {
    Zh_tw: string;          // 目的地中文站名
    En?: string;            // 目的地英文站名
  };
  TrainType?: number;       // 列車類型
  FirstTrainTime: string;   // 首班車時間
  LastTrainTime: string;    // 末班車時間
  ServiceDay?: {
    Monday?: boolean;
    Tuesday?: boolean;
    Wednesday?: boolean;
    Thursday?: boolean;
    Friday?: boolean;
    Saturday?: boolean;
    Sunday?: boolean;
    NationalHolidays?: boolean;
  };
  SrcUpdateTime?: string;   // 資料更新時間
  UpdateTime?: string;      // 更新時間
  VersionID?: number;       // 版本ID
}

export interface MetroStationTimeTable {
  LineNo: string;           // 路線編號
  LineID: string;           // 路線ID
  StationID: string;        // 車站編號
  StationName: {
    Zh_tw: string;          // 中文站名
    En?: string;            // 英文站名
  };
  TripHeadSign: string;     // 目的地（如"往南港展覽館"）
  DestinationStaionID?: string;  // 目的地車站ID
  DestinationStationName?: {
    Zh_tw: string;          // 目的地中文站名
    En?: string;            // 目的地英文站名
  };
  TrainType?: number;       // 列車類型
  ArrivalTime: string;      // 到站時間 (格式: HH:mm)
  ServiceDay?: {
    Monday?: boolean;
    Tuesday?: boolean;
    Wednesday?: boolean;
    Thursday?: boolean;
    Friday?: boolean;
    Saturday?: boolean;
    Sunday?: boolean;
    NationalHolidays?: boolean;
  };
  SrcUpdateTime?: string;   // 資料更新時間
  UpdateTime?: string;      // 更新時間
  VersionID?: number;       // 版本ID
}

export interface MetroStationExit {
  StationID: string;        // 車站編號
  StationName: {
    Zh_tw: string;          // 中文站名
    En?: string;            // 英文站名
  };
  ExitID: string;           // 出口編號
  ExitName: {
    Zh_tw: string;          // 出口中文名稱
    En?: string;            // 出口英文名稱
  };
  ExitPosition: {
    PositionLat: number;   // 出口緯度
    PositionLon: number;    // 出口經度
  };
  ExitDescription?: {
    Zh_tw?: string;         // 出口描述（中文）
    En?: string;            // 出口描述（英文）
  };
  UpdateTime?: string;      // 更新時間
  VersionID?: number;       // 版本ID
}

// 快取資料
let cachedMetroStations: MetroStation[] | null = null;
let cachedTimetable: Map<string, MetroFirstLastTimetable[]> = new Map();
let cachedStationTimeTable: Map<string, MetroStationTimeTable[]> = new Map();
let cacheTimestamp: number = 0;
let stationTimeTableCacheTimestamp: number = 0;
const CACHE_DURATION = 300000; // 快取 5 分鐘（捷運時刻表更新較不頻繁）
const STATION_TIMETABLE_CACHE_DURATION = 60000; // 快取 1 分鐘（列車時刻表更新較頻繁）

// 指定的6個捷運站座標（台北捷運文湖線/松山新店線）
// 注意：古亭站和大安站是交界站，有多條線路經過，需要查詢所有線路
const METRO_STATIONS = [
  { name: '公館站', lat: 25.0147, lng: 121.5344, stationId: 'G05', isTransfer: false }, // 松山新店線，不是信義線R05
  { name: '科技大樓站', lat: 25.0261, lng: 121.5436, stationId: 'BR08', isTransfer: false },
  { name: '台電大樓站', lat: 25.0208, lng: 121.5283, stationId: 'G07', isTransfer: false },
  { name: '大安站', lat: 25.0336, lng: 121.5436, stationId: 'BR11', isTransfer: true }, // 文湖線(BR11) + 信義線(R05) 交界站
  { name: '古亭站', lat: 25.0269, lng: 121.5229, stationId: 'G09', isTransfer: true }, // 松山新店線(G09) + 中和新蘆線(O07) 交界站
  { name: '萬隆站', lat: 25.0019, lng: 121.5394, stationId: 'G04', isTransfer: false },
];

/**
 * 獲取指定的捷運站資訊
 */
export function getMetroStations(): Array<{ name: string; lat: number; lng: number; stationId: string; isTransfer?: boolean }> {
  return METRO_STATIONS;
}

/**
 * 獲取捷運首末班車時刻表
 * 注意：TDX API 需要 API Key，如果未設定則會返回空陣列
 */
export async function fetchMetroTimetable(stationId: string, stationName?: string): Promise<MetroFirstLastTimetable[]> {
  // 檢查快取
  const cacheKey = stationId || stationName || '';
  const now = Date.now();
  const cached = cachedTimetable.get(cacheKey);
  if (cached && (now - cacheTimestamp) < CACHE_DURATION) {
    return cached;
  }

  try {
    // 使用 Next.js API route 來避免 CORS 問題和處理認證
    // 優先使用 stationId，如果沒有則使用 stationName
    const queryParam = stationId 
      ? `stationId=${encodeURIComponent(stationId)}`
      : `stationName=${encodeURIComponent(stationName || '')}`;
    const response = await fetch(`/api/tdx/metro-timetable?${queryParam}`);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      
      // 如果沒有設定 API Key，返回空陣列而不是拋出錯誤
      if (response.status === 500 && errorData.error === 'TDX API Key 未設定') {
        console.warn('TDX API Key 未設定，無法載入捷運時刻表');
        return [];
      }
      
      // 處理 429 錯誤（請求過於頻繁）
      if (response.status === 429) {
        console.warn('API 請求過於頻繁，請稍後再試');
        // 返回快取資料（如果有的話）
        const cached = cachedTimetable.get(cacheKey);
        if (cached) {
          return cached;
        }
        return [];
      }
      
      throw new Error(errorData.message || `API 請求失敗: ${response.status}`);
    }

    const data = await response.json();
    const timetable: MetroFirstLastTimetable[] = data.Timetable || [];

    cachedTimetable.set(cacheKey, timetable);
    cacheTimestamp = now;

    return timetable;
  } catch (error) {
    console.error('獲取捷運時刻表失敗:', error);
    const cached = cachedTimetable.get(cacheKey);
    if (cached) {
      return cached;
    }
    // 發生錯誤時返回空陣列，而不是拋出錯誤
    return [];
  }
}

/**
 * 獲取捷運站列車時刻表（每班列車時間）
 * 注意：TDX API 需要 API Key，如果未設定則會返回空陣列
 */
export async function fetchMetroStationTimeTable(stationId: string, stationName?: string): Promise<MetroStationTimeTable[]> {
  // 檢查快取
  const cacheKey = stationId || stationName || '';
  const now = Date.now();
  const cached = cachedStationTimeTable.get(cacheKey);
  if (cached && (now - stationTimeTableCacheTimestamp) < STATION_TIMETABLE_CACHE_DURATION) {
    return cached;
  }

  try {
    // 使用 Next.js API route 來避免 CORS 問題和處理認證
    // 優先使用 stationId，如果沒有則使用 stationName
    const queryParam = stationId 
      ? `stationId=${encodeURIComponent(stationId)}`
      : `stationName=${encodeURIComponent(stationName || '')}`;
    const response = await fetch(`/api/tdx/metro-station-timetable?${queryParam}`);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      
      // 如果沒有設定 API Key，返回空陣列而不是拋出錯誤
      if (response.status === 500 && errorData.error === 'TDX API Key 未設定') {
        console.warn('TDX API Key 未設定，無法載入捷運列車時刻表');
        return [];
      }
      
      // 處理 429 錯誤（請求過於頻繁）
      if (response.status === 429) {
        console.warn('API 請求過於頻繁，請稍後再試');
        // 返回快取資料（如果有的話）
        const cached = cachedStationTimeTable.get(cacheKey);
        if (cached) {
          return cached;
        }
        return [];
      }
      
      throw new Error(errorData.message || `API 請求失敗: ${response.status}`);
    }

    const data = await response.json();
    const timetable: MetroStationTimeTable[] = data.Timetable || [];

    // 調試：記錄返回的數據結構
    if (timetable.length > 0) {
      console.log('fetchMetroStationTimeTable 返回的數據:', {
        totalCount: timetable.length,
        firstItem: timetable[0],
        firstItemKeys: Object.keys(timetable[0]),
        firstItemFull: JSON.stringify(timetable[0], null, 2),
        hasArrivalTime: 'ArrivalTime' in timetable[0],
        hasArrivalTimeLower: 'arrivalTime' in timetable[0],
        arrivalTimeValue: (timetable[0] as any).ArrivalTime || (timetable[0] as any).arrivalTime,
      });
    }

    cachedStationTimeTable.set(cacheKey, timetable);
    stationTimeTableCacheTimestamp = now;

    return timetable;
  } catch (error) {
    console.error('獲取捷運列車時刻表失敗:', error);
    const cached = cachedStationTimeTable.get(cacheKey);
    if (cached) {
      return cached;
    }
    // 發生錯誤時返回空陣列，而不是拋出錯誤
    return [];
  }
}

/**
 * 獲取捷運站出口資訊
 */
const cachedExits = new Map<string, MetroStationExit[]>();
let exitsCacheTimestamp = 0;
const EXITS_CACHE_DURATION = 3600000; // 快取 1 小時（出口資訊更新不頻繁）

export async function fetchMetroStationExits(stationId: string, stationName?: string): Promise<MetroStationExit[]> {
  const now = Date.now();
  const cacheKey = stationId || stationName || 'all';
  
  // 檢查快取
  if (cachedExits.has(cacheKey) && (now - exitsCacheTimestamp) < EXITS_CACHE_DURATION) {
    return cachedExits.get(cacheKey)!;
  }

  try {
    // 使用 Next.js API route 來避免 CORS 問題和處理認證
    const queryParam = stationId 
      ? `stationId=${encodeURIComponent(stationId)}`
      : `stationName=${encodeURIComponent(stationName || '')}`;
    const response = await fetch(`/api/tdx/metro-exits?${queryParam}`);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      
      if (response.status === 500 && errorData.error === 'TDX API Key 未設定') {
        console.warn('TDX API Key 未設定，無法載入捷運站出口資訊');
        return [];
      }
      
      if (response.status === 429) {
        console.warn('API 請求過於頻繁，請稍後再試');
        const cached = cachedExits.get(cacheKey);
        if (cached) {
          return cached;
        }
        return [];
      }
      
      throw new Error(errorData.message || `API 請求失敗: ${response.status}`);
    }

    const data = await response.json();
    const exits: MetroStationExit[] = data.Exits || [];

    cachedExits.set(cacheKey, exits);
    exitsCacheTimestamp = now;

    return exits;
  } catch (error) {
    console.error('獲取捷運站出口資訊失敗:', error);
    const cached = cachedExits.get(cacheKey);
    if (cached) {
      return cached;
    }
    return [];
  }
}

/**
 * 清除快取
 */
export function clearMetroCache(): void {
  cachedMetroStations = null;
  cachedTimetable.clear();
  cachedStationTimeTable.clear();
  cachedExits.clear();
  cacheTimestamp = 0;
  stationTimeTableCacheTimestamp = 0;
  exitsCacheTimestamp = 0;
}

