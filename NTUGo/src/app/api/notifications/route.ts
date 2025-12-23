import { NextResponse } from 'next/server';
import { verifyToken, getTokenFromRequest } from '@/lib/jwt';
import { NotificationModel } from '@/lib/models/Notification';
import { UserModel } from '@/lib/models/User';
import { ObjectId } from 'mongodb';

// 取得通知列表
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
    const unreadOnly = url.searchParams.get('unreadOnly') === 'true';
    const limit = parseInt(url.searchParams.get('limit') || '50', 10);

    const notifications = await NotificationModel.findByUser(payload.userId, limit, unreadOnly);
    const unreadCount = await NotificationModel.getUnreadCount(payload.userId);

    // 取得發送者資訊
    const senderIds = [...new Set(
      notifications
        .filter(n => n.senderId)
        .map(n => n.senderId!.toString())
    )];
    
    const senders = senderIds.length > 0 ? await UserModel.findByIds(senderIds) : [];
    const senderMap = new Map(
      senders.map(s => [
        s._id instanceof ObjectId ? s._id.toString() : String(s._id),
        s,
      ])
    );

    const notificationsWithSender = notifications.map(notif => {
      const sender = notif.senderId ? senderMap.get(notif.senderId.toString()) : null;
      return {
        id: notif._id instanceof ObjectId ? notif._id.toString() : String(notif._id),
        type: notif.type,
        title: notif.title,
        content: notif.content || notif.message || '', // 支持 content 和 message 字段
        relatedId: notif.relatedId || null,
        isRead: notif.isRead,
        createdAt: notif.createdAt instanceof Date ? notif.createdAt.toISOString() : notif.createdAt,
        sender: sender ? {
          id: sender._id instanceof ObjectId ? sender._id.toString() : String(sender._id),
          name: sender.name || null,
          avatar: sender.avatar || null,
        } : null,
      };
    });

    return NextResponse.json({
      notifications: notificationsWithSender,
      unreadCount,
    });
  } catch (error: any) {
    console.error('取得通知錯誤:', error);
    return NextResponse.json(
      { message: '取得通知失敗' },
      { status: 500 }
    );
  }
}

// 標記通知為已讀
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
    const { action, notificationId } = body;

    if (action === 'markAsRead' && notificationId) {
      // 標記單一通知為已讀
      if (!ObjectId.isValid(notificationId)) {
        return NextResponse.json(
          { message: '無效的通知 ID' },
          { status: 400 }
        );
      }

      const success = await NotificationModel.markAsRead(notificationId, payload.userId);
      
      if (!success) {
        return NextResponse.json(
          { message: '通知不存在或無法標記' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        message: '已標記為已讀',
      });
    } else if (action === 'markAllAsRead') {
      // 標記所有通知為已讀
      const count = await NotificationModel.markAllAsRead(payload.userId);

      return NextResponse.json({
        message: `已標記 ${count} 則通知為已讀`,
        count,
      });
    } else {
      return NextResponse.json(
        { message: '無效的操作' },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error('標記通知錯誤:', error);
    return NextResponse.json(
      { message: '操作失敗' },
      { status: 500 }
    );
  }
}

