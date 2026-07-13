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
  const query = getQuery(event);
  const groupId = query.group_id ? Number(query.group_id) : null;

  const session = await useAuthSession(event);
  if (!session?.data?.id) {
    throw createError({
      statusCode: 401,
      message: 'Unauthenticated'
    });
  }

  const userId = session.data.id;

  // 如果指定了 group_id，校验权限
  if (groupId) {
    if (!checkGroupMembership(db, groupId, userId)) {
      throw createError({
        statusCode: 403,
        message: '您不是该群组成员'
      });
    }
    const finances = db.prepare('SELECT * FROM wedding_finances WHERE group_id = ? ORDER BY record_date DESC, created_at DESC').all(groupId);
    
    const summary = db.prepare(`
      SELECT 
        SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as total_income,
        SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as total_expense
      FROM wedding_finances
      WHERE group_id = ?
    `).get(groupId) as { total_income: number, total_expense: number };

    return {
      list: finances,
      summary: {
        total_income: summary.total_income || 0,
        total_expense: summary.total_expense || 0,
        balance: (summary.total_income || 0) - (summary.total_expense || 0)
      }
    };
  }

  // 没指定 group_id：返回用户所有群组的财务
  const finances = db.prepare(`
    SELECT * FROM wedding_finances 
    WHERE group_id IN (SELECT group_id FROM group_members WHERE user_id = ?)
    ORDER BY record_date DESC, created_at DESC
  `).all(userId);

  const summary = db.prepare(`
    SELECT 
      SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as total_income,
      SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as total_expense
    FROM wedding_finances
    WHERE group_id IN (SELECT group_id FROM group_members WHERE user_id = ?)
  `).get(userId) as { total_income: number, total_expense: number };

  return {
    list: finances,
    summary: {
      total_income: summary.total_income || 0,
      total_expense: summary.total_expense || 0,
      balance: (summary.total_income || 0) - (summary.total_expense || 0)
    }
  };
});