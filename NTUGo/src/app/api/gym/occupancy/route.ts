import { NextResponse } from 'next/server';
import axios from 'axios';
import * as cheerio from 'cheerio';

interface GymOccupancy {
  fitnessCenter: {
    current: number;
    optimal: number;
    max: number;
  };
  swimmingPool: {
    current: number;
    optimal: number;
    max: number;
  };
  lastUpdated: string;
}

// 從文字中提取人數資訊
function extractNumbersFromText(text: string, keyword: string): { current: number; optimal: number; max: number } {
  const section = text.match(new RegExp(`${keyword}[\\s\\S]{0,500}`, 'i'));
  if (!section) return { current: 0, optimal: 0, max: 0 };

  const sectionText = section[0];
  const currentMatch = sectionText.match(/(\d+)\s*現在人數/i);
  const optimalMatch = sectionText.match(/(\d+)\s*最適人數/i);
  const maxMatch = sectionText.match(/(\d+)\s*最大/i);

  return {
    current: currentMatch ? parseInt(currentMatch[1]) : 0,
    optimal: optimalMatch ? parseInt(optimalMatch[1]) : 0,
    max: maxMatch ? parseInt(maxMatch[1]) : 0,
  };
}

// 計算擁擠程度
function calculateStatus(occupancy: GymOccupancy): string {
  const fitnessRatio = occupancy.fitnessCenter.max > 0
    ? occupancy.fitnessCenter.current / occupancy.fitnessCenter.max
    : 0;
  const poolRatio = occupancy.swimmingPool.max > 0
    ? occupancy.swimmingPool.current / occupancy.swimmingPool.max
    : 0;
  const maxRatio = Math.max(fitnessRatio, poolRatio);

  if (maxRatio >= 0.9) return '擁擠';
  if (maxRatio >= 0.7) return '較多';
  if (maxRatio <= 0.3) return '較少';
  return '適中';
}

export async function GET() {
  try {
    const url = 'https://rent.pe.ntu.edu.tw/';

    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'zh-TW,zh;q=0.9,en;q=0.8',
    };
    // 使用 axios 獲取網頁內容
    const response = await axios.get(url, { headers });

    const html = response.data;
    const $ = cheerio.load(html);

    // 獲取最後更新時間
    const lastUpdatedMatch = $('body').text().match(/最後更新時間[\s\S]*?(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2})/);
    const lastUpdated = lastUpdatedMatch ? lastUpdatedMatch[1] : new Date().toISOString();

    // 初始化數據
    let occupancy: GymOccupancy = {
      fitnessCenter: { current: 0, optimal: 0, max: 0 },
      swimmingPool: { current: 0, optimal: 0, max: 0 },
      lastUpdated,
    };

    // 方法1: 使用 CMCItem 結構解析（新結構）
    const cmcItems = $('div.CMCItem');
    
    if (cmcItems.length > 0) {
      cmcItems.each((_, item) => {
        const itemText = $(item).text();
        const iciElements = $(item).find('div.ICI');
        const numbers: number[] = [];
        
        iciElements.each((_, element) => {
          const spanText = $(element).find('span').text().trim();
          const num = parseInt(spanText);
          if (!isNaN(num)) {
            numbers.push(num);
          }
        });
        
        // 根據 IT 文字判斷是哪個場地
        if (itemText.includes('健身中心') && numbers.length >= 3) {
          occupancy.fitnessCenter = {
            current: numbers[0], // 現在人數
            optimal: numbers[1], // 最適人數
            max: numbers[2],      // 最大乘載人數
          };
        } else if (itemText.includes('室內游泳池') && numbers.length >= 3) {
          occupancy.swimmingPool = {
            current: numbers[0], // 現在人數
            optimal: numbers[1], // 最適人數
            max: numbers[2],      // 最大乘載人數
          };
        }
      });
    }
    
    // 方法1b: 如果 CMCItem 方法失敗（max 都是 0），嘗試使用 ICI class 元素（舊方法）
    if (occupancy.fitnessCenter.max === 0 && occupancy.swimmingPool.max === 0) {
      const iciElements = $('div.ICI');
      const numbers: number[] = [];

      if (iciElements.length > 0) {
        iciElements.each((_, element) => {
          const spanText = $(element).find('span').text().trim();
          const num = parseInt(spanText);
          if (!isNaN(num)) {
            numbers.push(num);
          }
        });

        // 如果有 6 個數字，按順序分配
        if (numbers.length >= 6) {
          occupancy.fitnessCenter = {
            current: numbers[0],
            optimal: numbers[1],
            max: numbers[2],
          };
          occupancy.swimmingPool = {
            current: numbers[3],
            optimal: numbers[4],
            max: numbers[5],
          };
        }
      }
    }

    // 方法2: 如果前面的方法都失敗（max 都是 0），使用文字匹配
    if (occupancy.fitnessCenter.max === 0 && occupancy.swimmingPool.max === 0) {
      const bodyText = $('body').text();
      occupancy.fitnessCenter = extractNumbersFromText(bodyText, '健身中心');
      occupancy.swimmingPool = extractNumbersFromText(bodyText, '室內游泳池');
    }

    // 檢查是否有有效數據（只要 max > 0 就表示有有效數據，current 可以是 0）
    const hasValidData = (occupancy.fitnessCenter.max > 0 || occupancy.swimmingPool.max > 0);

    if (!hasValidData) {
      return NextResponse.json(
        {
          success: false,
          message: '目前無法獲取體育館人數資訊',
          error: '數據解析失敗',
        },
        { status: 200 }
      );
    }

    const status = calculateStatus(occupancy);

    return NextResponse.json({
      success: true,
      data: occupancy,
      status,
      totalCurrent: occupancy.fitnessCenter.current + occupancy.swimmingPool.current,
      totalMax: occupancy.fitnessCenter.max + occupancy.swimmingPool.max,
    });
  } catch (error: any) {
    console.error('[Gym API] 錯誤:', error.message);

    // 處理 axios 錯誤
    if (error.response) {
      // 服務器回應了錯誤狀態碼
      return NextResponse.json(
        {
          success: false,
          message: `體育館網站回應錯誤 (狀態碼: ${error.response.status})`,
          error: `HTTP ${error.response.status}`,
        },
        { status: 500 }
      );
    } else if (error.request) {
      // 請求已發出但沒有收到回應
      return NextResponse.json(
        {
          success: false,
          message: '無法連接到體育館網站，請檢查網絡連接',
          error: 'Network error',
        },
        { status: 500 }
      );
    } else {
      // 其他錯誤
      return NextResponse.json(
        {
          success: false,
          message: '無法獲取體育館人數資訊',
          error: error.message || 'Unknown error',
        },
        { status: 500 }
      );
    }
  }
}
