/**
 * 台大教室爬蟲腳本
 * 爬取 https://gra206.aca.ntu.edu.tw/classrm/acarm/webcr-use-new 上的所有教室資料
 */

import * as cheerio from 'cheerio';

interface Building {
  value: string;
  name: string;
}

interface Classroom {
  buildingValue: string;
  buildingName: string;
  classroomId: string;
  classroomName: string;
}

interface ClassroomApiResponse {
  status: string;
  room_ls: Array<{
    cr_no: string;  // 教室編號，例如 "共101", "普301"
  }>;
}

const BASE_URL = 'https://gra206.aca.ntu.edu.tw/classrm/acarm/webcr-use-new';
const CLASSROOM_API = 'https://gra206.aca.ntu.edu.tw/classrm/acarm/get-classroom-by-building';

/**
 * 從網頁獲取 HTML 內容
 */
async function fetchPage(url: string): Promise<string> {
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'zh-TW,zh;q=0.9,en-US;q=0.8,en;q=0.7',
    },
  });
  
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return await response.text();
}

/**
 * 從 API 獲取特定建物的教室列表
 */
async function fetchClassroomsByBuilding(buildingValue: string): Promise<ClassroomApiResponse> {
  const url = `${CLASSROOM_API}?building=${encodeURIComponent(buildingValue)}`;
  
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'application/json',
      'Accept-Language': 'zh-TW,zh;q=0.9,en-US;q=0.8,en;q=0.7',
      'Referer': BASE_URL,
    },
  });
  
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return await response.json();
}

/**
 * 獲取所有建物/學院選項
 */
function parseBuildings($: ReturnType<typeof cheerio.load>): Building[] {
  const buildings: Building[] = [];
  
  $('#BuildingDDL option').each((_, optionEl) => {
    const value = $(optionEl).attr('value') || '';
    const name = $(optionEl).text().trim();
    
    // 跳過空值和「全部」選項
    if (value && value !== '' && value !== '%' && name) {
      buildings.push({ value, name });
    }
  });

  return buildings;
}

/**
 * 主要爬蟲函數
 */
async function scrapeClassrooms(): Promise<Classroom[]> {
  console.log('🏫 開始爬取台大教室資料...\n');
  console.log(`📍 目標網址: ${BASE_URL}\n`);

  const allClassrooms: Classroom[] = [];

  try {
    // 步驟 1: 獲取首頁，解析建物選項
    console.log('📄 步驟 1: 獲取首頁，解析建物選項...');
    const html = await fetchPage(BASE_URL);
    const $ = cheerio.load(html);

    // 解析建物選項
    const buildings = parseBuildings($);
    console.log(`\n找到 ${buildings.length} 個建物/學院:`);
    buildings.forEach((b, i) => console.log(`  ${i + 1}. ${b.name} (${b.value})`));

    // 步驟 2: 對每個建物調用 API 獲取教室
    console.log('\n🔍 步驟 2: 獲取各建物的教室...\n');
    
    for (let i = 0; i < buildings.length; i++) {
      const building = buildings[i];
      console.log(`處理建物 ${i + 1}/${buildings.length}: ${building.name}...`);
      
      try {
        const data = await fetchClassroomsByBuilding(building.value);
        
        if (data.room_ls && Array.isArray(data.room_ls)) {
          for (const room of data.room_ls) {
            allClassrooms.push({
              buildingValue: building.value,
              buildingName: building.name,
              classroomId: room.cr_no,
              classroomName: room.cr_no,  // 教室編號同時作為名稱
            });
          }
          console.log(`  ✅ 找到 ${data.room_ls.length} 間教室`);
        } else {
          console.log(`  ⚠️ 無教室資料`);
        }
        
        // 避免請求過於頻繁
        await new Promise(resolve => setTimeout(resolve, 200));
      } catch (error) {
        console.error(`  ❌ 獲取失敗:`, error instanceof Error ? error.message : error);
      }
    }

    // 步驟 3: 也獲取「全部」選項的教室（可能有遺漏的）
    console.log('\n🔍 步驟 3: 獲取「全部」選項的教室...');
    try {
      const allData = await fetchClassroomsByBuilding('%');
      
      if (allData.room_ls && Array.isArray(allData.room_ls)) {
        let addedCount = 0;
        for (const room of allData.room_ls) {
          const exists = allClassrooms.some(c => c.classroomId === room.cr_no);
          if (!exists) {
            allClassrooms.push({
              buildingValue: '%',
              buildingName: '其他',
              classroomId: room.cr_no,
              classroomName: room.cr_no,
            });
            addedCount++;
          }
        }
        console.log(`  ✅ 補充了 ${addedCount} 間教室`);
      }
    } catch (error) {
      console.error(`  ❌ 獲取失敗:`, error instanceof Error ? error.message : error);
    }

    console.log(`\n========================================`);
    console.log(`🎉 爬取完成！共找到 ${allClassrooms.length} 間教室`);
    console.log(`========================================\n`);

    // 輸出結果摘要
    if (allClassrooms.length > 0) {
      console.log('📋 教室列表摘要:');
      
      // 按建物分組顯示
      const byBuilding = allClassrooms.reduce((acc, classroom) => {
        const key = classroom.buildingName || '未分類';
        if (!acc[key]) acc[key] = [];
        acc[key].push(classroom);
        return acc;
      }, {} as Record<string, Classroom[]>);

      for (const [buildingName, classrooms] of Object.entries(byBuilding)) {
        console.log(`\n【${buildingName}】(${classrooms.length} 間)`);
        // 只顯示前 5 間作為預覽
        const preview = classrooms.slice(0, 5);
        preview.forEach(c => {
          console.log(`  - ${c.classroomName} (${c.classroomId})`);
        });
        if (classrooms.length > 5) {
          console.log(`  ... 還有 ${classrooms.length - 5} 間`);
        }
      }
    }

    return allClassrooms;

  } catch (error) {
    console.error('❌ 爬取失敗:', error);
    throw error;
  }
}

