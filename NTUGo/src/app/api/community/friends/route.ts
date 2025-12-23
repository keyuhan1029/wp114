import { NextResponse } from 'next/server';
import { verifyToken, getTokenFromRequest } from '@/lib/jwt';
import { FriendshipModel } from '@/lib/models/Friendship';
import { UserModel } from '@/lib/models/User';
import { NotificationModel } from '@/lib/models/Notification';
import { triggerFriendRequest } from '@/lib/pusher';
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
          lastSeen: friend.lastSeen || null,
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

    // 取得發送者資訊
    const sender = await UserModel.findById(payload.userId);
    const friendshipId = friendship._id instanceof ObjectId 
      ? friendship._id.toString() 
      : String(friendship._id);

    // 建立通知
    try {
      await NotificationModel.create({
        userId: targetUserId,
        type: 'friend_request',
        title: '新的好友請求',
        content: `${sender?.name || '某位用戶'} 想要加你為好友`,
        relatedId: friendshipId,
        senderId: payload.userId,
      });

      // 透過 Pusher 即時推送通知
      await triggerFriendRequest(targetUserId, {
        friendshipId,
        from: {
          id: payload.userId,
          name: sender?.name || undefined,
          avatar: sender?.avatar || undefined,
        },
      });
    } catch (notifError) {
      // 通知錯誤不影響主流程
      console.warn('發送通知失敗:', notifError);
    }

    return NextResponse.json({
      message: '好友請求已發送',
      friendship: {
        id: friendshipId,
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

