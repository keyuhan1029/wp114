# 公车到站提醒功能设置说明

## 功能概述

用户可以在查询公车实时信息后，为即将到站的公车设置提醒。系统会在公车到站前5分钟发送通知给用户。

## 功能特性

1. **预约提醒**：用户可以为每条路线设置提醒
2. **自动通知**：系统在到站前5分钟自动发送通知
3. **实时推送**：通过 Pusher 实时推送通知
4. **通知记录**：所有通知都会保存在数据库中

## API 端点

### 1. 获取用户的提醒列表
```
GET /api/bus/reminders
Authorization: Bearer <token>
```

### 2. 创建提醒
```
POST /api/bus/reminders
Authorization: Bearer <token>
Content-Type: application/json

{
  "stopUID": "string",
  "stopName": "string",
  "routeUID": "string",
  "routeName": "string",
  "direction": number,
  "estimateTime": number  // 秒数
}
```

### 3. 删除提醒
```
DELETE /api/bus/reminders/[id]
Authorization: Bearer <token>
```

### 4. 检查并发送提醒（定时任务调用）
```
POST /api/bus/reminders/check
Authorization: Bearer <API_KEY>  // 可选，需要在环境变量中设置 BUS_REMINDER_API_KEY
```

## 定时任务设置

### 方法 1: 使用 Vercel Cron Jobs（推荐）

在 `vercel.json` 中添加：

```json
{
  "crons": [
    {
      "path": "/api/bus/reminders/check",
      "schedule": "*/1 * * * *"
    }
  ]
}
```

这会每分钟调用一次检查 API。

### 方法 2: 使用外部 Cron 服务

可以使用以下服务定期调用 API：
- EasyCron
- Cron-job.org
- GitHub Actions

设置每分钟调用一次：
```
POST https://your-domain.com/api/bus/reminders/check
Authorization: Bearer <BUS_REMINDER_API_KEY>
```

### 方法 3: 使用 Node.js 定时任务（开发环境）

创建一个简单的脚本 `scripts/check-bus-reminders.js`：

```javascript
const cron = require('node-cron');

cron.schedule('* * * * *', async () => {
  const response = await fetch('http://localhost:3000/api/bus/reminders/check', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.BUS_REMINDER_API_KEY || ''}`,
    },
  });
  const data = await response.json();
  console.log('检查结果:', data);
});
```

## 环境变量

可选：设置 API Key 以保护检查端点：

```env
BUS_REMINDER_API_KEY=your-secret-key-here
```

如果不设置，检查端点将不需要认证（仅用于开发环境）。

## 使用流程

1. 用户在地图上点击公车站牌
2. 查看公车实时信息
3. 点击路线卡片上的提醒图标（🔔）
4. 系统创建提醒记录
5. 定时任务每分钟检查一次
6. 当提醒时间到达时（到站前5分钟），系统：
   - 创建通知记录
   - 通过 Pusher 实时推送
   - 标记提醒为已通知

## 注意事项

- 提醒只在公车预计到站时间 >= 5分钟时才能设置
- 每个用户对同一路线（相同 stopUID + routeUID + direction）只能设置一个活跃提醒
- 提醒会在公车到站时间过后自动停用
- 已发送通知的提醒会被标记为已通知，不会重复发送

