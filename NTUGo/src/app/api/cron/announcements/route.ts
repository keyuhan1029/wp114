import { NextResponse } from 'next/server';
import { scrapeAnnouncements } from '@/lib/scrapers/osaActivityScraper';
import { AnnouncementModel } from '@/lib/models/Announcement';
import type { AnnouncementCategory } from '@/lib/models/Announcement';

/**
 * Vercel Cron Job 端点
 * 每天自动调用，抓取最新公告
 * 
 * 配置方式：在 vercel.json 中添加
 * {
 *   "crons": [{
 *     "path": "/api/cron/announcements",
 *     "schedule": "0 8 * * *"  // 每天 UTC 8:00（台湾时间 16:00）
 *   }]
 * }
 */
export async function GET(request: Request) {
  // Vercel Cron 会发送一个特殊的 header
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  
  // 验证请求来源（可选，但推荐）
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json(
      { message: '未授權訪問' },
      { status: 401 }
    );
  }

  try {
    console.log(`[${new Date().toISOString()}] 開始抓取台大活動公告`);

    // 要抓取的分類
    const targetCategories: AnnouncementCategory[] = [
      '社團資訊',
      '國際交流',
      '社會服務',
    ];

    // 抓取公告
    const scrapedAnnouncements = await scrapeAnnouncements(targetCategories);

    console.log(`成功抓取 ${scrapedAnnouncements.length} 条公告`);

    // 保存新公告（去重）
    const newAnnouncements = [];
    const existingAnnouncements = [];

    for (const scraped of scrapedAnnouncements) {
      try {
        const existing = await AnnouncementModel.findBySourceId(scraped.sourceId);
        if (!existing) {
          const announcement = await AnnouncementModel.create(scraped);
          newAnnouncements.push(announcement);
        } else {
          existingAnnouncements.push(existing);
        }
      } catch (error) {
        console.error(`保存公告失败 (${scraped.title}):`, error);
      }
    }

    console.log(`新增 ${newAnnouncements.length} 条公告，已存在 ${existingAnnouncements.length} 条`);

    // 清理旧公告（保留最近90天）
    const deletedCount = await AnnouncementModel.deleteOld(90);
    console.log(`清理了 ${deletedCount} 条旧公告`);

    return NextResponse.json({
      success: true,
      message: `成功处理 ${scrapedAnnouncements.length} 条公告`,
      scraped: scrapedAnnouncements.length,
      new: newAnnouncements.length,
      existing: existingAnnouncements.length,
      deleted: deletedCount,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('定时抓取公告失败:', error);
    return NextResponse.json(
      { 
        success: false,
        message: '抓取公告失败', 
        error: error.message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

