import { NextResponse } from 'next/server';
import { verifyToken, getTokenFromRequest } from '@/lib/jwt';
import { uploadFile } from '@/lib/cloudinary';
import { extractTextFromPDF, chunkText } from '@/lib/utils/pdfExtractor';
import { DocumentModel } from '@/lib/models/Document';
import axios from 'axios';

// 只允许 PDF 文件
const ALLOWED_FILE_TYPES = ['application/pdf'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

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

    // 检查 Cloudinary 环境变量
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      return NextResponse.json(
        { message: '檔案上傳服務未設定' },
        { status: 503 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const title = formData.get('title') as string | null;
    const description = formData.get('description') as string | null;

    if (!file) {
      return NextResponse.json(
        { message: '請選擇要上傳的檔案' },
        { status: 400 }
      );
    }

    // 检查文件类型
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      return NextResponse.json(
        { message: '只支援 PDF 檔案' },
        { status: 400 }
      );
    }

    // 检查文件大小
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { message: '檔案大小不能超過 10MB' },
        { status: 400 }
      );
    }

    // 转换为 Buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // 提取 PDF 文本
    let extractedText = '';
    let textChunks: string[] = [];
    try {
      console.log('[Upload] 开始提取PDF文本，文件名:', file.name, '大小:', file.size);
      extractedText = await extractTextFromPDF(buffer);
      
      if (!extractedText || extractedText.trim().length === 0) {
        console.warn('[Upload] PDF 文本提取结果为空');
        console.warn('[Upload] 可能的原因:');
        console.warn('  1. PDF是扫描版（图片），没有可提取的文本');
        console.warn('  2. PDF是加密的或受保护的');
        console.warn('  3. PDF文件损坏');
        extractedText = ''; // 允许空文本，但继续处理
      } else {
        console.log('[Upload] PDF文本提取成功，长度:', extractedText.length);
      }
      
      textChunks = chunkText(extractedText);
      console.log('[Upload] 文本分块完成，块数:', textChunks.length);
      
      if (textChunks.length > 0) {
        console.log('[Upload] 第一个文本块预览:', textChunks[0].substring(0, 100));
      }
    } catch (error: any) {
      console.error('[Upload] PDF 文本提取失败:');
      console.error('  错误类型:', error.name);
      console.error('  错误消息:', error.message);
      console.error('  错误堆栈:', error.stack);
      // 如果提取失败，仍然允许上传，但文本为空
      extractedText = '';
      textChunks = [];
      console.warn('[Upload] PDF 文本提取失败，但继续上传文件');
    }

    // 上传到 Cloudinary
    let result;
    try {
      const folder = `ntugo/documents/${payload.userId}`;
      result = await uploadFile(buffer, {
        folder,
        resourceType: 'raw',
      });
    } catch (uploadError: any) {
      console.error('Cloudinary 上傳錯誤:', uploadError);
      return NextResponse.json(
        { message: '檔案上傳到雲端失敗: ' + (uploadError.message || '未知錯誤') },
        { status: 500 }
      );
    }

    // 上传到 OpenAI Files API（让GPT直接读取PDF）
    let openaiFileId: string | undefined;
    try {
      const apiKey = process.env.OPENAI_API_KEY?.trim();
      if (apiKey) {
        console.log('[Upload] 开始上传PDF到OpenAI Files API');
        const OpenAI = require('openai');
        const openai = new OpenAI({ apiKey });
        
        // 创建文件对象（OpenAI Files API需要File对象）
        const fileBlob = new Blob([buffer], { type: 'application/pdf' });
        const openaiFile = new File([fileBlob], file.name, { type: 'application/pdf' });
        
        const uploadedFile = await openai.files.create({
          file: openaiFile,
          purpose: 'assistants', // 用于assistants API
        });
        
        openaiFileId = uploadedFile.id;
        console.log('[Upload] PDF已上传到OpenAI，文件ID:', openaiFileId);
      } else {
        console.warn('[Upload] OpenAI API Key未设置，跳过上传到OpenAI Files API');
      }
    } catch (openaiError: any) {
      console.error('[Upload] OpenAI Files API上传失败:', openaiError);
      console.warn('[Upload] 继续保存到数据库，但不包含OpenAI文件ID');
      // 不阻止上传，继续保存到数据库
    }

    // 保存到数据库
    let document;
    try {
      document = await DocumentModel.create({
        title: title || file.name,
        description: description || undefined,
        fileUrl: result.url,
        fileType: 'pdf',
        extractedText,
        textChunks,
        openaiFileId,
        uploadedBy: payload.userId,
      });
    } catch (dbError: any) {
      console.error('資料庫保存錯誤:', dbError);
      return NextResponse.json(
        { message: '保存文檔到資料庫失敗: ' + (dbError.message || '未知錯誤') },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      document: {
        id: document._id instanceof Object ? document._id.toString() : String(document._id),
        title: document.title,
        description: document.description,
        fileUrl: document.fileUrl,
        textChunksCount: textChunks.length,
      },
    });
  } catch (error: any) {
    console.error('PDF 上傳錯誤:', error);
    console.error('錯誤詳情:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
    });
    return NextResponse.json(
      { message: 'PDF 上傳失敗: ' + (error.message || '未知錯誤') },
      { status: 500 }
    );
  }
}

