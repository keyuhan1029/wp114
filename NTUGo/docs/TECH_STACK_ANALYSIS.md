# 技術棧分析與建議

## 一、當前技術棧分析

### 1.1 現狀

- **前端 + 後端框架：** Next.js 16 (App Router)
- **API Routes：** 約 50+ 個端點，涵蓋：
  - 認證系統 (auth)
  - 社群功能 (community)
  - 課表管理 (schedule)
  - 公車/地鐵 (tdx)
  - 行事曆 (calendar)
  - 公告 (announcements)
  - 檔案上傳 (upload)
  - Cron 任務 (cron)
  
- **數據庫：** MongoDB
- **實時通訊：** Pusher
- **狀態管理：** React Context / useState
- **UI 框架：** Material-UI

### 1.2 項目特點

1. **全棧應用**：前端和後端都在 Next.js 中
2. **API 數量多**：但複雜度中等
3. **實時功能**：使用 Pusher（外部服務）
4. **已形成完整架構**：模型、API、前端都已建立

## 二、Next.js 作為後端的優劣分析

### 2.1 優勢 ✅

1. **統一技術棧**
   - TypeScript 貫穿前後端
   - 共享類型和工具函數
   - 單一項目結構，易於維護

2. **部署簡單**
   - 單一部署目標（Vercel/其他平台）
   - 自動優化（API Routes 自動優化）
   - 邊緣函數支持（Edge Runtime）

3. **開發效率高**
   - 快速開發 API Routes
   - 熱重載
   - 內建路由系統

4. **已投入大量工作**
   - 50+ API 端點已實現
   - 模型層已建立
   - 重構成本高

### 2.2 劣勢 ⚠️

1. **性能限制**
   - API Routes 在 Serverless 環境中可能有冷啟動
   - 不適合長時間運行的任務（可用 Edge Functions 緩解）

2. **功能限制**
   - WebSocket 支持有限（但您已用 Pusher 解決）
   - 不適合複雜的背景任務（但可用 Cron Jobs）

3. **擴展性**
   - 大型項目可能變得複雜
   - 沒有傳統後端框架的某些高級特性

### 2.3 結論

**建議：繼續使用 Next.js 作為後端**

**理由：**
1. 項目已經成熟，重構成本極高
2. Next.js API Routes 完全滿足當前需求
3. 統一的技術棧帶來的便利性大於引入新框架的成本
4. 您的需求（郵箱驗證、認證、CRUD）Next.js 完全勝任

## 三、是否需要引入其他後端框架？

### 3.1 可能的替代方案

#### 選項 1：Express.js + Next.js（不推薦）

**架構：**
```
Next.js (前端 + SSR)
  ↓
Express.js (獨立後端服務)
  ↓
MongoDB
```

**優點：**
- 更靈活的後端控制
- 更好的 WebSocket 支持
- 更適合複雜業務邏輯

**缺點：**
- **需要重寫所有 API**（50+ 端點）
- 雙重部署複雜度
- CORS 配置
- 開發環境需要同時運行兩個服務
- **開發時間成本極高**

**結論：❌ 不推薦**

#### 選項 2：NestJS（不推薦）

**架構：**
```
Next.js (前端)
  ↓
NestJS (後端)
  ↓
MongoDB
```

**優點：**
- 企業級架構
- 依賴注入
- 模塊化設計

**缺點：**
- **需要完全重寫後端**
- 學習曲線
- 部署複雜度增加
- **時間成本巨大**

**結論：❌ 不推薦**

#### 選項 3：tRPC（可考慮，但非必需）

**架構：**
```
Next.js (前端 + 後端)
  ↓
tRPC (類型安全的 API 層)
  ↓
MongoDB
```

**優點：**
- 端到端類型安全
- 減少 API 文檔需求
- 更好的開發體驗

**缺點：**
- 需要重構現有 API
- 學習成本
- 社區相對較小

**結論：⏸️ 可選，但不緊急**

### 3.2 混合方案（可選）

如果未來有特殊需求，可以考慮：

```
Next.js (主要 API) 
  + 
獨立微服務 (特定功能，如 WebSocket 伺服器、背景任務處理器)
```

**適用場景：**
- 需要長時間運行的 WebSocket 連接
- 複雜的背景任務處理
- 需要獨立擴展的服務

**當前階段：❌ 不需要**

## 四、Redis 需求分析

### 4.1 是否需要 Redis？

#### 場景 1：驗證碼發送頻率限制

**方案 A：使用內存緩存（簡單）**
```typescript
// 使用 Map 存儲發送記錄（單實例有效）
const sendRateLimit = new Map<string, number[]>();
```

**適用於：**
- 單實例部署
- 開發環境
- 小規模應用

**方案 B：使用 Redis（可擴展）**
```typescript
// 使用 Redis 存儲發送記錄（多實例有效）
await redis.incr(`email:send:${email}:${hour}`);
```

**適用於：**
- 多實例部署
- 生產環境
- 需要持久化

#### 場景 2：會話管理

您目前使用 JWT，不需要 Redis 存儲會話。

#### 場景 3：實時數據緩存

您使用 Pusher，實時數據不在後端緩存。

### 4.2 建議

**開發階段：**
- ❌ **暫時不需要 Redis**
- ✅ 使用內存 Map 實現頻率限制
- ✅ 後續需要時再引入

