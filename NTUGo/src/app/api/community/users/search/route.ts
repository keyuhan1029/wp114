import { NextResponse } from 'next/server';
import { verifyToken, getTokenFromRequest } from '@/lib/jwt';
import { UserModel } from '@/lib/models/User';
import { FriendshipModel } from '@/lib/models/Friendship';
import { ObjectId } from 'mongodb';

// 搜尋用戶
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

    const url = new URL(request.url);
    const query = url.searchParams.get('q');

    if (!query || query.trim().length < 1) {
      return NextResponse.json(
        { message: '請提供搜尋關鍵字' },
        { status: 400 }
      );
    }

    const users = await UserModel.searchUsers(query.trim(), payload.userId);

    // 取得每個用戶與當前用戶的好友狀態
    const usersWithStatus = await Promise.all(
      users.map(async (user) => {
        const userId = user._id instanceof ObjectId ? user._id.toString() : String(user._id);
        const friendshipStatus = await FriendshipModel.getFriendshipStatus(payload.userId, userId);

        return {
          id: userId,
          userId: user.userId || null,
          name: user.name || null,
          avatar: user.avatar || null,
          department: user.department || null,
          email: user.email,
          friendshipStatus: friendshipStatus.status,
          friendshipDirection: friendshipStatus.direction || null,
          friendshipId: friendshipStatus.friendship
            ? (friendshipStatus.friendship._id instanceof ObjectId
                ? friendshipStatus.friendship._id.toString()
                : String(friendshipStatus.friendship._id))
            : null,
        };
      })
    );

    return NextResponse.json({
      users: usersWithStatus,
    });
  } catch (error: any) {
    console.error('搜尋用戶錯誤:', error);
    return NextResponse.json(
      { message: '搜尋用戶失敗' },
      { status: 500 }
    );
  }
}

