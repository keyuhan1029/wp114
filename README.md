# 114-1 Web Programming Final  
  
![NTUGo Logo](NTUGo/public/logo.svg)  
  
## (Group 32) NTUGo - Your Campus Life. We Make It GO   
組員：柯宇翰、蔣依倢、鄒馥謙  
  
## [影片連結]  
  
  
## [服務簡介]  
你是否曾為了通勤，在公車、捷運與 YouBike 的多個 App 間疲於切換？或在開學之際，為了約場午餐而逐一詢問好友的課表與動向？甚至因一時疏忽，錯過了台大行事曆上關鍵的生涯發展活動？  
**這些校園生活的瑣碎痛點，NTUGo 為你一併解決。**  
我們將碎片化的資訊深度整合，打造出專為台大人設計的一站式平台：  
* 即時交通導航：整合公車、捷運與 YouBike 動態，一鍵掌握最佳路徑。  
* 智慧社群地圖：同步好友課表與位置，讓約見面不再需要反覆確認，直覺更高效。  
* 自動化行事曆：串聯官方公告與活動提醒，確保你精準掌握每一個重要時刻。  
* 腳踏車紀錄點：紀錄每次腳踏車停的位置，不再為了腳踏車消失而煩惱  
不再被繁瑣的軟體束縛，NTUGo 將雜亂的校園資訊轉化為直覺的導引。現在起，把時間留給更重要的事情，讓 NTUGo 成為你最可靠的校園助手。 

https://ntu-go.com
## [使用/操作方式]  
**使用者端**  
* 直接造訪網址即可開始：透過瀏覽器即可進入專為台大人設計的一站式校園服務平台。  
* 四大功能模組切換：  
    * 校園地圖 (Map)：切換公車、YouBike 與捷運即時圖層，點擊建築物查看即時人潮，或長按記錄個人腳踏車位置。  
    * 智慧課表 (Schedule)：手動編輯課程，支援視覺化排課與一鍵匯出課表圖片。  
    * 整合行事曆 (Calendar)：自動同步台大官方重要時程，並與個人行程結合，支援 ICS 格式進行跨平台匯入匯出。  
    * 即時社群 (Community)：與好友即時聊天與分享課表，並共享彼此的位置與「上課中/空閒」狀態，讓校園社交更直覺。  
* 系統自動監測狀態：後端實時更新交通到站資訊、設施開放狀態與好友訊息通知，確保資訊不漏接。  
**伺服器端**  
* 全端 Serverless 架構：本專案採用 Next.js 15 構建，前端介面與 API Routes 深度整合，並部署於 Vercel 雲端平台。  
* 後端支撐與即時通訊：使用 MongoDB 儲存用戶數據與課表資訊，並透過 Pusher 支撐毫秒級的即時訊息與狀態同步。  
* 校園資訊自動化：伺服器端自動串接交通部 TDX API 與台大官方公告系統，透過 Scrapers 定期抓取並更新校園設施與空教室數據。  
* 多方服務整合：結合 Cloudinary 進行檔案儲存與 Resend 發送系統通知郵件，確保整體服務的穩定與完整性。  
  
## [GitHub Link]  
https://github.com/keyuhan1029/NTUGo  
  
## [其他說明]  
本專案整合多項政府與校園公開資源。以下是本專案使用的主要公開資源說明：  
**政府公開資源**  
1. 交通部 TDX 運輸資料流通服務平台 (MOTC TDX)  
    * 公車資訊：整合全台公車即時到站資料、路線圖與站牌位置，用於提供校內與周邊公車動態。  
    * 捷運資訊：取得台北捷運各站點出口資訊、首末班車時刻表及即時列車位置。  
2. 台北市政府公開資料平台 (Taipei City Open Data)  
    * YouBike 2.0 即時資訊：串接台北市公共自行車即時資料 API，提供校內各站點的可借車輛與可還車位數。  
**校園與機構公開資源 **  
1. 國立台灣大學官方行事曆  
    * 透過學校提供的 ICS 標準格式連結，自動同步教務處之重要學期時程（如選課、期中考週、放假日）。  
2. 國立台灣大學活動公告系統  
    * 自動抓取台大各處室（如學務處、教務處、國際事務處）發布的公開活動資訊，並進行分類標記供使用者訂閱。  
3. 台大教室列表  
    * 整合校方公開之教學大樓編號與教室分布資料，方便使用者快速查找課表地點。  
  
## [使用之第三方套件、框架、程式碼]  
**核心框架與開發語言**  
1. Next.js 15：作為全端開發架構，支撐 App Router 與 Server Actions 運作。  
2. React 19：用於構建宣告式、組件化的前端使用者介面。  
3. TypeScript：強化程式碼型別檢查，確保大型專案開發的穩定性。  
**外部服務與數據 API**  
1. Google Maps API：提供校園地圖底圖、位置標記與地理編碼服務。  
2. TDX 運輸資料平台：獲取交通部即時公車動態、捷運時刻表與路網資訊。  
3. Pusher Channels：實現好友間的即時聊天、位置更新與毫秒級狀態同步。  
4. Cloudinary：託管使用者上傳的頭像、腳踏車停車照與個人文檔。  
5. Resend：發送系統關鍵通知信與註冊驗證碼郵件。  
**關鍵套件與技術模組**  
1. Material UI (MUI)：核心 UI 組件庫，確保系統具備一致的現代化設計風格。  
2. MongoDB：儲存非結構化數據，如用戶設定、課表內容與聊天記錄。  
3. NextAuth.js：整合 Google OAuth 與自定義帳號系統的安全驗證框架。  
4. @dnd-kit：提供智慧課表中流暢的課程區塊拖拉互動體驗。  
5. Cheerio：用於後端爬蟲，解析並抓取台大官網最新的活動公告。  
6. html2canvas：支援使用者將排好的課表直接轉存為圖片分享。  
7. JWT (JSON Web Token)：用於 API 請求的身份驗證，確保資料傳輸的安全性。  
  
