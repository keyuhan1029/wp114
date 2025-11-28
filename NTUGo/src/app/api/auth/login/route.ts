import { NextResponse } from 'next/server';
import { UserModel } from '@/lib/models/User';
import { generateToken } from '@/lib/jwt';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    // 驗證輸入
    if (!email || !password) {
      return NextResponse.json(
        { message: '請提供電子郵件和密碼' },
        { status: 400 }
      );
    }

    // 查找用戶
    const user = await UserModel.findByEmail(email);
    if (!user) {
      return NextResponse.json(
        { message: '電子郵件或密碼錯誤' },
        { status: 401 }
      );
    }

    // 檢查用戶的 provider，如果是 Google，提示使用 Google 登入
    if (user.provider === 'google') {
      return NextResponse.json(
        { 
          message: '此帳號使用 Google 登入，請使用 Google 登入',
          provider: 'google',
        },
        { status: 400 }
      );
    }

    // 驗證密碼
    const isPasswordValid = await UserModel.verifyPassword(user, password);
    if (!isPasswordValid) {
      return NextResponse.json(
        { message: '電子郵件或密碼錯誤' },
        { status: 401 }
      );
    }

    // 生成 JWT token
    const userId = typeof user._id === 'string' ? user._id : user._id?.toString() || '';
    const token = generateToken({
      userId,
      email: user.email,
    });

    return NextResponse.json({
      message: '登入成功',
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
      },
    });
  } catch (error: any) {
    console.error('登入錯誤:', error);
    return NextResponse.json(
      { message: '登入失敗，請稍後再試' },
      { status: 500 }
    );
  }
}

