import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';

/**
 * 資料遷移：將簡體字分類名稱更新為繁體字
 * GET /api/announcements/migrate
 */
export async function GET() {
  try {
    const db = await getDatabase();
    const collection = db.collection('announcements');

    // 分類名稱映射：簡體 -> 繁體，以及舊名稱 -> 新名稱
    const categoryMapping: Record<string, string> = {
      '社团资讯': '社團資訊',
      '国际交流': '國際交流',
      '一般公告': '一般公告', // 這個不需要改
      '新生书院': '新生書院',
      '社会服务': '社會服務',
      '经费补助': '經費補助',
      '系友周': '小福/鹿鳴堂', // 更新系友周為小福/鹿鳴堂
    };

    // 統計更新數量
    const updateStats: Record<string, number> = {};

    // 更新每個分類
    for (const [oldCategory, newCategory] of Object.entries(categoryMapping)) {
      if (oldCategory !== newCategory) {
        const result = await collection.updateMany(
          { category: oldCategory },
          { $set: { category: newCategory } }
        );
        updateStats[oldCategory] = result.modifiedCount;
        console.log(`更新 ${oldCategory} -> ${newCategory}: ${result.modifiedCount} 條`);
      }
    }

    // 刪除不需要的分類（新生書院、經費補助）
    const deleteResult1 = await collection.deleteMany({ category: '新生書院' });
    const deleteResult2 = await collection.deleteMany({ category: '經費補助' });
    updateStats['刪除-新生書院'] = deleteResult1.deletedCount;
    updateStats['刪除-經費補助'] = deleteResult2.deletedCount;

    // 統計總數
    const total = await collection.countDocuments({});

    return NextResponse.json({
      success: true,
      message: '資料遷移完成',
      updates: updateStats,
      total,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('資料遷移失敗:', error);
    return NextResponse.json(
      {
        success: false,
        message: '資料遷移失敗',
        error: error.message,
      },
      { status: 500 }
    );
  }
}

