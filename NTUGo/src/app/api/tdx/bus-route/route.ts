import { NextRequest, NextResponse } from 'next/server';
import { safeJsonParse } from '@/lib/utils/safeJsonParse';

// TDX API 認證資訊
const TDX_CLIENT_ID = process.env.TDX_CLIENT_ID || '';
const TDX_CLIENT_SECRET = process.env.TDX_CLIENT_SECRET || '';

// Token 快取（避免每次請求都獲取新 token）
let cachedToken: string | null = null;
let tokenExpiryTime: number = 0;
const TOKEN_CACHE_DURATION = 3600000; // Token 快取 1 小時

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

  const data = await safeJsonParse<{ access_token: string }>(response, 'TDX Token API');
  const token: string = data.access_token;
  cachedToken = token;
  tokenExpiryTime = now + TOKEN_CACHE_DURATION;
  
  return token;
}

/**
 * 獲取公車路線資訊（包括起點站和終點站）
 * 支援根據 RouteUID 和 Direction 查詢
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
    const routeUID = searchParams.get('routeUID');
    const direction = searchParams.get('direction'); // 0: 去程, 1: 返程

    if (!routeUID) {
      return NextResponse.json(
        { error: '缺少必要參數: routeUID' },
        { status: 400 }
      );
    }

    const accessToken = await getTDXToken();

    // 查詢路線資訊
    // TDX API: Bus/Route/City/Taipei
    const url = `https://tdx.transportdata.tw/api/basic/v2/Bus/Route/City/Taipei?$filter=RouteUID eq '${routeUID}'&$format=JSON`;
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: '獲取路線資訊失敗', message: `API 請求失敗: ${response.status}` },
        { status: response.status }
      );
    }

    const data = await safeJsonParse<any[]>(response, 'Bus Route API');
    const routes = Array.isArray(data) ? data : [];

    if (routes.length === 0) {
      return NextResponse.json(
        { error: '找不到路線資訊' },
        { status: 404 }
      );
    }

    // 根據 Direction 過濾路線（如果提供了 direction 參數）
    let targetRoute = routes[0];
    if (direction !== null) {
      const directionNum = parseInt(direction, 10);
      const filteredRoute = routes.find((route: any) => route.Direction === directionNum);
      if (filteredRoute) {
        targetRoute = filteredRoute;
      }
    }

    // 提取起點站和終點站名稱
    // TDX API 可能使用不同的字段名格式
    const departureStopName = 
      targetRoute.DepartureStopNameZh || 
      targetRoute.DepartureStopName?.Zh_tw || 
      targetRoute.DepartureStopName || 
      '';
    const destinationStopName = 
      targetRoute.DestinationStopNameZh || 
      targetRoute.DestinationStopName?.Zh_tw || 
      targetRoute.DestinationStopName || 
      '';

    return NextResponse.json({
      routeUID: targetRoute.RouteUID,
      routeName: targetRoute.RouteName?.Zh_tw || targetRoute.RouteNameZh || targetRoute.RouteName || '',
      direction: targetRoute.Direction,
      departureStopName,
      destinationStopName,
    });
  } catch (error: any) {
    console.error('獲取公車路線資訊失敗:', error);
    return NextResponse.json(
      { error: '獲取公車路線資訊失敗', message: error.message },
      { status: 500 }
    );
  }
}

