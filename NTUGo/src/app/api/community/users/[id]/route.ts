import { NextResponse } from 'next/server';
import { verifyToken, getTokenFromRequest } from '@/lib/jwt';
import { UserModel } from '@/lib/models/User';
import { FriendshipModel } from '@/lib/models/Friendship';
import { ObjectId } from 'mongodb';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// 取得用戶資料
export async function GET(request: Request, { params }: RouteParams) {
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

    const { id } = await params;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { message: '無效的用戶 ID' },
        { status: 400 }
      );
    }

    // 取得用戶資訊
    const user = await UserModel.findById(id);

    if (!user) {
      return NextResponse.json(
        { message: '找不到此用戶' },
        { status: 404 }
      );
    }

    // 取得好友關係狀態
    const friendshipResult = await FriendshipModel.getFriendshipStatus(payload.userId, id);

    let friendshipStatus: 'none' | 'pending' | 'accepted' = 'none';
    let friendshipDirection: 'sent' | 'received' | null = null;
    let friendshipId: string | null = null;

    if (friendshipResult.status !== 'none' && friendshipResult.friendship) {
      friendshipId = friendshipResult.friendship._id instanceof ObjectId 
        ? friendshipResult.friendship._id.toString() 
        : String(friendshipResult.friendship._id);
      
      if (friendshipResult.status === 'accepted') {
        friendshipStatus = 'accepted';
      } else if (friendshipResult.status === 'pending') {
        friendshipStatus = 'pending';
        friendshipDirection = friendshipResult.direction || null;
      }
    }

    return NextResponse.json({
      user: {
        id: user._id instanceof ObjectId ? user._id.toString() : String(user._id),
        userId: user.userId || null,
        name: user.name || null,
        avatar: user.avatar || null,
        department: user.department || null,
        friendshipStatus,
        friendshipDirection,
        friendshipId,
      },
    });
  } catch (error: any) {
    console.error('取得用戶資料錯誤:', error);
    return NextResponse.json(
      { message: '取得用戶資料失敗' },
      { status: 500 }
    );
  }
}

