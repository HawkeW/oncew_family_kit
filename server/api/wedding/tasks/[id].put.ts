import { getDatabase } from '../../../utils/database';
import { useAuthSession } from '../../../utils/session';
import { WeddingTask } from '../../../models/schema';

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
      message: 'Unauthenticated'
    });
  }

  const id = event.context.params?.id;
  const body = await readBody<Partial<WeddingTask>>(event);

  // 检查记录是否存在
  const existing = db.prepare('SELECT group_id FROM wedding_tasks WHERE id = ?').get(id) as { group_id: number } | undefined;
  if (!existing) {
    throw createError({
      statusCode: 404,
      message: '记录未找到'
    });
  }

  // 检查权限：群组成员可修改
  if (!checkGroupMembership(db, existing.group_id, session.data.id)) {
    throw createError({
      statusCode: 403,
      message: '无权修改此记录'
    });
  }

  const now = new Date().toISOString();

  db.prepare(`
    UPDATE wedding_tasks 
    SET title = @title, description = @description, due_date = @due_date, status = @status, category = @category, updated_at = @updated_at
    WHERE id = @id
  `).run({
    id,
    title: body.title,
    description: body.description || null,
    due_date: body.due_date || null,
    status: body.status,
    category: body.category,
    updated_at: now
  });

  return { success: true };
});