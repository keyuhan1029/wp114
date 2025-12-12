# 社群功能開發總結

> 開發日期：2024-12-10

## 概述

本次開發為 NTUGo 專案新增完整的社群功能，包含好友系統、即時訊息（使用 Pusher Channels）、用戶狀態同步、以及個人資料系所欄位。

---

## 新增檔案清單

### 後端 - 資料模型

| 檔案路徑 | 說明 |
|----------|------|
| `src/lib/models/Friendship.ts` | 好友關係 MongoDB Model |
| `src/lib/models/ChatRoom.ts` | 聊天室 MongoDB Model |
| `src/lib/models/Message.ts` | 訊息 MongoDB Model |

### 後端 - API Routes

| 檔案路徑 | 方法 | 說明 |
|----------|------|------|
| `src/app/api/community/friends/route.ts` | GET, POST | 好友列表與發送請求 |
| `src/app/api/community/friends/[id]/route.ts` | PUT, DELETE | 接受/拒絕請求、移除好友 |
| `src/app/api/community/friends/requests/route.ts` | GET | 待處理好友請求 |
| `src/app/api/community/friends/suggestions/route.ts` | GET | 推薦好友 |
| `src/app/api/community/users/search/route.ts` | GET | 搜尋用戶 |
| `src/app/api/community/users/[id]/route.ts` | GET | 取得用戶資料 |
| `src/app/api/community/status/route.ts` | GET | 用戶狀態（根據課表） |
| `src/app/api/community/chatrooms/route.ts` | GET, POST | 聊天室列表與建立 |
| `src/app/api/community/messages/[roomId]/route.ts` | GET, POST | 訊息收發 |
| `src/app/api/pusher/auth/route.ts` | POST | Pusher 私有頻道認證 |

### 前端 - 頁面與組件

| 檔案路徑 | 說明 |
|----------|------|
| `src/app/community/page.tsx` | 社群主頁面 |
| `src/components/Community/FriendsList.tsx` | 好友列表組件 |
| `src/components/Community/FriendRequests.tsx` | 好友請求組件 |
| `src/components/Community/FriendSuggestions.tsx` | 推薦好友組件 |
| `src/components/Community/MessageList.tsx` | 訊息列表組件 |
| `src/components/Community/ChatRoom.tsx` | 聊天室組件 |
| `src/components/Community/UserProfileModal.tsx` | 用戶個人主頁 Modal |

### 其他新增檔案

| 檔案路徑 | 說明 |
|----------|------|
| `src/lib/pusher.ts` | Pusher 伺服器端實例 |
| `src/contexts/PusherContext.tsx` | Pusher 客戶端 Context |
| `src/data/departments.ts` | 台大系所清單 |

### 修改的檔案

| 檔案路徑 | 修改內容 |
|----------|----------|
| `src/lib/models/User.ts` | 新增 `department` 欄位、`findById`、`findByIds`、`searchUsers` 方法 |
| `src/app/api/auth/profile/route.ts` | 支援更新系所資料 |
| `src/app/api/auth/me/route.ts` | 回傳系所資訊 |
| `src/components/Auth/ProfileModal.tsx` | 顯示系所欄位 |
| `src/components/Auth/EditProfileModal.tsx` | 新增系所選擇下拉選單 |
| `src/components/Layout/Sidebar.tsx` | 「論壇」→「社群」、「目錄」→「主頁」 |
| `src/components/Layout/TopBar.tsx` | 新增通知圖示 |

---

## 資料模型

### Friendship（好友關係）

```typescript
{
  _id: ObjectId;
  requesterId: ObjectId;    // 發送請求者
  addresseeId: ObjectId;    // 接收請求者
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: Date;
  updatedAt: Date;
}
```

### ChatRoom（聊天室）

```typescript
{
  _id: ObjectId;
  type: 'private' | 'group';
  name?: string;            // 群組名稱（私聊不需要）
  members: ObjectId[];      // 成員 ID 陣列
  createdAt: Date;
  updatedAt: Date;
}
```

### Message（訊息）

```typescript
{
  _id: ObjectId;
  chatRoomId: ObjectId;
  senderId: ObjectId;
  content: string;
  createdAt: Date;
}
```

### User（擴充）

```typescript
{
  // 現有欄位...
  department?: string;      // 系所
}
```

---

## 功能詳細說明

### 1. 好友系統

