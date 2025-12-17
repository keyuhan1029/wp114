# 課表功能開發總結

> 開發日期：2025-12-04

## 概述

本次開發為 NTUGo 專案新增完整的課表功能，支援多課表管理、15 個時間段（含第 0 節與 ABCD 晚間節次）、多時段課程選擇，採用黑白極簡設計風格。

---

## 新增檔案清單

### 後端 - 資料模型

| 檔案路徑 | 說明 |
|----------|------|
| `src/lib/models/Schedule.ts` | 課表 MongoDB Model（支援多課表） |
| `src/lib/models/ScheduleItem.ts` | 課程項目 MongoDB Model |

### 後端 - API Routes

| 檔案路徑 | 方法 | 說明 |
|----------|------|------|
| `src/app/api/schedule/route.ts` | GET, POST | 課表列表與新增 |
| `src/app/api/schedule/[id]/route.ts` | GET, PUT, DELETE | 單一課表 CRUD |
| `src/app/api/schedule/[id]/items/route.ts` | GET, POST | 課程項目列表與新增 |
| `src/app/api/schedule/items/[itemId]/route.ts` | PUT, DELETE | 單一課程項目更新與刪除 |

### 前端 - 頁面與組件

| 檔案路徑 | 說明 |
|----------|------|
| `src/app/schedule/page.tsx` | 課表主頁面 |
| `src/components/Schedule/ScheduleGrid.tsx` | 課表網格組件（15 時段 × 5 天） |
| `src/components/Schedule/ScheduleSidebar.tsx` | 右側課表列表組件 |
| `src/components/Schedule/CourseDialog.tsx` | 課程新增/編輯對話框 |

### 修改的檔案

| 檔案路徑 | 修改內容 |
|----------|----------|
| `src/components/Layout/TopBar.tsx` | 課表 icon 點擊導向 `/schedule`，再次點擊返回首頁 |

---

## 資料模型

### Schedule（課表）

```typescript
{
  _id: ObjectId;
  userId: ObjectId;
  name: string;           // 課表名稱
  isDefault?: boolean;    // 是否為預設課表
  createdAt: Date;
  updatedAt: Date;
}
```

### ScheduleItem（課程項目）

```typescript
{
  _id: ObjectId;
  scheduleId: ObjectId;
  courseName: string;     // 課程名稱
  location?: string;      // 上課地點
  teacher?: string;       // 教師姓名
  dayOfWeek: number;      // 0=週一, 4=週五
  periodStart: number;    // 開始節次索引 (0-14)
  periodEnd: number;      // 結束節次索引 (0-14)
  color: string;          // 課程顏色 (hex)
  createdAt: Date;
  updatedAt: Date;
}
```

---

## 時間段定義

| 索引 | 標籤 | 時間 |
|------|------|------|
| 0 | 0 | 07:10-08:00 |
| 1 | 1 | 08:10-09:00 |
| 2 | 2 | 09:10-10:00 |
| 3 | 3 | 10:20-11:00 |
| 4 | 4 | 11:20-12:20 |
| 5 | 5 | 12:20-13:10 |
| 6 | 6 | 13:20-14:10 |
| 7 | 7 | 14:30-15:20 |
| 8 | 8 | 15:30-16:20 |
| 9 | 9 | 16:30-17:20 |
| 10 | 10 | 17:30-18:20 |
| 11 | A | 18:25-19:15 |
| 12 | B | 19:20-20:10 |
| 13 | C | 20:15-21:05 |
| 14 | D | 21:10-22:00 |

---

## 功能詳細說明

### 1. 多課表管理

- 支援創建多個課表（如：本學期、下學期）
- 右側欄顯示課表列表，點擊切換
- 支援重命名與刪除課表
- 首次進入自動創建「我的課表」

### 2. 課程新增與編輯

**時間選擇器**：
- 彈出式小課表選擇時間段
- 點擊一次選擇，再點擊一次取消
- 已佔用時間段顯示灰色（disabled）
- 支援一門課多個時段（如週一 1-2、週二 1-2）
- 非連續時段會拆分為多個課程項目

**課程資訊**：
- 課程名稱（必填）
- 上課地點（選填）
- 教師姓名（選填）
- 顏色選擇（8 種深色系預設色）

### 3. 課表網格顯示

- 15 行（時間段）× 5 列（週一至週五）
- 每個格子顯示課程名稱與地點
- 跨節課程在每個覆蓋的格子都顯示
- 點擊空格新增課程
- 點擊課程編輯或刪除

### 4. 設計風格

**黑白極簡設計**：
- 背景純白、邊框淺灰
- 文字使用深灰階
- 課程組件使用深色系顏色
- 文字為白色，帶陰影提升可讀性

**預設顏色**：
- 炭灰 `#4a4a4a`
- 石墨 `#5c5c5c`
- 深藍 `#3d5a80`
- 墨綠 `#4a6741`
- 深紫 `#5d4e6d`
- 棕褐 `#7d6b5d`
- 深紅 `#8b4049`
- 藏青 `#2c3e50`

---

## API 端點

### 課表 API

| 方法 | 路徑 | 說明 |
|------|------|------|
| GET | `/api/schedule` | 取得用戶所有課表 |
| POST | `/api/schedule` | 新增課表 |
| GET | `/api/schedule/:id` | 取得單一課表（含課程項目） |
| PUT | `/api/schedule/:id` | 更新課表名稱 |
| DELETE | `/api/schedule/:id` | 刪除課表 |

### 課程項目 API

| 方法 | 路徑 | 說明 |
|------|------|------|
| GET | `/api/schedule/:id/items` | 取得課表的所有課程項目 |
| POST | `/api/schedule/:id/items` | 新增課程項目 |
| PUT | `/api/schedule/items/:itemId` | 更新課程項目 |
| DELETE | `/api/schedule/items/:itemId` | 刪除課程項目 |

---

## Next.js 15 相容性

所有動態路由 API 均已適配 Next.js 15：

```typescript
// params 為 Promise，需 await
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  // ...
}
```

---

## 後續開發建議

1. **課表匯入**：支援從學校系統匯入課表
2. **課表分享**：生成分享連結或圖片
3. **衝堂檢測**：新增課程時自動檢測時間衝突
4. **上課提醒**：整合通知系統，課前提醒
5. **與行事曆整合**：將課程同步至個人行事曆

