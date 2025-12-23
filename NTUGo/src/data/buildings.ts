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

// 綜合體育館 SVG path (對應 NTUSportsCenter.svg)
const SPORTS_CENTER_PATH = 'M 100 70 Q 256 10 412 70 L 472 40 L 442 100 Q 502 256 442 412 L 472 472 L 412 442 Q 256 502 100 442 L 40 472 L 70 412 Q 10 256 70 100 L 40 40 Z';
const SPORTS_CENTER_VIEWBOX = '0 0 512 512';

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
  hidden?: boolean; // 是否隱藏標記（用於已有獨立 SVG 覆蓋層的建築物）
}

/**
 * 主要教學大樓 - 使用 SVG 矩形覆蓋層
 * 座標來源：Google Maps 手動測量
 */
export const MAIN_BUILDINGS: MainBuilding[] = [
  {
    id: 'common',
    name: '共同教學館',
    prefixes: ['共', '共同教室'],
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
    prefixes: ['普', '普通教室', '普通大樓'],
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
    prefixes: ['新生教室', '新生'],
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
    prefixes: ['綜合教學館', '綜教'],
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
    prefixes: ['博雅', '博雅教學館'],
    bounds: {
      north: 25.019042711077578,
      south: 25.018772921952323,
      east: 121.53715940254719,
      west: 121.53634535210323,
    },
    svgPath: RECTANGLE_PATH,
    viewBox: RECTANGLE_VIEWBOX,
  },
  {
    id: 'sports_center',
    name: '綜合體育館',
    prefixes: ['綜合體育館', '綜體', '綜館', '新體'],
    bounds: {
      north: 25.021999,
      south: 25.021286,
      east: 121.535645,
      west: 121.534778,
    },
    svgPath: SPORTS_CENTER_PATH,
    viewBox: SPORTS_CENTER_VIEWBOX,
  },
];

/**
 * 其他建築物 - 使用點標記
 */
