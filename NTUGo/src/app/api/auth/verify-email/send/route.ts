import { NextRequest, NextResponse } from 'next/server';
import { EmailVerificationModel } from '@/lib/models/EmailVerification';
import { generateVerificationCode, isValidEmail } from '@/lib/utils/verification';
import { sendVerificationCode } from '@/services/email';
import { checkEmailSendRateLimit } from '@/lib/utils/rateLimit';

const CODE_EXPIRY_MINUTES = parseInt(process.env.VERIFICATION_CODE_EXPIRY_MINUTES || '10', 10);
const MAX_SENDS_PER_HOUR = parseInt(process.env.VERIFICATION_CODE_MAX_SENDS_PER_HOUR || '5', 10);

/**
 * 發送驗證碼 API
 * POST /api/auth/verify-email/send
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    // 驗證輸入
    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { message: '請提供有效的郵箱地址' },
        { status: 400 }
      );
    }

    // 驗證郵箱格式
    if (!isValidEmail(email)) {
      return NextResponse.json(
        { message: '郵箱格式不正確' },
        { status: 400 }
      );
    }

    // 檢查發送頻率限制
    if (!checkEmailSendRateLimit(email, MAX_SENDS_PER_HOUR)) {
      return NextResponse.json(
        { 
          message: `發送過於頻繁，請稍後再試（每小時最多 ${MAX_SENDS_PER_HOUR} 次）`,
          rateLimited: true 
        },
        { status: 429 }
      );
    }

    // 生成驗證碼
    const code = generateVerificationCode();

    // 創建驗證碼記錄
    await EmailVerificationModel.create(email, code, CODE_EXPIRY_MINUTES);

    // 發送郵件
    try {
      await sendVerificationCode(email, code);
    } catch (error: any) {
      console.error('發送郵件失敗:', error);
      // 傳遞詳細錯誤信息（開發環境）
      const errorMessage = error.message || '發送郵件失敗，請稍後再試';
      return NextResponse.json(
        { 
          message: errorMessage,
          ...(process.env.NODE_ENV === 'development' && { details: error.stack }),
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '驗證碼已發送到您的郵箱',
      expiresIn: CODE_EXPIRY_MINUTES * 60, // 秒數
    });
  } catch (error: any) {
    console.error('發送驗證碼失敗:', error);
    console.error('錯誤詳情:', error.message, error.stack);
    return NextResponse.json(
      { 
        message: error.message || '發送驗證碼失敗，請稍後再試',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}