**發送好友請求**：
- 透過「推薦好友」或「搜尋用戶」發送請求
- 請求狀態：pending → accepted/rejected
- 不可重複發送請求給同一用戶

**好友請求管理**：
- 顯示所有待處理的好友請求
- 可接受或拒絕請求
- 接受後雙方成為好友

**好友列表**：
- 顯示所有已接受的好友
- 顯示好友即時狀態
- 點擊好友開啟聊天

### 2. 用戶狀態同步

根據用戶的課表自動計算當前狀態：

| 狀態 | 說明 |
|------|------|
| `上課中 @ {地點}` | 當前時間在某堂課的時段內 |
| `無課程` | 當前時間無任何課程 |

**狀態計算邏輯**：
1. 取得用戶預設課表的所有課程項目
2. 根據當前時間（星期幾、第幾節）比對
3. 若找到匹配課程，顯示上課地點

### 3. 即時訊息（Pusher）

**架構**：
- 伺服器端使用 `pusher` SDK 觸發事件
- 客戶端使用 `pusher-js` 訂閱頻道
- 私有頻道格式：`private-chat-{roomId}`

**訊息流程**：
1. 用戶發送訊息 → POST `/api/community/messages/:roomId`
2. 伺服器儲存訊息至 MongoDB
3. 伺服器透過 Pusher 觸發 `new-message` 事件
4. 聊天室訂閱者即時收到訊息

**頻道認證**：
- Pusher 私有頻道需要認證
- `/api/pusher/auth` 驗證用戶是否為聊天室成員

### 4. 聊天室介面

**訊息列表**：
- 顯示所有聊天室
- 顯示最後一則訊息預覽
- 顯示時間戳記（今天/昨天/N天前）

**聊天室**：
- 即時顯示訊息
- 自動捲動至最新訊息
- 訊息氣泡區分自己/對方
- 支援鍵盤發送（Enter）

### 5. 用戶個人主頁

**觸發方式**：
- 點擊好友列表中的頭像或名稱
- 點擊好友請求中的頭像或名稱
- 點擊推薦好友中的頭像或名稱

**顯示資訊**：
- 頭像
- 名稱
- 用戶 ID
- 系所
- 好友狀態（已是好友/待接受/發送請求）
- 開始對話按鈕

### 6. 系所欄位

**系所清單**：
- 包含台大所有學院與系所
- 共 11 個學院、100+ 個系所

**編輯方式**：
- 在「編輯個人資料」Modal 中選擇
- 使用 MUI Select 下拉選單

---

## API 端點

### 好友 API

| 方法 | 路徑 | 說明 |
|------|------|------|
| GET | `/api/community/friends` | 取得好友列表 |
| POST | `/api/community/friends` | 發送好友請求 |
| PUT | `/api/community/friends/:id` | 接受好友請求 |
| DELETE | `/api/community/friends/:id` | 拒絕請求/移除好友 |
| GET | `/api/community/friends/requests` | 取得待處理請求 |
| GET | `/api/community/friends/suggestions` | 取得推薦好友 |

### 用戶 API

| 方法 | 路徑 | 說明 |
|------|------|------|
| GET | `/api/community/users/search?q=xxx` | 搜尋用戶 |
| GET | `/api/community/users/:id` | 取得用戶資料 |
| GET | `/api/community/status?userIds=id1,id2` | 取得用戶狀態 |

### 訊息 API

| 方法 | 路徑 | 說明 |
|------|------|------|
| GET | `/api/community/chatrooms` | 取得聊天室列表 |
| POST | `/api/community/chatrooms` | 建立聊天室 |
| GET | `/api/community/messages/:roomId` | 取得訊息歷史 |
| POST | `/api/community/messages/:roomId` | 發送訊息 |
| POST | `/api/pusher/auth` | Pusher 頻道認證 |

---

## 環境變數

新增以下 Pusher 相關環境變數：

```env
# Pusher (伺服器端)
PUSHER_APP_ID=xxx
PUSHER_KEY=xxx
PUSHER_SECRET=xxx
PUSHER_CLUSTER=xxx

# Pusher (客戶端)
NEXT_PUBLIC_PUSHER_KEY=xxx
NEXT_PUBLIC_PUSHER_CLUSTER=xxx
```

---

## 依賴套件

```bash
npm install pusher pusher-js
```

