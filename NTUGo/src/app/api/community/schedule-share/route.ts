import { NextRequest, NextResponse } from 'next/server';
import { getTokenFromRequest, verifyToken } from '@/lib/jwt';
import { ScheduleShareModel } from '@/lib/models/ScheduleShare';
import { FriendshipModel } from '@/lib/models/Friendship';
import { triggerScheduleShareRequest } from '@/lib/pusher';
import { NotificationModel } from '@/lib/models/Notification';

async function getAuthUserId(request: NextRequest): Promise<string | null> {
  const token = getTokenFromRequest(request as unknown as Request);
  if (!token) return null;
  const payload = verifyToken(token);
  if (!payload || !payload.userId) return null;
  return payload.userId as string;
}

// 發送課表分享請求
export async function POST(request: NextRequest) {
  try {
    const userId = await getAuthUserId(request);
    if (!userId) {
      return NextResponse.json({ message: '未登入' }, { status: 401 });
    }

    const body = await request.json();
    const { targetUserId } = body;

    if (!targetUserId) {
      return NextResponse.json({ message: '缺少目標用戶 ID' }, { status: 400 });
    }

    // 檢查是否為好友
    const friendshipStatus = await FriendshipModel.getFriendshipStatus(userId, targetUserId);
    if (friendshipStatus.status !== 'accepted') {
      return NextResponse.json({ message: '只能與好友分享課表' }, { status: 403 });
    }

    // 發送分享請求
    const share = await ScheduleShareModel.sendRequest(userId, targetUserId);

    // 發送通知
    try {
      await NotificationModel.create({
        userId: targetUserId,
        type: 'schedule_share',
        title: '課表分享請求',
        content: '有人想與您分享課表',
        relatedId: share._id?.toString(),
        relatedType: 'schedule_share',
        senderId: userId,
      });

      await triggerScheduleShareRequest(targetUserId, {
        shareId: share._id?.toString(),
        senderId: userId,
      });
    } catch (error) {
      console.error('發送通知失敗:', error);
    }

    const serialized = {
      ...share,
      _id: share._id?.toString(),
      senderId: share.senderId.toString(),
      receiverId: share.receiverId.toString(),
      createdAt: share.createdAt.toISOString(),
      updatedAt: share.updatedAt.toISOString(),
    };

    return NextResponse.json({ share: serialized }, { status: 201 });
  } catch (error: any) {
    console.error('發送課表分享請求失敗:', error);
    return NextResponse.json(
      { message: error.message || '發送課表分享請求失敗' },
      { status: 400 }
    );
  }
}

