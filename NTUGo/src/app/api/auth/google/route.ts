import { NextResponse } from 'next/server';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

// 動態構建 REDIRECT_URI，使用請求的 origin
const getRedirectUri = (origin: string) => {
  return `${origin}/api/auth/google/callback`;
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');

  // 如果沒有 code，重定向到 Google OAuth 授權頁面
  if (!code) {
    if (!GOOGLE_CLIENT_ID) {
      return NextResponse.json(
        { message: 'Google OAuth 未設定' },
        { status: 500 }
      );
    }

    const origin = new URL(request.url).origin;
    const redirectUri = getRedirectUri(origin);
    
    console.log('Google OAuth 重定向:', { redirectUri, origin, hasClientId: !!GOOGLE_CLIENT_ID });

    const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    authUrl.searchParams.set('client_id', GOOGLE_CLIENT_ID);
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('scope', 'openid email profile');
    authUrl.searchParams.set('access_type', 'offline');
    authUrl.searchParams.set('prompt', 'consent');

    return NextResponse.redirect(authUrl.toString());
  }

  // 如果有 code，重定向到 callback 處理
  return NextResponse.redirect(
    `${new URL(request.url).origin}/api/auth/google/callback?code=${code}`
  );
}


