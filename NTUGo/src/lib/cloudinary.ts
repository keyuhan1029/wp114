import { v2 as cloudinary } from 'cloudinary';

// 初始化 Cloudinary
let isConfigured = false;

export function configureCloudinary() {
  if (isConfigured) return;

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    console.warn('Cloudinary 環境變數未設定，檔案上傳功能將無法使用');
    return;
  }

  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
  });

  isConfigured = true;
}

// 上傳檔案
export async function uploadFile(
  file: Buffer | string,
  options?: {
    folder?: string;
    resourceType?: 'image' | 'video' | 'raw' | 'auto';
    publicId?: string;
  }
): Promise<{
  url: string;
  publicId: string;
  format: string;
  size: number;
  width?: number;
  height?: number;
}> {
  configureCloudinary();

  const uploadOptions: any = {
    folder: options?.folder || 'ntugo/chat',
    resource_type: options?.resourceType || 'auto',
  };

  if (options?.publicId) {
    uploadOptions.public_id = options.publicId;
  }

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      uploadOptions,
      (error, result) => {
        if (error) {
          reject(error);
        } else if (result) {
          resolve({
            url: result.secure_url,
            publicId: result.public_id,
            format: result.format,
            size: result.bytes,
            width: result.width,
            height: result.height,
          });
        } else {
          reject(new Error('上傳失敗'));
        }
      }
    );

    if (typeof file === 'string') {
      // Base64 或 URL
      cloudinary.uploader.upload(file, uploadOptions)
        .then(result => {
          resolve({
            url: result.secure_url,
            publicId: result.public_id,
            format: result.format,
            size: result.bytes,
            width: result.width,
            height: result.height,
          });
        })
        .catch(reject);
    } else {
      // Buffer
      uploadStream.end(file);
    }
  });
}

// 刪除檔案
export async function deleteFile(publicId: string): Promise<boolean> {
  configureCloudinary();

  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result.result === 'ok';
  } catch (error) {
    console.error('刪除檔案失敗:', error);
    return false;
  }
}

// 取得縮圖 URL
export function getThumbnailUrl(url: string, width: number = 200, height: number = 200): string {
  // 如果是 Cloudinary URL，添加轉換參數
  if (url.includes('cloudinary.com')) {
    return url.replace('/upload/', `/upload/c_fill,w_${width},h_${height}/`);
  }
  return url;
}

