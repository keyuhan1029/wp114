import { NextResponse } from 'next/server';
import { UserModel } from '@/lib/models/User';
import { generateToken } from '@/lib/jwt';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

// 動態構建 REDIRECT_URI，使用請求的 origin
const getRedirectUri = (origin: string) => {
  return `${origin}/api/auth/google/callback`;
};

interface GoogleTokenResponse {
  access_token: string;
  id_token: string;
  expires_in: number;
  token_type: string;
}

interface GoogleUserInfo {
  id: string;
  email: string;
  name: string;
  picture: string;
  verified_email: boolean;
}

export async function GET(request: Request) {
  try {
    const { searchParams, origin } = new URL(request.url);
    const code = searchParams.get('code');

    // 輔助函數：構建絕對 URL
    const getLoginUrl = (error?: string) => {
      const url = new URL('/login', origin);
      if (error) {
        url.searchParams.set('error', error);
      }
      return url.toString();
    };

    if (!code) {
      return NextResponse.redirect(getLoginUrl('no_code'));
    }

    if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
      console.error('Google OAuth 未配置: GOOGLE_CLIENT_ID 或 GOOGLE_CLIENT_SECRET 未設置');
      return NextResponse.redirect(getLoginUrl('oauth_not_configured'));
    }

    const redirectUri = getRedirectUri(origin);
    console.log('Google OAuth 回調:', { code: code?.substring(0, 20) + '...', redirectUri, origin });

    // 1. 用 code 換取 access token
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code: code!,
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('Google token 交換失敗:', {
        status: tokenResponse.status,
        statusText: tokenResponse.statusText,
        error: errorText,
        redirectUri,
        hasCode: !!code,
      });
      return NextResponse.redirect(getLoginUrl('token_exchange_failed'));
    }

    const tokenData: GoogleTokenResponse = await tokenResponse.json();

    // 2. 用 access token 獲取用戶資訊
    const userInfoResponse = await fetch(
      'https://www.googleapis.com/oauth2/v2/userinfo',
      {
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
        },
      }
    );

    if (!userInfoResponse.ok) {
      return NextResponse.redirect(getLoginUrl('user_info_failed'));
    }

    const googleUser: GoogleUserInfo = await userInfoResponse.json();

    if (!googleUser.verified_email) {
      return NextResponse.redirect(getLoginUrl('email_not_verified'));
    }

    // 3. 查找或創建用戶
    let user = await UserModel.findByGoogleId(googleUser.id);

    if (!user) {
      // 檢查是否已有相同 email 的用戶
      const existingUser = await UserModel.findByEmail(googleUser.email);
      if (existingUser) {
        // 如果用戶已存在但沒有 Google ID，更新用戶資訊
        user = await UserModel.updateGoogleUser(googleUser.email, {
          googleId: googleUser.id,
          name: googleUser.name,
          avatar: googleUser.picture,
          provider: 'google',
        });
      } else {
        // 創建新用戶（使用 Google provider）
        user = await UserModel.create({
          email: googleUser.email,
          name: googleUser.name,
          googleId: googleUser.id,
          avatar: googleUser.picture,
          provider: 'google',
        });
      }
    }

    // 確保用戶存在
    if (!user) {
      return NextResponse.redirect(getLoginUrl('user_creation_failed'));
    }

    // 4. 生成 JWT token
    const userId = typeof user._id === 'string' ? user._id : user._id?.toString() || '';
    const token = generateToken({
      userId,
      email: user.email,
    });

    // 5. 檢查用戶是否已設定 userId，如果沒有則重定向到設定頁面
    if (!user.userId) {
      // 創建一個臨時頁面來設置 token 並重定向到設定頁面
      const setupUrl = new URL('/setup-userid', origin);
      setupUrl.searchParams.set('token', token);
      const html = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>登入中...</title>
          </head>
          <body>
            <script>
              localStorage.setItem('token', '${token}');
              window.location.href = '${setupUrl.toString()}';
            </script>
          </body>
        </html>
      `;
      return new NextResponse(html, {
        headers: {
          'Content-Type': 'text/html',
        },
      });
    }

    // 6. 如果已設定 userId，重定向到首頁
    const homeUrl = new URL('/', origin);
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>登入中...</title>
        </head>
        <body>
          <script>
            localStorage.setItem('token', '${token}');
            window.location.href = '${homeUrl.toString()}';
          </script>
        </body>
      </html>
    `;

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html',
      },
    });
  } catch (error: any) {
    console.error('Google OAuth 錯誤:', error);
    const { origin } = new URL(request.url);
    const loginUrl = new URL('/login', origin);
    loginUrl.searchParams.set('error', 'oauth_error');
    return NextResponse.redirect(loginUrl.toString());
  }
}

