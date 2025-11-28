import { NextResponse } from 'next/server';
import { UserModel } from '@/lib/models/User';
import { generateToken } from '@/lib/jwt';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = process.env.NEXT_PUBLIC_APP_URL
  ? `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/google/callback`
  : 'http://localhost:3000/api/auth/google/callback';

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
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');

    if (!code) {
      return NextResponse.redirect('/login?error=no_code');
    }

    if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
      return NextResponse.redirect('/login?error=oauth_not_configured');
    }

    // 1. 用 code 換取 access token
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri: REDIRECT_URI,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenResponse.ok) {
      const error = await tokenResponse.text();
      console.error('Google token 交換失敗:', error);
      return NextResponse.redirect('/login?error=token_exchange_failed');
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
      return NextResponse.redirect('/login?error=user_info_failed');
    }

    const googleUser: GoogleUserInfo = await userInfoResponse.json();

    if (!googleUser.verified_email) {
      return NextResponse.redirect('/login?error=email_not_verified');
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
      return NextResponse.redirect('/login?error=user_creation_failed');
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
      const html = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>登入中...</title>
          </head>
          <body>
            <script>
              localStorage.setItem('token', '${token}');
              window.location.href = '/setup-userid?token=${token}';
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
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>登入中...</title>
        </head>
        <body>
          <script>
            localStorage.setItem('token', '${token}');
            window.location.href = '/';
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
    return NextResponse.redirect('/login?error=oauth_error');
  }
}

