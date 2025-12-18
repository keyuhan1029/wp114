/**
 * 內存緩存的頻率限制（適合單實例部署）
 * 開發階段使用，生產環境可考慮 Redis
 */

interface RateLimitRecord {
  timestamps: number[];
  count: number;
}

const emailSendRecords = new Map<string, RateLimitRecord>();

/**
 * 檢查郵箱發送頻率限制
 * @param email 郵箱地址
 * @param maxPerHour 每小時最大發送次數，默認 5 次
 * @returns 是否允許發送
 */
export function checkEmailSendRateLimit(email: string, maxPerHour: number = 5): boolean {
  const now = Date.now();
  const oneHourAgo = now - 60 * 60 * 1000;

  const record = emailSendRecords.get(email);
  
  if (!record) {
    // 沒有記錄，允許發送
    emailSendRecords.set(email, {
      timestamps: [now],
      count: 1,
    });
    return true;
  }

  // 過濾掉一小時前的記錄
  const recentTimestamps = record.timestamps.filter(time => time > oneHourAgo);
  
  if (recentTimestamps.length >= maxPerHour) {
    // 超過限制
    return false;
  }

  // 更新記錄
  recentTimestamps.push(now);
  emailSendRecords.set(email, {
    timestamps: recentTimestamps,
    count: recentTimestamps.length,
  });

  return true;
}

/**
 * 清理舊的記錄（可選，定期執行）
 */
export function cleanupOldRecords(): void {
  const oneHourAgo = Date.now() - 60 * 60 * 1000;
  
  for (const [email, record] of emailSendRecords.entries()) {
    const recentTimestamps = record.timestamps.filter(time => time > oneHourAgo);
    
    if (recentTimestamps.length === 0) {
      // 沒有最近的記錄，刪除
      emailSendRecords.delete(email);
    } else {
      // 更新記錄
      emailSendRecords.set(email, {
        timestamps: recentTimestamps,
        count: recentTimestamps.length,
      });
    }
  }
}

/**
 * 獲取剩餘發送次數（用於前端顯示）
 */
export function getRemainingSends(email: string, maxPerHour: number = 5): number {
  const record = emailSendRecords.get(email);
  if (!record) {
    return maxPerHour;
  }

  const now = Date.now();
  const oneHourAgo = now - 60 * 60 * 1000;
  const recentCount = record.timestamps.filter(time => time > oneHourAgo).length;
  
  return Math.max(0, maxPerHour - recentCount);
}

