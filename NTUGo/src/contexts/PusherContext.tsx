'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import Pusher, { Channel } from 'pusher-js';

interface PusherContextType {
  pusher: Pusher | null;
  isConnected: boolean;
  subscribeToChannel: (channelName: string) => Channel | null;
  unsubscribeFromChannel: (channelName: string) => void;
}

const PusherContext = createContext<PusherContextType>({
  pusher: null,
  isConnected: false,
  subscribeToChannel: () => null,
  unsubscribeFromChannel: () => {},
});

export function usePusher() {
  return useContext(PusherContext);
}

interface PusherProviderProps {
  children: React.ReactNode;
}

export function PusherProvider({ children }: PusherProviderProps) {
  const [pusher, setPusher] = useState<Pusher | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const channelsRef = useRef<Map<string, Channel>>(new Map());

  useEffect(() => {
    const pusherKey = process.env.NEXT_PUBLIC_PUSHER_KEY;
    const pusherCluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;

    if (!pusherKey || !pusherCluster) {
      console.warn('Pusher 環境變數未設定，即時通訊功能將無法使用');
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      return;
    }

    // 初始化 Pusher
    const pusherInstance = new Pusher(pusherKey, {
      cluster: pusherCluster,
      authEndpoint: '/api/pusher/auth',
      auth: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    });

    // 連線狀態監聽
    pusherInstance.connection.bind('connected', () => {
      setIsConnected(true);
      console.log('Pusher 已連線');
    });

    pusherInstance.connection.bind('disconnected', () => {
      setIsConnected(false);
      console.log('Pusher 已斷線');
    });

    pusherInstance.connection.bind('failed', () => {
      setIsConnected(false);
      console.error('Pusher 連線失敗');
    });

    pusherInstance.connection.bind('unavailable', () => {
      setIsConnected(false);
      // Pusher 服務不可用，這是正常情況（例如網絡問題），不需要記錄為錯誤
      console.warn('Pusher 服務不可用');
    });

    pusherInstance.connection.bind('connecting', () => {
      console.log('Pusher 正在連線...');
    });

    pusherInstance.connection.bind('state_change', (states: { previous: string; current: string }) => {
      console.log(`Pusher 狀態變更: ${states.previous} -> ${states.current}`);
    });

    pusherInstance.connection.bind('error', (err: any) => {
      // Pusher 錯誤物件需要特殊處理才能正確顯示
      let errorMessage = '未知錯誤';
      let errorCode = '';
      let errorType = '';

      // 嘗試提取各種可能的錯誤信息格式
      if (err?.error?.data) {
        errorCode = err.error.data.code || '';
        errorMessage = err.error.data.message || errorMessage;
        errorType = err.type || 'PusherError';
      } else if (err?.error?.message) {
        errorMessage = err.error.message;
        errorCode = err.error.code || '';
        errorType = err.type || 'PusherError';
      } else if (err?.type) {
        errorType = err.type;
        errorMessage = err.message || err.error || errorMessage;
        errorCode = err.code || '';
      } else if (err?.message) {
        errorMessage = err.message;
        errorCode = err.code || '';
      } else if (typeof err === 'string') {
        errorMessage = err;
      } else if (err && typeof err === 'object') {
        // 嘗試提取所有可能的屬性
        errorMessage = err.message || err.msg || err.error || JSON.stringify(err);
        errorCode = err.code || err.status || '';
      }

      // 輸出詳細錯誤信息
      const errorDetails: any = {
        type: errorType || 'PusherError',
        message: errorMessage,
      };
      
      if (errorCode) {
        errorDetails.code = errorCode;
      }

      // 檢查連接狀態
      if (pusherInstance.connection) {
        errorDetails.state = pusherInstance.connection.state;
        errorDetails.socketId = pusherInstance.connection.socket_id || '未連接';
      } else {
        errorDetails.state = '未初始化';
        errorDetails.socketId = '未連接';
      }

      console.error('Pusher 連線錯誤:', errorDetails);
      
      // 如果是關鍵錯誤，輸出原始錯誤對象以便調試
      if (process.env.NODE_ENV === 'development') {
        console.error('原始錯誤對象:', err);
      }
    });

    setPusher(pusherInstance);

    // 清理
    return () => {
      channelsRef.current.forEach((channel, name) => {
        pusherInstance.unsubscribe(name);
      });
      channelsRef.current.clear();
      pusherInstance.disconnect();
    };
  }, []);

  const subscribeToChannel = useCallback((channelName: string): Channel | null => {
    if (!pusher) {
      console.warn(`[PusherContext] Pusher 實例不存在，無法訂閱頻道: ${channelName}`);
      return null;
    }

    // 檢查連接狀態
    if (pusher.connection.state !== 'connected' && pusher.connection.state !== 'connecting') {
      console.warn(`[PusherContext] Pusher 未連接 (狀態: ${pusher.connection.state})，無法訂閱頻道: ${channelName}`);
      return null;
    }

    // 如果已經訂閱，返回現有 channel
    if (channelsRef.current.has(channelName)) {
      return channelsRef.current.get(channelName)!;
    }

    try {
      const channel = pusher.subscribe(channelName);
      channelsRef.current.set(channelName, channel);
      return channel;
    } catch (error) {
      console.error(`[PusherContext] 訂閱頻道 ${channelName} 時發生錯誤:`, error);
      return null;
    }
  }, [pusher]);

  const unsubscribeFromChannel = useCallback((channelName: string) => {
    if (!pusher) return;

    if (channelsRef.current.has(channelName)) {
      pusher.unsubscribe(channelName);
      channelsRef.current.delete(channelName);
    }
  }, [pusher]);

  return (
    <PusherContext.Provider
      value={{
        pusher,
        isConnected,
        subscribeToChannel,
        unsubscribeFromChannel,
      }}
    >
      {children}
    </PusherContext.Provider>
  );
}

