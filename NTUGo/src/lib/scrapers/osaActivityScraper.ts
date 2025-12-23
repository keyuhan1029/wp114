import * as cheerio from 'cheerio';
import type { AnnouncementCategory } from '../models/Announcement';
import crypto from 'crypto';

export interface ScrapedAnnouncement {
  sourceId: string;
  title: string;
  content: string;
  category: AnnouncementCategory;
  publishDate: Date;
  sourceUrl: string;
  isPinned: boolean;
}

// 類型映射：網站的分類名稱 -> 我們的分類名稱（繁體字）
const CATEGORY_MAP: Record<string, AnnouncementCategory> = {
  '社團資訊': '社團資訊',
  '國際交流': '國際交流',
  '社會服務': '社會服務',
};

// 分類對應的 tab 參數（根據網站實際結構）
// 根據用戶提供的網頁，tab 0 是全部，其他數字對應不同分類
// 注意：只有部分分類有對應的 tab，使用 Partial 類型
const CATEGORY_TAB_MAP: Partial<Record<AnnouncementCategory, number[]>> = {
  '社團資訊': [10, 0], // tab 10 是社團資訊專頁（根據用戶提供的網頁 https://osa_activity.ntu.edu.tw/board/index/tab/10）
  '國際交流': [8, 0], // tab 8 是國際交流專頁（根據用戶提供的網頁 https://osa_activity.ntu.edu.tw/board/index/tab/8）
  '社會服務': [14, 0], // tab 14 是社會服務專頁（根據用戶提供的網頁 https://osa_activity.ntu.edu.tw/board/index/tab/14）
};

// 生成 sourceId（用於去重）
function generateSourceId(url: string, title: string): string {
  const hash = crypto.createHash('md5').update(`${url}|${title}`).digest('hex');
  return hash;
}

/**
 * 從單個頁面解析公告
 */
function parseAnnouncementsFromPage(
  $: ReturnType<typeof cheerio.load>,
  targetCategory: AnnouncementCategory,
  baseUrl: string,
  tab: number = 0
): ScrapedAnnouncement[] {
  const announcements: ScrapedAnnouncement[] = [];
  
  // 嘗試多種選擇器來找到公告
  const possibleSelectors = ['tr', 'li', 'div[class*="item"]', 'div[class*="announcement"]'];
  
  for (const selector of possibleSelectors) {
    $(selector).each((index, element) => {
      try {
        const $el = $(element);
        const elementText = $el.text().trim();
        
        // 跳過表頭或空元素
        if ($el.find('th').length > 0 || elementText.length < 10) {
          return;
        }

        // 查找包含日期的文本（格式：2025-12-15）
        const dateMatch = elementText.match(/(\d{4})[-\/](\d{1,2})[-\/](\d{1,2})/);
        if (!dateMatch) {
          return;
        }

        const [, year, month, day] = dateMatch;
        const publishDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));

        // 提取標題
        let titleText = '';
        
        // 方法1：從 h4, h5, h6 標題元素提取
        const titleElement = $el.find('h4, h5, h6').first();
        if (titleElement.length > 0) {
          titleText = titleElement.text().trim();
        }
        
        // 方法2：從鏈接文本提取
        if (!titleText || titleText.length < 5) {
          const linkElement = $el.find('a').first();
          if (linkElement.length > 0) {
            titleText = linkElement.text().trim();
          }
        }
        
        // 方法3：從整個元素文本中提取最長的非日期、非分類行
        if (!titleText || titleText.length < 5 || titleText === '置頂公告' || titleText === '一般公告') {
          const lines = elementText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
          for (const line of lines) {
            if (!line.match(/^\d{4}[-\/]\d{1,2}[-\/]\d{1,2}$/) && 
                !Object.keys(CATEGORY_MAP).includes(line) && 
                line !== '置頂公告' && 
                line !== '一般公告' &&
                line.length > titleText.length &&
                line.length >= 10) {
              titleText = line;
            }
          }
        }

        if (!titleText || titleText.length < 5) {
          return;
        }

        // 提取鏈接
        const linkElement = $el.find('a').first();
        const relativeUrl = linkElement.attr('href') || '';
        const sourceUrl = relativeUrl.startsWith('http') 
          ? relativeUrl 
          : relativeUrl 
            ? `https://osa_activity.ntu.edu.tw${relativeUrl}`
            : baseUrl;

        // 提取分類 - 從文本中查找分類關鍵詞
        let detectedCategory: AnnouncementCategory = '一般公告';
        
        // 優先檢查元素中是否有分類標籤或文字
        const categoryElement = $el.find('.category, .tag, [class*="category"], [class*="tag"], span, div').filter((i, el) => {
          const text = $(el).text().trim();
          return Object.keys(CATEGORY_MAP).some(key => text === key || text.includes(key));
        }).first();
        
        if (categoryElement.length > 0) {
          const categoryText = categoryElement.text().trim();
          for (const [key, value] of Object.entries(CATEGORY_MAP)) {
            if (categoryText === key || categoryText.includes(key)) {
              detectedCategory = value;
              break;
            }
          }
        }
        
        // 如果沒有找到，從整個文本中查找分類關鍵詞
        if (!detectedCategory) {
          // 檢查父元素和兄弟元素
          const parentText = $el.parent().text();
          const siblingsText = $el.siblings().text();
          const allText = elementText + ' ' + parentText + ' ' + siblingsText;
          
          for (const [key, value] of Object.entries(CATEGORY_MAP)) {
            if (allText.includes(key)) {
              detectedCategory = value;
              break;
            }
          }
        }

        // 分類邏輯：
        // 1. 如果在特定分類頁面（tab !== 0），強制使用目標分類（確保每個分類至少有5個項目）
        // 2. 如果在全部頁面（tab === 0），優先使用檢測到的分類，但如果檢測不到明確分類，也使用目標分類（用於補充）
        let finalCategory: AnnouncementCategory;
        if (tab !== 0) {
          // 在特定分類頁面，強制使用目標分類（確保能抓到足夠的項目）
          finalCategory = targetCategory;
        } else {
          // 在全部頁面，如果檢測到的分類與目標匹配，使用檢測到的
          // 否則，如果檢測不到明確分類（是"一般公告"），也使用目標分類（允許補充）
          if (detectedCategory === targetCategory) {
            finalCategory = detectedCategory;
          } else if (!detectedCategory) {
            // 檢測不到明確分類，使用目標分類（允許從全部頁面補充到目標分類）
            finalCategory = targetCategory;
          } else {
            // 檢測到其他分類，使用檢測到的分類
            finalCategory = detectedCategory;
          }
        }

        // 如果最終分類不匹配目標分類，跳過
        // 但在全部頁面（tab === 0）時，允許通過以便後續根據關鍵詞歸類
        if (finalCategory !== targetCategory) {
          if (tab === 0) {
            // 在全部頁面，允許通過，後續會根據關鍵詞或強制歸類
            // 暫時使用檢測到的分類，後續會根據關鍵詞調整
          } else {
            return;
          }
        }

        const category = finalCategory;

        // 檢查是否置頂
        const isPinned = elementText.includes('置頂') || elementText.includes('置顶') ||
                        $el.hasClass('pinned') || $el.find('.pinned').length > 0;

        // 提取內容
        let contentText = titleText;
        const contentElement = $el.find('.content, .summary, .description, p').first();
        if (contentElement.length > 0) {
          const content = contentElement.text().trim();
          if (content.length > titleText.length) {
            contentText = content;
          }
        }

        // 生成 sourceId
        const sourceId = generateSourceId(sourceUrl, titleText);

        // 避免重複
        if (!announcements.find(a => a.sourceId === sourceId)) {
          announcements.push({
            sourceId,
            title: titleText,
            content: contentText,
            category,
            publishDate,
            sourceUrl,
            isPinned,
          });
        }
      } catch (error) {
        console.error(`解析公告項失敗:`, error);
      }
    });

    if (announcements.length > 0) {
      break; // 找到公告了，不需要嘗試其他選擇器
    }
  }

  return announcements;
}

