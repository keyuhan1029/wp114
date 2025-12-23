/**
 * 公车提醒检查脚本
 * 用于开发环境，定期检查并发送公车到站提醒
 * 
 * 使用方法：
 * node scripts/check-bus-reminders.js
 * 
 * 或者使用 nodemon 自动重启：
 * nodemon scripts/check-bus-reminders.js
 */

const cron = require('node-cron');

// 检查 API 端点
const API_URL = process.env.API_URL || 'http://localhost:3000';
const API_KEY = process.env.BUS_REMINDER_API_KEY || '';

async function checkBusReminders() {
  try {
    const response = await fetch(`${API_URL}/api/bus/reminders/check`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(API_KEY && { 'Authorization': `Bearer ${API_KEY}` }),
      },
    });

    const data = await response.json();
    
    if (data.success) {
      if (data.count > 0) {
        console.log(`[${new Date().toLocaleString('zh-TW')}] ✅ 已處理 ${data.count} 個提醒`);
        if (data.results) {
          data.results.forEach((result, index) => {
            if (result.success) {
              console.log(`  - 提醒 ${result.reminderId}: 通知已發送`);
            } else {
              console.error(`  - 提醒 ${result.reminderId}: 失敗 - ${result.error}`);
            }
          });
        }
      } else {
        console.log(`[${new Date().toLocaleString('zh-TW')}] ℹ️  沒有需要發送的通知`);
      }
    } else {
      console.error(`[${new Date().toLocaleString('zh-TW')}] ❌ 檢查失敗:`, data.message);
    }
  } catch (error) {
    console.error(`[${new Date().toLocaleString('zh-TW')}] ❌ 請求失敗:`, error.message);
  }
}

// 每分钟执行一次
console.log('🚌 公车提醒检查服务已启动');
console.log(`📡 API URL: ${API_URL}`);
console.log('⏰ 检查频率: 每分钟一次');
console.log('按 Ctrl+C 停止服务\n');

// 立即执行一次
checkBusReminders();

// 然后每分钟执行一次
cron.schedule('* * * * *', checkBusReminders);

