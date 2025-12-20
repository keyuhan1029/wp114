/**
 * 台大建築物座標配置
 * 
 * 分為兩類：
 * 1. 主要教學大樓 (MAIN_BUILDINGS) - 使用 SVG 覆蓋層顯示
 * 2. 其他建築物 (OTHER_BUILDINGS) - 使用點標記顯示
 */

// 簡單矩形 SVG path
const RECTANGLE_PATH = 'M 0 0 L 100 0 L 100 100 L 0 100 Z';
const RECTANGLE_VIEWBOX = '0 0 100 100';

export interface BuildingBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

export interface MainBuilding {
  id: string;
  name: string;
  prefixes: string[]; // 教室名稱前綴，如 ['共']
  bounds: BuildingBounds;
  svgPath: string;
  viewBox: string;
}

export interface OtherBuilding {
  id: string;
  name: string;
  prefixes: string[]; // 教室名稱前綴
  lat: number;
  lng: number;
}

/**
 * 主要教學大樓 - 使用 SVG 矩形覆蓋層
 * 座標來源：Google Maps 手動測量
 */
export const MAIN_BUILDINGS: MainBuilding[] = [
  {
    id: 'common',
    name: '共同教學館',
    prefixes: ['共'],
    bounds: {
      north: 25.015948447564657,
      south: 25.015629671041687,
      east: 121.53767643071305,
      west: 121.53722469314624,
    },
    svgPath: RECTANGLE_PATH,
    viewBox: RECTANGLE_VIEWBOX,
  },
  {
    id: 'general',
    name: '普通教學館',
    prefixes: ['普'],
    bounds: {
      north: 25.018640457705214,
      south: 25.01848854898809,
      east: 121.53716074365013,
      west: 121.53635339873038,
    },
    svgPath: RECTANGLE_PATH,
    viewBox: RECTANGLE_VIEWBOX,
  },
  {
    id: 'freshman',
    name: '新生教學館',
    prefixes: ['新'],
    bounds: {
      north: 25.019811462916564,
      south: 25.019662908743385,
      east: 121.53874853327794,
      west: 121.53811050530173,
    },
    svgPath: RECTANGLE_PATH,
    viewBox: RECTANGLE_VIEWBOX,
  },
  {
    id: 'comprehensive',
    name: '綜合教學館',
    prefixes: ['綜'],
    bounds: {
      north: 25.018354420790235,
      south: 25.01813493267677,
      east: 121.53980088586289,
      west: 121.53923079605082,
    },
    svgPath: RECTANGLE_PATH,
    viewBox: RECTANGLE_VIEWBOX,
  },
  {
    id: 'liberal',
    name: '博雅教學館',
    prefixes: ['博雅'],
    bounds: {
      north: 25.019042711077578,
      south: 25.018772921952323,
      east: 121.53715940254719,
      west: 121.53634535210323,
    },
    svgPath: RECTANGLE_PATH,
    viewBox: RECTANGLE_VIEWBOX,
  },
];

/**
 * 其他建築物 - 使用點標記
 * 只有當有朋友在該建築物上課時才會顯示
 */
