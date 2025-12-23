import { NextRequest, NextResponse } from 'next/server';
import { AnnouncementModel, type AnnouncementCategory } from '@/lib/models/Announcement';
import { ObjectId } from 'mongodb';

/**
 * 获取公告列表
 * GET /api/announcements?category=社團資訊&limit=20&skip=0
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get('category') as AnnouncementCategory | null;
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const skip = parseInt(searchParams.get('skip') || '0', 10);

    let announcements = await AnnouncementModel.findAll(limit, skip, category || undefined);
    const total = await AnnouncementModel.count(category || undefined);

    // 過濾掉標題為「置頂公告」的公告，以及「一般公告」類別的公告（已移除該類別）
    announcements = announcements.filter(ann => 
      ann.title !== '置頂公告' && 
      ann.category !== '一般公告'
    );

    return NextResponse.json({
      success: true,
      announcements: announcements.map(announcement => ({
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
      })),
      total,
      limit,
      skip,
    });
  } catch (error: any) {
    console.error('获取公告列表失败:', error);
    return NextResponse.json(
      { success: false, message: '获取公告列表失败', error: error.message },
      { status: 500 }
    );
  }
}

/**
 * 手动触发爬虫（管理员功能）
 * POST /api/announcements
 * 需要认证和权限检查
 */
export async function POST(request: NextRequest) {
  try {
    // TODO: 添加管理员权限检查
    // const token = getTokenFromRequest(request);
    // const payload = verifyToken(token);
    // if (!payload || !payload.isAdmin) {
    //   return NextResponse.json({ message: '未授权' }, { status: 401 });
    // }

    const body = await request.json();
    const { categories } = body;

    // 导入爬虫服务（动态导入避免在构建时执行）
    const { scrapeAnnouncements } = await import('@/lib/scrapers/osaActivityScraper');
    const { AnnouncementModel } = await import('@/lib/models/Announcement');

    const targetCategories: AnnouncementCategory[] = categories || [
      '社團資訊',
      '國際交流',
      '社會服務',
    ];

    // 抓取公告
    const scrapedAnnouncements = await scrapeAnnouncements(targetCategories);

    // 保存新公告（去重）
    const newAnnouncements = [];
    for (const scraped of scrapedAnnouncements) {
      const existing = await AnnouncementModel.findBySourceId(scraped.sourceId);
      if (!existing) {
        const announcement = await AnnouncementModel.create(scraped);
        newAnnouncements.push(announcement);
      }
    }

    return NextResponse.json({
      success: true,
      message: `成功抓取 ${scrapedAnnouncements.length} 条公告，新增 ${newAnnouncements.length} 条`,
      scraped: scrapedAnnouncements.length,
      new: newAnnouncements.length,
    });
  } catch (error: any) {
    console.error('手动触发爬虫失败:', error);
    return NextResponse.json(
      { success: false, message: '抓取公告失败', error: error.message },
      { status: 500 }
    );
  }
}

