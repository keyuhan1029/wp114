# NTUGo

專為台大學生打造的整合式校園生活服務平台，整合地圖、交通、行事曆、課表、社群、活動公告等功能於一體，讓台大學生的校園生活更便利。

![NTUGo Logo](./NTUGo/public/logo.svg)

## ✨ 主要功能

### 🗺️ 互動式校園地圖
- **Google Maps 整合**：以台大校園為中心的地圖視圖
- **多種地圖標記**：
  - 🍔 **美食地點**：校園周邊推薦餐廳
  - 🚌 **公車站**：即時到站資訊與路線查詢
  - 🚲 **YouBike 站點**：即時可用車輛數與站點位置
  - 🚇 **捷運站**：出站口資訊與班次時刻表
  - 🏫 **校園設施**：圖書館、體育館、各系館等
- **個人腳踏車標記**：記錄停車位置，方便找回
- **即時資訊顯示**：點擊標記查看詳細資訊（圖書館人數、健身房使用率等）

### 🚌 交通資訊整合
- **公車即時到站**：整合 TDX API，顯示公車預估到站時間
- **YouBike 即時資訊**：查看各站點可借/可還車輛數
- **捷運資訊**：班次時刻表與出站口位置
- **公車提醒功能**：設定公車到站提醒，避免錯過班次

### 📅 行事曆管理
- **台大官方行事曆**：自動同步學校重要活動與假期
- **個人行程管理**：新增、編輯、刪除個人行程
- **ICS 檔案支援**：
  - 從 NTU COOL 匯入課表行程
  - 匯出行程至 Google Calendar / Apple Calendar / Outlook
- **月曆視圖**：清晰顯示所有行程
- **學校行事曆開關**：可選擇是否顯示官方行程

### 📚 課表管理
- **多課表支援**：可創建多個課表（本學期、下學期等）
- **完整時間段**：支援第 0-10 節 + ABCD 晚間節次
- **視覺化編輯**：彈出式時間選擇器，直覺式操作
- **課程資訊管理**：課程名稱、地點、教師、多時段選擇
- **課表分享**：與好友分享課表，查看彼此課程
- **圖片匯出**：將課表匯出為 PNG 圖片，方便分享

### 👥 社群功能
- **好友系統**：
  - 搜尋與新增好友
  - 好友請求管理（發送/接受/拒絕）
  - 系統推薦可能認識的人
- **即時聊天**：
  - 一對一私聊
  - 群組聊天室
  - 訊息已讀狀態
  - 未讀數量提示
  - 即時訊息同步（Pusher）
- **個人主頁**：查看好友資料、狀態、課表等
- **即時狀態顯示**：顯示好友當前狀態（上課中/無課程/位置）

### 📢 活動公告
- **台大活動資訊**：自動抓取台大官方活動公告
- **分類瀏覽**：社團資訊、國際交流、社會服務、小福/鹿鳴堂活動等
- **訂閱設定**：自訂想要接收的活動類別
- **詳細內容**：點擊查看活動完整資訊

### 📁 文檔管理
- **PDF 上傳**：上傳和管理 PDF 文件
- **雲端儲存**：使用 Cloudinary 儲存文件

### 🔐 用戶認證
- **Email/Password 註冊登入**
- **Google OAuth 登入**
- **Email 驗證**：註冊時發送驗證碼確認
- **JWT Token 認證**
- **個人資料管理**：頭像上傳、個人資訊編輯

## 🛠️ 技術棧

### 前端
- **Next.js 16** (App Router) - 全端框架
- **React 19** - UI 框架
- **Material-UI (MUI) 7** - UI 組件庫
- **TypeScript** - 型別安全
- **Emotion** - CSS-in-JS 樣式處理

### 後端
- **Next.js API Routes** - 後端 API
- **MongoDB** - 資料庫
- **JWT** - 身份驗證
- **Pusher Channels** - 即時通訊

