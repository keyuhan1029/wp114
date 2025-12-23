/**
 * 教室位置解析工具
 * 
 * 從教室名稱（如「共101」、「大氣A104」）解析出對應的建築物
 */

import { 
  MAIN_BUILDINGS, 
  OTHER_BUILDINGS, 
  MainBuilding, 
  OtherBuilding,
  isMainBuilding 
} from '@/data/buildings';

export interface ParsedLocation {
  building: MainBuilding | OtherBuilding;
  buildingName: string;
  displayType: 'svg' | 'marker';
  originalLocation: string;
}

/**
 * 教室名稱前綴對應表
 * 用於處理一些特殊情況
 */
const SPECIAL_PREFIX_MAP: Record<string, string> = {
  // 共同教學館的變體
  '共同': '共',
  
  // 普通教學館的變體
  '普通': '普',
  
  // 新生教學館的變體
  '新生': '新',
  
  // 綜合教學館的變體  
  '綜合': '綜',
  
  // 社科院的變體
  '社會科學': '社科',
  '社會': '社',
  
  // 管理學院的變體
  '管理一': '管一',
  '管理二': '管二',
  '管院一': '管一',
  '管院二': '管二',
  
  // 法律學院的變體
  '法律': '法',
  '法學': '法',
  
  // 電機的變體
  '電機二': '電二',
  
  // 化工的變體
  '化工一館': '化工一',
  '化工二館': '化工二',
  '化工三館': '化工三',
  
  // 農化的變體
  '農化一館': '農化一',
  '農化二館': '農化二',
  
  // 森林系的變體
  '林一館': '林一',
  '林二館': '林二',
  '林三館': '林三',
  '林四館': '林四',
  '林五館': '林五',
  
  // 畜產系的變體
  '畜一館': '畜一',
  '畜二館': '畜二',
  '畜三館': '畜三',
  
  // 其他
  '圖書資訊': '圖資',
  '基礎醫學': '基醫',
  '大氣系': '大氣',
  '天文數學': '天數',
};

/**
 * 從教室名稱提取前綴（建築物代碼）
 * 
 * 範例：
 * - "共101" → "共"
 * - "大氣A104" → "大氣"
 * - "管一101" → "管一"
 * - "博雅101/華南講堂" → "博雅"
 */
export function extractBuildingPrefix(location: string): string {
  if (!location) return '';
  
  // 移除前後空白
  location = location.trim();
  
  // 處理特殊格式，如 "博雅101/華南講堂"
  if (location.includes('/')) {
    location = location.split('/')[0];
  }
  
  // 處理括號，如 "(牙)實習一"
  if (location.startsWith('(')) {
    const match = location.match(/^\(([^)]+)\)/);
    if (match) {
      return match[1];
    }
  }
  
  // 嘗試匹配所有已知的前綴（從長到短排序，確保最長匹配優先）
  const allPrefixes = getAllKnownPrefixes();
  
  for (const prefix of allPrefixes) {
    if (location.startsWith(prefix)) {
      return prefix;
    }
  }
  
  // 如果沒有匹配到已知前綴，嘗試提取中文前綴
  // 匹配連續的中文字元，直到遇到數字或英文
  const chineseMatch = location.match(/^[\u4e00-\u9fa5]+/);
  if (chineseMatch) {
    const chinesePrefix = chineseMatch[0];
    
    // 檢查是否需要轉換特殊前綴
    if (SPECIAL_PREFIX_MAP[chinesePrefix]) {
      return SPECIAL_PREFIX_MAP[chinesePrefix];
    }
    
    return chinesePrefix;
  }
  
  return '';
}

/**
 * 獲取所有已知的建築物前綴（從長到短排序）
 */
function getAllKnownPrefixes(): string[] {
  const prefixes: Set<string> = new Set();
  
  // 從主要建築物收集
  for (const building of MAIN_BUILDINGS) {
    for (const prefix of building.prefixes) {
      prefixes.add(prefix);
    }
  }
  
  // 從其他建築物收集
  for (const building of OTHER_BUILDINGS) {
    for (const prefix of building.prefixes) {
      prefixes.add(prefix);
    }
  }
  
  // 從特殊前綴對應表收集
  for (const prefix of Object.keys(SPECIAL_PREFIX_MAP)) {
    prefixes.add(prefix);
  }
  for (const prefix of Object.values(SPECIAL_PREFIX_MAP)) {
    prefixes.add(prefix);
  }
  
  // 轉為陣列並按長度從長到短排序
  return Array.from(prefixes).sort((a, b) => b.length - a.length);
}

