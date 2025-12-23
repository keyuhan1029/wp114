/**
 * 生成 6 位數字驗證碼
 */
export function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * NTU 郵箱域名列表
 */
const NTU_EMAIL_DOMAINS = [
  'ntu.edu.tw',        // 一般學生/教職員
  // 可以根據需要擴展其他 NTU 相關域名
];

/**
 * 檢查是否為 NTU 郵箱
 */
export function isNTUEmail(email: string): boolean {
  const domain = email.split('@')[1]?.toLowerCase();
  return NTU_EMAIL_DOMAINS.includes(domain || '');
}

/**
 * 驗證郵箱格式
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

