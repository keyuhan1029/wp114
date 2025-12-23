import { getDatabase } from '../mongodb';
import { ObjectId } from 'mongodb';

export interface Document {
  _id?: string | ObjectId;
  title: string;
  description?: string;
  fileUrl: string; // Cloudinary URL
  fileType: 'pdf' | 'doc' | 'docx' | 'txt';
  extractedText?: string; // 提取的文本内容（可选，用于简单检索）
  textChunks?: string[]; // 分块的文本（可选，用于简单检索）
  openaiFileId?: string; // OpenAI Files API 文件ID（用于直接让GPT读取）
  uploadedBy: string | ObjectId; // 上传者 ID
  isActive: boolean; // 是否启用
  createdAt: Date;
  updatedAt: Date;
}

export class DocumentModel {
  static async create(documentData: {
    title: string;
    description?: string;
    fileUrl: string;
    fileType: 'pdf' | 'doc' | 'docx' | 'txt';
    extractedText?: string;
    textChunks?: string[];
    openaiFileId?: string;
    uploadedBy: string | ObjectId;
  }): Promise<Document> {
    const db = await getDatabase();
    const now = new Date();
    
    const document: Omit<Document, '_id'> = {
      title: documentData.title,
      description: documentData.description,
      fileUrl: documentData.fileUrl,
      fileType: documentData.fileType,
      extractedText: documentData.extractedText || '',
      textChunks: documentData.textChunks || [],
      openaiFileId: documentData.openaiFileId,
      uploadedBy: typeof documentData.uploadedBy === 'string' 
        ? new ObjectId(documentData.uploadedBy) 
        : documentData.uploadedBy,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    };

    const result = await db.collection<Document>('documents').insertOne(document);
    return { ...document, _id: result.insertedId };
  }

  static async findById(id: string | ObjectId): Promise<Document | null> {
    const db = await getDatabase();
    const docId = typeof id === 'string' ? new ObjectId(id) : id;
    return await db.collection<Document>('documents').findOne({ _id: docId });
  }

  static async findAll(activeOnly: boolean = true): Promise<Document[]> {
    const db = await getDatabase();
    const query = activeOnly ? { isActive: true } : {};
    return await db.collection<Document>('documents').find(query).toArray();
  }

  // 获取所有活跃文档的 OpenAI 文件ID
  static async getOpenAIFileIds(): Promise<string[]> {
    const activeDocs = await this.findAll(true);
    return activeDocs
      .filter(doc => doc.openaiFileId)
      .map(doc => doc.openaiFileId!);
  }

  static async updateText(
    id: string | ObjectId,
    extractedText: string,
    textChunks: string[]
  ): Promise<Document | null> {
    const db = await getDatabase();
    const docId = typeof id === 'string' ? new ObjectId(id) : id;
    
    const result = await db.collection<Document>('documents').findOneAndUpdate(
      { _id: docId },
      {
        $set: {
          extractedText,
          textChunks,
          updatedAt: new Date(),
        },
      },
      { returnDocument: 'after' }
    );

    return result || null;
  }

  static async searchRelevantChunks(query: string, limit: number = 5): Promise<string[]> {
    const db = await getDatabase();
    const activeDocs = await this.findAll(true);
    
    console.log('[DocumentModel] 搜索查询:', query);
    console.log('[DocumentModel] 找到活跃文档数量:', activeDocs.length);
    
    // 改进的文本匹配搜索
    const queryLower = query.toLowerCase().trim();
    // 提取关键词（过滤掉常见停用词和单字符）
    const stopWords = new Set(['的', '是', '在', '有', '和', '与', '或', '但', '而', '了', '吗', '呢', '啊', '吧', '这', '那', '什么', '怎么', '如何', '为什么']);
    const queryWords = queryLower
      .split(/[\s\u3000]+/) // 支持中英文空格
      .filter(w => w.length > 1 && !stopWords.has(w))
      .filter((w, i, arr) => arr.indexOf(w) === i); // 去重
    
    console.log('[DocumentModel] 提取的关键词:', queryWords);
    
    const relevantChunks: Array<{ chunk: string; score: number; docTitle: string }> = [];

    for (const doc of activeDocs) {
      if (!doc.textChunks || doc.textChunks.length === 0) {
        console.log(`[DocumentModel] 文档 "${doc.title}" 没有文本块`);
        continue;
      }
      
      console.log(`[DocumentModel] 检查文档 "${doc.title}"，文本块数量: ${doc.textChunks.length}`);

      for (const chunk of doc.textChunks) {
        if (!chunk || chunk.trim().length === 0) continue;
        
        const chunkLower = chunk.toLowerCase();
        let score = 0;
        
        // 计算匹配分数
        for (const word of queryWords) {
          // 完全匹配加分更多
          if (chunkLower.includes(word)) {
            // 检查是否是完整词匹配（前后不是字母或数字）
            const regex = new RegExp(`\\b${word}\\b|${word}`, 'gi');
            const matches = chunkLower.match(regex);
            if (matches) {
              score += matches.length * 2; // 完整词匹配权重更高
            } else {
              score += 1; // 部分匹配
            }
          }
        }
        
        // 如果查询词在文档标题中，额外加分
        if (doc.title && doc.title.toLowerCase().includes(queryLower)) {
          score += 5;
        }
        
        if (score > 0) {
          relevantChunks.push({ chunk, score, docTitle: doc.title });
        }
      }
    }

    console.log('[DocumentModel] 找到相关块数量:', relevantChunks.length);
    
    // 按分数排序并返回前 limit 个
    relevantChunks.sort((a, b) => b.score - a.score);
    const topChunks = relevantChunks.slice(0, limit);
    
    if (topChunks.length > 0) {
      console.log('[DocumentModel] 返回前', limit, '个块:');
      topChunks.forEach((item, idx) => {
        console.log(`  [${idx + 1}] 文档: "${item.docTitle}", 分数: ${item.score}, 块长度: ${item.chunk.length}`);
      });
    } else {
      console.log('[DocumentModel] 警告：没有找到任何相关文档块');
    }
    
    return topChunks.map(item => item.chunk);
  }

  static async delete(id: string | ObjectId): Promise<boolean> {
    const db = await getDatabase();
    const docId = typeof id === 'string' ? new ObjectId(id) : id;
    const result = await db.collection<Document>('documents').deleteOne({ _id: docId });
    return result.deletedCount > 0;
  }
}

