import { NextResponse } from 'next/server';
import { UserModel } from '@/lib/models/User';
import { generateToken } from '@/lib/jwt';
import { EmailVerificationModel } from '@/lib/models/EmailVerification';
import { isValidEmail } from '@/lib/utils/verification';
import { getDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function POST(request: Request) {
  try {
    const { email, password, name, verificationCode } = await request.json();

    // 驗證輸入
    if (!email || !password) {
      return NextResponse.json(
        { message: '請提供電子郵件和密碼' },
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

    // 驗證驗證碼（必需）
    if (!verificationCode || typeof verificationCode !== 'string') {
      return NextResponse.json(
        { message: '請提供驗證碼' },
        { status: 400 }
      );
    }

    // 驗證驗證碼
    const verification = await EmailVerificationModel.findValidCode(email, verificationCode);
    if (!verification || verification.verified) {
      return NextResponse.json(
        { message: '驗證碼錯誤或已失效，請重新獲取' },
        { status: 400 }
      );
    }

    // 標記驗證碼為已使用
    await EmailVerificationModel.markAsVerified(verification._id!);

    // 檢查用戶是否已存在
    const existingUser = await UserModel.findByEmail(email);
    if (existingUser) {
      return NextResponse.json(
        { message: '此電子郵件已被註冊' },
        { status: 400 }
      );
    }

    // 創建新用戶（使用 email provider），已通過郵箱驗證
    const user = await UserModel.create({
      email,
      password,
      name,
      provider: 'email',
    });

    // 更新用戶的驗證狀態
    const db = await getDatabase();
    await db.collection('users').updateOne(
      { _id: typeof user._id === 'string' ? new ObjectId(user._id) : user._id },
      {
        $set: {
          emailVerified: true,
          emailVerifiedAt: new Date(),
          isSchoolEmail: true,
        },
      }
    );

    // 重新獲取用戶以獲取最新數據
    const updatedUser = await UserModel.findByEmail(email);

    if (!updatedUser) {
      throw new Error('創建用戶後無法找到用戶記錄');
    }

    // 生成 JWT token
    const userId = typeof updatedUser._id === 'string' 
      ? updatedUser._id 
      : updatedUser._id?.toString() || '';
    const token = generateToken({
      userId,
      email: updatedUser.email,
    });

    return NextResponse.json(
      {
        message: '註冊成功',
        token,
        user: {
          id: updatedUser._id,
          email: updatedUser.email,
          name: updatedUser.name,
          emailVerified: updatedUser.emailVerified,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('註冊錯誤:', error);
    return NextResponse.json(
      { message: '註冊失敗，請稍後再試' },
      { status: 500 }
    );
  }
}

