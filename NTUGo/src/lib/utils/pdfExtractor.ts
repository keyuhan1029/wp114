/**
 * 从 PDF Buffer 中提取文本
 */
export async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  try {
    console.log('[PDF Extractor] 开始提取PDF文本，Buffer大小:', buffer.length, 'bytes');
    
    // 使用 require 方式导入 pdf-parse（CommonJS 模块）
    // 在 Next.js API routes 中，require 应该可以正常工作
    const pdfParse = require('pdf-parse');
    
    console.log('[PDF Extractor] pdf-parse 模块加载成功');
    
    // 确保 pdfParse 是一个函数
    const parseFunction = typeof pdfParse === 'function' ? pdfParse : (pdfParse.default || pdfParse);
    
    if (typeof parseFunction !== 'function') {
      throw new Error('pdf-parse 不是一个函数，类型: ' + typeof parseFunction);
    }
    
    const data = await parseFunction(buffer, {
      // 添加选项以提高提取质量
      max: 0, // 处理所有页面
    });
    
    console.log('[PDF Extractor] PDF解析完成:');
    console.log('  - 页数:', data.numpages);
    console.log('  - 文本长度:', data.text?.length || 0);
    console.log('  - 信息:', data.info);
    
    const extractedText = data.text || '';
    
    if (extractedText.trim().length === 0) {
      console.warn('[PDF Extractor] 警告：提取的文本为空，可能是扫描版PDF（图片）');
      console.warn('[PDF Extractor] PDF信息:', JSON.stringify(data.info, null, 2));
    } else {
      console.log('[PDF Extractor] 成功提取文本，前100字符:', extractedText.substring(0, 100));
    }
    
    return extractedText;
  } catch (error: any) {
    console.error('[PDF Extractor] PDF 文本提取失败:');
    console.error('  错误类型:', error.name);
    console.error('  错误消息:', error.message);
    console.error('  错误堆栈:', error.stack);
    throw new Error('无法提取 PDF 文本内容: ' + (error.message || '未知错误'));
  }
}

/**
 * 将文本分块（用于检索）
 * 每个块大约 500 字符，重叠 100 字符
 */
export function chunkText(text: string, chunkSize: number = 500, overlap: number = 100): string[] {
  const chunks: string[] = [];
  let start = 0;

  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length);
    let chunk = text.slice(start, end);

    // 尝试在句子边界处分割
    if (end < text.length) {
      const lastPeriod = chunk.lastIndexOf('.');
      const lastNewline = chunk.lastIndexOf('\n');
      const splitPoint = Math.max(lastPeriod, lastNewline);
      
      if (splitPoint > chunkSize * 0.5) {
        chunk = chunk.slice(0, splitPoint + 1);
        start = start + splitPoint + 1 - overlap;
      } else {
        start = end - overlap;
      }
    } else {
      start = end;
    }

    chunks.push(chunk.trim());
  }

  return chunks.filter(chunk => chunk.length > 0);
}

