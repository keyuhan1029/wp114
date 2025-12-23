import { NextResponse } from 'next/server';
import { AnnouncementModel } from '@/lib/models/Announcement';
import { getDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import * as cheerio from 'cheerio';
import crypto from 'crypto';

/**
 * 手動導入小福/鹿鳴堂公告
 * GET /api/announcements/import-alumni-week?sn=3437 (114-2) 或 ?sn=3315 (114-1)
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const sn = searchParams.get('sn') || '3437'; // 預設 114-2
    const url = `https://osa_activity.ntu.edu.tw/board/detail/sn/${sn}`;
    
    // 抓取公告詳情
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { success: false, message: `無法抓取公告內容: ${response.status}` },
        { status: 500 }
      );
    }

    const arrayBuffer = await response.arrayBuffer();
    const decoder = new TextDecoder('utf-8');
    const html = decoder.decode(arrayBuffer);
    const $ = cheerio.load(html);

    // 提取標題
    const titleElement = $('h2').first();
    let title = titleElement.text().trim();
    
    // 從標題提取學期資訊（例如：114-1 或 114-2）
    const semesterMatch = title.match(/(\d{3}-\d)/);
    const semester = semesterMatch ? semesterMatch[1] : '114-2';
    
    if (!title) {
      title = `${semester}小福鹿鳴攤位場地協調會結果公告`;
    }
    
    // 提取發佈日期
    const dateText = $('body').text();
    const dateMatch = dateText.match(/發佈日期[：:]\s*(\d{4}-\d{2}-\d{2})/);
    const publishDateStr = dateMatch ? dateMatch[1] : (semester === '114-1' ? '2025-05-27' : '2025-12-05');
    
    // 提取內容
    const content = $('main, article, .content, .article-content').first().text().trim() || $('body').text();
    const [year, month, day] = publishDateStr.split('-').map(Number);
    const publishDate = new Date(year, month - 1, day);

    // 提取系友周活動資訊
    // 格式：日期範圍 + 社團名稱列表
    const alumniWeekEvents: Array<{
      dateRange: string;
      events: Array<{ location: string; club: string }>;
    }> = [];

    // 解析內容中的日期範圍和活動
    const dateRangeRegex = /(\d{1,2})月(\d{1,2})日-(\d{1,2})月(\d{1,2})日/g;
    const lines = content.split('\n');
    
    let currentDateRange: string | null = null;
    let currentEvents: Array<{ location: string; club: string }> = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // 檢查是否是日期範圍行（格式：9月1日-9月5日 或 9月1日-9月5日）
      const dateMatch = line.match(/(\d{1,2})月(\d{1,2})日-(\d{1,2})月(\d{1,2})日/);
      if (dateMatch) {
        // 保存之前的日期範圍和活動
        if (currentDateRange) {
          alumniWeekEvents.push({
            dateRange: currentDateRange,
            events: [...currentEvents],
          });
        }
        
        // 開始新的日期範圍
        currentDateRange = `${dateMatch[1]}月${dateMatch[2]}日-${dateMatch[3]}月${dateMatch[4]}日`;
        currentEvents = [];
        continue;
      }
      
      // 檢查是否是活動行（包含鹿鳴或小福）
      if (currentDateRange && (line.includes('鹿鳴') || line.includes('小福'))) {
        // 優先匹配格式：使用【】的格式（114-1格式）
        // 例如："小福1【客家社】 小福2 無 小福3【椰風搖滾社】小福4無 小福5無"
        const bracketMatches = line.matchAll(/(小福\d+|鹿鳴\d+)\s*【([^】]+)】/g);
        let foundBracket = false;
        for (const match of bracketMatches) {
          foundBracket = true;
          const location = match[1].trim();
          const club = match[2].trim();
          if (club && club.length > 0) {
            currentEvents.push({ location, club });
          }
        }
        
        // 如果沒有找到【】格式，嘗試其他格式（114-2格式）
        if (!foundBracket) {
          // 匹配 "位置 社團名稱" 格式（排除「無」）
          const textMatches = line.matchAll(/(小福\d+|鹿鳴\d+)\s+([^小福鹿鳴□\s]+?)(?=\s*(?:小福|鹿鳴|□|$))/g);
          for (const match of textMatches) {
            const location = match[1].trim();
            let club = match[2].trim();
            // 移除「無」或空字串
            if (club && club !== '無' && !club.match(/^無\s*$/) && club.length > 0) {
              currentEvents.push({ location, club });
            }
          }
        }
      }
    }
    
    // 保存最後一個日期範圍（即使沒有活動也要保存）
    if (currentDateRange) {
      alumniWeekEvents.push({
        dateRange: currentDateRange,
        events: [...currentEvents],
      });
    }

    // 格式化內容為結構化的小福/鹿鳴堂資訊
    let formattedContent = `# ${title}\n\n`;
    formattedContent += `發佈日期：${publishDateStr}\n\n`;
    formattedContent += `學期：${semester}\n\n`;
    formattedContent += `## 小福/鹿鳴堂活動安排\n\n`;
    
    for (const week of alumniWeekEvents) {
      formattedContent += `### ${week.dateRange}\n\n`;
      if (week.events.length === 0) {
        formattedContent += `暫無活動安排\n\n`;
      } else {
        for (const event of week.events) {
          formattedContent += `- **${event.location}**：${event.club}\n`;
        }
        formattedContent += '\n';
      }
    }

    // 生成 sourceId
    const sourceId = crypto.createHash('md5').update(`${url}|${title}`).digest('hex');

    // 檢查是否已存在，如果存在則更新
    const existing = await AnnouncementModel.findBySourceId(sourceId);
    
    if (existing && existing._id) {
      // 更新現有公告的內容
      const db = await getDatabase();
      const id = typeof existing._id === 'string' ? new ObjectId(existing._id) : existing._id;
      await db.collection('announcements').updateOne(
        { _id: id },
        { $set: { content: formattedContent, publishDate } }
      );
      
      return NextResponse.json({
        success: true,
        message: '小福/鹿鳴堂公告已更新',
        announcement: {
          _id: existing._id?.toString(),
          title: existing.title,
          category: existing.category,
        },
        alumniWeekEvents,
      });
    }

    // 創建新公告
    const announcement = await AnnouncementModel.create({
      sourceId,
      title,
      content: formattedContent,
      category: '小福/鹿鳴堂',
      publishDate,
      sourceUrl: url,
      isPinned: false,
    });

    return NextResponse.json({
      success: true,
      message: '系友周公告導入成功',
      announcement: {
        _id: announcement._id?.toString(),
        title: announcement.title,
        category: announcement.category,
      },
      alumniWeekEvents,
      totalWeeks: alumniWeekEvents.length,
    });
  } catch (error: any) {
    console.error('導入系友周公告失敗:', error);
    return NextResponse.json(
      {
        success: false,
        message: '導入系友周公告失敗',
        error: error.message,
      },
      { status: 500 }
    );
  }
}