## [專題製作心得]  
****柯宇翰****  
****蔣依倢****  
****鄒馥謙****  
這學期修老師的課真的被LLM驚嘆到了，很想不到原先以為自己根本做不出來的東西，居然能夠花一個下午就做完了。但在享受便利的同時，我好像也忘記了鑽研這些技術棧背後的原理，可能時間也不夠多😅，之後還需要慢慢學習。不能只是讓自己變成空有想法卻不懂得實踐方法的人，雖然Cursor十分方便可以幫我們實踐，但是實踐的方法邏輯可能才是軟體工程師真正需要學習的課題。  
期末作業我負責了社群、行事曆與課表，開發的時候Cursor同時推出了plan模式真的很厲害，LLM現在能夠自己建立前端框架、API規則一步一步實現我們要求的內容，甚至可以推薦我下次能夠增加什麼功能。像是在做社群通訊功能時，做完之後他會直接推薦我要不要增加上線狀態、已讀狀態甚至上傳檔案與圖片，我連思考都不需要就幫我規劃好了，也讓我自己反思如果沒有agent我是不是就再也沒有產出了呢？  
感謝這堂課帶給我的各種知識，也讓我發現自己的不足，很開心可以跟組員們一起合作，謝謝教授與助教帶給我們這麼精彩的課程。  


—

## 🚀 本地運行指南

### 前置需求

- **Node.js** 20.x 或更高版本（建議使用 [nvm](https://github.com/nvm-sh/nvm) 管理版本）
- **npm** 或 **yarn** 套件管理器
- **MongoDB** 資料庫（建議使用 [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) 免費版）
- 以下服務的 API 金鑰：
  - [Google Cloud Console](https://console.cloud.google.com/)（Maps API、OAuth）
  - [TDX 平台](https://tdx.transportdata.tw/)（交通資訊）
  - [Pusher](https://pusher.com/)（即時通訊）
  - [Cloudinary](https://cloudinary.com/)（檔案儲存）
  - [Resend](https://resend.com/)（Email 發送）

### 安裝步驟

1. **複製專案**
   ```bash
   git clone https://github.com/keyuhan1029/wp114.git
   cd wp114/NTUGo
   ```

2. **安裝依賴**
   ```bash
   npm install
   ```

3. **設定環境變數**
   
   在專案根目錄建立 `.env.local` 檔案，並填入以下環境變數：
   
   ```env
   # MongoDB
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/ntugo
   
   # Google OAuth
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   
   # Google Maps API
   NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
   
   # Pusher
   NEXT_PUBLIC_PUSHER_APP_KEY=your_pusher_app_key
   PUSHER_APP_ID=your_pusher_app_id
   PUSHER_SECRET=your_pusher_secret
   PUSHER_CLUSTER=your_pusher_cluster
   
   # Cloudinary
   CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
   CLOUDINARY_API_KEY=your_cloudinary_api_key
   CLOUDINARY_API_SECRET=your_cloudinary_api_secret
   
   # Resend (Email)
   RESEND_API_KEY=your_resend_api_key
   RESEND_FROM_EMAIL=your_verified_email@yourdomain.com
   
   # TDX API
   TDX_CLIENT_ID=your_tdx_client_id
   TDX_CLIENT_SECRET=your_tdx_client_secret
   
   # NTU Calendar
   NTU_CALENDAR_ICS_URL=https://ppt.cc/fXxnLx
   
   # JWT Secret
   JWT_SECRET=your_jwt_secret_key
   
   # App URL (開發環境)
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   
   # Cron Job Secret (可選，用於保護 cron job 端點)
   CRON_SECRET=your_cron_secret
   
   # Bus Reminder API Key (可選，用於保護公車提醒 API)
   BUS_REMINDER_API_KEY=your_bus_reminder_api_key
   ```

4. **啟動開發伺服器**
   ```bash
   npm run dev
   ```

5. **開啟瀏覽器**
   
   訪問 [http://localhost:3000](http://localhost:3000)

### 其他常用指令

```bash
# 建置生產版本
npm run build

# 啟動生產伺服器（需要先 build）
npm start

# 執行 ESLint 檢查
npm run lint
```

### 注意事項

- 確保所有環境變數都已正確設定，否則部分功能可能無法正常運作
- MongoDB 連線字串請使用 MongoDB Atlas 提供的連接字串
- Google OAuth 的 Redirect URI 需要設定為 `http://localhost:3000/api/auth/google/callback`
- 開發環境下，Resend 可能只能發送到已驗證的郵箱地址

## 📄 授權

本專案為學術用途開發。

## 👥 貢獻

歡迎提交 Issue 或 Pull Request！

## 📞 聯絡資訊

如有問題或建議，歡迎透過 Issue 聯繫。

---

**NTUGo** - 讓台大生活更便利 🚀