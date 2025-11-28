# 認證系統設定指南

## 環境變數設定

請在專案根目錄創建 `.env.local` 文件，並設定以下環境變數：

```env
# MongoDB Atlas 連接字串
# 格式: mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<database>?retryWrites=true&w=majority
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/ntugo?retryWrites=true&w=majority

# JWT 密鑰（請使用強隨機字串）
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Google OAuth 設定
# 前往 https://console.cloud.google.com/apis/credentials 創建 OAuth 2.0 客戶端 ID
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret

# 應用程式 URL（用於 OAuth 回調）
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## MongoDB Atlas 設定

1. 前往 [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. 創建一個免費的集群
3. 創建資料庫用戶
4. 設定網路訪問（允許所有 IP 或特定 IP）
5. 獲取連接字串並設定到 `MONGODB_URI`

## Google OAuth 設定

1. 前往 [Google Cloud Console](https://console.cloud.google.com/)
2. 創建新專案或選擇現有專案
3. 啟用 Google+ API
4. 前往「憑證」頁面
5. 點擊「建立憑證」>「OAuth 客戶端 ID」
6. 選擇「Web 應用程式」
7. 設定授權重新導向 URI：
   - 開發環境: `http://localhost:3000/api/auth/google/callback`
   - 生產環境: `https://yourdomain.com/api/auth/google/callback`
8. 複製「用戶端 ID」和「用戶端密鑰」到環境變數

## API 端點

### 註冊
- **POST** `/api/auth/register`
- Body: `{ email, password, name? }`
- 返回: `{ token, user }`

### 登入
- **POST** `/api/auth/login`
- Body: `{ email, password }`
- 返回: `{ token, user }`

### Google OAuth
- **GET** `/api/auth/google` - 開始 OAuth 流程
- **GET** `/api/auth/google/callback` - OAuth 回調處理

### 獲取當前用戶
- **GET** `/api/auth/me`
- Headers: `Authorization: Bearer <token>`
- 返回: `{ user }`

## 使用方式

### 前端登入範例

```typescript
// 登入
const response = await fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password }),
});
const { token } = await response.json();
localStorage.setItem('token', token);

// 獲取用戶資訊
const userResponse = await fetch('/api/auth/me', {
  headers: { 'Authorization': `Bearer ${token}` },
});
const { user } = await userResponse.json();
```

## 安全注意事項

1. **JWT_SECRET**: 請使用強隨機字串，建議至少 32 字元
2. **MongoDB**: 確保資料庫用戶只有必要的權限
3. **HTTPS**: 生產環境請使用 HTTPS
4. **Token 過期**: JWT token 預設有效期為 7 天
5. **密碼**: 使用 bcrypt 加密，salt rounds 為 10

