import { getDatabase } from '../../../utils/database';
import { useAuthSession } from '../../../utils/session';
import { WeddingTimeline } from '../../../models/schema';

const db = getDatabase();

export default defineEventHandler(async (event) => {
  const session = await useAuthSession(event);
  if (!session?.data?.id) {
    throw createError({
      statusCode: 401,
      message: 'Unauthenticated'
    });
  }

  const body = await readBody<Partial<WeddingTimeline>>(event);
  
  if (!body.start_time || !body.title) {
    throw createError({
      statusCode: 400,
      message: 'Missing required fields'
    });
  }

  const now = new Date().toISOString();
  
  const result = db.prepare(`
    INSERT INTO wedding_timelines (start_time, end_time, title, description, location, owner, created_at, updated_at)
    VALUES (@start_time, @end_time, @title, @description, @location, @owner, @created_at, @updated_at)
  `).run({
    start_time: body.start_time,
    end_time: body.end_time || null,
    title: body.title,
    description: body.description || null,
    location: body.location || null,
    owner: body.owner || null,
    created_at: now,
    updated_at: now
  });

  return { id: result.lastInsertRowid };
});
