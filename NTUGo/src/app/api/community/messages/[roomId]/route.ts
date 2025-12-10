import { NextResponse } from 'next/server';
import { verifyToken, getTokenFromRequest } from '@/lib/jwt';
import { ChatRoomModel } from '@/lib/models/ChatRoom';
import { MessageModel } from '@/lib/models/Message';
import { UserModel } from '@/lib/models/User';
import { triggerNewMessage } from '@/lib/pusher';
import { ObjectId } from 'mongodb';

interface RouteParams {
  params: Promise<{ roomId: string }>;
}

// 取得聊天室訊息
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

    const { roomId } = await params;

    if (!ObjectId.isValid(roomId)) {
      return NextResponse.json(
        { message: '無效的聊天室 ID' },
        { status: 400 }
      );
    }

    // 檢查用戶是否為聊天室成員
    const isMember = await ChatRoomModel.isMember(roomId, payload.userId);
    if (!isMember) {
      return NextResponse.json(
        { message: '您不是此聊天室的成員' },
        { status: 403 }
      );
    }

    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '50', 10);
    const beforeStr = url.searchParams.get('before');
    const before = beforeStr ? new Date(beforeStr) : undefined;

    const messages = await MessageModel.findByChatRoom(roomId, limit, before);

    // 標記訊息為已讀
    await MessageModel.markAsRead(roomId, payload.userId);

    // 取得發送者資訊
    const senderIds = [...new Set(messages.map(m => m.senderId.toString()))];
    const senders = await UserModel.findByIds(senderIds);
    const senderMap = new Map(
      senders.map(s => [
        s._id instanceof ObjectId ? s._id.toString() : String(s._id),
        s,
      ])
    );

    const messagesWithSender = messages.map(msg => {
      const sender = senderMap.get(msg.senderId.toString());
      return {
        id: msg._id instanceof ObjectId ? msg._id.toString() : String(msg._id),
        senderId: msg.senderId.toString(),
        sender: sender ? {
          id: sender._id instanceof ObjectId ? sender._id.toString() : String(sender._id),
          userId: sender.userId || null,
          name: sender.name || null,
          avatar: sender.avatar || null,
        } : null,
        content: msg.content,
        createdAt: msg.createdAt,
        isOwn: msg.senderId.toString() === payload.userId,
      };
    });

    return NextResponse.json({
      messages: messagesWithSender,
    });
  } catch (error: any) {
    console.error('取得訊息錯誤:', error);
    return NextResponse.json(
      { message: '取得訊息失敗' },
      { status: 500 }
    );
  }
}

// 發送訊息
export async function POST(request: Request, { params }: RouteParams) {
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

    const { roomId } = await params;

    if (!ObjectId.isValid(roomId)) {
      return NextResponse.json(
        { message: '無效的聊天室 ID' },
        { status: 400 }
      );
    }

    // 檢查用戶是否為聊天室成員
    const isMember = await ChatRoomModel.isMember(roomId, payload.userId);
    if (!isMember) {
      return NextResponse.json(
        { message: '您不是此聊天室的成員' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { content } = body;

    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        { message: '訊息內容不能為空' },
        { status: 400 }
      );
    }

    // 建立訊息
    const message = await MessageModel.create(roomId, payload.userId, content.trim());

    // 更新聊天室最後訊息
    await ChatRoomModel.updateLastMessage(roomId, content.trim());

    // 取得發送者資訊
    const sender = await UserModel.findById(payload.userId);

    const messageData = {
      id: message._id instanceof ObjectId ? message._id.toString() : String(message._id),
      senderId: payload.userId,
      senderName: sender?.name || null,
      senderAvatar: sender?.avatar || null,
      content: message.content,
      createdAt: message.createdAt,
    };

    // 透過 Pusher 推送訊息（如果 Pusher 設定了的話）
    try {
      await triggerNewMessage(roomId, messageData);
    } catch (pusherError) {
      // Pusher 錯誤不影響訊息發送
      console.warn('Pusher 推送失敗:', pusherError);
    }

    return NextResponse.json({
      message: {
        ...messageData,
        sender: sender ? {
          id: sender._id instanceof ObjectId ? sender._id.toString() : String(sender._id),
          userId: sender.userId || null,
          name: sender.name || null,
          avatar: sender.avatar || null,
        } : null,
        isOwn: true,
      },
    });
  } catch (error: any) {
    console.error('發送訊息錯誤:', error);
    return NextResponse.json(
      { message: '發送訊息失敗' },
      { status: 500 }
    );
  }
}

