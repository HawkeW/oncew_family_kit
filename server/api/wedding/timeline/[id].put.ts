import { getDatabase } from '../../../utils/database';
import { useAuthSession } from '../../../utils/session';
import { WeddingTimeline } from '../../../models/schema';

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
  const body = await readBody<Partial<WeddingTimeline>>(event);

  // 检查记录是否存在
  const existing = db.prepare('SELECT group_id FROM wedding_timelines WHERE id = ?').get(id) as { group_id: number } | undefined;
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
    UPDATE wedding_timelines 
    SET start_time = @start_time, end_time = @end_time, title = @title, description = @description, location = @location, owner = @owner, updated_at = @updated_at
    WHERE id = @id
  `).run({
    id,
    start_time: body.start_time,
    end_time: body.end_time || null,
    title: body.title,
    description: body.description || null,
    location: body.location || null,
    owner: body.owner || null,
    updated_at: now
  });

  return { success: true };
});