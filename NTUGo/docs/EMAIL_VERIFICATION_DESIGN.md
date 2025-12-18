# 學校身份驗證與郵箱驗證碼系統設計文檔

## 一、需求概述

### 1.1 業務需求
- 只有使用學校郵箱（NTU 郵箱）註冊的用戶才能使用某些特定功能
- 在註冊時向用戶的學校郵箱發送驗證碼
- 用戶需要輸入驗證碼完成郵箱驗證才能完成註冊
- 已註冊但未驗證的用戶無法訪問受保護的功能

### 1.2 功能範圍
**受保護的功能（需要驗證的學校身份）：**
- 社群功能（好友、聊天、課表分享等）
- 校園設施相關功能
- 其他需要驗證學校身份的服務

**開放的功能（無需驗證）：**
- 瀏覽公開資訊（如校園地圖、公告等）
- 查看課表範例等公開內容

## 二、技術架構設計

### 2.1 系統組件

```
┌─────────────┐
│   前端 UI   │
│ (註冊/驗證) │
└──────┬──────┘
       │
       ▼
┌─────────────────────┐
│   API Routes        │
│  - 發送驗證碼        │
│  - 驗證驗證碼        │
│  - 檢查驗證狀態      │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│  Service Layer      │
│  - Email Service    │
│  - Code Generator   │
│  - Validator        │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│   Database          │
│  - Users            │
│  - EmailVerifications│
└─────────────────────┘
```

### 2.2 數據庫設計

#### 2.2.1 User 模型擴展

需要在現有的 `User` 模型中添加以下字段：

```typescript
export interface User {
  // ... 現有字段
  emailVerified: boolean;        // 郵箱是否已驗證
  emailVerifiedAt?: Date;        // 郵箱驗證時間
  isSchoolEmail: boolean;        // 是否為學校郵箱（通過域名判斷）
}
```

#### 2.2.2 EmailVerification 模型（新建）

創建新的集合來存儲驗證碼：

```typescript
export interface EmailVerification {
  _id?: string | ObjectId;
  email: string;                 // 待驗證的郵箱
  code: string;                  // 6位數字驗證碼
  expiresAt: Date;               // 驗證碼過期時間（通常 10-15 分鐘）
  attempts: number;              // 驗證嘗試次數（防止暴力破解）
  verified: boolean;             // 是否已驗證
  verifiedAt?: Date;             // 驗證時間
  createdAt: Date;               // 創建時間
}
```

**索引設計：**
- `email` + `verified: false` + `expiresAt > now()` - 用於查詢有效的驗證碼
- `email` - 用於查詢某郵箱的所有驗證記錄
- `expiresAt` - 用於定期清理過期驗證碼

## 三、技術實現方案

### 3.1 郵件發送服務

#### 3.1.1 郵件服務提供商選擇

**選項 1：SMTP 服務（推薦用於生產環境）**
- **Nodemailer** + **Gmail SMTP** 或 **SendGrid**
- 優點：可靠、功能完整、可追蹤
- 缺點：需要配置 SMTP 憑證

**選項 2：第三方 API 服務**
- **SendGrid** / **Mailgun** / **Amazon SES** / **Resend**
- 優點：易於集成、有免費額度、提供統計
- 缺點：可能產生費用

**推薦方案：使用 Resend 或 SendGrid**
- Resend：開發者友好，免費額度充足（每月 3000 封）
- SendGrid：功能強大，免費額度 100 封/天

#### 3.1.2 依賴包安裝

```bash
npm install nodemailer
npm install @types/nodemailer --save-dev

# 如果使用 Resend
npm install resend

# 如果使用 SendGrid
npm install @sendgrid/mail
```

### 3.2 驗證碼生成

```typescript
// 生成 6 位數字驗證碼
function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}
```

**安全考慮：**
- 使用加密安全的隨機數生成器
- 驗證碼有效期：10-15 分鐘
- 限制每郵箱每小時發送次數（防濫用）
- 限制驗證嘗試次數（防暴力破解）

### 3.3 學校郵箱驗證

#### 3.3.1 NTU 郵箱域名列表

```typescript
const NTU_EMAIL_DOMAINS = [
  'ntu.edu.tw',        // 一般學生/教職員
  'moeaidb.gov.tw',    // 部分行政單位
  // 可以根據需要擴展
];
```

#### 3.3.2 郵箱域名驗證函數

