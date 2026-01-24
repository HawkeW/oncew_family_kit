import { getDatabase } from '../../utils/database';
import { useAuthSession } from '../../utils/session';

const db = getDatabase();

export default defineEventHandler(async (event) => {
  const session = await useAuthSession(event);
  if (!session?.data?.id) {
    throw createError({
      statusCode: 401,
      message: '未登录'
    });
  }

  const rsvps = db.prepare('SELECT * FROM wedding_rsvps ORDER BY created_at DESC').all();

  // 统计总人数
  const totalCount = db.prepare('SELECT SUM(count) as total FROM wedding_rsvps').get() as { total: number };

  return {
    list: rsvps,
    total: totalCount.total || 0
  };
});
