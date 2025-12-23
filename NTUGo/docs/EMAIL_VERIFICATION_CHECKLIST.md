# 郵箱驗證功能實施檢查清單

## 前置準備

### 1. 郵件服務選擇和配置

- [ ] **選擇郵件服務提供商**
  - [ ] Resend（推薦：免費額度充足，易於使用）
  - [ ] SendGrid（功能強大，免費額度 100 封/天）
  - [ ] 其他（SMTP、Mailgun、Amazon SES 等）

- [ ] **註冊郵件服務帳號**
  - [ ] 創建帳號
  - [ ] 獲取 API Key
  - [ ] 配置發送域名（生產環境需要）
  - [ ] 配置 SPF/DKIM 記錄（提高送達率）

- [ ] **環境變數配置**
  ```env
  # 選擇一種郵件服務
  # Resend
  RESEND_API_KEY=re_xxxxx
  
  # 或 SendGrid
  SENDGRID_API_KEY=SG.xxxxx
  
  # 或 SMTP
  SMTP_HOST=smtp.gmail.com
  SMTP_PORT=587
  SMTP_USER=your-email@gmail.com
  SMTP_PASS=your-app-password
  
  # 驗證碼配置
  VERIFICATION_CODE_EXPIRY_MINUTES=10
  VERIFICATION_CODE_MAX_ATTEMPTS=5
  VERIFICATION_CODE_MAX_SENDS_PER_HOUR=5
  ```

## 數據庫設計

### 2. User 模型擴展

- [ ] 在 `src/lib/models/User.ts` 中添加字段：
  ```typescript
  emailVerified: boolean;        // 郵箱是否已驗證
  emailVerifiedAt?: Date;        // 郵箱驗證時間
  isSchoolEmail: boolean;        // 是否為學校郵箱
  ```

- [ ] 添加相關方法：
  - [ ] `updateEmailVerificationStatus()`
  - [ ] `checkSchoolEmail()`

### 3. EmailVerification 模型創建

- [ ] 創建 `src/lib/models/EmailVerification.ts`
- [ ] 定義接口和模型類
- [ ] 實現方法：
  - [ ] `create()` - 創建驗證碼記錄
  - [ ] `findValidCode()` - 查找有效驗證碼
  - [ ] `verify()` - 驗證驗證碼
  - [ ] `incrementAttempts()` - 增加嘗試次數
  - [ ] `cleanupExpired()` - 清理過期記錄

- [ ] 創建數據庫索引：
  - [ ] `email` + `verified: false` + `expiresAt`
  - [ ] `email`
  - [ ] `expiresAt`（用於定期清理）

## 核心功能開發

### 4. 郵件服務層

- [ ] 創建 `src/lib/services/email.ts`
- [ ] 實現郵件發送函數：
  - [ ] `sendVerificationCode(email, code)`
  - [ ] 使用選擇的郵件服務（Resend/SendGrid/SMTP）
  - [ ] 使用 HTML 模板

- [ ] 創建郵件模板：
  - [ ] `src/lib/templates/verification-email.tsx` 或 `.html`
  - [ ] 設計美觀的 HTML 郵件模板

### 5. 驗證碼工具

- [ ] 創建 `src/lib/utils/verification.ts`
- [ ] 實現函數：
  - [ ] `generateVerificationCode()` - 生成 6 位數字碼
  - [ ] `isNTUEmail(email)` - 檢查是否為 NTU 郵箱
  - [ ] 定義 NTU 郵箱域名列表

### 6. API 端點實現

#### 6.1 發送驗證碼 API

- [ ] 創建 `src/app/api/auth/verify-email/send/route.ts`
- [ ] 實現邏輯：
  - [ ] 驗證郵箱格式
  - [ ] 檢查是否為 NTU 郵箱
  - [ ] 檢查發送頻率限制
  - [ ] 生成驗證碼
  - [ ] 存儲到數據庫
  - [ ] 發送郵件
  - [ ] 返回響應

#### 6.2 驗證驗證碼 API

- [ ] 創建 `src/app/api/auth/verify-email/verify/route.ts`
- [ ] 實現邏輯：
  - [ ] 查找有效驗證碼
  - [ ] 檢查嘗試次數
  - [ ] 驗證碼匹配
  - [ ] 標記為已驗證
  - [ ] 返回結果

#### 6.3 檢查驗證狀態 API

- [ ] 創建 `src/app/api/auth/verify-email/status/route.ts`
- [ ] 實現邏輯：
  - [ ] 檢查用戶登入狀態
  - [ ] 查詢用戶驗證狀態
  - [ ] 返回狀態

### 7. 註冊 API 修改