### 第三方服務
- **Google Maps API** - 地圖服務
- **TDX API** - 公車與捷運資訊
- **YouBike API** - 公共自行車資訊
- **Cloudinary** - 圖片與檔案儲存
- **Resend** - Email 發送服務

## 📋 環境變數設定

在專案根目錄建立 `.env.local` 檔案：

```env
# MongoDB
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/ntugo

# JWT
JWT_SECRET=your_jwt_secret_key

# Google Maps
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id

# TDX API (公車與捷運)
TDX_CLIENT_ID=your_tdx_client_id
TDX_CLIENT_SECRET=your_tdx_client_secret

# Pusher (即時通訊)
PUSHER_APP_ID=your_pusher_app_id
PUSHER_KEY=your_pusher_key
PUSHER_SECRET=your_pusher_secret
PUSHER_CLUSTER=your_pusher_cluster
NEXT_PUBLIC_PUSHER_KEY=your_pusher_key
NEXT_PUBLIC_PUSHER_CLUSTER=your_pusher_cluster

# Cloudinary (檔案上傳)
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# Resend (Email 發送)
RESEND_API_KEY=your_resend_api_key
RESEND_FROM_EMAIL=your_verified_email@yourdomain.com

# NTU 行事曆
NTU_CALENDAR_ICS_URL=https://ppt.cc/fXxnLx
```

## 🚀 快速開始

### 前置需求

