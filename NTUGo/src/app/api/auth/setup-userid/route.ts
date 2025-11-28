import { NextResponse } from 'next/server';
import { verifyToken, getTokenFromRequest } from '@/lib/jwt';
import { UserModel } from '@/lib/models/User';
import { getDatabase } from '@/lib/mongodb';

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

    const { userId } = await request.json();
    if (!userId || !userId.trim()) {
      return NextResponse.json(
        { message: '請提供用戶 ID' },
        { status: 400 }
      );
    }

    // 驗證用戶 ID 格式
    if (!/^[a-zA-Z0-9_]+$/.test(userId)) {
      return NextResponse.json(
        { message: '用戶 ID 只能包含字母、數字和底線' },
        { status: 400 }
      );
    }

    // 檢查用戶 ID 是否已被使用
    const existingUser = await UserModel.findByUserId(userId);
    if (existingUser) {
      return NextResponse.json(
        { message: '此用戶 ID 已被使用' },
        { status: 400 }
      );
    }

    // 更新用戶的 userId
    const db = await getDatabase();
    const { ObjectId } = await import('mongodb');
    const userIdObj = new ObjectId(payload.userId);
    
    const result = await db.collection('users').findOneAndUpdate(
      { _id: userIdObj },
      {
        $set: {
          userId,
          updatedAt: new Date(),
        },
      },
      { returnDocument: 'after' }
    );

    if (!result) {
      return NextResponse.json(
        { message: '用戶不存在' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: '用戶 ID 設定成功',
      userId,
    });
  } catch (error: any) {
    console.error('設定用戶 ID 錯誤:', error);
    return NextResponse.json(
      { message: '設定失敗，請稍後再試' },
      { status: 500 }
    );
  }
}