```typescript
function isNTUEmail(email: string): boolean {
  const domain = email.split('@')[1]?.toLowerCase();
  return NTU_EMAIL_DOMAINS.includes(domain || '');
}
```

### 3.4 API 端點設計

#### 3.4.1 發送驗證碼 API

**POST** `/api/auth/verify-email/send`

**請求體：**
```json
{
  "email": "user@ntu.edu.tw"
}
```

**響應：**
```json
{
  "success": true,
  "message": "驗證碼已發送",
  "expiresIn": 600  // 秒數
}
```

**業務邏輯：**
1. 驗證郵箱格式
2. 檢查是否為 NTU 郵箱
3. 檢查該郵箱是否已註冊（如果是註冊流程）
4. 檢查發送頻率限制（每郵箱每小時最多 3-5 次）
5. 生成驗證碼並存儲到數據庫
6. 發送郵件
7. 返回成功響應

#### 3.4.2 驗證驗證碼 API

**POST** `/api/auth/verify-email/verify`

**請求體：**
```json
{
  "email": "user@ntu.edu.tw",
  "code": "123456"
}
```

**響應：**
```json
{
  "success": true,
  "message": "驗證成功",
  "verified": true
}
```

**業務邏輯：**
1. 查找有效的驗證碼（未驗證、未過期）
2. 檢查嘗試次數（最多 5 次）
3. 驗證碼匹配檢查（大小寫不敏感）
4. 標記為已驗證
5. 更新用戶的 `emailVerified` 狀態
6. 返回驗證結果

#### 3.4.3 檢查驗證狀態 API

**GET** `/api/auth/verify-email/status?email=user@ntu.edu.tw`

**響應：**
```json
{
  "verified": true,
  "email": "user@ntu.edu.tw"
}
```

### 3.5 註冊流程改造

#### 3.5.1 新的註冊流程

```
用戶輸入郵箱和密碼
    ↓
檢查是否為 NTU 郵箱
    ↓
發送驗證碼到郵箱
    ↓
用戶輸入驗證碼
    ↓
驗證驗證碼
    ↓
創建用戶帳號（emailVerified = true）
    ↓
完成註冊
```

#### 3.5.2 註冊 API 修改

**POST** `/api/auth/register`

**修改後的請求體：**
```json
{
  "email": "user@ntu.edu.tw",
  "password": "password123",
  "name": "用戶名稱",
  "verificationCode": "123456"  // 新增：驗證碼
}
```

**業務邏輯調整：**
1. 驗證郵箱格式和 NTU 域名
2. 驗證驗證碼（調用驗證 API）
3. 只有驗證碼正確才允許註冊
4. 創建用戶時設置 `emailVerified = true`

### 3.6 中間件設計

創建中間件來保護需要學校身份驗證的路由：

```typescript
// src/middleware/requireSchoolVerification.ts
export async function requireSchoolVerification(request: NextRequest) {
  const userId = await getAuthUserId(request);
  if (!userId) {
    return NextResponse.json({ message: '未登入' }, { status: 401 });
  }

  const user = await UserModel.findById(userId);
  if (!user) {
    return NextResponse.json({ message: '用戶不存在' }, { status: 404 });
  }

  if (!user.emailVerified || !user.isSchoolEmail) {
    return NextResponse.json(
      { 
        message: '需要學校郵箱驗證才能使用此功能',
        requiresVerification: true 
      }, 
      { status: 403 }
    );
  }

  return null; // 通過驗證
}
```

## 四、郵件模板設計

### 4.1 驗證碼郵件模板

**主題：** `[NTUGo] 您的驗證碼是：{code}`

**內容（HTML）：**
```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .code { font-size: 32px; font-weight: bold; color: #0F4C75; 
            text-align: center; padding: 20px; background: #f5f7fa; 
            border-radius: 8px; margin: 20px 0; }
    .footer { margin-top: 30px; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <h2>歡迎使用 NTUGo！</h2>
    <p>您的驗證碼是：</p>
    <div class="code">{CODE}</div>
    <p>此驗證碼將在 10 分鐘後失效。</p>
    <p>如果您沒有申請此驗證碼，請忽略此郵件。</p>
    <div class="footer">
      <p>此郵件由 NTUGo 系統自動發送，請勿回覆。</p>
    </div>
  </div>
</body>
</html>
```

## 五、安全考量