export const OTHER_BUILDINGS: OtherBuilding[] = [
  // ===== 文學院 =====
  { id: 'literature', name: '文學院大樓', prefixes: ['文學院', '文學院大樓', '文學院中文系', '中文系'], lat: 25.017835553250347, lng: 121.53675875047934 },
  { id: 'humanities', name: '人文館', prefixes: ['人文館', '人文'], lat: 25.017748253210545, lng: 121.53419838596814 },
  { id: 'philosophy', name: '哲學系館', prefixes: ['哲學系館', '哲人館', '哲'], lat: 25.013715110313395, lng: 121.5296628635244 },
  { id: 'lib_info', name: '圖資系館', prefixes: ['圖書資訊學系系館', '圖書資訊館', '圖資系館', '圖資'], lat: 25.01750, lng: 121.53950 },
  { id: 'leling', name: '樂學館', prefixes: ['樂學館', '樂學'], lat: 25.018082480476416, lng: 121.53531462794933 },
  { id: 'foreign', name: '外語教學中心', prefixes: ['外語教學中心', '外教', '語文大樓'], lat: 25.020503897951475, lng: 121.54064621949888 },
  { id: 'drama', name: '一號館', prefixes: ['校總區一號館', '總一', '五號館'], lat: 25.016842908816, lng: 121.53474704812014 },
  { id: 'history', name: '校史館', prefixes: ['校史館'], lat: 25.01745, lng: 121.54020 },

  // ===== 理學院 =====
  { id: 'atmosphere', name: '大氣系館', prefixes: ['大氣科學系', '大氣系A館', '大氣系B館', '大氣系C館', '大氣'], lat: 25.014799882364535, lng: 121.53895160150154 },
  { id: 'astronomy_math', name: '天文數學館', prefixes: ['天文數學大樓', '天文數學館', '天數'], lat: 25.021265440533934, lng: 121.53821446703002 },
  { id: 'chemistry', name: '化學系館', prefixes: ['化學系', '積學館', '化'], lat: 25.01908028885688, lng: 121.53816081845275 },
  { id: 'geography', name: '地理系館', prefixes: ['地理館', '地理'], lat: 25.01502012174517, lng: 121.53834670366565 },
  { id: 'geosciences', name: '地質系館', prefixes: ['地質科學系', '地質', '中庭大講堂'], lat: 25.014961584443586, lng: 121.53720967394395 },
  { id: 'physics_new', name: '新物理館', prefixes: ['新物理館', '新物'], lat: 25.021827087071646, lng: 121.53654285855791 },
  { id: 'physics_old', name: '舊物理館', prefixes: ['舊物理館', '舊物'], lat: 25.016691730449562, lng: 121.53589948003663 },
  { id: 'math_old', name: '舊數學館', prefixes: ['數學系舊館', '舊數', '數學系'], lat: 25.02036089288454, lng: 121.53845914667474 },
  { id: 'math_new', name: '數學研究中心', prefixes: ['數學研究中心', '新數'], lat: 25.020070705105177, lng: 121.53853265499146 },
  { id: 'thinking', name: '思亮館', prefixes: ['思亮館', '思亮'], lat: 25.020944487533654, lng: 121.53866402445297 },

  // ===== 社科院 =====
  // 社科院大樓已獨立為 T 字型 SVG 覆蓋層
  { id: 'social', name: '社科院大樓', prefixes: ['社科院大樓', '社科院前排教室', '社科院後排教室', '社科'], lat: 25.020785158266026, lng: 121.54241024885106, hidden: true },
  { id: 'social_social_work', name: '社會暨社工系館', prefixes: ['社會暨社工系館', '社會社工系館', '社會工作系館', '社'], lat: 25.020196807636555, lng: 121.54169906118808 },
  { id: 'national_dev', name: '國發大樓', prefixes: ['國家發展研究所', '國發大樓', '國發'], lat: 25.020333319563445, lng: 121.54298087034894 },
  { id: 'news', name: '新聞研究所', prefixes: ['新聞研究所', '新聞'], lat: 25.019435597594217, lng: 121.54298833281294 },
  { id: 'economics', name: '經濟研究大樓', prefixes: ['經研大樓', '經'], lat: 25.02050, lng: 121.54320 },

  // ===== 管理學院 =====
  { id: 'management1', name: '管理學院一館', prefixes: ['管理學院一號館', '管院一館', '管一', '玉山', '冠德', '重光', '國學'], lat: 25.013900151467706, lng: 121.53802942132974 },
  { id: 'management2', name: '管理學院二館', prefixes: ['管院二館', '管二'], lat: 25.01308449782241, lng: 121.536825360279 },

  // ===== 法律學院 =====
  { id: 'lin_building', name: '霖澤館', prefixes: ['霖澤館', '法', '法研', '科法', '霖', '霖研'], lat: 25.020606897592376, lng: 121.54368172232635 },
  { id: 'wan_building', name: '萬才館', prefixes: ['萬才館', '萬'], lat: 25.019877714693454, lng: 121.54476510145031 },

  // ===== 工學院 =====
  { id: 'civil', name: '土木系館', prefixes: ['土木館', '土木研究大樓', '土', '土研'], lat: 25.017755100842056, lng: 121.53831079778047 },
  { id: 'engineering_complex', name: '工學院綜合大樓', prefixes: ['工學院綜合大樓', '工綜'], lat: 25.018973752335715, lng: 121.54086881602035 },
  { id: 'engineering_science', name: '工科海洋系館', prefixes: ['工科系管', '工科系館', '工科'], lat: 25.01714176591244, lng: 121.54254361714271 },
  { id: 'mechanical', name: '機械系館', prefixes: ['機械系館', '機械實習工場', '機械系臨時工廠', '機械', '機皮'], lat: 25.018951721523866, lng: 121.54018483637984 },
  { id: 'chemical_eng', name: '化工系館', prefixes: ['化工一館', '化工二館', '化工館', '化工'], lat: 25.018149159511566, lng: 121.53829158830366 },
  { id: 'environmental', name: '環工所', prefixes: ['環工所', '環研大樓', '環工', '環研'], lat: 25.017296858659275, lng: 121.54377033950738 },
  { id: 'applied_mechanics', name: '應力館', prefixes: ['應用力學館', '應力'], lat: 25.0178, lng: 121.5395 },
  { id: 'zhihong', name: '志鴻館', prefixes: ['志鴻館'], lat: 25.0182, lng: 121.5402 },

  // ===== 電資學院 =====
  { id: 'ee2', name: '電機二館', prefixes: ['電機二館', '電二'], lat: 25.01877352888742, lng: 121.54203247379898 },
  { id: 'csie', name: '資訊系館', prefixes: ['資訊館', '資'], lat: 25.019426046391867, lng: 121.54167507193384 },
  { id: 'computer_center', name: '計算機中心', prefixes: ['計算機中心', '計算機及資訊網路中心', '計資'], lat: 25.020872873238297, lng: 121.53984949394552 },
  { id: 'boli', name: '博理館', prefixes: ['博理館', '博理'], lat: 25.019288101500184, lng: 121.54224954614476 },
  { id: 'mingda', name: '明達館', prefixes: ['明達館', '明達'], lat: 25.01782372734124, lng: 121.54440692924256 },

  // ===== 生農學院 =====
  { id: 'agri_chem', name: '農化館', prefixes: ['農化一館', '農化二館', '農化新館', '農化'], lat: 25.01616841160872, lng: 121.53594780096319 },
  { id: 'agri', name: '農業綜合館', prefixes: ['農業綜合館', '農業綜合', '農經綜合館', '農經', '生傳'], lat: 25.016216776260112, lng: 121.53765808716884 },
  { id: 'agronomy', name: '農藝系館', prefixes: ['農藝館', '農藝'], lat: 25.018262976506282, lng: 121.54073734461754 },
  { id: 'horticulture', name: '園藝系館', prefixes: ['園藝系加工館', '園藝系四號館', '園藝系花卉館', '園藝系造園館', '園藝', '造園', '花卉館'], lat: 25.01684928626481, lng: 121.537666704144 },
  { id: 'forestry', name: '森林系館', prefixes: ['森林館', '林', '林一', '林二', '林三', '林四', '林五'], lat: 25.01686394380694, lng: 121.53961778320016 },
  { id: 'animal', name: '動科系館', prefixes: ['動科系加工館', '動科系畜牧館', '畜牧館', '畜一', '畜二', '畜三'], lat: 25.01247979211605, lng: 121.54420859808748 },
  { id: 'vet', name: '獸醫系館', prefixes: ['獸醫一館', '獸醫三館', '動物醫院', '獸'], lat: 25.018267965605933, lng: 121.5423050947429 },
  { id: 'bio_mechatronics', name: '生機系館', prefixes: ['生機系知武館', '生機館', '生機2號館', '知武館', '生機'], lat: 25.018622566521127, lng: 121.5427907107889 },
  { id: 'bio_env_eng', name: '生工系館', prefixes: ['生工二館', '生工系館', '生工'], lat: 25.016515158321276, lng: 121.53765017172691 },
  { id: 'entomology', name: '昆蟲館', prefixes: ['昆蟲館', '昆蟲'], lat: 25.011092059395903, lng: 121.54069221654629 },
  { id: 'food_tech', name: '食科館', prefixes: ['食品研發大樓', '食科館', '食科', '食研'], lat: 25.013993685002507, lng: 121.53900765467667 },
  { id: 'agri_machine', name: '農機館', prefixes: ['農機二號館', '農機館', '農機'], lat: 25.017944473982833, lng: 121.54278926060763 },
  { id: 'farm', name: '農場', prefixes: ['農場', '轉殖溫室'], lat: 25.015547722503882, lng: 121.5415317412492 },
  
  // ===== 公衛學院 =====
//   { id: 'public_health', name: '公衛大樓', prefixes: ['公衛大樓', '公衛學院', '公衛'], lat: 25.041289428885307, lng: 121.52310200375642 },

  // ===== 生命科學院 =====
  { id: 'life_science', name: '生命科學館', prefixes: ['生命科學館', '生科'], lat: 25.01540183032612, lng: 121.53871739379949 },
  { id: 'biochemistry', name: '生化館', prefixes: ['生化館', '生化'], lat: 25.016168731167497, lng: 121.53594859955616},
  { id: 'biotech', name: '生物科技館', prefixes: ['生物科技館', '生技中心', '生農院生技所', '生技'], lat: 25.015644285307435, lng: 121.54715905796499 },
  { id: 'fishery', name: '漁科館', prefixes: ['漁科館', '漁科'], lat: 25.020539398528935, lng: 121.5394669024734 },
  { id: 'ocean_research', name: '海洋研究所', prefixes: ['海洋研究所', '海洋所', '海研所', '海研'], lat: 25.02129367984671, lng: 121.53734481848423 },
//   { id: 'biometry', name: '生統大樓', prefixes: ['生統'], lat: 25.0163, lng: 121.5352 },

  // ===== 醫學院 =====
//   { id: 'basic_med', name: '基礎醫學大樓', prefixes: ['基礎醫學大樓', '基醫大樓', '基醫'], lat: 25.0420, lng: 121.5220 },
//   { id: 'nursing', name: '護理系館', prefixes: ['護理系館', '護'], lat: 25.0425, lng: 121.5225 },
//   { id: 'hospital_west', name: '台大醫院西址', prefixes: ['台大醫院西址', '台大西址檢驗大樓', '臺大醫院西址檢驗大樓', '檢驗大樓'], lat: 25.0415, lng: 121.5210 },
//   { id: 'hospital_east', name: '台大醫院東址', prefixes: ['台大醫院東址'], lat: 25.0418, lng: 121.5235 },
//   { id: 'dentistry', name: '牙科大樓', prefixes: ['牙科大樓', '牙醫', '牙'], lat: 25.0422, lng: 121.5230 },
//   { id: 'medical_building', name: '醫學大樓', prefixes: ['醫學大樓', '醫學院基醫大樓'], lat: 25.0412, lng: 121.5218 },
//   { id: 'liangjiao', name: '聯教館', prefixes: ['聯教館', '醫學院聯教館'], lat: 25.0408, lng: 121.5212 },
  
  // ===== 其他設施 =====
//   { id: 'admin', name: '行政大樓', prefixes: ['行政大樓'], lat: 25.0178, lng: 121.5405 },
//   { id: 'auditorium', name: '視聽館', prefixes: ['總區視聯館', '視聽'], lat: 25.0175, lng: 121.5400 },
//   { id: 'student_activity1', name: '第一活動中心', prefixes: ['學生第一活動中心', '一活'], lat: 25.0168, lng: 121.5340 },
//   { id: 'sports_complex', name: '綜合體育館', prefixes: ['綜合體育館', '綜體', '綜館'], lat: 25.0215, lng:   121.5350 },
  { id: 'old_gym', name: '舊體育館', prefixes: ['舊體育館', '舊館柔道房', '舊館羽球場', '舊館重訓室', '舊館韻律房', '舊館'], lat: 25.019695166147738, lng: 121.53655459857424 },
//   { id: 'expansion', name: '推廣教育大樓', prefixes: ['推廣教育大樓', '推廣'], lat: 25.0160, lng: 121.5325 },
//   { id: 'zhanshulou', name: '展書樓', prefixes: ['展書樓', '高分子所展書樓'], lat: 25.0185, lng: 121.5415 },
//   { id: 'global_change', name: '全球變遷中心', prefixes: ['全球變遷中心', '全變中心', '全變'], lat: 25.0190, lng: 121.5380 },
  { id: 'north_building', name: '北館', prefixes: ['北館'], lat: 25.02004089569226, lng: 121.54023849646836 },
  { id: 'south_building', name: '南館', prefixes: ['南館'], lat: 25.01957149412149, lng: 121.5403237591254 },
//   { id: 'zhongfei', name: '中非大樓', prefixes: ['中非大樓', '中非'], lat: 25.0185, lng: 121.5405 },
//   { id: 'zhuo_building', name: '卓越研究大樓', prefixes: ['卓越研究大樓', '卓'], lat: 25.0205, lng: 121.5365 },
  { id: 'xuexin', name: '學新館', prefixes: ['學新館'], lat: 25.01899139952044, lng: 121.5437055511802 },
//   { id: 'wanglelou', name: '望樂樓', prefixes: ['望樂樓'], lat: 25.0188, lng: 121.5360 },
//   { id: 'guoqing', name: '國青大樓', prefixes: ['國青大樓', '國青中心', '國青'], lat: 25.0182, lng: 121.5358 },
  
  // ===== 水源校區 =====
//   { id: 'water_forest', name: '水森館', prefixes: ['水森館', '水源校區', '水源'], lat: 25.0115, lng: 121.5320 },
//   { id: 'shuiyuan_anthropology', name: '水源人類學系', prefixes: ['水源校區人類學系系館'], lat: 25.0118, lng: 121.5325 },
//   { id: 'shuiyuan_drama', name: '水源戲夢空間', prefixes: ['水源校區戲夢空間', '戲夢空間'], lat: 25.0112, lng: 121.5318 },
//   { id: 'gongguan', name: '公館校區', prefixes: ['公館', '城鄉所公館分部'], lat: 25.0110, lng: 121.5315 },
  
  // ===== 中研院 =====
//   { id: 'academia_sinica', name: '中央研究院', prefixes: ['中央研究院', '中研院'], lat: 25.0400, lng: 121.6150 },
  
  // ===== 宿舍 =====
//   { id: 'girl1_dorm', name: '大一女舍', prefixes: ['大一女舍', '大1女'], lat: 25.0172, lng: 121.5328 },
//   { id: 'girl5_dorm', name: '女五舍', prefixes: ['女五舍', '女生5宿舍', '女5舍'], lat: 25.0168, lng: 121.5322 },
//   { id: 'boy1_dorm', name: '男一舍', prefixes: ['男一舍活動學習中心', '男1舍'], lat: 25.0165, lng: 121.5318 },

  // ===== 運動場 =====
  { id: 'tennis', name: '網球場', prefixes: ['網球場', '醫學院網球場'], lat: 25.018635570360697, lng: 121.53438548172448 },
  { id: 'basketball', name: '籃球場', prefixes: ['籃球場', '中央籃球場', '新生路籃球場', '醫學院籃球場'], lat: 25.02015556778366, lng: 121.53642376767128 },
  { id: 'track', name: '田徑場', prefixes: ['田徑場'], lat: 25.019695070796818, lng: 121.53483095870548 },
  { id: 'baseball', name: '棒壘球場', prefixes: ['棒壘球場'], lat: 25.020804398503522, lng: 121.53537512289576 },
  { id: 'soccer', name: '足球場', prefixes: ['足球場'], lat: 25.020052878706622, lng: 121.53564030636535 },
  { id: 'volleyball', name: '排球場', prefixes: ['排球場'], lat: 25.019257161783454, lng: 121.5365720042466 },
//   { id: 'handball', name: '手球場', prefixes: ['手球場', '原手球場'], lat: 25.0185, lng: 121.5330 },
//   { id: 'rugby', name: '橄欖球場', prefixes: ['橄欖球場'], lat: 25.0178, lng: 121.5325 },
//   { id: 'golf', name: '高爾夫球場', prefixes: ['高爾夫球場'], lat: 25.0170, lng: 121.5315 },
//   { id: 'swimming_old', name: '舊游泳池', prefixes: ['舊游泳池前'], lat: 25.0212, lng: 121.5358 },
//   { id: 'redclay', name: '紅土球場', prefixes: ['紅土球場'], lat: 25.0175, lng: 121.5320 },
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
