import { NextRequest, NextResponse } from 'next/server';

// TDX API 認證資訊
const TDX_CLIENT_ID = process.env.TDX_CLIENT_ID || '';
const TDX_CLIENT_SECRET = process.env.TDX_CLIENT_SECRET || '';

// Token 快取（避免每次請求都獲取新 token）
let cachedToken: string | null = null;
let tokenExpiryTime: number = 0;
const TOKEN_CACHE_DURATION = 3600000; // Token 快取 1 小時（通常 token 有效期更長）

/**
 * 獲取 TDX API Access Token（帶快取）
 */
async function getTDXToken(): Promise<string> {
  const now = Date.now();
  
  // 如果快取的 token 還有效，直接返回
  if (cachedToken && now < tokenExpiryTime) {
    return cachedToken;
  }

  const response = await fetch('https://tdx.transportdata.tw/auth/realms/TDXConnect/protocol/openid-connect/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: TDX_CLIENT_ID,
      client_secret: TDX_CLIENT_SECRET,
    }),
  });

  if (!response.ok) {
    throw new Error(`TDX 認證失敗: ${response.status}`);
  }

  const data = await response.json();
  cachedToken = data.access_token;
  tokenExpiryTime = now + TOKEN_CACHE_DURATION;
  
  return cachedToken;
}

/**
 * 限制並發請求的輔助函數
 */
async function limitConcurrency<T>(
  tasks: (() => Promise<T>)[],
  limit: number = 2
): Promise<T[]> {
  const results: T[] = [];
  
  for (let i = 0; i < tasks.length; i += limit) {
    const batch = tasks.slice(i, i + limit);
    const batchResults = await Promise.all(batch.map(task => task()));
    results.push(...batchResults);
    
    // 批次之間添加延遲以避免429錯誤
    if (i + limit < tasks.length) {
      await new Promise(resolve => setTimeout(resolve, 300));
    }
  }
  
  return results;
}

/**
 * 帶重試機制的請求函數（處理429錯誤）
 */
async function fetchWithRetry(
  url: string,
  headers: HeadersInit,
  maxRetries: number = 2,
  retryDelay: number = 1000
): Promise<any[]> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetch(url, { headers });

      if (response.status === 429 && attempt < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, retryDelay * (attempt + 1)));
        continue;
      }

      if (!response.ok) {
        return [];
      }

      const data = await response.json();
      return Array.isArray(data) ? data : [];
    } catch (error) {
      if (attempt < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, retryDelay));
        continue;
      }
      return [];
    }
  }
  return [];
}

/**
 * 獲取公車即時資訊
 * 支援兩種查詢方式：
 * 1. 根據 stopUID 查詢單一站點的即時資訊
 * 2. 根據 stopName 查詢所有同名站點的即時資訊（推薦，類似台北等公車）
 * 
 * 當使用 stopName 時，會查詢所有具有相同站名的 StopUID，並合併所有路線資訊
 */
export async function GET(request: NextRequest) {
  try {
    if (!TDX_CLIENT_ID || !TDX_CLIENT_SECRET) {
      return NextResponse.json(
        { error: 'TDX API Key 未設定' },
        { status: 500 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const stopUID = searchParams.get('stopUID');
    const stopName = searchParams.get('stopName');

    // 必須提供 stopUID 或 stopName 其中一個
    if (!stopUID && !stopName) {
      return NextResponse.json(
        { error: '缺少必要參數: stopUID 或 stopName' },
        { status: 400 }
      );
    }

    const accessToken = await getTDXToken();
    let allBusData: any[] = [];

    // 如果提供 stopName，先查詢所有同名站點的 StopUID
    if (stopName) {
      // 使用 contains 查詢以匹配站名變體（例如："臺大癌醫" 和 "臺大癌醫 (基隆路)"）
      const stopsResponse = await fetch(
        `https://tdx.transportdata.tw/api/basic/v2/Bus/Stop/City/Taipei?$filter=contains(StopName/Zh_tw,'${encodeURIComponent(stopName)}')&$format=JSON`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Accept': 'application/json',
          },
        }
      );

      if (stopsResponse.ok) {
        const stopsData = await stopsResponse.json();
        let matchingStops = Array.isArray(stopsData) ? stopsData : [];
        
        // 過濾出真正匹配的站點（因為 contains 可能匹配到部分字串）
        // 優先匹配完全相同的站名，其次匹配以該站名開頭的站名（例如："臺大癌醫" 匹配 "臺大癌醫 (基隆路)"）
        matchingStops = matchingStops.filter((stop: any) => {
          const stopNameZh = stop.StopName?.Zh_tw || '';
          // 完全匹配或站名以查詢名稱開頭（允許後綴如 "(基隆路)"）
          return stopNameZh === stopName || stopNameZh.startsWith(stopName);
        });
        
        const stopUIDs = matchingStops.map((stop: any) => stop.StopUID);
        
        if (stopUIDs.length === 0) {
          return NextResponse.json({ BusRealTimeInfos: [] });
        }

        // 建立查詢任務
        const realTimeTasks = stopUIDs.map((uid: string) => async () => {
          const url = `https://tdx.transportdata.tw/api/basic/v2/Bus/EstimatedTimeOfArrival/City/Taipei?$filter=StopUID eq '${uid}'&$format=JSON`;
          const headers = {
            'Authorization': `Bearer ${accessToken}`,
            'Accept': 'application/json',
          };
          return await fetchWithRetry(url, headers);
        });

        // 批次查詢（每批2個，批次間延遲300ms）
        const realTimeResults = await limitConcurrency(realTimeTasks, 2);
        allBusData = realTimeResults.flat();

        // 去重並排序：一次遍歷完成
        const uniqueMap = new Map<string, any>();
        for (const item of allBusData) {
          const key = `${item.RouteUID}_${item.Direction}`;
          const existing = uniqueMap.get(key);
          const itemTime = item.EstimateTime ?? Infinity;
          const existingTime = existing?.EstimateTime ?? Infinity;
          
          if (!existing || itemTime < existingTime) {
            uniqueMap.set(key, item);
          }
        }
        
        // 轉換為陣列並排序
        allBusData = Array.from(uniqueMap.values()).sort((a, b) => {
          const timeA = a.EstimateTime ?? Infinity;
          const timeB = b.EstimateTime ?? Infinity;
          return timeA - timeB;
        });
      }
    } else if (stopUID) {
      // 根據 stopUID 查詢
      const url = `https://tdx.transportdata.tw/api/basic/v2/Bus/EstimatedTimeOfArrival/City/Taipei?$filter=StopUID eq '${stopUID}'&$format=JSON`;
      const headers = {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json',
      };
      
      allBusData = await fetchWithRetry(url, headers);
    }

    return NextResponse.json({ BusRealTimeInfos: allBusData });
  } catch (error: any) {
    console.error('獲取公車即時資訊失敗:', error);
    return NextResponse.json(
      { error: '獲取公車即時資訊失敗', message: error.message },
      { status: 500 }
    );
  }
}

