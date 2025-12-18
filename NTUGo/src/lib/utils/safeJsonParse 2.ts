/**
 * 安全地解析 JSON 响应
 * 提供更详细的错误信息以便调试
 */
export async function safeJsonParse<T = any>(
  response: Response,
  endpoint?: string
): Promise<T> {
  try {
    // 检查响应内容类型
    const contentType = response.headers.get('content-type');
    if (contentType && !contentType.includes('application/json')) {
      const text = await response.text();
      throw new Error(
        `响应不是 JSON 格式。Content-Type: ${contentType}, 响应长度: ${text.length} 字符`
      );
    }

    // 获取响应文本（用于调试）
    const text = await response.text();
    
    // 检查响应是否为空
    if (!text || text.trim().length === 0) {
      throw new Error('响应为空');
    }

    // 检查响应长度（如果太大可能有问题）
    if (text.length > 10 * 1024 * 1024) { // 10MB
      console.warn(`响应很大: ${text.length} 字符 (${(text.length / 1024 / 1024).toFixed(2)} MB)`);
    }

    // 尝试解析 JSON
    try {
      const data = JSON.parse(text) as T;
      return data;
    } catch (parseError: any) {
      // 提供更详细的错误信息
      const errorPosition = parseError.message.match(/position (\d+)/)?.[1];
      const startPos = errorPosition ? Math.max(0, parseInt(errorPosition) - 100) : 0;
      const endPos = errorPosition ? Math.min(text.length, parseInt(errorPosition) + 100) : 200;
      const context = text.substring(startPos, endPos);
      
      console.error(`JSON 解析失败${endpoint ? ` (${endpoint})` : ''}:`, {
        message: parseError.message,
        position: errorPosition,
        context: context,
        responseLength: text.length,
        preview: text.substring(0, 200),
      });

      throw new Error(
        `JSON 解析失败: ${parseError.message}${errorPosition ? ` (位置: ${errorPosition})` : ''}${endpoint ? ` - 端点: ${endpoint}` : ''}`
      );
    }
  } catch (error: any) {
    // 如果错误已经是我们包装的，直接抛出
    if (error.message.includes('JSON 解析失败') || error.message.includes('响应不是 JSON')) {
      throw error;
    }
    // 否则包装错误
    throw new Error(`解析响应失败: ${error.message}`);
  }
}