| 套件 | 版本 | 說明 |
|------|------|------|
| `pusher` | ^5.x | 伺服器端 Pusher SDK |
| `pusher-js` | ^8.x | 客戶端 Pusher SDK |

---

## UI 設計

### 頁面佈局

```
┌─────────────────────────────────────────────────┐
│                    TopBar                        │
├────────┬────────────────────────────────────────┤
│        │  ┌──────────┐  ┌───────────────────┐   │
│        │  │ 好友列表  │  │     訊息列表       │   │
│ Side   │  │          │  │                   │   │
│  bar   │  │          │  │                   │   │
│        │  ├──────────┤  │                   │   │
│        │  │ 好友請求  │  │                   │   │
│        │  ├──────────┤  │                   │   │
│        │  │ 推薦好友  │  │                   │   │
│        │  └──────────┘  └───────────────────┘   │
└────────┴────────────────────────────────────────┘
```

### 聊天室視圖

```
┌─────────────────────────────────────────────────┐
│                    TopBar                        │
├────────┬────────────────────────────────────────┤
│        │  ┌──────────────────────────────────┐  │
│        │  │ 好友名稱                    ← 返回 │  │
│ Side   │  ├──────────────────────────────────┤  │
│  bar   │  │                                  │  │
│        │  │         訊息內容區域              │  │
│        │  │                                  │  │
│        │  ├──────────────────────────────────┤  │
│        │  │ [輸入訊息...]            [發送]  │  │
│        │  └──────────────────────────────────┘  │
└────────┴────────────────────────────────────────┘
```

### 配色

- 背景：`#f5f7fa`（灰色，與行事曆、課表一致）
- 卡片：`#ffffff`
- 主色：`#0F4C75`
- 訊息氣泡（自己）：`#0F4C75`
- 訊息氣泡（對方）：`#e0e0e0`

---

## Next.js 16 相容性

### 靜態 Import（重要）

Next.js 16 + Turbopack 環境下，動態 `import()` 語法可能導致錯誤。所有 MongoDB `ObjectId` 需使用靜態 import：

```typescript
// ✅ 正確
import { ObjectId } from 'mongodb';

// ❌ 錯誤（會在 Turbopack 中報錯）
const { ObjectId } = await import('mongodb');
```

### 動態路由 API

```typescript
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  // ...
}
```

---

## 修正與優化（2024-12-12）

### Bug 修復

1. **訊息方向錯誤**：修復自己發送的訊息顯示在對方位置的問題
   - 原因：Pusher 訊息可能比 API 響應更快到達
   - 解法：在 `handleNewMessage` 中檢查 `senderId === currentUserId`，忽略自己發送的訊息

2. **重複聊天室**：修復同一個好友出現多個聊天室的問題
   - 在 `/api/community/chatrooms` 中添加去重邏輯

3. **用戶資料找不到**：修復點擊頭像顯示「找不到此用戶」的問題
   - 新增 `/api/community/users/[id]/route.ts` API
   - 改用 ID 查詢取代搜尋 API

4. **React key 重複警告**：修復訊息列表中的 key 重複錯誤
   - 使用 `${message.id}-${index}` 作為唯一 key

### 功能優化

1. **即時更新訊息列表**
   - 新增 `triggerChatUpdate` Pusher 事件
   - 訊息預覽和未讀數量即時更新
   - 有新訊息的聊天室自動移到最上方

2. **已讀消除未讀數字**
   - 選擇聊天室時自動將未讀數設為 0

3. **隱藏空聊天室**
   - 只顯示有訊息記錄的聊天室

4. **顯示已送出的好友邀請**
   - `FriendRequests` 組件新增「已送出的邀請」區塊
   - 可取消已送出的邀請

5. **聊天室頭像可點擊**
   - 點擊聊天室頂部的頭像或名稱可查看用戶資料

6. **中文化**
   - 聊天室狀態：`no class` → `無課程`
   - 狀態標籤：`status:` → `狀態：`

---

## 後續開發建議

1. **通知系統**：好友請求、新訊息通知（TopBar 已預留通知圖示）
2. **群組聊天**：支援多人聊天室
3. **訊息已讀**：顯示訊息已讀狀態
4. **檔案傳送**：支援圖片、檔案傳送
5. **訊息搜尋**：搜尋聊天記錄
6. **用戶封鎖**：封鎖特定用戶
7. **線上狀態**：顯示用戶是否在線