- **Node.js** 20+ 與 npm
- **MongoDB** 資料庫（建議使用 [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)）
- 以下服務的 API 金鑰：
  - Google Cloud Console（Maps API、OAuth）
  - [TDX 平台](https://tdx.transportdata.tw/)（交通資訊）
  - [Pusher](https://pusher.com/)（即時通訊）
  - [Cloudinary](https://cloudinary.com/)（檔案儲存）
  - [Resend](https://resend.com/)（Email 發送）

### 安裝步驟

```bash
# 複製專案
git clone <repository-url>
cd NTUGo

# 安裝依賴
npm install

# 設定環境變數
cp .env.example .env.local
# 編輯 .env.local 填入你的 API 金鑰

# 啟動開發伺服器
npm run dev
```

開啟瀏覽器訪問 [http://localhost:3000](http://localhost:3000)

### 其他指令

```bash
# 建置生產版本
npm run build

# 啟動生產伺服器
npm start

# 執行 ESLint 檢查
npm run lint
```

## 📁 專案結構

```
NTUGo/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── api/                      # API Routes
│   │   │   ├── auth/                 # 認證 API（登入、註冊、OAuth）
│   │   │   ├── calendar/             # 行事曆 API
│   │   │   ├── schedule/             # 課表 API
│   │   │   ├── community/            # 社群 API（好友、聊天）
│   │   │   ├── announcements/        # 活動公告 API
│   │   │   ├── documents/            # 文檔管理 API
│   │   │   ├── tdx/                  # TDX 交通 API
│   │   │   ├── map/                  # 地圖相關 API
│   │   │   └── ...
│   │   ├── calendar/                 # 行事曆頁面
│   │   ├── schedule/                 # 課表頁面
│   │   ├── community/                # 社群頁面
│   │   ├── announcements/            # 活動公告頁面
│   │   ├── documents/                # 文檔管理頁面
│   │   ├── login/                    # 登入頁面
│   │   ├── register/                 # 註冊頁面
│   │   └── page.tsx                  # 首頁（地圖）
│   ├── components/                   # React 組件
│   │   ├── Auth/                     # 認證相關組件
│   │   ├── Community/                # 社群相關組件
│   │   ├── Calendar/                 # 行事曆相關組件
│   │   ├── Schedule/                 # 課表相關組件
│   │   ├── Map/                      # 地圖相關組件
│   │   ├── Layout/                   # 布局組件
│   │   └── Announcements/            # 活動公告組件
│   ├── lib/                          # 工具函數與模型
│   │   ├── models/                   # MongoDB 模型
│   │   ├── calendar/                 # 行事曆相關邏輯
│   │   ├── utils/                    # 工具函數
│   │   ├── jwt.ts                    # JWT 工具
│   │   ├── mongodb.ts                # MongoDB 連線
│   │   └── pusher.ts                 # Pusher 設定
│   ├── services/                     # 外部服務整合
│   │   ├── busApi.ts                 # 公車 API
│   │   ├── youbikeApi.ts             # YouBike API
│   │   ├── metroApi.ts               # 捷運 API
│   │   └── email.ts                  # Email 服務
│   ├── contexts/                     # React Context
│   │   ├── MapContext.tsx            # 地圖狀態管理
│   │   └── PusherContext.tsx         # Pusher 即時通訊
│   └── data/                         # 靜態資料
│       ├── departments.ts            # 台大系所清單
│       └── buildings.ts              # 建築物資訊
├── public/                           # 靜態資源
├── docs/                             # 文件資料夾
└── package.json
```

## 🔌 主要 API 端點

### 認證 API
- `POST /api/auth/register` - 註冊新用戶
- `POST /api/auth/login` - 登入
- `GET /api/auth/me` - 取得當前用戶資訊
- `PUT /api/auth/profile` - 更新個人資料
- `GET /api/auth/google` - Google OAuth 登入

### 行事曆 API
- `GET /api/calendar/events` - 取得 NTU 官方行事曆
- `GET /api/calendar/personal` - 取得個人行程
- `POST /api/calendar/personal` - 新增個人行程
- `PUT /api/calendar/personal/:id` - 更新個人行程
- `DELETE /api/calendar/personal/:id` - 刪除個人行程
- `GET /api/calendar/personal/:id/ics` - 匯出行程為 .ics

### 課表 API
- `GET /api/schedule` - 取得用戶所有課表
- `POST /api/schedule` - 新增課表
- `PUT /api/schedule/:id` - 更新課表
- `DELETE /api/schedule/:id` - 刪除課表
- `POST /api/schedule/:id/items` - 新增課程項目
- `PUT /api/schedule/items/:itemId` - 更新課程項目
- `DELETE /api/schedule/items/:itemId` - 刪除課程項目

### 社群 API
- `GET /api/community/friends` - 取得好友列表
- `POST /api/community/friends` - 發送好友請求
- `PUT /api/community/friends/:id` - 接受好友請求
- `DELETE /api/community/friends/:id` - 拒絕請求/移除好友
- `GET /api/community/chatrooms` - 取得聊天室列表
- `GET /api/community/messages/:roomId` - 取得聊天訊息
- `POST /api/community/messages/:roomId` - 發送訊息

### 活動公告 API
- `GET /api/announcements` - 取得活動公告列表
- `GET /api/announcements/:id` - 取得活動詳情
- `GET /api/announcements/subscriptions` - 取得訂閱設定
- `PUT /api/announcements/subscriptions` - 更新訂閱設定

### 交通 API
- `GET /api/tdx/bus-stops` - 公車站點資訊
- `GET /api/tdx/bus-realtime` - 公車即時到站
- `GET /api/tdx/metro-timetable` - 捷運班次時刻表

詳細 API 文件請參考各 API 路由的程式碼註解。

## 🎨 設計特色

- **現代化 UI**：使用 Material-UI 設計系統，提供一致的用戶體驗
- **響應式設計**：適配不同螢幕尺寸
- **深色主題**：友善的視覺體驗
- **即時更新**：使用 Pusher 實現即時資料同步

## 📝 開發筆記

本專案使用以下開發規範：

- **TypeScript**：所有程式碼使用 TypeScript 確保型別安全
- **ESLint**：使用 ESLint 確保程式碼品質
- **組件化設計**：將功能拆分成可重用的組件
- **API Routes**：使用 Next.js API Routes 作為後端

## 📄 授權

本專案為學術用途開發。

## 👥 貢獻

歡迎提交 Issue 或 Pull Request！

## 📞 聯絡資訊

如有問題或建議，歡迎透過 Issue 聯繫。

---

**NTUGo** - 讓台大生活更便利 🚀
