import { getDatabase } from '../../../utils/database';
import { useAuthSession } from '../../../utils/session';

const db = getDatabase();

export default defineEventHandler(async (event) => {
  // 鉴权
  const session = await useAuthSession(event);
  if (!session?.data?.id) {
    throw createError({
      statusCode: 401,
      message: '未登录'
    });
  }

  const id = getRouterParam(event, 'id');
  if (!id) {
    throw createError({
      statusCode: 400,
      message: '缺少 ID'
    });
  }

  const result = db.prepare('DELETE FROM wedding_rsvps WHERE id = ?').run(id);

  if (result.changes === 0) {
    throw createError({
      statusCode: 404,
      message: '记录未找到'
    });
  }

  return {
    success: true,
    message: '删除成功'
  };
});
