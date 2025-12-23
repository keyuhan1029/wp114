import { NextResponse } from 'next/server';
import { verifyToken, getTokenFromRequest } from '@/lib/jwt';
import { getPusher } from '@/lib/pusher';
import { ChatRoomModel } from '@/lib/models/ChatRoom';

// Pusher 頻道認證
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

    const body = await request.formData();
    const socketId = body.get('socket_id') as string;
    const channel = body.get('channel_name') as string;

    if (!socketId || !channel) {
      return NextResponse.json(
        { message: '缺少必要參數' },
        { status: 400 }
      );
    }

    // 驗證頻道權限
    if (channel.startsWith('presence-chat-')) {
      // 聊天室頻道 - 驗證用戶是否為成員
      const roomId = channel.replace('presence-chat-', '');
      const isMember = await ChatRoomModel.isMember(roomId, payload.userId);
      
      if (!isMember) {
        return NextResponse.json(
          { message: '您不是此聊天室的成員' },
          { status: 403 }
        );
      }

      // Presence 頻道認證
      const pusher = getPusher();
      const presenceData = {
        user_id: payload.userId,
        user_info: {
          name: payload.email, // 可以從 payload 取得更多用戶資訊
        },
      };

      const authResponse = pusher.authorizeChannel(socketId, channel, presenceData);
      return NextResponse.json(authResponse);
    } else if (channel.startsWith('private-user-')) {
      // 用戶私人頻道 - 驗證是否為本人
      const userId = channel.replace('private-user-', '');
      
      if (userId !== payload.userId) {
        return NextResponse.json(
          { message: '無權限存取此頻道' },
          { status: 403 }
        );
      }

      const pusher = getPusher();
      const authResponse = pusher.authorizeChannel(socketId, channel);
      return NextResponse.json(authResponse);
    } else {
      return NextResponse.json(
        { message: '未知的頻道類型' },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error('Pusher 認證錯誤:', error);
    return NextResponse.json(
      { message: 'Pusher 認證失敗' },
      { status: 500 }
    );
  }
}

