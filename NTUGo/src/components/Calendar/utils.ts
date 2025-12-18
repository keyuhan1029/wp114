/**
 * 日曆工具函數
 */

/**
 * 格式化月份年份顯示
 */
export function formatMonthYear(date: Date): string {
  return `${date.getFullYear()} 年 ${date.getMonth() + 1} 月`;
}

/**
 * 獲取指定月份的第一天和最後一天
 */
export function getMonthRange(date: Date): { start: Date; end: Date } {
  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59);
  return { start, end };
}

/**
 * 生成日曆矩陣（6週 x 7天 = 42天）
 */
export function getCalendarMatrix(current: Date): Date[] {
  const { start } = getMonthRange(current);
  const firstDayOfWeek = start.getDay(); // 0 (Sun) - 6 (Sat)
  const days: Date[] = [];

  // 從本月第一天所在週的星期日開始
  const firstCell = new Date(start);
  firstCell.setDate(start.getDate() - firstDayOfWeek);

  for (let i = 0; i < 42; i++) {
    const d = new Date(firstCell);
    d.setDate(firstCell.getDate() + i);
    days.push(d);
  }

  return days;
}

/**
 * 判斷兩個日期是否為同一天
 */
export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/**
 * 將 Date 轉換為 datetime-local input 的格式
 */
export function toLocalInputValue(date: Date): string {
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate()
  )}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

