import { NextResponse } from 'next/server';
import { verifyToken, getTokenFromRequest } from '@/lib/jwt';
import { FriendshipModel } from '@/lib/models/Friendship';
import { UserModel } from '@/lib/models/User';
import { NotificationModel } from '@/lib/models/Notification';
import { triggerFriendAccepted } from '@/lib/pusher';
import { ObjectId } from 'mongodb';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// 接受好友請求
export async function PUT(request: Request, { params }: RouteParams) {
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
        { message: '無效的好友請求 ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { action } = body;

    if (action === 'accept') {
      const friendship = await FriendshipModel.acceptRequest(id, payload.userId);

      if (!friendship) {
        return NextResponse.json(
          { message: '好友請求不存在或無法接受' },
          { status: 404 }
        );
      }

      // 取得接受者資訊
      const accepter = await UserModel.findById(payload.userId);
      const requesterId = friendship.requesterId.toString();
      const friendshipId = friendship._id instanceof ObjectId 
        ? friendship._id.toString() 
        : String(friendship._id);

      // 建立通知給原請求者
      try {
        await NotificationModel.create({
          userId: requesterId,
          type: 'friend_accepted',
          title: '好友請求已接受',
          content: `${accepter?.name || '某位用戶'} 接受了你的好友請求`,
          relatedId: friendshipId,
          senderId: payload.userId,
        });

        // 透過 Pusher 即時推送通知
        await triggerFriendAccepted(requesterId, {
          friendshipId,
          friend: {
            id: payload.userId,
            name: accepter?.name || undefined,
            avatar: accepter?.avatar || undefined,
          },
        });
      } catch (notifError) {
        // 通知錯誤不影響主流程
        console.warn('發送通知失敗:', notifError);
      }

      return NextResponse.json({
        message: '已接受好友請求',
        friendship: {
          id: friendshipId,
          status: friendship.status,
          updatedAt: friendship.updatedAt,
        },
      });
    } else {
      return NextResponse.json(
        { message: '無效的操作' },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error('處理好友請求錯誤:', error);
    return NextResponse.json(
      { message: '處理好友請求失敗' },
      { status: 500 }
    );
  }
}

// 拒絕好友請求或刪除好友
export async function DELETE(request: Request, { params }: RouteParams) {
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
        { message: '無效的好友請求 ID' },
        { status: 400 }
      );
    }

    // 先嘗試拒絕請求
    let deleted = await FriendshipModel.rejectRequest(id, payload.userId);
    
    // 如果不是待處理的請求，嘗試刪除好友
    if (!deleted) {
      deleted = await FriendshipModel.removeFriend(id, payload.userId);
    }

    if (!deleted) {
      return NextResponse.json(
        { message: '好友關係不存在或無法刪除' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: '操作成功',
    });
  } catch (error: any) {
    console.error('刪除好友關係錯誤:', error);
    return NextResponse.json(
      { message: '操作失敗' },
      { status: 500 }
    );
  }
}

