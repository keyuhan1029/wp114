# Resend 域名驗證和 DMARC 設置指南

## 問題 1：缺少 DMARC 記錄

### 什麼是 DMARC？

DMARC（Domain-based Message Authentication, Reporting & Conformance）是一種電子郵件驗證協議，用於防止電子郵件欺詐和釣魚攻擊。

### 為什麼需要 DMARC？

- 提高郵件送達率
- 防止域名被濫用
- 增加收件人對郵件的信任

### 如何添加 DMARC 記錄

1. **在 Resend Dashboard 中查看需要的 DNS 記錄**
   - 訪問 https://resend.com/domains
   - 點擊您的域名
   - 查看需要添加的 DNS 記錄

2. **在您的域名註冊商（如 Cloudflare）中添加 DMARC 記錄**

   **記錄類型：** `TXT`
   
   **名稱/主機：** `_dmarc`
   
   **值/內容：** 
   ```
   v=DMARC1; p=none; rua=mailto:dmarc@yourdomain.com
   ```
   
   或者更嚴格的策略：
   ```
   v=DMARC1; p=quarantine; rua=mailto:dmarc@yourdomain.com
   ```
   
   或者最嚴格（推薦生產環境）：
   ```
   v=DMARC1; p=reject; rua=mailto:dmarc@yourdomain.com
   ```
   
   **說明：**
   - `v=DMARC1` - DMARC 版本
   - `p=none` - 策略：不採取行動（測試階段）
   - `p=quarantine` - 策略：隔離（中等）
   - `p=reject` - 策略：拒絕（最嚴格，推薦生產環境）
   - `rua=mailto:dmarc@yourdomain.com` - 報告郵箱（可選，用於接收 DMARC 報告）

3. **在 Cloudflare 中添加記錄的步驟**
   - 登入 Cloudflare Dashboard
   - 選擇您的域名
   - 點擊 "DNS" → "Records"
   - 點擊 "Add record"
   - 選擇類型：`TXT`
   - 名稱：`_dmarc`
   - 內容：`v=DMARC1; p=none; rua=mailto:dmarc@yourdomain.com`
   - 點擊 "Save"

4. **等待 DNS 傳播**
   - 通常需要幾分鐘到幾小時
   - 可以在 https://mxtoolbox.com/dmarc.aspx 檢查是否生效

## 問題 2：避免使用 "noreply" 作為發件人

### 為什麼不建議使用 "noreply"？

- 降低郵件信任度
- 收件人無法回覆（降低互動性）
- 可能被標記為垃圾郵件

### 推薦的發件人地址

使用以下格式之一：

```env
# 選項 1：簡單友好
RESEND_FROM_EMAIL=hello@yourdomain.com

# 選項 2：帶顯示名稱
RESEND_FROM_EMAIL=NTUGo <hello@yourdomain.com>

# 選項 3：支持相關
RESEND_FROM_EMAIL=support@yourdomain.com

# 選項 4：驗證碼專用
RESEND_FROM_EMAIL=verify@yourdomain.com
```

### 更新環境變數

在 `.env.local` 中設置：

```env
# 推薦使用 hello 或 support，避免使用 noreply
RESEND_FROM_EMAIL=NTUGo <hello@yourdomain.com>
```

## 完整的 DNS 記錄設置

在 Resend 中驗證域名時，通常需要添加以下記錄：

### 1. SPF 記錄
**類型：** `TXT`
**名稱：** `@` 或您的域名
**值：** Resend 會提供（類似：`v=spf1 include:resend.com ~all`）

### 2. DKIM 記錄
**類型：** `TXT`
**名稱：** Resend 會提供（類似：`resend._domainkey`）
**值：** Resend 會提供

### 3. DMARC 記錄（新增）
**類型：** `TXT`
**名稱：** `_dmarc`
**值：** `v=DMARC1; p=none; rua=mailto:dmarc@yourdomain.com`

## 驗證步驟

1. ✅ 在 Resend 中添加域名
2. ✅ 添加 SPF 記錄
3. ✅ 添加 DKIM 記錄
4. ✅ 添加 DMARC 記錄（新增）
5. ✅ 等待驗證完成
6. ✅ 更新環境變數使用新的發件人地址

## 測試

驗證完成後，發送測試郵件，檢查：
- ✅ 郵件成功發送
- ✅ 沒有退回（Bounce）
- ✅ 收件箱中正常顯示

## 排查郵件退回（Bounce）問題

如果郵件被退回，常見原因和解決方法：

### 1. 域名未完全驗證
**檢查：**
- 在 Resend Dashboard 中確認域名狀態為 "Verified"
- 確認所有 DNS 記錄（SPF、DKIM）都已添加並生效

**解決：**
- 等待 DNS 傳播（可能需要幾小時）
- 使用 https://mxtoolbox.com 檢查 DNS 記錄是否生效

### 2. SPF 記錄問題
**檢查：**
- 在 Resend Dashboard 中查看 SPF 記錄
- 使用 https://mxtoolbox.com/spf.aspx 檢查 SPF 記錄

**解決：**
- 確保 SPF 記錄包含 `include:resend.com`
- 確保記錄語法正確

### 3. DKIM 記錄問題
**檢查：**
- 在 Resend Dashboard 中查看 DKIM 記錄
- 確認 DKIM 記錄已正確添加到 DNS

**解決：**
- 重新檢查 DKIM 記錄的 Name 和 Content
- 等待 DNS 傳播

### 4. 收件人郵箱問題
**檢查：**
- 確認收件人郵箱地址正確
- 確認收件人郵箱未滿或未關閉

**解決：**
- 嘗試發送到不同的郵箱測試
- 檢查收件人郵箱的垃圾郵件文件夾

### 5. 域名聲譽問題
**檢查：**
- 域名是否是新註冊的（可能需要時間建立聲譽）
- 是否之前有發送垃圾郵件的記錄

**解決：**
- 新域名需要時間建立聲譽
- 確保發送內容符合規範

### 6. 臨時性問題
**檢查：**
- 錯誤信息是否顯示 "Temporary" 或 "Retry"

**解決：**
- 等待一段時間後重試
- 某些郵件服務提供商可能有臨時限制

## 查看詳細錯誤信息

在 Resend Dashboard 中：
1. 點擊被退回的郵件
2. 查看 "See details" 獲取詳細錯誤信息
3. 根據錯誤信息採取相應措施

## 參考資源

- [Resend 域名驗證文檔](https://resend.com/docs/dashboard/domains/introduction)
- [DMARC 記錄生成器](https://www.dmarcanalyzer.com/dmarc-record-generator/)
- [檢查 DMARC 記錄](https://mxtoolbox.com/dmarc.aspx)

---

**注意：** 添加 DMARC 記錄後，可能需要幾小時才能完全生效。建議先使用 `p=none` 策略測試，確認無誤後再改為 `p=reject`。

