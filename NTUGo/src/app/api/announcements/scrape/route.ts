import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, getTokenFromRequest } from '@/lib/jwt';
import { scrapeAnnouncements } from '@/lib/scrapers/osaActivityScraper';
import { AnnouncementModel } from '@/lib/models/Announcement';
import type { AnnouncementCategory } from '@/lib/models/Announcement';

/**
 * 手动触发爬虫任务（需要认证）
 * POST /api/announcements/scrape
 * Body: { categories?: AnnouncementCategory[] }
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

    // TODO: 可以添加管理员权限检查
    // if (!payload.isAdmin) {
    //   return NextResponse.json({ message: '需要管理员权限' }, { status: 403 });
    // }

    const body = await request.json();
    const { categories } = body;

    const targetCategories: AnnouncementCategory[] = categories || [
      '社團資訊',
      '國際交流',
      '社會服務',
    ];

    // 抓取公告
    const scrapedAnnouncements = await scrapeAnnouncements(targetCategories);

    // 保存新公告（去重）
    const newAnnouncements = [];
    const existingAnnouncements = [];

    for (const scraped of scrapedAnnouncements) {
      const existing = await AnnouncementModel.findBySourceId(scraped.sourceId);
      if (!existing) {
        const announcement = await AnnouncementModel.create(scraped);
        newAnnouncements.push(announcement);
      } else {
        existingAnnouncements.push(existing);
      }
    }

    return NextResponse.json({
      success: true,
      message: `成功抓取 ${scrapedAnnouncements.length} 条公告，新增 ${newAnnouncements.length} 条`,
      scraped: scrapedAnnouncements.length,
      new: newAnnouncements.length,
      existing: existingAnnouncements.length,
      newAnnouncements: newAnnouncements.map(announcement => ({
        _id: announcement._id?.toString(),
        title: announcement.title,
        category: announcement.category,
      })),
    });
  } catch (error: any) {
    console.error('手动触发爬虫失败:', error);
    return NextResponse.json(
      { success: false, message: '抓取公告失败', error: error.message },
      { status: 500 }
    );
  }
}

