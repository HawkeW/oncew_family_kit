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

  const id = event.context.params?.id;
  const body = await readBody<Partial<WeddingTimeline>>(event);
  
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