/**
 * 將教室資料儲存為 JSON 檔案
 */
async function saveToJson(classrooms: Classroom[], filename: string): Promise<void> {
  const fs = await import('fs/promises');
  const path = await import('path');
  
  const outputPath = path.join(process.cwd(), 'src', 'data', filename);
  
  // 確保目錄存在
  const dir = path.dirname(outputPath);
  await fs.mkdir(dir, { recursive: true });
  
  await fs.writeFile(outputPath, JSON.stringify(classrooms, null, 2), 'utf-8');
  console.log(`\n💾 已儲存到: ${outputPath}`);
}

/**
 * 生成 TypeScript 類型檔案
 */
async function saveAsTypeScript(classrooms: Classroom[], filename: string): Promise<void> {
  const fs = await import('fs/promises');
  const path = await import('path');
  
  const outputPath = path.join(process.cwd(), 'src', 'data', filename);
  
  // 按建物分組
  const byBuilding = classrooms.reduce((acc, classroom) => {
    const key = classroom.buildingName;
    if (!acc[key]) acc[key] = [];
    acc[key].push(classroom);
    return acc;
  }, {} as Record<string, Classroom[]>);

  let content = `/**
 * 台大教室資料
 * 自動生成於 ${new Date().toISOString()}
 * 來源: https://gra206.aca.ntu.edu.tw/classrm/acarm/webcr-use-new
 */

export interface Classroom {
  buildingValue: string;
  buildingName: string;
  classroomId: string;
  classroomName: string;
}

export const BUILDINGS = ${JSON.stringify(Object.keys(byBuilding), null, 2)} as const;

export type BuildingName = typeof BUILDINGS[number];

export const CLASSROOMS: Classroom[] = ${JSON.stringify(classrooms, null, 2)};

/**
 * 按建物分組的教室資料
 */
export const CLASSROOMS_BY_BUILDING: Record<string, Classroom[]> = ${JSON.stringify(byBuilding, null, 2)};

/**
 * 取得特定建物的教室列表
 */
export function getClassroomsByBuilding(buildingName: string): Classroom[] {
  return CLASSROOMS_BY_BUILDING[buildingName] || [];
}

/**
 * 根據教室 ID 查找教室
 */
export function getClassroomById(classroomId: string): Classroom | undefined {
  return CLASSROOMS.find(c => c.classroomId === classroomId);
}

/**
 * 搜尋教室（依名稱）
 */
export function searchClassrooms(query: string): Classroom[] {
  const lowerQuery = query.toLowerCase();
  return CLASSROOMS.filter(c => 
    c.classroomName.toLowerCase().includes(lowerQuery) ||
    c.classroomId.toLowerCase().includes(lowerQuery)
  );
}

export default CLASSROOMS;
`;

  await fs.writeFile(outputPath, content, 'utf-8');
  console.log(`💾 已儲存 TypeScript 檔案到: ${outputPath}`);
}

// 執行爬蟲
scrapeClassrooms()
  .then(async (classrooms) => {
    if (classrooms.length > 0) {
      // 儲存為 JSON
      await saveToJson(classrooms, 'classrooms.json');
      // 儲存為 TypeScript
      await saveAsTypeScript(classrooms, 'classrooms.ts');
    }
  })
  .catch(console.error);

export { scrapeClassrooms, type Classroom, type Building };
