import { NextResponse } from 'next/server';
import { verifyToken, getTokenFromRequest } from '@/lib/jwt';
import { getDatabase } from '@/lib/mongodb';

export async function GET(request: Request) {
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

    // 從資料庫獲取用戶資訊
    const db = await getDatabase();
    const { ObjectId } = await import('mongodb');
    
    // 確保 userId 是有效的 ObjectId
    if (!ObjectId.isValid(payload.userId)) {
      return NextResponse.json(
        { message: '無效的用戶 ID' },
        { status: 400 }
      );
    }
    
    const queryUserId = new ObjectId(payload.userId);
    const user = await db.collection('users').findOne(
      { _id: queryUserId },
      { projection: { password: 0 } } // 排除密碼
    );

    if (!user) {
      return NextResponse.json(
        { message: '用戶不存在' },
        { status: 404 }
      );
    }

    // 轉換 MongoDB Document 為安全的用戶物件
    const userData = user as unknown as {
      _id: InstanceType<typeof ObjectId> | string;
      userId?: string;
      email?: string;
      name?: string;
      avatar?: string;
      provider?: 'email' | 'google';
    };

    const userIdString = userData._id instanceof ObjectId 
      ? userData._id.toString() 
      : String(userData._id);

    return NextResponse.json({
      user: {
        id: userIdString,
        userId: userData.userId || null,
        email: userData.email || '',
        name: userData.name || null,
        avatar: userData.avatar || null,
        provider: userData.provider || 'email',
      },
    });
  } catch (error: any) {
    console.error('獲取用戶資訊錯誤:', error);
    return NextResponse.json(
      { message: '獲取用戶資訊失敗' },
      { status: 500 }
    );
  }
}

