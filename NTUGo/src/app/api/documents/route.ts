import { NextResponse } from 'next/server';
import { verifyToken, getTokenFromRequest } from '@/lib/jwt';
import { DocumentModel } from '@/lib/models/Document';

// 获取所有文档列表
export async function GET(request: Request) {
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

    const documents = await DocumentModel.findAll(true);

    // 添加调试信息
    console.log('[Documents API] 找到文档数量:', documents.length);
    documents.forEach(doc => {
      console.log(`[Documents API] 文档: "${doc.title}", 文本块数量: ${doc.textChunks?.length || 0}, 提取文本长度: ${doc.extractedText?.length || 0}`);
      if (doc.textChunks && doc.textChunks.length > 0) {
        console.log(`[Documents API] 第一个文本块预览: ${doc.textChunks[0].substring(0, 100)}...`);
      }
    });

    return NextResponse.json({
      success: true,
      documents: documents.map(doc => ({
        id: doc._id,
        title: doc.title,
        description: doc.description,
        fileUrl: doc.fileUrl,
        fileType: doc.fileType,
        textChunksCount: doc.textChunks?.length || 0,
        extractedTextLength: doc.extractedText?.length || 0,
        uploadedBy: doc.uploadedBy,
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt,
      })),
    });
  } catch (error: any) {
    console.error('獲取文檔列表錯誤:', error);
    return NextResponse.json(
      { message: '獲取文檔列表失敗' },
      { status: 500 }
    );
  }
}

// 删除文档
export async function DELETE(request: Request) {
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

    const { searchParams } = new URL(request.url);
    const documentId = searchParams.get('id');

    if (!documentId) {
      return NextResponse.json(
        { message: '請提供文檔 ID' },
        { status: 400 }
      );
    }

    const deleted = await DocumentModel.delete(documentId);

    if (!deleted) {
      return NextResponse.json(
        { message: '文檔不存在或刪除失敗' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '文檔已刪除',
    });
  } catch (error: any) {
    console.error('刪除文檔錯誤:', error);
    return NextResponse.json(
      { message: '刪除文檔失敗' },
      { status: 500 }
    );
  }
}

