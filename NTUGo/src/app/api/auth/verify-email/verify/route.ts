import { NextRequest, NextResponse } from 'next/server';
import { EmailVerificationModel } from '@/lib/models/EmailVerification';
import { UserModel } from '@/lib/models/User';
import { isValidEmail } from '@/lib/utils/verification';

const MAX_ATTEMPTS = parseInt(process.env.VERIFICATION_CODE_MAX_ATTEMPTS || '5', 10);

/**
 * 驗證驗證碼 API
 * POST /api/auth/verify-email/verify
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, code } = body;

    // 驗證輸入
    if (!email || !code) {
      return NextResponse.json(
        { message: '請提供郵箱和驗證碼' },
        { status: 400 }
      );
    }

    if (!isValidEmail(email)) {
      return NextResponse.json(
        { message: '郵箱格式不正確' },
        { status: 400 }
      );
    }

    if (typeof code !== 'string' || code.length !== 6 || !/^\d{6}$/.test(code)) {
      return NextResponse.json(
        { message: '驗證碼格式不正確（應為 6 位數字）' },
        { status: 400 }
      );
    }

    // 查找有效的驗證碼
    const verification = await EmailVerificationModel.findValidCode(email, code);

    if (!verification) {
      // 檢查是否有過期的驗證碼
      const recentCodes = await EmailVerificationModel.findRecentCodes(email, 60);
      const hasRecentCode = recentCodes.some(v => !v.verified && v.code === code);
      
      if (hasRecentCode) {
        return NextResponse.json(
          { message: '驗證碼已過期，請重新發送' },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { message: '驗證碼錯誤或已失效' },
        { status: 400 }
      );
    }

    // 檢查嘗試次數
    if (verification.attempts >= MAX_ATTEMPTS) {
      return NextResponse.json(
        { message: '驗證嘗試次數過多，請重新發送驗證碼' },
        { status: 400 }
      );
    }

    // 增加嘗試次數
    const newAttempts = await EmailVerificationModel.incrementAttempts(verification._id!);

    // 如果嘗試次數超過限制，不再驗證
    if (newAttempts > MAX_ATTEMPTS) {
      return NextResponse.json(
        { message: '驗證嘗試次數過多，請重新發送驗證碼' },
        { status: 400 }
      );
    }

    // 驗證碼匹配，標記為已驗證
    await EmailVerificationModel.markAsVerified(verification._id!);

    // 如果用戶已存在，更新驗證狀態
    const user = await UserModel.findByEmail(email);
    if (user) {
      await UserModel.updateEmailVerificationStatus(user._id!, true);
      
      // 更新 isSchoolEmail
      const { getDatabase } = await import('@/lib/mongodb');
      const { ObjectId } = await import('mongodb');
      const db = await getDatabase();
      await db.collection('users').updateOne(
        { _id: typeof user._id === 'string' ? new ObjectId(user._id) : user._id },
        { $set: { isSchoolEmail: true } }
      );
    }

    return NextResponse.json({
      success: true,
      message: '驗證成功',
      verified: true,
    });
  } catch (error: any) {
    console.error('驗證驗證碼失敗:', error);
    return NextResponse.json(
      { message: '驗證失敗，請稍後再試' },
      { status: 500 }
    );
  }
}

