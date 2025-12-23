# 公车站点路线筛选流程说明

## 整体流程概览

```
1. 获取公车站点 → 2. 筛选可见站点 → 3. 点击站点 → 4. 查询路线 → 5. 分组和排序 → 6. 分页显示
```

---

## 详细流程

### 第一步：获取公车站点

**位置**：`src/services/busApi.ts` → `fetchBusStopsNearNTU()`

**筛选条件**：
- **中心点**：台大中心坐标 `(25.0173405, 121.5397518)`
- **范围**：半径 **1 公里**内的所有公车站点
- **API**：调用 `/api/tdx/bus-stops?lat=...&lon=...&radius=1000`
- **TDX API**：使用 `spatialFilter=nearby(lat, lon, radius)` 查询

**代码位置**：
```typescript
// src/services/busApi.ts:60-105
const centerLat = 25.0173405;  // 台大中心纬度
const centerLon = 121.5397518;  // 台大中心经度
const radius = 1000;            // 1 公里范围
```

**缓存机制**：
- 缓存时间：30 秒
- 如果 API 失败，返回缓存的站点数据

---

### 第二步：筛选可见站点（地图显示）

**位置**：`src/components/Map/MapComponent.tsx` → `updateVisibleStations()`

**筛选条件**：
- 只显示**当前地图视窗内**的站点
- 使用 Google Maps 的 `bounds.contains()` 检查
- 只有当 `showBusStops` 为 `true` 时才显示

**代码逻辑**：
```typescript
// src/components/Map/MapComponent.tsx:694-708
if (showBusStopsRef.current && busStopsRef.current.length > 0) {
  const bounds = map.getBounds();
  if (bounds) {
    const visible = busStopsRef.current.filter((stop) => {
      const latLng = new google.maps.LatLng(
        stop.StopPosition.PositionLat,
        stop.StopPosition.PositionLon
      );
      return bounds.contains(latLng);  // 只显示视窗内的站点
    });
    setVisibleBusStops(visible);
  }
}
```

---

### 第三步：点击站点触发查询

**位置**：`src/components/Map/MapComponent.tsx` → `handleBusStopClick()`

**触发方式**：
- 用户点击地图上的公车站点标记
- 使用**站名**（`stopName`）而不是 `stopUID` 查询
- 这样可以获取所有同名站点的路线（类似"台北等公车"）

**代码逻辑**：
```typescript
// src/components/Map/MapComponent.tsx:787-835
const handleBusStopClick = async (stop: BusStop) => {
  const stopName = stop.StopName.Zh_tw;
  // 使用站名查询，获取所有同名站点的路线
  const realTimeInfo = await fetchBusRealTimeInfo(stopName, true);
}
```

---

### 第四步：查询路线（API 层面）

**位置**：`src/app/api/tdx/bus-realtime/route.ts` → `GET()`

**查询流程**：

#### 4.1 根据站名查找所有同名站点
```typescript
// 使用 contains 查询匹配站名变体
// 例如："臺大癌醫" 和 "臺大癌醫 (基隆路)"
const stopsResponse = await fetch(
  `https://tdx.transportdata.tw/api/basic/v2/Bus/Stop/City/Taipei?$filter=contains(StopName/Zh_tw,'${stopName}')&$format=JSON`
);
```

#### 4.2 过滤真正匹配的站点
```typescript
// 完全匹配或站名以查询名称开头
matchingStops = matchingStops.filter((stop: any) => {
  const stopNameZh = stop.StopName?.Zh_tw || '';
  return stopNameZh === stopName || stopNameZh.startsWith(stopName);
});
```

#### 4.3 为每个 StopUID 查询实时信息
```typescript
// 为每个匹配的站点创建查询任务
const realTimeTasks = stopUIDs.map((uid: string) => async () => {
  const url = `https://tdx.transportdata.tw/api/basic/v2/Bus/EstimatedTimeOfArrival/City/Taipei?$filter=StopUID eq '${uid}'&$format=JSON`;
  return await fetchWithRetry(url, headers);
});
```

#### 4.4 批次查询（避免 API 限制）
```typescript
// 每批2个请求，批次间延迟300ms
const realTimeResults = await limitConcurrency(realTimeTasks, 2);
allBusData = realTimeResults.flat();
```

---

### 第五步：去重和排序

**位置**：`src/app/api/tdx/bus-realtime/route.ts` → 去重逻辑

**去重规则**：
- 使用 `RouteUID + Direction` 作为唯一键
- 如果同一路线有多条数据，保留**预计到站时间最短**的那条

**代码逻辑**：
```typescript
// src/app/api/tdx/bus-realtime/route.ts:182-200
const uniqueMap = new Map<string, any>();
for (const item of allBusData) {
  const key = `${item.RouteUID}_${item.Direction}`;
  const existing = uniqueMap.get(key);
  const itemTime = item.EstimateTime ?? Infinity;
  const existingTime = existing?.EstimateTime ?? Infinity;
  
  // 保留时间最短的
  if (!existing || itemTime < existingTime) {
    uniqueMap.set(key, item);
  }
}

