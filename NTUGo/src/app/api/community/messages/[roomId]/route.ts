import { NextResponse } from 'next/server';
import { verifyToken, getTokenFromRequest } from '@/lib/jwt';
import { ChatRoomModel } from '@/lib/models/ChatRoom';
import { MessageModel } from '@/lib/models/Message';
import { UserModel } from '@/lib/models/User';
import { NotificationModel } from '@/lib/models/Notification';
import { triggerNewMessage, triggerChatUpdate, triggerMessageRead } from '@/lib/pusher';
import { ChatRoom } from '@/lib/models/ChatRoom';
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
    const markedCount = await MessageModel.markAsRead(roomId, payload.userId);

    // 如果有標記已讀，透過 Pusher 通知聊天室其他成員
    if (markedCount > 0) {
      try {
        const reader = await UserModel.findById(payload.userId);
        await triggerMessageRead(roomId, {
          readerId: payload.userId,
          readerName: reader?.name || undefined,
          readAt: new Date().toISOString(),
        });
      } catch (pusherError) {
        // Pusher 錯誤不影響主流程
        console.warn('Pusher 推送已讀狀態失敗:', pusherError);
      }
    }

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
      // 检查是否为 AI 消息（senderId 是特殊的 ObjectId '000000000000000000000000'）

      // 普通用户消息
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
        type: msg.type || 'text',
        content: msg.content,
        file: msg.file || null,
        createdAt: msg.createdAt,
        isOwn: msg.senderId.toString() === payload.userId,
        readBy: msg.readBy?.map(id => id.toString()) || [],
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
    const { content, type, file } = body;

    // 檔案訊息可以沒有 content，但必須有 file
    if (type === 'image' || type === 'file') {
      if (!file || !file.url) {
        return NextResponse.json(
          { message: '檔案訊息必須包含檔案資訊' },
          { status: 400 }
        );
      }
    } else if (!content || content.trim().length === 0) {
      return NextResponse.json(
        { message: '訊息內容不能為空' },
        { status: 400 }
      );
    }

    // 建立訊息
    const messageContent = content?.trim() || (file?.name || '傳送了檔案');
    const message = await MessageModel.create(roomId, payload.userId, messageContent, {
      type: type || 'text',
      file: file || undefined,
    });

    // 更新聊天室最後訊息
    const lastMessagePreview = type === 'image' ? '[圖片]' : type === 'file' ? `[檔案] ${file?.name || ''}` : messageContent;
    await ChatRoomModel.updateLastMessage(roomId, lastMessagePreview);

    // 取得發送者資訊
    const sender = await UserModel.findById(payload.userId);

    const messageData = {
      id: message._id instanceof ObjectId ? message._id.toString() : String(message._id),
      senderId: payload.userId,
      senderName: sender?.name || null,
      senderAvatar: sender?.avatar || null,
      type: message.type,
      content: message.content,
      file: message.file || null,
      createdAt: message.createdAt,
    };

    // 透過 Pusher 推送訊息（如果 Pusher 設定了的話）
    try {
      await triggerNewMessage(roomId, messageData);
      
      // 向聊天室其他成員發送更新通知（用於更新訊息列表）
      const chatRoom = await ChatRoomModel.findById(roomId);
      if (chatRoom) {
        const otherMembers = chatRoom.members.filter(
          (memberId) => memberId.toString() !== payload.userId
        );
        
        const chatUpdateData = {
          roomId,
          lastMessage: lastMessagePreview,
          lastMessageAt: message.createdAt.toISOString(),
          senderId: payload.userId,
          senderName: sender?.name || undefined,
        };
        
        // 向每個其他成員發送通知
        await Promise.all(
          otherMembers.map((memberId) =>
            triggerChatUpdate(memberId.toString(), chatUpdateData)
          )
        );

        // 建立訊息通知（儲存到資料庫）
        const notificationTitle = chatRoom.type === 'group'
          ? `${chatRoom.name || '群組'}`
          : (sender?.name || '有人');
        const notificationContent = type === 'image'
          ? '傳送了一張圖片'
          : type === 'file'
          ? `傳送了檔案：${file?.name || '檔案'}`
          : messageContent.length > 50
          ? messageContent.substring(0, 50) + '...'
          : messageContent;

        await Promise.all(
          otherMembers.map((memberId) =>
            NotificationModel.create({
              userId: memberId.toString(),
              type: 'new_message',
              title: notificationTitle,
              content: notificationContent,
              relatedId: roomId,
              senderId: payload.userId,
            })
          )
        );
      }
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
        readBy: [payload.userId],
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

