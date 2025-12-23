'use client';

import { useEffect, useRef } from 'react';

const HEARTBEAT_INTERVAL = 25000; // 25 秒發送一次心跳（稍微小於 30 秒的判斷閾值）

export function useHeartbeat() {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const sendHeartbeat = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;

      try {
        await fetch('/api/community/heartbeat', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      } catch (error) {
        // 心跳失敗靜默處理
        console.warn('心跳發送失敗:', error);
      }
    };

    // 立即發送一次心跳
    sendHeartbeat();

    // 設定定期心跳
    intervalRef.current = setInterval(sendHeartbeat, HEARTBEAT_INTERVAL);

    // 清理
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);
}

