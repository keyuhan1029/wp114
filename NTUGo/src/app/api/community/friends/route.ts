import { NextResponse } from 'next/server';
import { verifyToken, getTokenFromRequest } from '@/lib/jwt';
import { FriendshipModel } from '@/lib/models/Friendship';
import { UserModel } from '@/lib/models/User';
import { ObjectId } from 'mongodb';

// 取得好友列表
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

    const friendships = await FriendshipModel.getFriends(payload.userId);
    
    // 取得好友的用戶資訊
    const friendIds = friendships.map(f => 
      f.requesterId.toString() === payload.userId 
        ? f.addresseeId 
        : f.requesterId
    );

    const friends = await UserModel.findByIds(friendIds);

    // 組合好友資訊
    const friendsWithInfo = friendships.map(friendship => {
      const friendId = friendship.requesterId.toString() === payload.userId 
        ? friendship.addresseeId.toString() 
        : friendship.requesterId.toString();
      
      const friend = friends.find(f => 
        (f._id instanceof ObjectId ? f._id.toString() : String(f._id)) === friendId
      );

      return {
        friendshipId: friendship._id instanceof ObjectId 
          ? friendship._id.toString() 
          : String(friendship._id),
        friend: friend ? {
          id: friend._id instanceof ObjectId ? friend._id.toString() : String(friend._id),
          userId: friend.userId || null,
          name: friend.name || null,
          avatar: friend.avatar || null,
          department: friend.department || null,
          email: friend.email,
        } : null,
        since: friendship.updatedAt,
      };
    }).filter(f => f.friend !== null);

    return NextResponse.json({
      friends: friendsWithInfo,
    });
  } catch (error: any) {
    console.error('取得好友列表錯誤:', error);
    return NextResponse.json(
      { message: '取得好友列表失敗' },
      { status: 500 }
    );
  }
}

// 發送好友請求
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

    const body = await request.json();
    const { targetUserId } = body;

    if (!targetUserId) {
      return NextResponse.json(
        { message: '請提供目標用戶 ID' },
        { status: 400 }
      );
    }

    if (!ObjectId.isValid(targetUserId)) {
      return NextResponse.json(
        { message: '無效的用戶 ID' },
        { status: 400 }
      );
    }

    if (targetUserId === payload.userId) {
      return NextResponse.json(
        { message: '無法向自己發送好友請求' },
        { status: 400 }
      );
    }

    // 檢查目標用戶是否存在
    const targetUser = await UserModel.findById(targetUserId);
    if (!targetUser) {
      return NextResponse.json(
        { message: '用戶不存在' },
        { status: 404 }
      );
    }

    const friendship = await FriendshipModel.sendRequest(payload.userId, targetUserId);

    return NextResponse.json({
      message: '好友請求已發送',
      friendship: {
        id: friendship._id instanceof ObjectId 
          ? friendship._id.toString() 
          : String(friendship._id),
        status: friendship.status,
        createdAt: friendship.createdAt,
      },
    });
  } catch (error: any) {
    console.error('發送好友請求錯誤:', error);
    
    if (error.message === '好友請求已存在或你們已經是好友') {
      return NextResponse.json(
        { message: error.message },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { message: '發送好友請求失敗' },
      { status: 500 }
    );
  }
}