export const OTHER_BUILDINGS: OtherBuilding[] = [
  // ===== 文學院 =====
  { id: 'literature', name: '文學院大樓', prefixes: ['文', '外', '中', '歷' ], lat: 25.017835553250347, lng: 121.53675875047934 },
  { id: 'humanities', name: '人文館', prefixes: ['人文'], lat: 25.017748253210545, lng: 121.53419838596814 },
  { id: 'philosophy', name: '哲學系館', prefixes: ['哲'], lat: 25.013715110313395, lng: 121.5296628635244 },
  { id: 'lib_info', name: '圖資系館', prefixes: ['圖資'], lat: 25.01750, lng: 121.53950 },
    { id: 'leling', name: '樂學館', prefixes: ['樂學'], lat: 25.018082480476416, lng: 121.53531462794933 },
  { id: 'foreign', name: '外教中心', prefixes: ['外教'], lat: 25.020503897951475, lng: 121.54064621949888 },
  { id: 'drama', name: '一號館（戲劇系、植微系）', prefixes: ['總一'], lat: 25.016842908816, lng: 121.53474704812014 },

  // ===== 理學院 =====
  { id: 'atmosphere', name: '大氣系館', prefixes: ['大氣'], lat: 25.014799882364535, lng: 121.53895160150154 },
  { id: 'astronomy_math', name: '天文數學館', prefixes: ['天數'], lat: 25.021265440533934, lng: 121.53821446703002 },
  { id: 'chemistry', name: '化學系館（積學館）', prefixes: ['化'], lat: 25.01908028885688, lng: 121.53816081845275 },
  { id: 'geography', name: '地理系館', prefixes: ['地理'], lat: 25.01502012174517, lng: 121.53834670366565 },
  { id: 'geosciences', name: '地質系館', prefixes: ['地質','中庭大講堂'], lat: 25.014961584443586, lng: 121.53720967394395 },
  { id: 'physics_new', name: '新物理館', prefixes: ['新物'], lat: 25.021827087071646, lng: 121.53654285855791 },
  { id: 'physics_old', name: '舊物理館', prefixes: ['舊物'], lat: 25.016691730449562, lng: 121.53589948003663 },
  { id: 'math_old', name: '舊數學館', prefixes: ['舊數'], lat: 25.02036089288454, lng: 121.53845914667474 },
  { id: 'math_new', name: '新數學館', prefixes: ['新數'], lat: 25.020070705105177, lng: 121.53853265499146 },
  { id: 'thinking', name: '思亮館', prefixes: ['思亮'], lat: 25.020944487533654, lng: 121.53866402445297 },

  // ===== 社科院 =====
  { id: 'social', name: '社科院大樓', prefixes: ['社科'], lat: 25.020785158266026, lng: 121.54241024885106 },
  { id: 'social_social_work', name: '社會暨社工系館', prefixes: ['社'], lat: 25.020196807636555, lng: 121.54169906118808 },
  { id: 'national_dev', name: '國家發展研究所', prefixes: ['國發'], lat: 25.020333319563445, lng: 121.54298087034894 },
  { id: 'news', name: '新聞研究所', prefixes: ['新聞'], lat: 25.019435597594217, lng: 121.54298833281294 },

  // ===== 管理學院 =====
  { id: 'management1', name: '管理學院一館', prefixes: ['管一', '玉山', '冠德', '重光', '國學'], lat: 25.013900151467706, lng: 121.53802942132974 },
  { id: 'management2', name: '管理學院二館', prefixes: ['管二'], lat: 25.01308449782241, lng: 121.536825360279 },

  // ===== 法律學院 =====
  { id: 'lin_building', name: '霖澤館', prefixes: ['法', '法研', '科法', '霖', '霖研'], lat: 25.020606897592376, lng: 121.54368172232635 },
  { id: 'wan_building', name: '萬才館', prefixes: ['萬'], lat: 25.019877714693454, lng: 121.54476510145031 },

  // ===== 工學院 =====
  { id: 'civil', name: '土木系館', prefixes: ['土', '土研'], lat: 25.017755100842056, lng: 121.53831079778047 },
  { id: 'engineering_complex', name: '工學院綜合大樓', prefixes: ['工綜'], lat: 25.018973752335715, lng: 121.54086881602035 },
  { id: 'engineering_science', name: '工科海洋系館', prefixes: ['工科'], lat: 25.01714176591244, lng: 121.54254361714271 },
  { id: 'mechanical', name: '機械系館', prefixes: ['機械', '機皮'], lat: 25.018951721523866, lng: 121.54018483637984 },
  { id: 'chemical_eng', name: '化工系館', prefixes: ['化工'], lat: 25.018149159511566, lng: 121.53829158830366 },
  { id: 'environmental', name: '環工所', prefixes: ['環工', '環研'], lat: 25.017296858659275, lng: 121.54377033950738 },

  // ===== 電資學院 =====
  { id: 'ee2', name: '電機二館', prefixes: ['電二', '電機二'], lat: 25.01877352888742, lng: 121.54203247379898 },
  { id: 'csie', name: '資訊工程系館', prefixes: ['資'], lat: 25.019426046391867, lng: 121.54167507193384 },
  { id: 'computer_center', name: '計算機中心', prefixes: ['計資'], lat: 25.020872873238297, lng: 121.53984949394552 },
  { id: 'boli', name: '博理館', prefixes: ['博理'], lat: 25.019288101500184, lng: 121.54224954614476 },
  { id: 'mingda', name: '明達館', prefixes: ['明達'], lat: 25.01782372734124, lng: 121.54440692924256 },

  // ===== 生農學院 =====
  { id: 'agri_chem1', name: '農化一館', prefixes: ['農化一'], lat: 25.01616841160872, lng: 121.53594780096319 },
  { id: 'agri_chem2', name: '農化二館', prefixes: ['農化二', '農化'], lat: 25.016161791977105, lng: 121.53595953259604 },
  { id: 'agri', name: '農學院大樓（農經系、生傳系）', prefixes: ['農經', '生傳'], lat: 25.016216776260112, lng: 121.53765808716884 },
  { id: 'agronomy', name: '農藝系館', prefixes: ['農藝'], lat: 25.018262976506282, lng: 121.54073734461754 },
  { id: 'horticulture', name: '園藝系館', prefixes: ['園藝', '造園'], lat: 25.01684928626481, lng: 121.537666704144 },
  { id: 'forestry', name: '森林系館', prefixes: ['林', '林一', '林二', '林三', '林四', '林五'], lat: 25.01686394380694, lng: 121.53961778320016 },
//   { id: 'animal', name: '畜產系館', prefixes: ['畜一', '畜二', '畜三'], lat: 25.01550, lng: 121.54300 },
  { id: 'vet', name: '獸醫系館', prefixes: ['獸'], lat: 25.018267965605933, lng: 121.5423050947429 },
  { id: 'bio_mechatronics', name: '生物機電系館', prefixes: ['生機'], lat: 25.018622566521127, lng: 121.5427907107889 },
//   { id: 'bio_env_eng', name: '生物環境系統工程系館', prefixes: ['生工'], lat: 25.01220, lng: 121.53850 },
//   { id: 'agri_eng', name: '農工系館', prefixes: ['農工'], lat: 25.01300, lng: 121.53800 },
//   { id: 'food_tech', name: '食品科技館', prefixes: ['食科', '食研'], lat: 25.01450, lng: 121.54350 },
//   { id: 'entomology', name: '昆蟲系館', prefixes: ['昆蟲'], lat: 25.01520, lng: 121.54180 },
//   { id: 'plant_pathology', name: '植物病理館', prefixes: ['植病'], lat: 25.01480, lng: 121.54120 },
//   { id: 'agri_process', name: '農產品加工館', prefixes: ['加工'], lat: 25.01350, lng: 121.54250 },
  
//   // ===== 公衛學院 =====
//   { id: 'public_health', name: '公衛學院', prefixes: ['公衛'], lat: 25.02050, lng: 121.53750 },

//   // ===== 生命科學院 =====
//   { id: 'life_science', name: '生命科學館', prefixes: ['生科'], lat: 25.01680, lng: 121.53550 },
//   { id: 'biochemistry', name: '生化館', prefixes: ['生化'], lat: 25.01650, lng: 121.53500 },
//   { id: 'biotech', name: '生物技術館', prefixes: ['生技'], lat: 25.01620, lng: 121.53450 },
//   { id: 'fishery', name: '漁科館', prefixes: ['漁科'], lat: 25.01590, lng: 121.53400 },
//   { id: 'ocean_research', name: '海洋研究所', prefixes: ['海研'], lat: 25.01560, lng: 121.53350 },

//   // ===== 醫學院 =====
//   { id: 'basic_med', name: '基礎醫學大樓', prefixes: ['基醫'], lat: 25.04200, lng: 121.52200 },
//   { id: 'nursing', name: '護理系館', prefixes: ['護'], lat: 25.04250, lng: 121.52250 },
//   { id: 'pharmacy', name: '藥學系館', prefixes: ['藥'], lat: 25.04180, lng: 121.52150 },
//   { id: 'hospital', name: '台大醫院', prefixes: ['醫院'], lat: 25.04150, lng: 121.52100 },
//   { id: 'dentistry', name: '牙醫系館', prefixes: ['牙'], lat: 25.04220, lng: 121.52300 },
//   { id: 'pt', name: '物理治療系館', prefixes: ['物治'], lat: 25.04280, lng: 121.52350 },
//   { id: 'ot', name: '職能治療系館', prefixes: ['職治'], lat: 25.04300, lng: 121.52400 },
  
//   // ===== 其他設施 =====
//   { id: 'library_old', name: '舊圖書館', prefixes: ['舊圖'], lat: 25.01720, lng: 121.54080 },
//   { id: 'student_activity1', name: '第一活動中心', prefixes: ['一活'], lat: 25.01680, lng: 121.53400 },
//   { id: 'student_activity2', name: '第二活動中心', prefixes: ['二活'], lat: 25.01650, lng: 121.53350 },
//   { id: 'sports_complex', name: '綜合體育館', prefixes: ['綜體', '綜館'], lat: 25.02150, lng: 121.53500 },
//   { id: 'expansion', name: '推廣教育中心', prefixes: ['推廣'], lat: 25.01600, lng: 121.53250 },
//   { id: 'zhanshulou', name: '展書樓', prefixes: ['展書'], lat: 25.01850, lng: 121.54150 },
//   { id: 'global_change', name: '全球變遷中心', prefixes: ['全變'], lat: 25.01900, lng: 121.53800 },
//   { id: 'polymer', name: '高分子館', prefixes: ['高分', '高分子'], lat: 25.01950, lng: 121.53850 },
//   { id: 'north_building', name: '北館', prefixes: ['北館'], lat: 25.02000, lng: 121.53700 },
//   { id: 'south_building', name: '南館', prefixes: ['南館'], lat: 25.01550, lng: 121.53700 },
//   { id: 'zhongfei', name: '中非大樓', prefixes: ['中非'], lat: 25.01850, lng: 121.54050 },
//   { id: 'zhuo_building', name: '卓越研究大樓', prefixes: ['卓'], lat: 25.02050, lng: 121.53650 },
//   { id: 'water_forest', name: '水源校區', prefixes: ['水森', '水源'], lat: 25.01150, lng: 121.53200 },
//   { id: 'gongguan', name: '公館校區', prefixes: ['公館'], lat: 25.01100, lng: 121.53150 },
//   { id: 'academia_sinica', name: '中研院', prefixes: ['中研院'], lat: 25.04000, lng: 121.61500 },
  
//   // ===== 講堂 =====
//   { id: 'yangbinyan', name: '楊斌彥廳', prefixes: ['楊斌彥'], lat: 25.01780, lng: 121.53900 },
//   { id: 'jinbao', name: '楊金豹演講廳', prefixes: ['楊金豹'], lat: 25.01800, lng: 121.53850 },
//   { id: 'panguan', name: '潘貫講堂', prefixes: ['潘貫'], lat: 25.01820, lng: 121.53800 },
//   { id: 'jinxue', name: '進學講堂', prefixes: ['進學'], lat: 25.01860, lng: 121.53700 },
//   { id: 'xiushan', name: '繡山講堂', prefixes: ['繡山'], lat: 25.01880, lng: 121.53650 },
//   { id: 'xinyi', name: '信義講堂', prefixes: ['信義'], lat: 25.01920, lng: 121.53550 },
];

/**
 * 根據教室名稱前綴查找建築物
 */
export function findBuildingByPrefix(prefix: string): MainBuilding | OtherBuilding | null {
  // 先搜尋主要建築物
  for (const building of MAIN_BUILDINGS) {
    if (building.prefixes.some(p => prefix.startsWith(p) || p.startsWith(prefix))) {
      return building;
    }
  }
  
  // 再搜尋其他建築物
  for (const building of OTHER_BUILDINGS) {
    if (building.prefixes.some(p => prefix.startsWith(p) || p.startsWith(prefix))) {
      return building;
    }
  }
  
  return null;
}

/**
 * 判斷是否為主要建築物
 */
export function isMainBuilding(building: MainBuilding | OtherBuilding): building is MainBuilding {
  return 'bounds' in building;
}

/**
 * 取得所有建築物前綴
 */
export function getAllBuildingPrefixes(): string[] {
  const prefixes: string[] = [];
  
  for (const building of MAIN_BUILDINGS) {
    prefixes.push(...building.prefixes);
  }
  
  for (const building of OTHER_BUILDINGS) {
    prefixes.push(...building.prefixes);
  }
  
  return prefixes;
}

