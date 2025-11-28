import { NextResponse } from 'next/server';

export async function POST() {
  // 登出主要是前端清除 token，這裡可以添加後端邏輯（如 token 黑名單等）
  return NextResponse.json({ message: '登出成功' });
}

