import { NextRequest, NextResponse } from 'next/server';
import { AnnouncementModel } from '@/lib/models/Announcement';
import { ObjectId } from 'mongodb';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * 获取单个公告详情
 * GET /api/announcements/[id]
 */
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, message: '无效的公告ID' },
        { status: 400 }
      );
    }

    const announcement = await AnnouncementModel.findById(id);

    if (!announcement) {
      return NextResponse.json(
        { success: false, message: '公告不存在' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      announcement: {
        _id: announcement._id instanceof ObjectId ? announcement._id.toString() : announcement._id,
        sourceId: announcement.sourceId,
        title: announcement.title,
        content: announcement.content,
        category: announcement.category,
        publishDate: announcement.publishDate instanceof Date 
          ? announcement.publishDate.toISOString() 
          : announcement.publishDate,
        sourceUrl: announcement.sourceUrl,
        isPinned: announcement.isPinned,
        createdAt: announcement.createdAt instanceof Date 
          ? announcement.createdAt.toISOString() 
          : announcement.createdAt,
        updatedAt: announcement.updatedAt instanceof Date 
          ? announcement.updatedAt.toISOString() 
          : announcement.updatedAt,
      },
    });
  } catch (error: any) {
    console.error('获取公告详情失败:', error);
    return NextResponse.json(
      { success: false, message: '获取公告详情失败', error: error.message },
      { status: 500 }
    );
  }
}

