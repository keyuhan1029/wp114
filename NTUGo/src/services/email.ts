import { Resend } from 'resend';

// 獲取並驗證 API Key
const getResendApiKey = (): string => {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    console.error('RESEND_API_KEY 環境變數未設置');
    throw new Error('RESEND_API_KEY 環境變數未設置，請檢查 .env.local 文件');
  }
  return apiKey;
};

function renderVerificationEmailTemplate(code: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f5f5f5;
    }
    .container {
      background-color: #ffffff;
      border-radius: 8px;
      padding: 40px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
    }
    .header h1 {
      color: #0F4C75;
      margin: 0;
      font-size: 24px;
    }
    .code-container {
      background-color: #f5f7fa;
      border-radius: 8px;
      padding: 30px;
      text-align: center;
      margin: 30px 0;
    }
    .code {
      font-size: 36px;
      font-weight: bold;
      color: #0F4C75;
      letter-spacing: 8px;
      margin: 0;
    }
    .message {
      color: #666;
      margin: 20px 0;
      line-height: 1.8;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #eee;
      font-size: 12px;
      color: #999;
      text-align: center;
    }
    .warning {
      color: #f44336;
      font-size: 14px;
      margin-top: 20px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>歡迎使用 NTUGo！</h1>
    </div>
    
    <p class="message">您的驗證碼是：</p>
    
    <div class="code-container">
      <p class="code">${code}</p>
    </div>
    
    <p class="message">
      請在註冊頁面輸入此驗證碼以完成郵箱驗證。
    </p>
    
    <p class="message">
      此驗證碼將在 <strong>10 分鐘</strong>後失效。
    </p>
    
    <p class="warning">
      ⚠️ 如果您沒有申請此驗證碼，請忽略此郵件。
    </p>
    
    <div class="footer">
      <p>此郵件由 NTUGo 系統自動發送，請勿回覆。</p>
      <p>© ${new Date().getFullYear()} NTUGo. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

export async function sendVerificationCode(email: string, code: string): Promise<void> {
  try {
 
    const apiKey = getResendApiKey();
    const resend = new Resend(apiKey);
    const fromEmail = process.env.RESEND_FROM_EMAIL?.trim() || 'onboarding@resend.dev';

    console.log('正在發送驗證碼郵件到:', email);
    console.log('發送地址:', fromEmail);

    const result = await resend.emails.send({
      from: fromEmail,
      to: email,
      subject: `[NTUGo] 您的驗證碼是：${code}`,
      html: renderVerificationEmailTemplate(code),
    });

    if (result.error) {
      console.error('Resend API 錯誤:', JSON.stringify(result.error, null, 2));
      
      // 處理特定錯誤類型
      if (result.error.message?.includes('bounce') || result.error.message?.includes('delivery failure')) {
        throw new Error(
          `郵件被退回：${result.error.message}。` +
          `可能原因：1) 域名未完全驗證 2) SPF/DKIM 記錄未生效 3) 收件人郵箱問題。` +
          `請檢查 Resend Dashboard 中的詳細錯誤信息。`
        );
      }
      
      throw new Error(`發送郵件失敗: ${JSON.stringify(result.error)}`);
    }
    
    // 檢查是否有警告
    if (result.data?.id) {
      console.log('郵件已發送，ID:', result.data.id);
      console.log('注意：如果郵件被退回，請檢查 Resend Dashboard 中的詳細信息');
    }
  } catch (error: any) {
    console.error('發送驗證碼郵件失敗:', {
      email,
      error: error.message,
      stack: error.stack,
    });
    throw new Error(error.message || '發送郵件失敗，請稍後再試');
  }
}

