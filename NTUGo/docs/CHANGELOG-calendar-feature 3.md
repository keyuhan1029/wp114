# 行事曆功能開發總結

> 開發日期：2025-12-02

## 概述

本次開發為 NTUGo 專案新增完整的行事曆功能，包含台大官方行事曆整合、個人行事曆管理、ICS 匯入匯出等功能。

---

## 新增檔案清單

### 後端 - 資料模型與工具

| 檔案路徑 | 說明 |
|----------|------|
| `src/lib/calendar/CalendarEvent.ts` | 行事曆事件共用型別定義 |
| `src/lib/calendar/dataSource.ts` | 行事曆資料來源抽象介面 |
| `src/lib/calendar/ntuOfficial.ts` | NTU 官方行事曆 ICS 解析器 |
| `src/lib/calendar/ics.ts` | ICS 檔案生成工具 |
| `src/lib/models/PersonalEvent.ts` | 個人行程 MongoDB Model |

### 後端 - API Routes

| 檔案路徑 | 方法 | 說明 |
|----------|------|------|
| `src/app/api/calendar/events/route.ts` | GET | 取得 NTU 官方行事曆事件 |
| `src/app/api/calendar/personal/route.ts` | GET, POST | 個人行程列表與新增 |
| `src/app/api/calendar/personal/[id]/route.ts` | PUT, DELETE | 個人行程更新與刪除 |
| `src/app/api/calendar/personal/[id]/ics/route.ts` | GET | 匯出單一行程為 .ics |
| `src/app/api/calendar/personal/from-ntu/route.ts` | POST | 從 NTU 行事曆加入個人行程 |

### 前端 - 頁面與組件

| 檔案路徑 | 說明 |
|----------|------|
| `src/app/calendar/page.tsx` | 行事曆主頁面（約 1250 行） |
| `public/ntucool_calander_QA.png` | NTU COOL 匯入說明圖片 |

### 修改的檔案

| 檔案路徑 | 修改內容 |
|----------|----------|
| `src/components/Layout/TopBar.tsx` | 行事曆 icon 點擊導向 `/calendar`，再次點擊返回首頁 |
| `src/app/page.tsx` | 首頁活動列表改為顯示真實 NTU 行事曆事件，加入「加入行事曆」按鈕 |

---

## 功能詳細說明

### 1. 台大官方行事曆整合

**資料來源**：
- 使用環境變數 `NTU_CALENDAR_ICS_URL` 指定 ICS 檔案 URL
- 預設使用台大官方行事曆：`https://ppt.cc/fXxnLx`

**技術實作**：
- `NTUOfficialCalendarSource` 類別實作 `CalendarDataSource` 介面
- 支援 ICS 標準格式解析（VEVENT、SUMMARY、DTSTART、DTEND、LOCATION、DESCRIPTION）
- 支援全天事件（`VALUE=DATE`）與帶時間事件
- 支援 UTC 時間與本地時間
- 支援 ICS 折行展開

### 2. 個人行事曆 CRUD

**資料模型** (`PersonalEvent`)：
```typescript
{
  userId: ObjectId | string;
  title: string;
  description?: string;
  location?: string;
  startTime: Date;
  endTime: Date;
  allDay: boolean;
  source: 'manual' | 'ntu_imported';
  createdAt: Date;
  updatedAt: Date;
}
```

**API 功能**：
- 新增行程（手動輸入或從 NTU 行事曆匯入）
- 編輯行程
- 刪除行程
- 依時間範圍查詢

### 3. ICS 匯入匯出

**匯入功能**：
- 前端解析 .ics 檔案內容
- 支援批次匯入多筆事件
- 支援從 NTU COOL、Google Calendar、Apple Calendar 等來源匯入

**匯出功能**：
- 後端生成標準 ICS 格式
- 支援單一行程匯出
- 可匯入至 Google Calendar、Apple Calendar、Outlook 等

### 4. 行事曆 UI

**月曆視圖**：
- 6 週 × 7 天固定格式
- 支援月份切換
- 「今天」快速跳轉按鈕
- 日期格子顯示事件標記（校/個）

**當日行程卡片**：
- 顯示選定日期的所有行程
- 支援編輯、匯出、刪除操作
- 學校行程開關（可隱藏 NTU 官方行事曆事件）

**推薦活動卡片**：
- 顯示未來 5 筆 NTU 官方活動
- 一鍵加入個人行事曆

**匯入說明彈窗**：
- 點擊 info icon 顯示 NTU COOL 匯入說明圖片
- 支援點擊遮罩關閉

---

## 環境變數

新增以下環境變數：

```env
# NTU 行事曆 ICS URL
NTU_CALENDAR_ICS_URL=https://ppt.cc/fXxnLx
```

---

## Next.js 15 相容性修正

在開發過程中遇到 Next.js 15 的 breaking change：

**問題**：動態路由的 `params` 現在是 Promise

**修正方式**：
```typescript
// 舊寫法（Next.js 14）
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = params.id;
  // ...
}

// 新寫法（Next.js 15）
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  // ...
}
```

---

## MUI v6 相容性修正

**問題**：`Grid` 元件 API 變更

**修正方式**：
```tsx
// 舊寫法（MUI v5）
<Grid item xs={6}>

// 新寫法（MUI v6）
<Grid size={6}>
```

---

## 測試建議

1. **行事曆顯示**：確認 NTU 官方行事曆事件正確顯示
2. **個人行程 CRUD**：測試新增、編輯、刪除功能
3. **ICS 匯入**：從 NTU COOL 下載 .ics 檔案並匯入
4. **ICS 匯出**：匯出行程並在 Google Calendar 中匯入
5. **學校行程開關**：測試開關是否正確隱藏/顯示學校行事曆

---

## 後續開發建議

1. **課表功能**：可重用行事曆架構，新增課表專用視圖
2. **行事曆訂閱**：提供 ICS 訂閱 URL，讓外部行事曆自動同步
3. **提醒功能**：行程開始前推送通知
4. **重複事件**：支援每週/每月重複的行程
5. **共享行事曆**：支援與其他用戶共享行程

