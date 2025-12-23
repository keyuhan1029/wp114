import { NextResponse } from 'next/server';
import axios from 'axios';
import * as cheerio from 'cheerio';

interface StudyRoomInfo {
  occupied: number;
  available: number;
  total: number;
}

interface LibraryInfo {
  openingHours: {
    today: string;
    status: string; // '開館中' | '閉館'
    hours: string; // 例如: "08:00-22:00"
  };
  studyRoom: StudyRoomInfo;
  // 社科圖自習室
  socialScienceStudyRoom?: StudyRoomInfo;
  lastUpdated: string;
}

export async function GET() {
  try {
    // 抓取首頁獲取開館時間
    const homeResponse = await axios.get('https://www.lib.ntu.edu.tw/', {
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'zh-TW,zh;q=0.9,en;q=0.8',
      },
    });

    const homeHtml = homeResponse.data;
    const $home = cheerio.load(homeHtml);

    // 提取開館時間資訊 - 優先從「今日開館」文字提取
    let openingHours = {
      today: '',
      status: '未知',
      hours: '',
    };

    // 方法1: 優先從整個 HTML 原始內容中查找包含時間的「今日開館」文字
    // 查找格式：今日開館：8:00-22:00 或 今日開館: 8:00-22:00
    const htmlContent = homeHtml;
    const todayOpenWithTimeMatch = htmlContent.match(/今日開館[：:\s]+(\d{1,2}:\d{2})\s*[-~]\s*(\d{1,2}:\d{2})/i);
    if (todayOpenWithTimeMatch) {
      openingHours.hours = `${todayOpenWithTimeMatch[1]}-${todayOpenWithTimeMatch[2]}`;
      openingHours.today = `今日開館: ${openingHours.hours}`;
      console.log('從 HTML 原始內容找到「今日開館」時間:', openingHours.hours);
    }
    
    // 方法1b: 如果沒找到，從 body 文字中查找（cheerio 解析後的文字內容）
    if (!openingHours.hours && openingHours.status !== '閉館') {
      const bodyText = $home('body').text();
      const todayMatch = bodyText.match(/今日開館[：:\s]+(\d{1,2}:\d{2})\s*[-~]\s*(\d{1,2}:\d{2})/i);
      if (todayMatch) {
        openingHours.hours = `${todayMatch[1]}-${todayMatch[2]}`;
        openingHours.today = `今日開館: ${openingHours.hours}`;
        console.log('從 body 文字找到「今日開館」時間:', openingHours.hours);
      }
    }
    
    // 方法1c: 如果還是沒找到，從 #open_time 元素中查找
    if (!openingHours.hours && openingHours.status !== '閉館') {
      const openTimeElement = $home('#open_time');
      if (openTimeElement.length > 0) {
        const timeText = openTimeElement.text().trim();
        console.log('#open_time 元素文字:', timeText);
        
        if (timeText === '閉館') {
          openingHours.status = '閉館';
          openingHours.hours = '';
        } else if (timeText) {
          const timeMatch = timeText.match(/(\d{1,2}:\d{2})\s*[-~]\s*(\d{1,2}:\d{2})/);
          if (timeMatch) {
            openingHours.hours = `${timeMatch[1]}-${timeMatch[2]}`;
            openingHours.today = `今日開館: ${openingHours.hours}`;
            console.log('從 #open_time 元素找到時間:', openingHours.hours);
          }
        }
      }
    }
    
    // 方法2: 備用方法 - 嘗試從 API 獲取今日開館時間
    if (!openingHours.hours && openingHours.status !== '閉館') {
      try {
        const now = new Date();
        const taiwanTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Taipei' }));
        const todayStr = `${taiwanTime.getFullYear()}-${taiwanTime.getMonth() + 1}-${taiwanTime.getDate()}`;
        
        const holidayResponse = await axios.get('https://www.lib.ntu.edu.tw/page/stat/output/holiday_config.json', {
          timeout: 10000,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          },
        });
        
        const holidayData = holidayResponse.data;
        if (Array.isArray(holidayData)) {
          // 查找今天的數據
          const todayData = holidayData.find((item: any) => item.date === todayStr);
          if (todayData && todayData.open_time) {
            const openTime = todayData.open_time.trim();
            if (openTime === '閉館' || openTime.includes('閉館')) {
              openingHours.status = '閉館';
              openingHours.hours = '';
            } else {
              // 提取時間格式：8:00-22:00
              const timeMatch = openTime.match(/(\d{1,2}:\d{2})\s*[-~]\s*(\d{1,2}:\d{2})/);
              if (timeMatch) {
                openingHours.hours = `${timeMatch[1]}-${timeMatch[2]}`;
                openingHours.today = `今日開館: ${openingHours.hours}`;
                console.log('從 API 找到今日開館時間:', openingHours.hours);
              }
            }
          }
        }
      } catch (apiError: any) {
        console.log('無法從 API 獲取開館時間:', apiError.message);
      }
    }

    // 檢查是否開館中 - 優先根據當前時間判斷
    if (openingHours.status === '未知') {
      // 如果有開館時間，優先根據當前時間判斷
      if (openingHours.hours) {
        const now = new Date();
        const taiwanTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Taipei' }));
        const currentHour = taiwanTime.getHours();
        const currentMinute = taiwanTime.getMinutes();
        const currentTime = currentHour * 60 + currentMinute;
        
        const [openTime, closeTime] = openingHours.hours.split('-');
        const [openHour, openMin] = openTime.split(':').map(Number);
        const [closeHour, closeMin] = closeTime.split(':').map(Number);
        const openTimeMinutes = openHour * 60 + openMin;
        const closeTimeMinutes = closeHour * 60 + closeMin;
        
        // 根據當前時間判斷是否在開館時間內
        if (currentTime >= openTimeMinutes && currentTime < closeTimeMinutes) {
          openingHours.status = '開館中';
        } else {
          openingHours.status = '閉館';
        }
      } else {
        // 如果沒有開館時間，才使用頁面文字判斷
        const bodyText = $home('body').text();
        const openTimeText = $home('#open_time').text().trim();
        
        // 如果 #open_time 顯示「閉館」
        if (openTimeText === '閉館') {
          openingHours.status = '閉館';
        } else if (bodyText.includes('開館中') || bodyText.includes('開放中')) {
          openingHours.status = '開館中';
        } else if (bodyText.includes('閉館') || bodyText.includes('休館')) {
          openingHours.status = '閉館';
        }
      }
    }
    
    // 如果沒有 today 信息且有開館時間，設置它
    if (!openingHours.today && openingHours.hours) {
      openingHours.today = `今日開館: ${openingHours.hours}`;
    }
    
    console.log('開館時間解析結果:', openingHours);

    // 抓取自習室座位資訊
    // 先訪問主頁面，找到 iframe URL
    const statsResponse = await axios.get('https://www.lib.ntu.edu.tw/node/2540', {
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'zh-TW,zh;q=0.9,en;q=0.8',
      },
    });

    const statsHtml = statsResponse.data;
    let $stats = cheerio.load(statsHtml);
    
    // 查找 iframe URL
    let iframeUrl = '';
    $stats('iframe').each((_, element) => {
      const src = $stats(element).attr('src');
      if (src && src.includes('studyroom')) {
        iframeUrl = src;
        console.log('找到 iframe URL:', iframeUrl);
        return false;
      }
    });
    
    // 如果找到 iframe URL，訪問它
    let studyRoomHtml = statsHtml;
    if (iframeUrl) {
      // 處理相對路徑
      const fullIframeUrl = iframeUrl.startsWith('http') 
        ? iframeUrl 
        : `https://www.lib.ntu.edu.tw${iframeUrl.startsWith('/') ? '' : '/'}${iframeUrl}`;
      
      console.log('訪問 iframe URL:', fullIframeUrl);
      
      try {
        const iframeResponse = await axios.get(fullIframeUrl, {
          timeout: 10000,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'zh-TW,zh;q=0.9,en;q=0.8',
            'Referer': 'https://www.lib.ntu.edu.tw/node/2540',
          },
        });
        
        studyRoomHtml = iframeResponse.data;
        console.log('iframe HTML 長度:', studyRoomHtml.length);
        $stats = cheerio.load(studyRoomHtml);
      } catch (iframeError: any) {
        console.error('訪問 iframe 失敗:', iframeError.message);
        // 繼續使用主頁面的 HTML
      }
    }

    let studyRoom = {
      occupied: 0,
      available: 0,
      total: 0,
    };

    // 社科圖自習室座位
    let socialScienceStudyRoom = {
      occupied: 0,
      available: 0,
      total: 0,
    };

    // 直接從 JavaScript 變量中提取數據（根據實際 HTML 結構）
    // 總圖：jsonstr = [{"count":651}] - 尚有座位, jsonstr2 = [{"count":814}] - 總座位數
    // 社科圖：jsonstr3 = [{"count":128}] - 尚有座位, jsonstr4 = [{"count":133}] - 總座位數
    
    const statsScriptTags = $stats('script').toArray();
    
    for (const script of statsScriptTags) {
      const scriptContent = $stats(script).html() || '';
      
      // 總圖：直接查找 jsonstr 和 jsonstr2 變量定義
      const jsonstrMatch = scriptContent.match(/var\s+jsonstr\s*=\s*\[\s*\{\s*"count"\s*:\s*(\d+)\s*\}\s*\]/i);
      const jsonstr2Match = scriptContent.match(/var\s+jsonstr2\s*=\s*\[\s*\{\s*"count"\s*:\s*(\d+)\s*\}\s*\]/i);
      
      if (jsonstrMatch && jsonstr2Match) {
        const vacancy = parseInt(jsonstrMatch[1]);
        const total = parseInt(jsonstr2Match[1]);
        studyRoom.available = vacancy;
        studyRoom.total = total;
        studyRoom.occupied = total - vacancy;
        console.log('總圖從 jsonstr 變量找到數據:', { available: studyRoom.available, total: studyRoom.total, occupied: studyRoom.occupied });
      }

      // 社科圖：查找 jsonstr3 和 jsonstr4 變量定義
      const jsonstr3Match = scriptContent.match(/var\s+jsonstr3\s*=\s*\[\s*\{\s*"count"\s*:\s*(\d+)\s*\}\s*\]/i);
      const jsonstr4Match = scriptContent.match(/var\s+jsonstr4\s*=\s*\[\s*\{\s*"count"\s*:\s*(\d+)\s*\}\s*\]/i);
      
      if (jsonstr3Match && jsonstr4Match) {
        const ssVacancy = parseInt(jsonstr3Match[1]);
        const ssTotal = parseInt(jsonstr4Match[1]);
        socialScienceStudyRoom.available = ssVacancy;
        socialScienceStudyRoom.total = ssTotal;
        socialScienceStudyRoom.occupied = ssTotal - ssVacancy;
        console.log('社科圖從 jsonstr3/4 變量找到數據:', { 
          available: socialScienceStudyRoom.available, 
          total: socialScienceStudyRoom.total, 
          occupied: socialScienceStudyRoom.occupied 
        });
      }
    }
    
    // 如果總圖沒找到，嘗試查找計算後的變量
    if (studyRoom.total === 0) {
      for (const script of statsScriptTags) {
        const scriptContent = $stats(script).html() || '';
        
        // 查找 StudyRoom_vacancy 和 StudyRoom_inhouse（計算後的變量）
        const vacancyMatch = scriptContent.match(/var\s+StudyRoom_vacancy\s*=\s*(\d+)/i);
        const inhouseMatch = scriptContent.match(/var\s+StudyRoom_inhouse\s*=\s*(\d+)/i);
        const totalMatch = scriptContent.match(/var\s+StudyRoom_total_seat\s*=\s*(\d+)/i);
        
        if (studyRoom.total > 0 || (studyRoom.available > 0 && studyRoom.occupied > 0)) {
          if (!studyRoom.total) {
            studyRoom.total = studyRoom.occupied + studyRoom.available;
          }
          break;
        }
      }
    }

    // 如果社科圖沒找到，嘗試查找計算後的變量
    if (socialScienceStudyRoom.total === 0) {
      for (const script of statsScriptTags) {
        const scriptContent = $stats(script).html() || '';
        
        // 查找 koolib_ava 和 koolib_un（社科圖計算後的變量）
        const koollibAvaMatch = scriptContent.match(/var\s+koolib_ava\s*=\s*(\d+)/i);
        const koollibUnMatch = scriptContent.match(/var\s+koolib_un\s*=\s*(\d+)/i);
        const koollibTotalMatch = scriptContent.match(/var\s+koolib_total_seat\s*=\s*(\d+)/i);
        
        if (koollibAvaMatch) {
          socialScienceStudyRoom.available = parseInt(koollibAvaMatch[1]);
        }
        if (koollibUnMatch) {
          socialScienceStudyRoom.occupied = parseInt(koollibUnMatch[1]);
        }
        if (koollibTotalMatch) {
          socialScienceStudyRoom.total = parseInt(koollibTotalMatch[1]);
        } else if (socialScienceStudyRoom.available > 0 || socialScienceStudyRoom.occupied > 0) {
          socialScienceStudyRoom.total = socialScienceStudyRoom.available + socialScienceStudyRoom.occupied;
        }
        
        if (socialScienceStudyRoom.total > 0) {
          console.log('社科圖從 koolib 變量找到數據:', socialScienceStudyRoom);
          break;
        }
      }
    }
    
    console.log('最終提取結果 - 總圖:', { occupied: studyRoom.occupied, available: studyRoom.available, total: studyRoom.total });
    console.log('最終提取結果 - 社科圖:', { occupied: socialScienceStudyRoom.occupied, available: socialScienceStudyRoom.available, total: socialScienceStudyRoom.total });

    // 格式化最後更新時間為台灣時間
    const now = new Date();
    // 使用 toLocaleString 直接格式化為台灣時間，格式：YYYY-MM-DD HH:mm:ss
    const taiwanTimeStr = now.toLocaleString('zh-TW', { 
      timeZone: 'Asia/Taipei',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
    // 轉換格式：2025/12/1 23:47:04 -> 2025-12-01 23:47:04
    const lastUpdated = taiwanTimeStr
      .replace(/\//g, '-')
      .replace(/(\d{4})-(\d{1,2})-(\d{1,2})/, (_, year, month, day) => {
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      });
    
    const result: LibraryInfo = {
      openingHours,
      studyRoom,
      socialScienceStudyRoom: socialScienceStudyRoom.total > 0 ? socialScienceStudyRoom : undefined,
      lastUpdated,
    };
    
    console.log('返回的圖書館資訊:', JSON.stringify(result, null, 2));

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error('[Library API] 錯誤:', error.message);

    if (error.response) {
      return NextResponse.json(
        {
          success: false,
          message: `圖書館網站回應錯誤 (狀態碼: ${error.response.status})`,
          error: `HTTP ${error.response.status}`,
        },
        { status: 500 }
      );
    } else if (error.request) {
      return NextResponse.json(
        {
          success: false,
          message: '無法連接到圖書館網站，請檢查網絡連接',
          error: 'Network error',
        },
        { status: 500 }
      );
    } else {
      return NextResponse.json(
        {
          success: false,
          message: '無法獲取圖書館資訊',
          error: error.message || 'Unknown error',
        },
        { status: 500 }
      );
    }
  }
}

