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
  CHAT_UPDATE: 'chat-update', // 聊天室列表更新（新訊息預覽）
  SCHEDULE_SHARE_REQUEST: 'schedule-share-request',
  SCHEDULE_SHARE_ACCEPTED: 'schedule-share-accepted',
  BUS_ARRIVAL: 'bus-arrival', // 公车到站提醒
};

// 觸發聊天室訊息事件
export async function triggerNewMessage(
  roomId: string,
  message: {
    id: string;
    senderId: string;
    senderName?: string | null;
    senderAvatar?: string | null;
    type?: 'text' | 'image' | 'file';
    content: string;
    file?: {
      url: string;
      name: string;
      size: number;
      mimeType: string;
      width?: number;
      height?: number;
    } | null;
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

// 觸發聊天室更新通知（新訊息預覽）
export async function triggerChatUpdate(
  userId: string,
  data: {
    roomId: string;
    lastMessage: string;
    lastMessageAt: string;
    senderId: string;
    senderName?: string;
  }
) {
  const pusher = getPusher();
  await pusher.trigger(CHANNEL_NAMES.userPrivate(userId), EVENT_NAMES.CHAT_UPDATE, data);
}

// 觸發訊息已讀事件
export async function triggerMessageRead(
  roomId: string,
  data: {
    readerId: string;
    readerName?: string;
    readAt: string;
  }
) {
  const pusher = getPusher();
  await pusher.trigger(CHANNEL_NAMES.chatRoom(roomId), EVENT_NAMES.MESSAGE_READ, data);
}

// 觸發課表分享請求通知
export async function triggerScheduleShareRequest(
  userId: string,
  data: {
    shareId?: string;
    senderId: string;
  }
) {
  const pusher = getPusher();
  await pusher.trigger(CHANNEL_NAMES.userPrivate(userId), EVENT_NAMES.SCHEDULE_SHARE_REQUEST, data);
}

// 觸發課表分享接受通知
export async function triggerScheduleShareAccepted(
  userId: string,
  data: {
    shareId?: string;
    receiverId: string;
  }
) {
  const pusher = getPusher();
  await pusher.trigger(CHANNEL_NAMES.userPrivate(userId), EVENT_NAMES.SCHEDULE_SHARE_ACCEPTED, data);
}

// 觸發公車到站提醒通知
export async function triggerBusArrival(
  userId: string,
  data: {
    reminderId: string;
    stopName: string;
    routeName: string;
    direction: number;
    estimatedMinutes: number;
  }
) {
  try {
    const pusher = getPusher();
    const channelName = CHANNEL_NAMES.userPrivate(userId);
    const eventName = EVENT_NAMES.BUS_ARRIVAL;
    
    console.log(`[Pusher] 發送公車到站通知: userId=${userId}, channel=${channelName}, event=${eventName}`, data);
    
    await pusher.trigger(channelName, eventName, data);
    
    console.log(`[Pusher] 公車到站通知發送成功: userId=${userId}`);
  } catch (error: any) {
    console.error(`[Pusher] 公車到站通知發送失敗: userId=${userId}`, error);
    throw error;
  }
}

