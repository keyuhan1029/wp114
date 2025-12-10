import Pusher from 'pusher';

// 伺服器端 Pusher 實例
let pusherInstance: Pusher | null = null;

export function getPusher(): Pusher {
  if (!pusherInstance) {
    if (!process.env.PUSHER_APP_ID || 
        !process.env.PUSHER_KEY || 
        !process.env.PUSHER_SECRET || 
        !process.env.PUSHER_CLUSTER) {
      throw new Error('Pusher 環境變數未設定');
    }

    pusherInstance = new Pusher({
      appId: process.env.PUSHER_APP_ID,
      key: process.env.PUSHER_KEY,
      secret: process.env.PUSHER_SECRET,
      cluster: process.env.PUSHER_CLUSTER,
      useTLS: true,
    });
  }

  return pusherInstance;
}

// 頻道命名規則
export const CHANNEL_NAMES = {
  // 私人聊天室頻道：presence-chat-{roomId}
  chatRoom: (roomId: string) => `presence-chat-${roomId}`,
  
  // 用戶私人頻道：private-user-{userId}（接收通知等）
  userPrivate: (userId: string) => `private-user-${userId}`,
};

// 事件名稱
export const EVENT_NAMES = {
  NEW_MESSAGE: 'new-message',
  MESSAGE_READ: 'message-read',
  TYPING: 'typing',
  FRIEND_REQUEST: 'friend-request',
  FRIEND_ACCEPTED: 'friend-accepted',
};

// 觸發聊天室訊息事件
export async function triggerNewMessage(
  roomId: string,
  message: {
    id: string;
    senderId: string;
    senderName?: string;
    senderAvatar?: string;
    content: string;
    createdAt: Date;
  }
) {
  const pusher = getPusher();
  await pusher.trigger(CHANNEL_NAMES.chatRoom(roomId), EVENT_NAMES.NEW_MESSAGE, message);
}

// 觸發打字中事件
export async function triggerTyping(
  roomId: string,
  user: {
    id: string;
    name?: string;
  }
) {
  const pusher = getPusher();
  await pusher.trigger(CHANNEL_NAMES.chatRoom(roomId), EVENT_NAMES.TYPING, user);
}

// 觸發好友請求通知
export async function triggerFriendRequest(
  userId: string,
  request: {
    friendshipId: string;
    from: {
      id: string;
      name?: string;
      avatar?: string;
    };
  }
) {
  const pusher = getPusher();
  await pusher.trigger(CHANNEL_NAMES.userPrivate(userId), EVENT_NAMES.FRIEND_REQUEST, request);
}

// 觸發好友接受通知
export async function triggerFriendAccepted(
  userId: string,
  data: {
    friendshipId: string;
    friend: {
      id: string;
      name?: string;
      avatar?: string;
    };
  }
) {
  const pusher = getPusher();
  await pusher.trigger(CHANNEL_NAMES.userPrivate(userId), EVENT_NAMES.FRIEND_ACCEPTED, data);
}

