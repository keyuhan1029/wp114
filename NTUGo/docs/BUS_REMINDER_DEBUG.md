# 公车提醒功能调试指南

## 问题排查步骤

### 1. 检查提醒是否已创建

在浏览器控制台执行：
```javascript
const token = localStorage.getItem('token');
fetch('/api/bus/reminders', {
  headers: { Authorization: `Bearer ${token}` }
}).then(r => r.json()).then(console.log);
```

应该能看到你创建的提醒列表。

### 2. 检查通知是否已创建

在浏览器控制台执行：
```javascript
const token = localStorage.getItem('token');
fetch('/api/notifications?limit=20', {
  headers: { Authorization: `Bearer ${token}` }
}).then(r => r.json()).then(console.log);
```

应该能看到所有通知，包括公车到站通知。

### 3. 手动触发检查（测试用）

在终端执行：
```bash
curl -X POST http://localhost:3000/api/bus/reminders/check
```

这会立即检查并发送所有到期的提醒。

### 4. 检查定时任务是否运行

**开发环境：**
需要手动运行定时任务脚本：
```bash
cd "final 2/NTUGo"
node scripts/check-bus-reminders.js
```

或者安装依赖后运行：
```bash
npm install node-cron
node scripts/check-bus-reminders.js
```

**生产环境：**
需要设置 Vercel Cron Jobs 或外部 Cron 服务。

### 5. 检查 Pusher 连接

在浏览器控制台检查：
```javascript
// 检查 Pusher 是否连接
// 应该在 TopBar 组件加载时自动连接
```

如果 Pusher 未连接，检查：
- `.env.local` 中是否设置了 `NEXT_PUBLIC_PUSHER_KEY` 和 `NEXT_PUBLIC_PUSHER_CLUSTER`
- 浏览器控制台是否有 Pusher 相关错误

### 6. 测试提醒创建流程

1. 在地图上点击公车站牌
2. 查看公车实时信息
3. 找到预计到站时间 >= 5分钟的公车路线
4. 点击路线卡片上的提醒图标（🔔）
5. 图标应该变成橙色（已设置提醒）

### 7. 测试通知接收

**方法 1：等待定时任务**
- 设置一个提醒，目标到站时间设置为当前时间 + 6分钟
- 等待 1-2 分钟，定时任务应该会触发
- 检查通知图标上的未读数量是否增加

**方法 2：手动触发**
- 设置一个提醒，目标到站时间设置为当前时间 + 6分钟
- 在终端执行：`curl -X POST http://localhost:3000/api/bus/reminders/check`
- 应该立即收到通知

### 8. 常见问题

**问题：提醒已创建但没有收到通知**
- 检查定时任务是否在运行
- 检查提醒的 `reminderTime` 是否已到（应该 <= 当前时间）
- 检查提醒的 `isNotified` 是否为 `false`
- 手动执行检查 API 看是否有错误

**问题：收到通知但前端没有显示**
- 检查浏览器控制台是否有错误
- 检查 Pusher 是否连接
- 尝试刷新页面
- 点击通知图标查看通知列表

**问题：Pusher 连接失败**
- 检查环境变量是否正确设置
- 检查 `/api/pusher/auth` 端点是否正常工作
- 检查浏览器控制台的错误信息

## 调试技巧

### 查看提醒详情

```javascript
// 获取提醒列表
const token = localStorage.getItem('token');
const reminders = await fetch('/api/bus/reminders', {
  headers: { Authorization: `Bearer ${token}` }
}).then(r => r.json());

console.log('提醒列表:', reminders.reminders);

// 检查提醒时间
reminders.reminders.forEach(r => {
  const reminderTime = new Date(r.reminderTime);
  const now = new Date();
  const diff = reminderTime.getTime() - now.getTime();
  console.log(`提醒 ${r._id}:`, {
    routeName: r.routeName,
    reminderTime: reminderTime.toLocaleString('zh-TW'),
    now: now.toLocaleString('zh-TW'),
    diffMinutes: Math.floor(diff / 60000),
    isActive: r.isActive,
    isNotified: r.isNotified,
  });
});
```

### 查看通知详情

```javascript
const token = localStorage.getItem('token');
const notifications = await fetch('/api/notifications?limit=50', {
  headers: { Authorization: `Bearer ${token}` }
}).then(r => r.json());

console.log('通知列表:', notifications.notifications);
console.log('未读数量:', notifications.unreadCount);

// 筛选公车通知
const busNotifications = notifications.notifications.filter(n => n.type === 'bus_arrival');
console.log('公车通知:', busNotifications);
```

