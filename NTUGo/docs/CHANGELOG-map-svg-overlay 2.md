# 地圖 SVG Overlay 功能更新

> 開發日期：2025-12-02

## 概述

本次更新為 NTUGo 地圖元件新增自訂 SVG Overlay 功能，將新體育館與總圖書館的 icon 改為可隨地圖縮放的 SVG 圖示，並固定在指定的經緯度範圍內。

---

## 新增檔案清單

| 檔案路徑 | 說明 |
|----------|------|
| `src/components/Map/SVGOverlay.tsx` | 自訂 Google Maps OverlayView 元件，支援 SVG 綁定到經緯度邊界 |
| `public/NTUSportsCenter.svg` | 新體育館 SVG 圖示 |
| `public/NTUMainLibrary.svg` | 總圖書館 SVG 圖示 |

---

## 修改的檔案

| 檔案路徑 | 修改內容 |
|----------|----------|
| `src/components/Map/MapComponent.tsx` | 新體與總圖改用 SVGOverlay 元件，支援隨地圖縮放、hover 變色 |

---

## 功能詳細說明

### 1. SVGOverlay 元件

**技術實作**：
- 繼承 `google.maps.OverlayView` 建立自訂 overlay
- 使用 `document.createElementNS` 建立 SVG 元素，確保頁面載入時立即顯示
- SVG 大小會隨地圖縮放而改變，始終固定在指定的經緯度邊界內

**Props 介面**：
```typescript
interface SVGOverlayProps {
  map: google.maps.Map | null;
  bounds: {
    north: number;  // 北緯
    south: number;  // 南緯
    east: number;   // 東經
    west: number;   // 西經
  };
  svgPath: string;      // SVG path d 屬性
  viewBox: string;      // SVG viewBox
  defaultColor: string; // 預設顏色
  hoverColor: string;   // hover 顏色
  onClick?: () => void; // 點擊事件
}
```

### 2. 新體育館 Icon

**經緯度邊界**：
- 北緯：`25.021999`
- 南緯：`25.021286`
- 東經：`121.535645`
- 西經：`121.534778`

**樣式**：
- 預設顏色：灰色 `#9e9e9e`
- Hover 顏色：黑色 `#000000`
- CSS transition：`fill 0.15s ease, stroke 0.15s ease`

**點擊行為**：
- 顯示 InfoWindow
- 呼叫 `fetchGymOccupancy()` 取得體育館人數資訊

### 3. 總圖書館 Icon

**經緯度邊界**：
- 北緯：`25.017916`
- 南緯：`25.017039`
- 東經：`121.541376`
- 西經：`121.540522`

**樣式**：
- 預設顏色：灰色 `#9e9e9e`
- Hover 顏色：黑色 `#000000`
- CSS transition：`fill 0.15s ease, stroke 0.15s ease`

**點擊行為**：
- 顯示 InfoWindow
- 呼叫 `fetchLibraryInfo()` 取得圖書館資訊

---

## 技術細節

### 為何不使用 MarkerF

`MarkerF` 的 `icon` 屬性使用固定像素大小，無法隨地圖縮放而改變。要讓圖示固定在經緯度範圍內並隨縮放變化，必須使用 `OverlayView`。

### SVG 建立方式

使用 `document.createElementNS` 而非 `innerHTML`，確保：
1. 頁面載入時 SVG 立即顯示
2. hover 狀態切換更即時（直接修改 DOM 屬性）
3. 避免 React state 異步更新造成的延遲

### Hover 事件處理

事件處理直接在 OverlayView class 內部用 arrow function 綁定：
```typescript
private handleMouseEnter = () => {
  this.isHovered = true;
  this.updateColor();
};

private handleMouseLeave = () => {
  this.isHovered = false;
  this.updateColor();
};
```

這樣可以：
1. 確保 `this` 指向正確
2. 避免 React state 異步更新問題
3. 直接操作 DOM 讓顏色變化更即時

---

## SVG Path 參考

### 新體育館 (NTUSportsCenter.svg)

```
viewBox: 0 0 512 512
path: M 100 70 Q 256 10 412 70 L 472 40 L 442 100 Q 502 256 442 412 L 472 472 L 412 442 Q 256 502 100 442 L 40 472 L 70 412 Q 10 256 70 100 L 40 40 Z
```

### 總圖書館 (NTUMainLibrary.svg)

```
viewBox: 0 0 500 600
path: M 250 50 L 450 50 L 450 200 L 500 200 L 500 550 L 50 550 L 50 200 L 250 200 Z
```

---

## 測試建議

1. **頁面載入**：確認 SVG 圖示在頁面載入時立即顯示
2. **地圖縮放**：放大/縮小地圖，確認 SVG 大小隨之改變
3. **Hover 效果**：滑鼠移入/移出，確認顏色切換即時且平滑
4. **點擊功能**：點擊新體/總圖，確認 InfoWindow 正確顯示
5. **資訊載入**：確認點擊後體育館人數/圖書館資訊正確載入

---

## 後續開發建議

1. **更多地標**：可將其他校園地標也改用 SVGOverlay
2. **動態 SVG**：可根據狀態（如人數多寡）動態改變 SVG 顏色
3. **動畫效果**：可加入 SVG 動畫（如 pulse 效果）吸引注意