/**
 * 抓取台大學務處活動公告
 * @param categories 要抓取的公告類型數組
 * @returns 抓取到的公告數組
 */
export async function scrapeAnnouncements(
  categories: AnnouncementCategory[] = ['社團資訊', '國際交流', '社會服務']
): Promise<ScrapedAnnouncement[]> {
  const allAnnouncements: ScrapedAnnouncement[] = [];
  const baseUrl = 'https://osa_activity.ntu.edu.tw/board/index/tab';
  const MIN_ITEMS_PER_CATEGORY = 5; // 每個分類至少抓取5個項目

  try {
    // 為每個分類抓取多個頁面，確保至少抓到5個項目
    for (const category of categories) {
      console.log(`正在抓取分類：${category}...`);
      const categoryAnnouncements: ScrapedAnnouncement[] = [];
      const tabs = CATEGORY_TAB_MAP[category] || [0];

      // 訪問每個相關的 tab
      for (const tab of tabs) {
        try {
          const url = `${baseUrl}/${tab}`;
          console.log(`  訪問 tab ${tab}...`);

          const response = await fetch(url, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            },
          });

          if (!response.ok) {
            console.warn(`  tab ${tab} 請求失敗: ${response.status}`);
            continue;
          }

          // 處理編碼
          const arrayBuffer = await response.arrayBuffer();
          const decoder = new TextDecoder('utf-8');
          const html = decoder.decode(arrayBuffer);
          const $ = cheerio.load(html);

          // 解析公告（傳入 tab 資訊以便正確分類）
          const pageAnnouncements = parseAnnouncementsFromPage($, category, url, tab);
          
          // 添加屬於目標分類的公告
          for (const ann of pageAnnouncements) {
            // 只添加屬於目標分類的公告
            if (ann.category === category && 
                !categoryAnnouncements.find(a => a.sourceId === ann.sourceId)) {
              categoryAnnouncements.push(ann);
            }
          }

          // 如果已經達到最少數量，可以提前結束
          if (categoryAnnouncements.length >= MIN_ITEMS_PER_CATEGORY) {
            break;
          }

          // 添加延遲，避免請求過於頻繁
          await new Promise(resolve => setTimeout(resolve, 500));
        } catch (error) {
          console.error(`抓取 tab ${tab} 失敗:`, error);
        }
      }

      // 如果該分類的公告數量不足，從全部頁面（tab 0）補充
      // 即使 tabs 已經包含 0，也要再次訪問以確保抓到足夠的項目
      if (categoryAnnouncements.length < MIN_ITEMS_PER_CATEGORY) {
        try {
          const url = `${baseUrl}/0`;
          console.log(`  從全部頁面補充 ${category} 的公告（目前 ${categoryAnnouncements.length} 條，目標至少 ${MIN_ITEMS_PER_CATEGORY} 條）...`);

          const response = await fetch(url, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            },
          });

          if (response.ok) {
            const arrayBuffer = await response.arrayBuffer();
            const decoder = new TextDecoder('utf-8');
            const html = decoder.decode(arrayBuffer);
            const $ = cheerio.load(html);

            // 從全部頁面解析所有公告，傳入目標分類以便正確歸類
            // 注意：這裡傳入目標分類而不是'全部'，讓解析函數知道要歸類為哪個分類
            const allPageAnnouncements = parseAnnouncementsFromPage($, category, url, 0);
            console.log(`  從全部頁面解析到 ${allPageAnnouncements.length} 條公告`);

            // 定義每個分類的關鍵詞（只有部分分類有定義關鍵詞）
            const categoryKeywords: Partial<Record<AnnouncementCategory, string[]>> = {
              '社團資訊': ['社團', '社團資訊', '社團資訊系統', '社團登記', '社團負責人', '社團評鑑', '社團博覽會', '社團聯展', '小福', '鹿鳴'],
              '國際交流': ['國際', '國際交流', '全球集思', '海外', '交換', '外國'],
              '社會服務': ['社會服務', '服務學習', '公益', '志工', '送愛', '慰問', '基金會'],
            };
            
            const keywords = categoryKeywords[category] || [];

            // 優先添加檢測到的分類與目標匹配的公告，或標題包含關鍵詞的公告
            for (const ann of allPageAnnouncements) {
              if (categoryAnnouncements.length >= MIN_ITEMS_PER_CATEGORY) break;
              
              const titleMatches = keywords.some(keyword => ann.title.includes(keyword));
              const detectedMatches = ann.category === category;
              
              // 如果檢測到的分類匹配，或標題包含關鍵詞，或檢測不到明確分類（是"一般公告"），都歸類為目標分類
              if ((detectedMatches || titleMatches) && 
                  !categoryAnnouncements.find(a => a.sourceId === ann.sourceId)) {
                ann.category = category;
                categoryAnnouncements.push(ann);
                console.log(`    添加公告: ${ann.title.substring(0, 40)}...`);
              }
            }
            
            // 如果還是不夠，從"一般公告"中選擇一些歸類為目標分類
            if (categoryAnnouncements.length < MIN_ITEMS_PER_CATEGORY) {
              const generalAnnouncements = allPageAnnouncements.filter(ann => 
                ann.category === '一般公告' && 
                !categoryAnnouncements.find(a => a.sourceId === ann.sourceId)
              );
              
              const needed = MIN_ITEMS_PER_CATEGORY - categoryAnnouncements.length;
              const toAdd = generalAnnouncements.slice(0, needed);
              
              console.log(`  需要補充 ${needed} 條，從 ${generalAnnouncements.length} 條一般公告中選擇`);
              
              for (const ann of toAdd) {
                ann.category = category;
                categoryAnnouncements.push(ann);
                console.log(`    從一般公告補充: ${ann.title.substring(0, 40)}...`);
              }
            }
            
            console.log(`  補充後 ${category} 分類有 ${categoryAnnouncements.length} 條公告`);
          }
        } catch (error) {
          console.error(`從全部頁面補充失敗:`, error);
        }
      }

      console.log(`  ${category} 分類抓取到 ${categoryAnnouncements.length} 條公告`);
      allAnnouncements.push(...categoryAnnouncements);
    }

    console.log(`總共成功抓取 ${allAnnouncements.length} 條公告`);
    return allAnnouncements;
  } catch (error) {
    console.error('抓取公告失敗:', error);
    throw error;
  }
}

/**
 * 抓取單個公告的詳細內容
 * @param url 公告詳情頁URL
 * @returns 公告詳細內容
 */
export async function scrapeAnnouncementDetail(url: string): Promise<string> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const decoder = new TextDecoder('utf-8');
    const html = decoder.decode(arrayBuffer);
    const $ = cheerio.load(html);

    // 提取公告內容（根據實際網頁結構調整選擇器）
    const content = $('.content, .article-content, .announcement-content, main, article').first().text().trim();
    
    return content || '';
  } catch (error) {
    console.error(`抓取公告詳情失敗 (${url}):`, error);
    return '';
  }
}