/**
 * 根據前綴查找建築物
 */
function findBuildingByPrefix(prefix: string): MainBuilding | OtherBuilding | null {
  // 先檢查特殊前綴對應
  const normalizedPrefix = SPECIAL_PREFIX_MAP[prefix] || prefix;
  
  // ===== 特殊情況處理：社科 vs 社 =====
  // 「社科」→ 社科院大樓，「社」→ 社工系館
  if (normalizedPrefix === '社科' || normalizedPrefix.startsWith('社科')) {
    // 完全等於「社科」或以「社科」開頭 → 社科院大樓
    const socialBuilding = [...MAIN_BUILDINGS, ...OTHER_BUILDINGS].find(b => b.id === 'social');
    if (socialBuilding) return socialBuilding;
  } else if (normalizedPrefix === '社') {
    // 只有「社」→ 社工系館
    const socialWorkBuilding = OTHER_BUILDINGS.find(b => b.id === 'social_social_work');
    if (socialWorkBuilding) return socialWorkBuilding;
  }
  
  // 搜尋主要建築物
  for (const building of MAIN_BUILDINGS) {
    if (building.prefixes.some(p => 
      p === normalizedPrefix || 
      normalizedPrefix.startsWith(p) || 
      p.startsWith(normalizedPrefix)
    )) {
      return building;
    }
  }
  
  // 搜尋其他建築物
  for (const building of OTHER_BUILDINGS) {
    if (building.prefixes.some(p => 
      p === normalizedPrefix || 
      normalizedPrefix.startsWith(p) || 
      p.startsWith(normalizedPrefix)
    )) {
      return building;
    }
  }
  
  return null;
}

/**
 * 解析教室位置，返回對應的建築物資訊
 * 
 * @param location 教室名稱，如 "共101"、"大氣A104"
 * @returns 解析後的位置資訊，如果無法解析則返回 null
 */
export function parseLocation(location: string): ParsedLocation | null {
  if (!location) return null;
  
  const prefix = extractBuildingPrefix(location);
  if (!prefix) return null;
  
  const building = findBuildingByPrefix(prefix);
  if (!building) return null;
  
  return {
    building,
    buildingName: building.name,
    displayType: isMainBuilding(building) ? 'svg' : 'marker',
    originalLocation: location,
  };
}

/**
 * 批量解析多個位置
 * 
 * @param locations 教室名稱陣列
 * @returns 成功解析的位置資訊陣列
 */
export function parseLocations(locations: string[]): ParsedLocation[] {
  return locations
    .map(parseLocation)
    .filter((result): result is ParsedLocation => result !== null);
}

/**
 * 將多個朋友的位置按建築物分組
 * 
 * @param friendLocations 朋友位置資料陣列 [{ friendId, friendName, location }]
 * @returns 按建築物分組的結果
 */
export interface FriendLocationInfo {
  friendId: string;
  friendName: string;
  location: string;
  courseName?: string;
}

export interface BuildingWithFriends {
  building: MainBuilding | OtherBuilding;
  displayType: 'svg' | 'marker';
  friends: FriendLocationInfo[];
}

export function groupFriendsByBuilding(
  friendLocations: FriendLocationInfo[]
): Map<string, BuildingWithFriends> {
  const result = new Map<string, BuildingWithFriends>();
  
  for (const friendLoc of friendLocations) {
    if (!friendLoc.location) continue;
    
    const parsed = parseLocation(friendLoc.location);
    if (!parsed) continue;
    
    const buildingId = parsed.building.id;
    
    if (result.has(buildingId)) {
      result.get(buildingId)!.friends.push(friendLoc);
    } else {
      result.set(buildingId, {
        building: parsed.building,
        displayType: parsed.displayType,
        friends: [friendLoc],
      });
    }
  }
  
  return result;
}

/**
 * 檢查某個建築物是否有朋友正在上課
 */
export function hasFriendsInBuilding(
  buildingId: string,
  buildingsWithFriends: Map<string, BuildingWithFriends>
): boolean {
  return buildingsWithFriends.has(buildingId);
}

/**
 * 獲取某個建築物內的朋友列表
 */
export function getFriendsInBuilding(
  buildingId: string,
  buildingsWithFriends: Map<string, BuildingWithFriends>
): FriendLocationInfo[] {
  return buildingsWithFriends.get(buildingId)?.friends || [];
}