// 聊天室訊息 Hook
export function useChatRoomMessages(
  roomId: string | null,
  onNewMessage?: (message: any) => void,
  onMessageRead?: (data: { readerId: string; readerName?: string; readAt: string }) => void
) {
  const { subscribeToChannel, unsubscribeFromChannel } = usePusher();
  const [isSubscribed, setIsSubscribed] = useState(false);

  useEffect(() => {
    if (!roomId) return;

    const channelName = `presence-chat-${roomId}`;
    const channel = subscribeToChannel(channelName);

    if (channel) {
      channel.bind('new-message', (data: any) => {
        if (onNewMessage) {
          onNewMessage(data);
        }
      });

      channel.bind('message-read', (data: any) => {
        if (onMessageRead) {
          onMessageRead(data);
        }
      });

      channel.bind('pusher:subscription_succeeded', () => {
        setIsSubscribed(true);
      });

      channel.bind('pusher:subscription_error', (error: any) => {
        setIsSubscribed(false);
        console.error(`頻道 ${channelName} 訂閱失敗:`, error?.type || error?.error || JSON.stringify(error));
      });
    }

    return () => {
      if (channel) {
        channel.unbind('new-message');
        channel.unbind('message-read');
        channel.unbind('pusher:subscription_succeeded');
        channel.unbind('pusher:subscription_error');
      }
      unsubscribeFromChannel(channelName);
      setIsSubscribed(false);
    };
  }, [roomId, subscribeToChannel, unsubscribeFromChannel, onNewMessage, onMessageRead]);

  return { isSubscribed };
}

// 用戶通知 Hook
export function useUserNotifications(
  userId: string | null,
  callbacks?: {
    onFriendRequest?: (data: any) => void;
    onFriendAccepted?: (data: any) => void;
    onChatUpdate?: (data: any) => void;
    onBusArrival?: (data: any) => void;
  }
) {
  const { subscribeToChannel, unsubscribeFromChannel } = usePusher();
  
  // 使用 useRef 存储最新的回调函数，避免依赖数组变化导致重新绑定
  const callbacksRef = useRef(callbacks);
  useEffect(() => {
    callbacksRef.current = callbacks;
  }, [callbacks]);

  useEffect(() => {
    if (!userId) return;

    const channelName = `private-user-${userId}`;
    const channel = subscribeToChannel(channelName);

    if (!channel) {
      console.warn(`[PusherContext] 無法訂閱頻道 ${channelName}: channel 為 null`);
      return;
    }

    // 處理訂閱成功
    channel.bind('pusher:subscription_succeeded', () => {
      console.log(`[PusherContext] 頻道 ${channelName} 訂閱成功`);
    });

    // 處理訂閱錯誤
    channel.bind('pusher:subscription_error', (error: any) => {
      console.error(`[PusherContext] 頻道 ${channelName} 訂閱失敗:`, error?.type || error?.error || JSON.stringify(error));
    });

    // 始终绑定事件，使用包装函数来调用最新的回调（如果存在）
    // 这样即使回调函数在后续渲染中被添加，事件也能正常工作
    channel.bind('friend-request', (data: any) => {
      callbacksRef.current?.onFriendRequest?.(data);
    });
    channel.bind('friend-accepted', (data: any) => {
      callbacksRef.current?.onFriendAccepted?.(data);
    });
    channel.bind('chat-update', (data: any) => {
      callbacksRef.current?.onChatUpdate?.(data);
    });
    channel.bind('bus-arrival', (data: any) => {
      console.log(`[PusherContext] 收到 bus-arrival 事件: userId=${userId}`, data);
      if (callbacksRef.current?.onBusArrival) {
        console.log(`[PusherContext] 調用 onBusArrival 回調`);
        callbacksRef.current.onBusArrival(data);
      } else {
        console.warn(`[PusherContext] onBusArrival 回調不存在`);
      }
    });

    return () => {
      if (channel) {
        channel.unbind_all();
      }
      unsubscribeFromChannel(channelName);
    };
  }, [userId, subscribeToChannel, unsubscribeFromChannel]);
}

