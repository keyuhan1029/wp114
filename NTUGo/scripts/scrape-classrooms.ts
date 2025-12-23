/**
 * 台大教室爬蟲腳本
 * 爬取 https://gra206.aca.ntu.edu.tw/classrm/acarm/webcr-use-new 上的所有教室資料
 * 包含教室詳細資訊（位置、容量、型態、設備等）
 */

import * as cheerio from 'cheerio';

interface Building {
  value: string;
  name: string;
}

interface ClassroomDetail {
  classroomId: string;
  capacity: string;
  location: string;      // 真實建築物位置
  type: string;          // 教室型態（階梯、一般等）
  equipment: string;     // 硬體設備
  description: string;   // 教室描述
}

interface Classroom {
  buildingValue: string;
  buildingName: string;
  classroomId: string;
  classroomName: string;
  // 詳細資訊
  capacity?: string;
  location?: string;
  type?: string;
  equipment?: string;
  description?: string;
}

interface ClassroomApiResponse {
  status: string;
  room_ls: Array<{
    cr_no: string;
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
 * 獲取教室詳細資訊
 */
async function fetchClassroomDetail(buildingValue: string, classroomId: string): Promise<ClassroomDetail | null> {
  const url = `${BASE_URL}?SYearDDL=1141&BuildingDDL=${encodeURIComponent(buildingValue)}&RoomDDL=${encodeURIComponent(classroomId)}`;
  
  try {
    const html = await fetchPage(url);
    const $ = cheerio.load(html);
    
    // 找到教室資訊表格
    const infoTable = $('#ClassroomInfoGV_RoomInfoGV');
    if (infoTable.length === 0) {
      return null;
    }

    // 解析表格行
    const dataRow = infoTable.find('tr').eq(1); // 第二行是資料
    if (dataRow.length === 0) {
      return null;
    }

    const cells = dataRow.find('td');
    if (cells.length < 6) {
      return null;
    }

    return {
      classroomId: cells.eq(0).text().trim(),
      capacity: cells.eq(1).text().trim(),
      location: cells.eq(2).text().trim(),
      type: cells.eq(3).text().trim(),
      equipment: cells.eq(4).text().trim(),
      description: cells.eq(5).text().trim(),
    };
  } catch (error) {
    console.error(`  獲取教室 ${classroomId} 詳細資訊失敗:`, error instanceof Error ? error.message : error);
    return null;
  }
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
async function scrapeClassrooms(fetchDetails: boolean = true): Promise<Classroom[]> {
  console.log('🏫 開始爬取台大教室資料...\n');
  console.log(`📍 目標網址: ${BASE_URL}`);
  console.log(`📋 獲取詳細資訊: ${fetchDetails ? '是' : '否'}\n`);

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
              classroomName: room.cr_no,
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

    console.log(`\n總共找到 ${allClassrooms.length} 間教室`);

    // 步驟 4: 獲取每個教室的詳細資訊（位置、容量等）
    if (fetchDetails) {
      console.log('\n🔎 步驟 4: 獲取教室詳細資訊（位置、容量等）...\n');
      console.log('⚠️ 這可能需要一些時間，因為需要逐一請求每個教室...\n');
      
      let successCount = 0;
      let failCount = 0;
      
      for (let i = 0; i < allClassrooms.length; i++) {
        const classroom = allClassrooms[i];
        
        // 顯示進度
        if ((i + 1) % 50 === 0 || i === allClassrooms.length - 1) {
          console.log(`進度: ${i + 1}/${allClassrooms.length} (成功: ${successCount}, 失敗: ${failCount})`);
        }
        
        try {
          const detail = await fetchClassroomDetail(classroom.buildingValue, classroom.classroomId);
          
          if (detail) {
            classroom.capacity = detail.capacity;
            classroom.location = detail.location;
            classroom.type = detail.type;
            classroom.equipment = detail.equipment;
            classroom.description = detail.description;
            successCount++;
          } else {
            failCount++;
          }
          
          // 避免請求過於頻繁 - 稍微加長延遲
          await new Promise(resolve => setTimeout(resolve, 100));
        } catch {
          failCount++;
        }
      }
      
      console.log(`\n詳細資訊獲取完成！成功: ${successCount}, 失敗: ${failCount}`);
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
        // 只顯示前 3 間作為預覽
        const preview = classrooms.slice(0, 3);
        preview.forEach(c => {
          const locationInfo = c.location ? ` → ${c.location}` : '';
          console.log(`  - ${c.classroomName}${locationInfo}`);
        });
        if (classrooms.length > 3) {
          console.log(`  ... 還有 ${classrooms.length - 3} 間`);
        }
      }

      // 顯示一些有位置資訊的教室範例
      if (fetchDetails) {
        const classroomsWithLocation = allClassrooms.filter(c => c.location);
        console.log(`\n📍 有位置資訊的教室數量: ${classroomsWithLocation.length}/${allClassrooms.length}`);
        
        if (classroomsWithLocation.length > 0) {
          console.log('\n範例（前 10 間有位置資訊的教室）:');
          classroomsWithLocation.slice(0, 10).forEach(c => {
            console.log(`  - ${c.classroomName}: ${c.location} (容量: ${c.capacity}, 型態: ${c.type})`);
          });
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

  // 提取所有唯一的位置
  const uniqueLocations = [...new Set(classrooms.map(c => c.location).filter(Boolean))];

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
  capacity?: string;
  location?: string;      // 真實建築物位置
  type?: string;          // 教室型態
  equipment?: string;     // 硬體設備
  description?: string;   // 教室描述
}

export const BUILDINGS = ${JSON.stringify(Object.keys(byBuilding), null, 2)} as const;

export type BuildingName = typeof BUILDINGS[number];

/**
 * 所有唯一的位置名稱
 */
export const LOCATIONS = ${JSON.stringify(uniqueLocations.sort(), null, 2)} as const;

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
 * 搜尋教室（依名稱或位置）
 */
export function searchClassrooms(query: string): Classroom[] {
  const lowerQuery = query.toLowerCase();
  return CLASSROOMS.filter(c => 
    c.classroomName.toLowerCase().includes(lowerQuery) ||
    c.classroomId.toLowerCase().includes(lowerQuery) ||
    (c.location && c.location.toLowerCase().includes(lowerQuery))
  );
}

/**
 * 根據位置取得教室列表
 */
export function getClassroomsByLocation(location: string): Classroom[] {
  return CLASSROOMS.filter(c => c.location === location);
}

export default CLASSROOMS;
`;

  await fs.writeFile(outputPath, content, 'utf-8');
  console.log(`💾 已儲存 TypeScript 檔案到: ${outputPath}`);
}

// 解析命令列參數
const args = process.argv.slice(2);
const skipDetails = args.includes('--skip-details') || args.includes('-s');

// 執行爬蟲
scrapeClassrooms(!skipDetails)
  .then(async (classrooms) => {
    if (classrooms.length > 0) {
      // 儲存為 JSON
      await saveToJson(classrooms, 'classrooms.json');
      // 儲存為 TypeScript
      await saveAsTypeScript(classrooms, 'classrooms.ts');
    }
  })
  .catch(console.error);

export { scrapeClassrooms, type Classroom, type Building, type ClassroomDetail };
