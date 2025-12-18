import { NextRequest, NextResponse } from 'next/server';
import { safeJsonParse } from '@/lib/utils/safeJsonParse';

// TDX API 認證資訊
const TDX_CLIENT_ID = process.env.TDX_CLIENT_ID || '';
const TDX_CLIENT_SECRET = process.env.TDX_CLIENT_SECRET || '';

/**
 * 獲取 TDX API Access Token
 */
async function getTDXToken(): Promise<string> {
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
  return data.access_token;
}

/**
 * 獲取公車站牌資訊
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
    const lat = searchParams.get('lat');
    const lon = searchParams.get('lon');
    const radius = searchParams.get('radius') || '1000';

    if (!lat || !lon) {
      return NextResponse.json(
        { error: '缺少必要參數: lat, lon' },
        { status: 400 }
      );
    }

    const accessToken = await getTDXToken();

    // 使用 TDX API 獲取站牌資訊
    // 台北市公車站牌 API
    const response = await fetch(
      `https://tdx.transportdata.tw/api/basic/v2/Bus/Stop/City/Taipei?$spatialFilter=nearby(${lat},${lon},${radius})&$format=JSON`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`TDX API 請求失敗: ${response.status}`);
    }

    const data = await safeJsonParse<any[]>(response, 'Bus Stops API');
    return NextResponse.json({ Stops: data });
  } catch (error: any) {
    console.error('獲取公車站牌失敗:', error);
    return NextResponse.json(
      { error: '獲取公車站牌失敗', message: error.message },
      { status: 500 }
    );
  }
}