- [ ] 修改 `src/app/api/auth/register/route.ts`
- [ ] 添加驗證碼驗證步驟：
  - [ ] 檢查是否為 NTU 郵箱
  - [ ] 驗證驗證碼（調用驗證 API 或直接驗證）
  - [ ] 只有驗證通過才創建用戶
  - [ ] 設置 `emailVerified = true`

### 8. 權限中間件

- [ ] 創建 `src/middleware/requireSchoolVerification.ts`
- [ ] 實現檢查邏輯：
  - [ ] 檢查用戶登入
  - [ ] 檢查 `emailVerified` 和 `isSchoolEmail`
  - [ ] 返回適當的錯誤響應

- [ ] 在需要驗證的路由上應用：
  - [ ] 社群相關 API（好友、聊天、課表分享）
  - [ ] 其他需要學校身份的功能

## 前端開發

### 9. 註冊頁面改造

- [ ] 修改 `src/app/register/page.tsx`
- [ ] 添加驗證碼相關狀態：
  - [ ] `verificationCode` - 驗證碼輸入
  - [ ] `codeSent` - 是否已發送
  - [ ] `countdown` - 倒計時（60 秒）
  - [ ] `canResend` - 是否可以重新發送

- [ ] 添加 UI 元素：
  - [ ] 驗證碼輸入框
  - [ ] "發送驗證碼" 按鈕
  - [ ] "重新發送" 按鈕（帶倒計時）
  - [ ] 驗證碼錯誤提示

- [ ] 實現邏輯：
  - [ ] 檢查郵箱格式和 NTU 域名
  - [ ] 發送驗證碼請求
  - [ ] 倒計時功能
  - [ ] 重新發送功能
  - [ ] 表單提交時驗證驗證碼

### 10. 未驗證用戶提示

- [ ] 在受保護的頁面添加檢查
- [ ] 顯示提示信息：
  - [ ] "需要學校郵箱驗證才能使用此功能"
  - [ ] 提供重新發送驗證碼的連結

- [ ] 創建驗證狀態檢查 Hook：
  - [ ] `src/hooks/useEmailVerification.ts`
  - [ ] 檢查當前用戶的驗證狀態
  - [ ] 提供重新發送驗證碼功能

## 測試

### 11. 單元測試

- [ ] 驗證碼生成測試
- [ ] 郵箱域名驗證測試
- [ ] EmailVerification 模型測試

### 12. 集成測試

- [ ] 完整的註冊流程測試
- [ ] 驗證碼發送測試
- [ ] 驗證碼驗證測試
- [ ] 權限中間件測試

### 13. 手動測試

- [ ] 使用真實 NTU 郵箱測試註冊流程
- [ ] 測試驗證碼過期情況
- [ ] 測試驗證碼錯誤情況
- [ ] 測試重新發送功能
- [ ] 測試非 NTU 郵箱的錯誤處理
- [ ] 測試已註冊郵箱的錯誤處理

## 安全性檢查

### 14. 安全措施驗證

- [ ] 發送頻率限制正常工作
- [ ] 驗證嘗試次數限制正常工作
- [ ] 驗證碼過期機制正常
- [ ] 不洩露郵箱是否存在（防枚舉攻擊）
- [ ] 錯誤訊息不洩露敏感信息

### 15. 性能優化

- [ ] 實現驗證碼記錄定期清理（Cron Job）
- [ ] 實現 Redis 緩存發送頻率限制（可選）
- [ ] 郵件發送錯誤重試機制

## 部署準備

### 16. 生產環境配置

- [ ] 配置生產環境的郵件服務
- [ ] 配置發送域名和 DNS 記錄
- [ ] 設置環境變數
- [ ] 配置數據庫索引
- [ ] 設置定期清理任務（Cron）

### 17. 監控和日誌

- [ ] 添加郵件發送日誌
- [ ] 添加驗證成功率統計
- [ ] 設置錯誤告警

## 文檔更新

- [ ] 更新 API 文檔
- [ ] 更新用戶註冊指南
- [ ] 更新開發者文檔

---

## 依賴安裝命令

```bash
# 選擇一種郵件服務
# Resend
npm install resend

# 或 SendGrid
npm install @sendgrid/mail

# 或 Nodemailer (SMTP)
npm install nodemailer
npm install @types/nodemailer --save-dev
```

## 注意事項

1. **郵件服務選擇**：建議開發環境使用 Resend，生產環境根據需求選擇
2. **驗證碼有效期**：建議設置為 10-15 分鐘
3. **頻率限制**：防止濫用，建議每郵箱每小時最多 5 次
4. **測試郵箱**：開發時可以使用真實郵箱測試，但避免大量發送
5. **錯誤處理**：確保所有錯誤都被適當處理和記錄

