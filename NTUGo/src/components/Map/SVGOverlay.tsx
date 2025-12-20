'use client';

import * as React from 'react';

interface SVGOverlayProps {
  map: google.maps.Map | null;
  bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
  svgPath: string;
  viewBox: string;
  defaultColor: string;
  hoverColor: string;
  onClick?: () => void;
}

/**
 * SVGOverlay - 將 SVG 圖示綁定到指定的經緯度邊界
 * 圖示大小會隨地圖縮放而改變
 */
export default function SVGOverlay({
  map,
  bounds,
  svgPath,
  viewBox,
  defaultColor,
  hoverColor,
  onClick,
}: SVGOverlayProps) {
  const overlayRef = React.useRef<google.maps.OverlayView | null>(null);

  // 使用 ref 來存儲最新的 onClick，避免因為 onClick 變化導致 overlay 重建
  const onClickRef = React.useRef(onClick);
  React.useEffect(() => {
    onClickRef.current = onClick;
  }, [onClick]);

  React.useEffect(() => {
    if (!map) return;

    // 建立自訂 OverlayView - 所有邏輯都在 class 內部處理
    class CustomOverlay extends google.maps.OverlayView {
      private bounds: google.maps.LatLngBounds;
      private div: HTMLDivElement | null = null;
      private svgElement: SVGSVGElement | null = null;
      private pathElement: SVGPathElement | null = null;
      private isHovered = false;
      private mouseInside = false;

      constructor(bounds: google.maps.LatLngBounds) {
        super();
        this.bounds = bounds;
      }

      onAdd() {
        // 建立容器
        this.div = document.createElement('div');
        this.div.style.position = 'absolute';
        this.div.style.cursor = 'pointer';
        // 設定較低的 z-index，讓其他標記顯示在上方
        this.div.style.zIndex = '0';

        // 建立 SVG
        const svgNS = 'http://www.w3.org/2000/svg';
        this.svgElement = document.createElementNS(svgNS, 'svg');
        this.svgElement.setAttribute('viewBox', viewBox);
        this.svgElement.setAttribute('width', '100%');
        this.svgElement.setAttribute('height', '100%');
        this.svgElement.setAttribute('preserveAspectRatio', 'none');
        this.svgElement.style.display = 'block';

        // 建立 path
        this.pathElement = document.createElementNS(svgNS, 'path');
        this.pathElement.setAttribute('d', svgPath);
        this.pathElement.setAttribute('fill', defaultColor);
        this.pathElement.setAttribute('stroke', defaultColor);
        this.pathElement.setAttribute('stroke-width', '4');
        this.pathElement.setAttribute('stroke-linejoin', 'round');
        // 加入 CSS transition 讓顏色變化更平滑，使用更長的時間減少閃爍
        this.pathElement.style.transition = 'fill 0.2s ease, stroke 0.2s ease';
        // 防止過渡期間的閃爍
        this.pathElement.style.willChange = 'fill, stroke';

        this.svgElement.appendChild(this.pathElement);
        this.div.appendChild(this.svgElement);

        // 綁定 hover 事件 - 直接在 div 上處理
        this.div.addEventListener('mouseenter', this.handleMouseEnter);
        this.div.addEventListener('mouseleave', this.handleMouseLeave);
        this.div.addEventListener('click', this.handleClick);

        // 使用 overlayMouseTarget 以接收滑鼠事件，z-index 已設為 1 讓標記顯示在上方
        const panes = this.getPanes();
        panes?.overlayMouseTarget.appendChild(this.div);
      }

      draw() {
        if (!this.div) return;

        const overlayProjection = this.getProjection();
        if (!overlayProjection) return;

        const sw = overlayProjection.fromLatLngToDivPixel(this.bounds.getSouthWest());
        const ne = overlayProjection.fromLatLngToDivPixel(this.bounds.getNorthEast());

        if (sw && ne) {
          this.div.style.left = sw.x + 'px';
          this.div.style.top = ne.y + 'px';
          this.div.style.width = (ne.x - sw.x) + 'px';
          this.div.style.height = (sw.y - ne.y) + 'px';
        }
      }

      onRemove() {
        if (this.div) {
          this.div.removeEventListener('mouseenter', this.handleMouseEnter);
          this.div.removeEventListener('mouseleave', this.handleMouseLeave);
          this.div.removeEventListener('click', this.handleClick);
          this.div.parentNode?.removeChild(this.div);
          this.div = null;
          this.svgElement = null;
          this.pathElement = null;
        }
      }

      private handleMouseEnter = () => {
        this.mouseInside = true;
        this.isHovered = true;
        this.updateColor();
      };

      private handleMouseLeave = () => {
        this.mouseInside = false;
        this.isHovered = false;
        this.updateColor();
      };

      private handleClick = () => {
        onClickRef.current?.();
      };

      private updateColor() {
        if (!this.pathElement) return;
        const color = this.isHovered ? hoverColor : defaultColor;
        this.pathElement.setAttribute('fill', color);
        this.pathElement.setAttribute('stroke', color);
      }
    }

    const latLngBounds = new google.maps.LatLngBounds(
      new google.maps.LatLng(bounds.south, bounds.west),
      new google.maps.LatLng(bounds.north, bounds.east)
    );

    const overlay = new CustomOverlay(latLngBounds);
    overlay.setMap(map);
    overlayRef.current = overlay;

    return () => {
      overlay.setMap(null);
      overlayRef.current = null;
    };
  }, [map, bounds.north, bounds.south, bounds.east, bounds.west, svgPath, viewBox, defaultColor, hoverColor]);

  return null;
}
