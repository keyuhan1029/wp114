import { NextResponse } from 'next/server';

// TDX API 認證資訊
// 注意：實際使用時需要申請 TDX API Key
// 請前往 https://tdx.transportdata.tw/ 申請
const TDX_CLIENT_ID = process.env.TDX_CLIENT_ID || '';
const TDX_CLIENT_SECRET = process.env.TDX_CLIENT_SECRET || '';

// Token 快取
let cachedToken: string | null = null;
let tokenExpiry: number = 0;

/**
 * 獲取 TDX API Access Token
 */
async function getTDXToken(): Promise<string> {
  // 檢查快取的 token 是否還有效
  if (cachedToken && Date.now() < tokenExpiry) {
    return cachedToken;
  }

  try {
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
    // Token 有效期通常是 3600 秒，提前 5 分鐘過期
    tokenExpiry = Date.now() + (data.expires_in - 300) * 1000;

    // 確保 cachedToken 不是 null（此時應該已經被賦值）
    if (!cachedToken) {
      throw new Error('無法獲取 TDX Access Token');
    }

    return cachedToken;
  } catch (error) {
    console.error('獲取 TDX token 失敗:', error);
    throw error;
  }
}

export async function GET() {
  try {
    // 如果沒有設定 API Key，返回錯誤提示
    if (!TDX_CLIENT_ID || !TDX_CLIENT_SECRET) {
      return NextResponse.json(
        { 
          error: 'TDX API Key 未設定',
          message: '請在 .env.local 中設定 TDX_CLIENT_ID 和 TDX_CLIENT_SECRET',
          hint: '前往 https://tdx.transportdata.tw/ 申請 API Key'
        },
        { status: 500 }
      );
    }

    const accessToken = await getTDXToken();
    return NextResponse.json({ access_token: accessToken });
  } catch (error: any) {
    return NextResponse.json(
      { error: '獲取 token 失敗', message: error.message },
      { status: 500 }
    );
  }
}

