import { NextResponse } from 'next/server';
import { verifyToken, getTokenFromRequest } from '@/lib/jwt';
import { FriendshipModel } from '@/lib/models/Friendship';
import { UserModel } from '@/lib/models/User';
import { ObjectId } from 'mongodb';

// 取得好友請求
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
    const type = url.searchParams.get('type') || 'received';

    let friendships;
    if (type === 'sent') {
      friendships = await FriendshipModel.getSentRequests(payload.userId);
    } else {
      friendships = await FriendshipModel.getPendingRequests(payload.userId);
    }

    // 取得相關用戶資訊
    const userIds = friendships.map(f => 
      type === 'sent' ? f.addresseeId : f.requesterId
    );

    const users = await UserModel.findByIds(userIds);

    // 組合請求資訊
    const requests = friendships.map(friendship => {
      const userId = type === 'sent' 
        ? friendship.addresseeId.toString() 
        : friendship.requesterId.toString();
      
      const user = users.find(u => 
        (u._id instanceof ObjectId ? u._id.toString() : String(u._id)) === userId
      );

      return {
        friendshipId: friendship._id instanceof ObjectId 
          ? friendship._id.toString() 
          : String(friendship._id),
        user: user ? {
          id: user._id instanceof ObjectId ? user._id.toString() : String(user._id),
          userId: user.userId || null,
          name: user.name || null,
          avatar: user.avatar || null,
          department: user.department || null,
          email: user.email,
        } : null,
        createdAt: friendship.createdAt,
      };
    }).filter(r => r.user !== null);

    return NextResponse.json({
      requests,
      type,
    });
  } catch (error: any) {
    console.error('取得好友請求錯誤:', error);
    return NextResponse.json(
      { message: '取得好友請求失敗' },
      { status: 500 }
    );
  }
}