### 5.1 防止濫用措施

1. **發送頻率限制**
   - 每個郵箱每小時最多發送 3-5 次
   - 使用 Redis 或內存緩存記錄發送時間

2. **驗證嘗試限制**
   - 每個驗證碼最多嘗試 5 次
   - 超過限制後需要重新發送

3. **驗證碼過期**
   - 驗證碼有效期 10-15 分鐘
   - 過期後自動失效

4. **IP 限制（可選）**
   - 記錄發送驗證碼的 IP
   - 同一 IP 每小時限制發送次數

### 5.2 數據隱私

- 驗證碼使用後立即標記為已驗證，不可重用
- 定期清理過期的驗證碼記錄（保留 24 小時用於審計）

### 5.3 錯誤處理

- 不要洩露郵箱是否存在（防止郵箱枚舉攻擊）
- 統一的錯誤響應格式
- 記錄異常情況以便監控

## 六、環境變數配置

需要在 `.env.local` 中添加：

```env
# 郵件服務配置（以 Resend 為例）
RESEND_API_KEY=re_xxxxx

# 或者使用 SMTP
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# 驗證碼配置
VERIFICATION_CODE_EXPIRY_MINUTES=10
VERIFICATION_CODE_MAX_ATTEMPTS=5
VERIFICATION_CODE_MAX_SENDS_PER_HOUR=5

# 應用 URL（用於郵件中的連結）
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## 七、實施步驟

### 階段 1：基礎設施設置
1. ✅ 安裝必要的 npm 包
2. ✅ 配置郵件服務（選擇 Resend 或 SendGrid）
3. ✅ 創建 EmailVerification 模型
4. ✅ 擴展 User 模型

### 階段 2：核心功能開發
1. ✅ 實現郵箱域名驗證邏輯
2. ✅ 實現驗證碼生成和存儲
3. ✅ 實現郵件發送服務
4. ✅ 實現發送驗證碼 API
5. ✅ 實現驗證驗證碼 API

### 階段 3：註冊流程整合
1. ✅ 修改註冊 API，整合驗證碼驗證
2. ✅ 更新前端註冊頁面，添加驗證碼輸入
3. ✅ 實現前端驗證碼發送和驗證邏輯

### 階段 4：權限控制
1. ✅ 創建中間件檢查學校身份驗證
2. ✅ 在需要驗證的路由上應用中間件
3. ✅ 前端添加未驗證用戶的提示和引導

### 階段 5：測試和優化
1. ✅ 單元測試
2. ✅ 集成測試
3. ✅ 性能優化（緩存、批量清理等）
4. ✅ 安全性測試

## 八、潛在問題和解決方案

### 8.1 郵件發送失敗
- **問題：** 郵件服務商 API 限制或故障
- **解決：** 
  - 實現重試機制
  - 使用備用郵件服務
  - 記錄失敗日誌並通知管理員

### 8.2 驗證碼被攔截
- **問題：** 用戶收不到驗證碼（進入垃圾郵件）
- **解決：**
  - 使用專業郵件服務提高送達率
  - 配置 SPF/DKIM 記錄
  - 提供「重新發送」功能

### 8.3 郵箱域名變更
- **問題：** NTU 可能新增或變更郵箱域名
- **解決：**
  - 將域名列表配置化（環境變數或數據庫）
  - 提供管理後台更新域名列表

## 九、後續優化建議

1. **驗證碼類型擴展**
   - 支持數字驗證碼
   - 支持字母數字混合（更安全）

2. **郵件模板多樣化**
   - 支持多語言
   - 自定義模板

3. **統計和監控**
   - 發送成功率統計
   - 驗證成功率統計
   - 異常郵箱監控

4. **用戶體驗優化**
   - 驗證碼自動填充（某些瀏覽器支持）
   - 倒計時顯示
   - 清晰的錯誤提示

## 十、參考資源

- [Nodemailer 文檔](https://nodemailer.com/about/)
- [Resend 文檔](https://resend.com/docs)
- [SendGrid 文檔](https://docs.sendgrid.com/)
- [Next.js API Routes](https://nextjs.org/docs/api-routes/introduction)
- [MongoDB 索引最佳實踐](https://www.mongodb.com/docs/manual/indexes/)

---

**文檔版本：** 1.0  
**創建日期：** 2024-12-14  
**最後更新：** 2024-12-14

