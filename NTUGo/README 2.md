# NTUGo

專為台大學生打造的整合式地圖服務平台，提供校園周邊美食、交通資訊（公車、YouBike、捷運）、校內設施查詢、個人行事曆等功能。

## 技術棧

- **Next.js 16** (App Router) - 全端框架
- **React 19** - 前端框架
- **Material UI (MUI) 7** - UI 組件庫
- **Google Maps API** - 地圖服務
- **MongoDB** - 資料庫
- **TypeScript** - 型別安全
- **Emotion** - CSS-in-JS 樣式處理

## 已完成功能

### 🗺️ 首頁地圖
- **互動式 Google 地圖**：以台大校園為中心
- **客製化圖標 (Pins)**：
  - 🍔 **美食**：校園周邊美食地點
  - 🚌 **公車站**：顯示公車站位置與即時到站資訊
  - 🚲 **YouBike**：YouBike 站點即時車輛數量
  - 🏫 **校園設施**：圖書館、體育館等校內設施
- **地圖樣式**：黑白灰階主題
- **InfoWindow**：點擊圖標顯示詳細資訊

### 🚌 公車資訊（TDX API）
- 即時公車到站時間
- 公車站點位置顯示
- 公車動態消息

### 🚲 YouBike 資訊
- 即時站點車輛數量
- 可借/可還車位資訊
- 站點位置地圖標記

### 📚 校園設施
- **總圖書館**：即時人數資訊
- **健身房**：即時使用人數

### 🔐 登入與認證
- Email/Password 註冊與登入
- Google OAuth 登入
- JWT Token 認證機制
- 個人資料編輯

### 📅 行事曆功能
- **台大官方行事曆**：自動從 NTU ICS 匯入學校行事曆
- **個人行事曆**：新增/編輯/刪除個人行程
- **匯入功能**：支援 .ics 檔案匯入（可從 NTU COOL 匯出）
- **匯出功能**：匯出行程為 .ics 檔案（可匯入 Google/Apple/Outlook）
- **月曆視圖**：完整月曆顯示，支援切換月份
- **學校行程開關**：可選擇是否顯示學校行事曆

### 📚 課表功能
- **多課表管理**：支援創建多個課表（本學期、下學期等）
- **15 個時間段**：第 0 節至第 10 節 + ABCD 晚間節次
- **多時段選擇**：一門課可選擇多個時段（如週一 1-2、週二 1-2）
- **視覺化時間選擇器**：彈出式小課表直覺選擇時間
- **課程資訊**：課程名稱、上課地點、教師姓名
- **黑白極簡設計**：深色系課程顏色，白色文字

### 🧭 側邊欄導覽
- 公車站點顯示切換
- YouBike 站點顯示切換
- NTU COOL 快速連結
- NTU Mail 快速連結

## 環境變數設定

在專案根目錄建立 `.env.local` 檔案：

```env
# Google Maps
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key

# MongoDB
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/ntugo

# JWT
JWT_SECRET=your_jwt_secret_key

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# TDX API (公車資訊)
TDX_CLIENT_ID=your_tdx_client_id
TDX_CLIENT_SECRET=your_tdx_client_secret

# NTU 行事曆
NTU_CALENDAR_ICS_URL=https://ppt.cc/fXxnLx
```

## 開始使用

### 前置需求

1. **Node.js** 20+ 與 npm
2. **MongoDB** 資料庫（可使用 MongoDB Atlas）
3. **Google Cloud Console** 設定：
   - Maps JavaScript API
   - OAuth 2.0 Client ID
4. **TDX 平台** API 金鑰（公車資訊）

### 安裝步驟

