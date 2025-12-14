import { NextResponse } from 'next/server';
import { verifyToken, getTokenFromRequest } from '@/lib/jwt';
import { uploadFile } from '@/lib/cloudinary';

// 允許的檔案類型
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const ALLOWED_FILE_TYPES = [
  ...ALLOWED_IMAGE_TYPES,
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
];

// 最大檔案大小 (10MB)
const MAX_FILE_SIZE = 10 * 1024 * 1024;

export async function POST(request: Request) {
  try {
    const token = getTokenFromRequest(request);

    if (!token) {
      return NextResponse.json(
        { message: '未提供認證 token' },
        { status: 401 }
      );
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json(
        { message: '無效的 token' },
        { status: 401 }
      );
    }

    // 檢查 Cloudinary 環境變數
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      return NextResponse.json(
        { message: '檔案上傳服務未設定' },
        { status: 503 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const folderParam = formData.get('folder') as string | null;

    if (!file) {
      return NextResponse.json(
        { message: '請選擇要上傳的檔案' },
        { status: 400 }
      );
    }

    // 檢查檔案類型
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      return NextResponse.json(
        { message: '不支援的檔案類型' },
        { status: 400 }
      );
    }

    // 檢查檔案大小
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { message: '檔案大小不能超過 10MB' },
        { status: 400 }
      );
    }

    // 轉換為 Buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // 判斷資源類型
    const isImage = ALLOWED_IMAGE_TYPES.includes(file.type);
    const resourceType = isImage ? 'image' : 'raw';

    // 決定文件夾路徑
    const folderName = folderParam || 'chat';
    const folder = `ntugo/${folderName}/${payload.userId}`;

    // 上傳到 Cloudinary
    const result = await uploadFile(buffer, {
      folder,
      resourceType,
    });

    return NextResponse.json({
      success: true,
      file: {
        url: result.url,
        publicId: result.publicId,
        format: result.format,
        size: result.size,
        width: result.width,
        height: result.height,
        name: file.name,
        type: isImage ? 'image' : 'file',
        mimeType: file.type,
      },
    });
  } catch (error: any) {
    console.error('檔案上傳錯誤:', error);
    return NextResponse.json(
      { message: '檔案上傳失敗' },
      { status: 500 }
    );
  }
}

