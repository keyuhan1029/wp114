# NTUGo

專為台大學生打造的整合式地圖服務平台，提供校園周邊美食、交通資訊（公車、YouBike、捷運）以及校內設施查詢功能。

## 技術棧

- **Next.js 16** (App Router) - 全端框架
- **Material UI (MUI) 7** - UI 組件庫
- **Google Maps API** - 地圖服務
- **TypeScript** - 型別安全
- **Emotion** - CSS-in-JS 樣式處理

## 功能特色（前端原型）

### 首頁地圖
- **互動式 Google 地圖**：以台大校園為中心
- **客製化圖標 (Pins)**：
  - 🍔 **美食**：校園周邊美食地點
  - 🚌 **公車站**：顯示公車站位置（保留 Google 原生公車站圖示）
  - 🚲 **YouBike**：YouBike 站點資訊
  - 🚇 **捷運站**：捷運站位置與時間資訊
  - 🏫 **校園設施**：圖書館、體育館等校內設施
- **地圖樣式**：黑白灰階主題，符合設計需求
- **InfoWindow**：點擊圖標顯示詳細資訊（目前為模擬數據）

### 側邊欄 (Sidebar)
- **黑白風格設計**：深黑灰背景配白色圖標與文字
- **導覽功能**：
  - 目錄（展開/收合側邊欄）
  - 公車（預留功能）
  - YouBike（預留功能）
  - 捷運（預留功能）
  - 論壇（預留功能）

### 右上角工具列
- **個人頭像**：連結至個人主頁（預留功能）
- **行事曆圖示**：個人行事曆功能（預留功能）

### 右側資訊卡片
- **活動列表**：顯示校園活動資訊
- **論壇熱門**：論壇熱門話題
- **交流版最新消息**：最新交流資訊
- **位置**：貼齊螢幕底部

## 開始使用

### 前置需求

1. **Node.js** 18+ 與 npm
2. **Google Maps API Key**：
   - 前往 [Google Cloud Console](https://console.cloud.google.com/)
   - 建立專案並啟用 "Maps JavaScript API"
   - 取得 API Key

### 安裝步驟

1. **進入專案目錄**：
   ```bash
   cd NTUGo
   ```

2. **安裝依賴**：
   ```bash
   npm install
   ```

3. **設定環境變數**：
   在專案根目錄 (`NTUGo/`) 建立 `.env.local` 檔案：
   ```env
   NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=你的_API_Key_這裡
   ```

4. **啟動開發伺服器**：
   ```bash
   npm run dev
   ```

5. **開啟瀏覽器**：
   訪問 [http://localhost:3000](http://localhost:3000)

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
│   ├── app/                    # Next.js App Router
│   │   ├── layout.tsx         # 根布局（整合 ThemeRegistry）
│   │   ├── page.tsx           # 首頁
│   │   └── globals.css        # 全域樣式
│   ├── components/
│   │   ├── Layout/            # 布局組件
│   │   │   ├── MainLayout.tsx
│   │   │   ├── Sidebar.tsx    # 側邊欄（黑白風格）
│   │   │   └── TopBar.tsx      # 右上角工具列
│   │   ├── Map/
│   │   │   └── MapComponent.tsx # Google Maps 地圖組件
│   │   └── ThemeRegistry/     # MUI 主題設定
│   │       ├── ThemeRegistry.tsx
│   │       ├── EmotionCache.tsx
│   │       └── theme.ts       # 黑白灰主題配置
│   └── data/
│       └── mockData.ts        # 模擬數據（地點座標等）
├── public/                     # 靜態資源
├── .env.local                 # 環境變數（需自行建立）
├── package.json
├── tsconfig.json
└── next.config.ts
```

## 設計特色

- **黑白灰階主題**：整體採用黑白灰色調，符合設計需求
- **地圖樣式**：
  - 全域灰階處理
  - 隱藏外部建築物（僅保留道路、水域、公車站）
  - 禁用 Google 原生 POI 圖標
  - 45 度傾斜角度（3D 建築效果）

## 注意事項

- 目前所有數據（公車時間、YouBike 數量、圖書館人數等）皆為模擬數據，位於 `src/data/mockData.ts`
- 後端 API 整合功能尚未實作（公車、YouBike、捷運、論壇等）
- Google Maps API 有使用限制，請注意 API Key 的配額與計費設定

## 開發計劃

- [ ] 整合台北市公車 API
- [ ] 整合 YouBike API
- [ ] 整合捷運即時資訊
- [ ] 實作論壇功能
- [ ] 實作個人主頁
- [ ] 實作個人行事曆
- [ ] 整合校園設施即時資訊（圖書館人數、健身房人數等）

## 授權

本專案為學術用途開發。
