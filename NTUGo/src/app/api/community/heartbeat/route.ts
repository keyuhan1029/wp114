import { NextResponse } from 'next/server';
import { verifyToken, getTokenFromRequest } from '@/lib/jwt';
import { UserModel } from '@/lib/models/User';

// 心跳 API - 更新用戶最後上線時間
export async function POST(request: Request) {
  try {
    const token = getTokenFromRequest(request);

    if (!token) {
      return NextResponse.json(
        { message: '未提供認證 token' },
        { status: 401 }
      );
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json(
        { message: '無效的 token' },
        { status: 401 }
      );
    }

    // 更新最後上線時間
    await UserModel.updateLastSeen(payload.userId);

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('心跳更新錯誤:', error);
    return NextResponse.json(
      { message: '心跳更新失敗' },
      { status: 500 }
    );
  }
}

