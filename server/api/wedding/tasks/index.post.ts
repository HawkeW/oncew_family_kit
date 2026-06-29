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

  const body = await readBody<Partial<WeddingTask> & { group_id?: number }>(event);
  
  if (!body.title || !body.category) {
    throw createError({
      statusCode: 400,
      message: 'Missing required fields'
    });
  }

  if (!body.group_id) {
    throw createError({
      statusCode: 400,
      message: '必须指定群组 ID'
    });
  }

  // 校验群组成员身份
  if (!checkGroupMembership(db, body.group_id, session.data.id)) {
    throw createError({
      statusCode: 403,
      message: '您不是该群组成员，无法添加记录'
    });
  }

  const now = new Date().toISOString();
  
  const result = db.prepare(`
    INSERT INTO wedding_tasks (title, description, due_date, status, category, created_at, updated_at, group_id)
    VALUES (@title, @description, @due_date, @status, @category, @created_at, @updated_at, @group_id)
  `).run({
    title: body.title,
    description: body.description || null,
    due_date: body.due_date || null,
    status: body.status || 'pending',
    category: body.category,
    created_at: now,
    updated_at: now,
    group_id: body.group_id
  });

  return { id: result.lastInsertRowid };
});