```bash
# 進入專案目錄
cd NTUGo

# 安裝依賴
npm install

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

## 專案結構

```
NTUGo/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── api/                      # API Routes
│   │   │   ├── auth/                 # 認證 API
│   │   │   │   ├── login/            # 登入
│   │   │   │   ├── register/         # 註冊
│   │   │   │   ├── google/           # Google OAuth
│   │   │   │   ├── me/               # 取得當前用戶
│   │   │   │   └── profile/          # 個人資料
│   │   │   ├── calendar/             # 行事曆 API
│   │   │   │   ├── events/           # NTU 官方行事曆
│   │   │   │   └── personal/         # 個人行事曆 CRUD
│   │   │   ├── schedule/             # 課表 API
│   │   │   │   ├── [id]/             # 單一課表與課程項目
│   │   │   │   └── items/            # 課程項目 CRUD
│   │   │   ├── gym/occupancy/        # 健身房人數
│   │   │   ├── library/info/         # 圖書館資訊
│   │   │   └── tdx/                  # TDX 公車 API
│   │   ├── calendar/                 # 行事曆頁面
│   │   ├── schedule/                 # 課表頁面
│   │   ├── login/                    # 登入頁面
│   │   ├── register/                 # 註冊頁面
│   │   ├── layout.tsx                # 根布局
│   │   └── page.tsx                  # 首頁
│   ├── components/
│   │   ├── Auth/                     # 認證相關組件
│   │   ├── Layout/                   # 布局組件
│   │   ├── Map/                      # 地圖相關組件
│   │   ├── Schedule/                 # 課表相關組件
│   │   │   ├── ScheduleGrid.tsx      # 課表網格
│   │   │   ├── ScheduleSidebar.tsx   # 課表列表側欄
│   │   │   └── CourseDialog.tsx      # 課程編輯對話框
│   │   └── ThemeRegistry/            # MUI 主題設定
│   ├── contexts/
│   │   └── MapContext.tsx            # 地圖狀態管理
│   ├── lib/
│   │   ├── calendar/                 # 行事曆邏輯
│   │   │   ├── CalendarEvent.ts      # 事件型別
│   │   │   ├── dataSource.ts         # 資料來源介面
│   │   │   ├── ics.ts                # ICS 生成工具
│   │   │   └── ntuOfficial.ts        # NTU 官方行事曆解析
│   │   ├── models/                   # MongoDB Models
│   │   │   ├── User.ts               # 用戶模型
│   │   │   ├── PersonalEvent.ts      # 個人行程模型
│   │   │   ├── Schedule.ts           # 課表模型
│   │   │   └── ScheduleItem.ts       # 課程項目模型
│   │   ├── jwt.ts                    # JWT 工具
│   │   └── mongodb.ts                # MongoDB 連線
│   ├── services/
│   │   ├── busApi.ts                 # 公車 API 服務
│   │   └── youbikeApi.ts             # YouBike API 服務
│   └── data/
│       └── mockData.ts               # 模擬數據
├── public/                           # 靜態資源
├── .env.local                        # 環境變數
├── package.json
├── tsconfig.json
└── next.config.ts
```

## API 端點

### 認證 API
| 方法 | 路徑 | 說明 |
|------|------|------|
| POST | `/api/auth/register` | 註冊新用戶 |
| POST | `/api/auth/login` | 登入 |
| POST | `/api/auth/logout` | 登出 |
| GET | `/api/auth/me` | 取得當前用戶資訊 |
| PUT | `/api/auth/profile` | 更新個人資料 |
| GET | `/api/auth/google` | Google OAuth 登入 |

### 行事曆 API
| 方法 | 路徑 | 說明 |
|------|------|------|
| GET | `/api/calendar/events` | 取得 NTU 官方行事曆 |
| GET | `/api/calendar/personal` | 取得個人行程 |
| POST | `/api/calendar/personal` | 新增個人行程 |
| PUT | `/api/calendar/personal/:id` | 更新個人行程 |
| DELETE | `/api/calendar/personal/:id` | 刪除個人行程 |
| POST | `/api/calendar/personal/from-ntu` | 從 NTU 行事曆加入個人行程 |
| GET | `/api/calendar/personal/:id/ics` | 匯出行程為 .ics |

### 課表 API
| 方法 | 路徑 | 說明 |
|------|------|------|
| GET | `/api/schedule` | 取得用戶所有課表 |
| POST | `/api/schedule` | 新增課表 |
| GET | `/api/schedule/:id` | 取得單一課表（含課程項目） |
| PUT | `/api/schedule/:id` | 更新課表名稱 |
| DELETE | `/api/schedule/:id` | 刪除課表 |
| GET | `/api/schedule/:id/items` | 取得課表的所有課程項目 |
| POST | `/api/schedule/:id/items` | 新增課程項目 |
| PUT | `/api/schedule/items/:itemId` | 更新課程項目 |
| DELETE | `/api/schedule/items/:itemId` | 刪除課程項目 |

### 設施 API
| 方法 | 路徑 | 說明 |
|------|------|------|
| GET | `/api/library/info` | 圖書館即時資訊 |
| GET | `/api/gym/occupancy` | 健身房使用人數 |

### 交通 API
| 方法 | 路徑 | 說明 |
|------|------|------|
| GET | `/api/tdx/bus-stops` | 公車站點資訊 |
| GET | `/api/tdx/bus-realtime` | 公車即時到站 |
| GET | `/api/tdx/bus-news` | 公車動態消息 |

## 開發計劃

- [x] 整合台北市公車 API (TDX)
- [x] 整合 YouBike API
- [x] 實作個人行事曆
- [x] 整合校園設施即時資訊（圖書館、健身房）
- [x] 實作登入與 OAuth
- [x] 實作課表功能
- [ ] 整合捷運即時資訊
- [ ] 實作論壇功能
- [ ] 實作通知系統
- [ ] 手機版 RWD 優化

## 授權

本專案為學術用途開發。