// 按预计到站时间排序（时间越短越前面）
allBusData = Array.from(uniqueMap.values()).sort((a, b) => {
  const timeA = a.EstimateTime ?? Infinity;
  const timeB = b.EstimateTime ?? Infinity;
  return timeA - timeB;
});
```

---

### 第六步：前端分组和排序

**位置**：`src/components/Map/BusInfoContent.tsx` → `groupedRoutes`

**分组规则**：
- 按 `RouteUID + Direction` 分组（同一路线的去程和返程分开）
- 每组内的多条数据按 `EstimateTime` 排序（时间越短越前面）

**排序规则**：
- 按第一班车的预计到站时间排序（时间越短越前面）

**代码逻辑**：
```typescript
// src/components/Map/BusInfoContent.tsx:254-288
const groupedRoutes = React.useMemo(() => {
  const groups = new Map<string, BusRealTimeInfo[]>();
  
  // 按 RouteUID + Direction 分组
  for (const info of busRealTimeInfo) {
    const key = `${info.RouteUID}_${info.Direction}`;
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key)!.push(info);
  }
  
  // 每组内按 EstimateTime 排序
  for (const [key, infos] of groups) {
    infos.sort((a, b) => {
      const timeA = a.EstimateTime ?? Infinity;
      const timeB = b.EstimateTime ?? Infinity;
      return timeA - timeB;
    });
  }
  
  // 按第一班车的时间排序
  sortedGroups.sort((a, b) => {
    const timeA = a[0]?.EstimateTime ?? Infinity;
    const timeB = b[0]?.EstimateTime ?? Infinity;
    return timeA - timeB;
  });
}, [busRealTimeInfo]);
```

---

### 第七步：分页显示

**位置**：`src/components/Map/BusInfoContent.tsx` → `displayedRoutes`

**分页规则**：
- 每页显示 **5 条路线**
- 初始显示第一页（前 5 条）
- 点击"加载更多"显示下一页（累积显示）

**代码逻辑**：
```typescript
// src/components/Map/BusInfoContent.tsx
const ITEMS_PER_PAGE = 5;
const displayedRoutes = React.useMemo(() => {
  const endIndex = displayedPage * ITEMS_PER_PAGE;
  return groupedRoutes.slice(0, endIndex);  // 累积显示
}, [groupedRoutes, displayedPage]);
```

---

## 关键筛选点总结

| 步骤 | 筛选条件 | 目的 |
|------|---------|------|
| 1. 获取站点 | 台大中心 1 公里内 | 只显示相关站点 |
| 2. 显示站点 | 地图视窗内 | 只显示可见站点 |
| 3. 查询路线 | 使用站名（非 stopUID） | 获取所有同名站点路线 |
| 4. 过滤站点 | 完全匹配或开头匹配 | 避免部分匹配错误 |
| 5. 去重 | RouteUID + Direction | 避免重复路线 |
| 6. 排序 | 按 EstimateTime | 时间短的优先显示 |
| 7. 分组 | RouteUID + Direction | 同一路线多条班次合并 |
| 8. 分页 | 每页 5 条 | 快速显示，渐进加载 |

---

## 性能优化

1. **缓存机制**：
   - 站点数据缓存 30 秒
   - Token 缓存 1 小时

2. **批次查询**：
   - 每批 2 个请求
   - 批次间延迟 300ms
   - 避免 API 429 错误

3. **防抖机制**：
   - 点击站点后延迟 100ms 再请求
   - 避免快速点击重复请求

4. **去重优化**：
   - 一次遍历完成去重和排序
   - 使用 Map 数据结构提高效率

---

## 注意事项

1. **同名站点**：同一个站名可能有多个 StopUID（不同方向、不同位置），系统会查询所有同名站点
2. **API 限制**：TDX API 有请求频率限制，使用批次查询和延迟避免 429 错误
3. **数据准确性**：预计到站时间可能因交通状况变化，数据实时更新
4. **分页显示**：虽然 API 返回所有数据，但前端分页显示，提升用户体验

