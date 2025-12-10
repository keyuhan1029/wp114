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

    pusherInstance.connection.bind('error', (err: any) => {
      console.error('Pusher 錯誤:', err);
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
    if (!pusher) return null;

    // 如果已經訂閱，返回現有 channel
    if (channelsRef.current.has(channelName)) {
      return channelsRef.current.get(channelName)!;
    }

    const channel = pusher.subscribe(channelName);
    channelsRef.current.set(channelName, channel);
    return channel;
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
  onNewMessage?: (message: any) => void
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

      channel.bind('pusher:subscription_succeeded', () => {
        setIsSubscribed(true);
      });

      channel.bind('pusher:subscription_error', () => {
        setIsSubscribed(false);
      });
    }

    return () => {
      if (channel) {
        channel.unbind('new-message');
        channel.unbind('pusher:subscription_succeeded');
        channel.unbind('pusher:subscription_error');
      }
      unsubscribeFromChannel(channelName);
      setIsSubscribed(false);
    };
  }, [roomId, subscribeToChannel, unsubscribeFromChannel, onNewMessage]);

  return { isSubscribed };
}

// 用戶通知 Hook
export function useUserNotifications(
  userId: string | null,
  callbacks?: {
    onFriendRequest?: (data: any) => void;
    onFriendAccepted?: (data: any) => void;
  }
) {
  const { subscribeToChannel, unsubscribeFromChannel } = usePusher();

  useEffect(() => {
    if (!userId) return;

    const channelName = `private-user-${userId}`;
    const channel = subscribeToChannel(channelName);

    if (channel) {
      if (callbacks?.onFriendRequest) {
        channel.bind('friend-request', callbacks.onFriendRequest);
      }
      if (callbacks?.onFriendAccepted) {
        channel.bind('friend-accepted', callbacks.onFriendAccepted);
      }
    }

    return () => {
      if (channel) {
        channel.unbind_all();
      }
      unsubscribeFromChannel(channelName);
    };
  }, [userId, subscribeToChannel, unsubscribeFromChannel, callbacks]);
}

