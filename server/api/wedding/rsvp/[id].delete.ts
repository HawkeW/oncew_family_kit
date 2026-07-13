import { getDatabase } from '../../../utils/database';
import { useAuthSession } from '../../../utils/session';

const db = getDatabase();

function checkGroupMembership(db: any, groupId: number, userId: number): boolean {
  const member = db.prepare(`
    SELECT id FROM group_members WHERE group_id = ? AND user_id = ?
  `).get(groupId, userId);
  return !!member;
}

export default defineEventHandler(async (event) => {
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

  // 检查记录是否存在
  const existing = db.prepare('SELECT group_id FROM wedding_rsvps WHERE id = ?').get(id) as { group_id: number } | undefined;
  if (!existing) {
    throw createError({
      statusCode: 404,
      message: '记录未找到'
    });
  }

  // 检查权限：群组成员可删除
  if (!checkGroupMembership(db, existing.group_id, session.data.id)) {
    throw createError({
      statusCode: 403,
      message: '无权删除此记录'
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