import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, getTokenFromRequest } from '@/lib/jwt';
import { AnnouncementSubscriptionModel } from '@/lib/models/AnnouncementSubscription';
import type { AnnouncementCategory } from '@/lib/models/Announcement';
import { ObjectId } from 'mongodb';

/**
 * 获取当前用户的订阅设置
 * GET /api/announcements/subscriptions
 */
export async function GET(request: NextRequest) {
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

    const subscription = await AnnouncementSubscriptionModel.findByUser(payload.userId);

    return NextResponse.json({
      success: true,
      subscription: subscription ? {
        _id: subscription._id instanceof ObjectId ? subscription._id.toString() : subscription._id,
        categories: subscription.categories,
        createdAt: subscription.createdAt instanceof Date 
          ? subscription.createdAt.toISOString() 
          : subscription.createdAt,
        updatedAt: subscription.updatedAt instanceof Date 
          ? subscription.updatedAt.toISOString() 
          : subscription.updatedAt,
      } : null,
    });
  } catch (error: any) {
    console.error('获取订阅设置失败:', error);
    return NextResponse.json(
      { success: false, message: '获取订阅设置失败', error: error.message },
      { status: 500 }
    );
  }
}

/**
 * 更新用户的订阅设置
 * POST /api/announcements/subscriptions
 * Body: { categories: AnnouncementCategory[] }
 */
export async function POST(request: NextRequest) {
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
    const { categories } = body;

    if (!Array.isArray(categories)) {
      return NextResponse.json(
        { success: false, message: 'categories 必须是数组' },
        { status: 400 }
      );
    }

    // 驗證分類是否有效
    const validCategories: AnnouncementCategory[] = [
      '社團資訊',
      '國際交流',
      '社會服務',
      '小福/鹿鳴堂',
    ];

    const invalidCategories = categories.filter(
      (cat: string) => !validCategories.includes(cat as AnnouncementCategory)
    );

    if (invalidCategories.length > 0) {
      return NextResponse.json(
        { success: false, message: `无效的分类: ${invalidCategories.join(', ')}` },
        { status: 400 }
      );
    }

    const subscription = await AnnouncementSubscriptionModel.createOrUpdate(
      payload.userId,
      categories as AnnouncementCategory[]
    );

    return NextResponse.json({
      success: true,
      subscription: {
        _id: subscription._id instanceof ObjectId ? subscription._id.toString() : subscription._id,
        categories: subscription.categories,
        createdAt: subscription.createdAt instanceof Date 
          ? subscription.createdAt.toISOString() 
          : subscription.createdAt,
        updatedAt: subscription.updatedAt instanceof Date 
          ? subscription.updatedAt.toISOString() 
          : subscription.updatedAt,
      },
    });
  } catch (error: any) {
    console.error('更新订阅设置失败:', error);
    return NextResponse.json(
      { success: false, message: '更新订阅设置失败', error: error.message },
      { status: 500 }
    );
  }
}

