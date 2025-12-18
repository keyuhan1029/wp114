import { NextResponse } from 'next/server';
import { verifyToken, getTokenFromRequest } from '@/lib/jwt';
import { UserModel } from '@/lib/models/User';
import { ObjectId } from 'mongodb';

export async function PUT(request: Request) {
  try {
    const token = getTokenFromRequest(request);

    if (!token) {
      return NextResponse.json(
        { message: '未提供認證 token' },
        { status: 401 }
      );
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json(
        { message: '無效的 token' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name, avatar, userId, department } = body;

    // 驗證輸入
    if (name !== undefined && (typeof name !== 'string' || name.trim().length === 0)) {
      return NextResponse.json(
        { message: '姓名不能為空' },
        { status: 400 }
      );
    }

    if (userId !== undefined && (typeof userId !== 'string' || userId.trim().length === 0)) {
      return NextResponse.json(
        { message: '用戶 ID 不能為空' },
        { status: 400 }
      );
    }

    // 確保 userId 是有效的 ObjectId
    if (!ObjectId.isValid(payload.userId)) {
      return NextResponse.json(
        { message: '無效的用戶 ID' },
        { status: 400 }
      );
    }

    const updateData: {
      name?: string;
      avatar?: string;
      userId?: string;
      department?: string;
    } = {};

    if (name !== undefined) {
      updateData.name = name.trim();
    }
    if (avatar !== undefined) {
      updateData.avatar = avatar.trim() || undefined;
    }
    if (userId !== undefined) {
      updateData.userId = userId.trim();
    }
    if (department !== undefined) {
      updateData.department = department;
    }

    // 更新用戶資料
    const updatedUser = await UserModel.updateProfile(payload.userId, updateData);

    if (!updatedUser) {
      return NextResponse.json(
        { message: '用戶不存在' },
        { status: 404 }
      );
    }

    // 返回更新後的用戶資料（排除密碼）
    const userData = {
      id: updatedUser._id instanceof ObjectId 
        ? updatedUser._id.toString() 
        : String(updatedUser._id),
      userId: updatedUser.userId || null,
      email: updatedUser.email || '',
      name: updatedUser.name || null,
      avatar: updatedUser.avatar || null,
      department: updatedUser.department || null,
      provider: updatedUser.provider || 'email',
    };

    return NextResponse.json({
      message: '個人資料更新成功',
      user: userData,
    });
  } catch (error: any) {
    console.error('更新個人資料錯誤:', error);
    
    if (error.message === '此用戶 ID 已被使用') {
      return NextResponse.json(
        { message: error.message },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { message: '更新個人資料失敗' },
      { status: 500 }
    );
  }
}




