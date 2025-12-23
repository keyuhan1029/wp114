# 快速開始指南：郵箱驗證功能

## 第一步：註冊 Resend（5 分鐘）

### 1.1 訪問並註冊

1. 打開瀏覽器，訪問：https://resend.com
2. 點擊 "Sign Up" 或 "Get Started"
3. 使用以下方式之一註冊：
   - GitHub 帳號（推薦，快速）
   - Google 帳號
   - 電子郵件註冊

### 1.2 獲取 API Key

1. 註冊成功後，進入 Dashboard
2. 點擊左側菜單的 "API Keys"
3. 點擊 "Create API Key"
4. 輸入名稱（如：NTUGo Development）
5. 選擇權限（選擇 "Sending access"）
6. 複製生成的 API Key（格式：`re_xxxxxxxxxxxx`）
   - ⚠️ **注意**：API Key 只顯示一次，請妥善保存

### 1.3 配置環境變數

在項目根目錄的 `.env.local` 文件中添加：

```env
# Resend API Key
RESEND_API_KEY=re_你的API_KEY

# 驗證碼配置
VERIFICATION_CODE_EXPIRY_MINUTES=10
VERIFICATION_CODE_MAX_ATTEMPTS=5
VERIFICATION_CODE_MAX_SENDS_PER_HOUR=5

# 應用 URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 1.4 安裝 Resend SDK

在項目根目錄執行：

```bash
cd NTUGo
npm install resend
```

## 第二步：驗證設置（可選）

### 2.1 測試郵件發送

創建一個測試腳本 `scripts/test-email.ts`：

```typescript
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

async function testEmail() {
  try {
    const { data, error } = await resend.emails.send({
      from: 'NTUGo <onboarding@resend.dev>', // 使用 Resend 提供的測試域名
      to: 'your-email@example.com', // 替換為您的測試郵箱
      subject: '測試郵件',
      html: '<p>這是一封測試郵件</p>',
    });

    if (error) {
      console.error('發送失敗:', error);
      return;
    }

    console.log('發送成功:', data);
  } catch (error) {
    console.error('錯誤:', error);
  }
}

testEmail();
```

運行測試：

```bash
npx tsx scripts/test-email.ts
```

### 2.2 檢查 Resend Dashboard

1. 在 Resend Dashboard 中點擊 "Emails"
2. 您應該能看到剛才發送的測試郵件
3. 查看發送狀態和統計

## 第三步：開發環境配置建議

### 3.1 開發環境變數示例

創建 `.env.local.example` 作為模板：

```env
# Resend (郵件服務)
RESEND_API_KEY=re_xxxxxxxxxxxx

# 驗證碼配置
VERIFICATION_CODE_EXPIRY_MINUTES=10
VERIFICATION_CODE_MAX_ATTEMPTS=5
VERIFICATION_CODE_MAX_SENDS_PER_HOUR=5

# 應用配置
NEXT_PUBLIC_APP_URL=http://localhost:3000

# MongoDB
MONGODB_URI=mongodb+srv://...

# 其他現有配置...
```

### 3.2 開發時的注意事項

1. **免費額度**：
   - 每月 3,000 封郵件
   - 開發階段通常足夠
   - 避免大量測試發送

2. **測試郵箱**：
   - 使用真實郵箱測試
   - 檢查垃圾郵件文件夾
   - 使用多個測試郵箱

3. **API Key 安全**：
   - 不要提交到 Git
   - 確保 `.env.local` 在 `.gitignore` 中
   - 生產環境使用環境變數或密鑰管理服務

## 第四步：開始實現功能

參考 `EMAIL_VERIFICATION_DESIGN.md` 和 `EMAIL_VERIFICATION_CHECKLIST.md` 開始實施。

### 4.1 優先順序

1. ✅ **註冊 Resend**（已完成）
2. ✅ **安裝依賴**（已完成）
3. ⏭️ **創建數據模型**（下一步）
4. ⏭️ **實現郵件發送服務**（下一步）
5. ⏭️ **實現 API 端點**（下一步）

## 常見問題

### Q1: Resend 免費額度用完怎麼辦？

**A:** 
- 開發階段：等待下個月重置（每月重置）
- 生產環境：升級到付費計劃（$20/月起，100,000 封/月）

### Q2: 可以不用真實郵箱測試嗎？

**A:** 
- Resend 提供測試模式，但建議使用真實郵箱測試
- 可以創建一個專門的測試郵箱帳號

### Q3: API Key 洩露了怎麼辦？

**A:**
- 立即在 Resend Dashboard 中刪除該 API Key
- 創建新的 API Key
- 更新所有使用該 Key 的環境

### Q4: 郵件進入垃圾郵件怎麼辦？

**A:**
- 生產環境需要配置自定義域名
- 設置 SPF、DKIM 記錄
- 使用 Resend 提供的域名驗證功能

---

**下一步：** 開始實現郵箱驗證功能，參考設計文檔和檢查清單。

