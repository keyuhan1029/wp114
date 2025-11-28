import { NextResponse } from 'next/server';
import { UserModel } from '@/lib/models/User';
import { generateToken } from '@/lib/jwt';

export async function POST(request: Request) {
  try {
    const { email, password, name } = await request.json();

    // 驗證輸入
    if (!email || !password) {
      return NextResponse.json(
        { message: '請提供電子郵件和密碼' },
        { status: 400 }
      );
    }

    // 檢查用戶是否已存在
    const existingUser = await UserModel.findByEmail(email);
    if (existingUser) {
      return NextResponse.json(
        { message: '此電子郵件已被註冊' },
        { status: 400 }
      );
    }

    // 創建新用戶（使用 email provider）
    const user = await UserModel.create({
      email,
      password,
      name,
      provider: 'email',
    });

    // 生成 JWT token
    const userId = typeof user._id === 'string' ? user._id : user._id?.toString() || '';
    const token = generateToken({
      userId,
      email: user.email,
    });

    return NextResponse.json(
      {
        message: '註冊成功',
        token,
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('註冊錯誤:', error);
    return NextResponse.json(
      { message: '註冊失敗，請稍後再試' },
      { status: 500 }
    );
  }
}

