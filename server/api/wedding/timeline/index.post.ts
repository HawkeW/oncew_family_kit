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

  const body = await readBody<Partial<WeddingTimeline> & { group_id?: number }>(event);
  
  if (!body.start_time || !body.title) {
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
    INSERT INTO wedding_timelines (start_time, end_time, title, description, location, owner, created_at, updated_at, group_id)
    VALUES (@start_time, @end_time, @title, @description, @location, @owner, @created_at, @updated_at, @group_id)
  `).run({
    start_time: body.start_time,
    end_time: body.end_time || null,
    title: body.title,
    description: body.description || null,
    location: body.location || null,
    owner: body.owner || null,
    created_at: now,
    updated_at: now,
    group_id: body.group_id
  });

  return { id: result.lastInsertRowid };
});