**生產環境：**
- ✅ 如果部署在單實例環境（如 Vercel），仍可用內存緩存
- ✅ 如果需要多實例或持久化，再引入 Redis

### 4.3 Redis 提供商選擇（未來參考）

**免費選項：**
- **Upstash Redis**（推薦）
  - 免費額度：10,000 請求/天
  - Serverless Redis
  - 自動擴展
  - 適合 Serverless 環境

- **Redis Cloud**
  - 免費額度：30MB
  - 傳統 Redis

**付費選項：**
- AWS ElastiCache
- Azure Cache for Redis

## 五、Resend 註冊建議

### 5.1 是否需要立即註冊？

**答案：✅ 是的，建議立即註冊**

**理由：**
1. **免費額度充足**：每月 3,000 封（開發階段足夠）
2. **註冊簡單**：幾分鐘即可完成
3. **可以立即開始開發**：需要 API Key 才能測試郵件發送
4. **不註冊無法測試**：開發時需要真實的郵件發送功能

### 5.2 註冊步驟

1. 訪問 [resend.com](https://resend.com)
2. 使用 GitHub/Google 登入或創建帳號
3. 獲取 API Key（在 Dashboard → API Keys）
4. 添加到 `.env.local`：
   ```env
   RESEND_API_KEY=re_xxxxxxxxxxxx
   ```

### 5.3 開發環境配置

**開發時可以：**
- 使用免費額度
- 發送到真實郵箱測試
- 查看發送記錄和統計

**注意事項：**
- 避免在開發時大量發送測試郵件
- 可以設置開發環境只記錄不發送（可選）

## 六、技術棧建議總結

### 6.1 後端框架決策

| 選項 | 推薦度 | 理由 |
|------|--------|------|
| **繼續使用 Next.js** | ⭐⭐⭐⭐⭐ | 項目已成熟，重構成本高，滿足需求 |
| Express.js | ⭐ | 需要重寫所有 API，成本太高 |
| NestJS | ⭐ | 過度工程化，學習成本高 |
| tRPC | ⭐⭐⭐ | 可選，但不緊急 |

**最終建議：✅ 繼續使用 Next.js**

### 6.2 中間件/工具決策

| 工具 | 是否需要 | 時機 | 推薦方案 |
|------|---------|------|---------|
| **Resend** | ✅ 需要 | **立即註冊** | Resend（免費額度充足） |
| **Redis** | ⏸️ 可選 | 生產環境需要時 | 開發階段用內存 Map |
| **tRPC** | ⏸️ 可選 | 未來重構時 | 不緊急 |

### 6.3 實施優先級

**第一優先級（立即）：**
1. ✅ 註冊 Resend 帳號
2. ✅ 獲取 API Key
3. ✅ 開始實現郵箱驗證功能

**第二優先級（開發過程中）：**
1. ✅ 使用內存 Map 實現頻率限制
2. ✅ 測試郵件發送功能
3. ✅ 完善驗證流程

**第三優先級（生產環境）：**
1. ⏸️ 評估是否需要 Redis（如果多實例部署）
2. ⏸️ 考慮引入 Upstash Redis（如果需要）

## 七、具體實施建議

### 7.1 立即行動

**今天就可以做：**
1. 註冊 Resend 帳號（5 分鐘）
2. 獲取 API Key
3. 添加到環境變數
4. 安裝 Resend SDK：
   ```bash
   npm install resend
   ```

### 7.2 開發階段頻率限制實現

**使用內存 Map（適合當前階段）：**

```typescript
// src/lib/utils/rateLimit.ts
const emailSendRecords = new Map<string, number[]>();

export function checkSendRateLimit(email: string, maxPerHour: number = 5): boolean {
  const now = Date.now();
  const oneHourAgo = now - 60 * 60 * 1000;
  
  const records = emailSendRecords.get(email) || [];
  const recentRecords = records.filter(time => time > oneHourAgo);
  
  if (recentRecords.length >= maxPerHour) {
    return false; // 超過限制
  }
  
  recentRecords.push(now);
  emailSendRecords.set(email, recentRecords);
  
  // 清理舊記錄（可選，定期清理）
  return true; // 允許發送
}
```

**優點：**
- 簡單直接
- 無需額外服務
- 適合單實例部署

**缺點：**
- 多實例部署時不共享
- 重啟後丟失

### 7.3 未來升級路徑

如果未來需要 Redis：

```typescript
// 使用 Upstash Redis（Serverless 友好）
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export async function checkSendRateLimit(email: string): Promise<boolean> {
  const key = `email:send:${email}:${Math.floor(Date.now() / 3600000)}`;
  const count = await redis.incr(key);
  await redis.expire(key, 3600); // 1 小時過期
  
  return count <= 5;
}
```

**遷移成本低**：只需替換實現，接口不變。

## 八、總結

### 後端框架
✅ **繼續使用 Next.js** - 這是正確的選擇，無需重構

### Resend
✅ **立即註冊** - 免費、簡單、必需

### Redis
⏸️ **暫時不需要** - 開發階段用內存緩存即可，生產環境需要時再引入

### 下一步
1. 註冊 Resend 並獲取 API Key
2. 開始實現郵箱驗證功能
3. 使用內存 Map 實現頻率限制
4. 根據實際需求決定是否引入 Redis

---

**文檔版本：** 1.0  
**創建日期：** 2024-12-14

