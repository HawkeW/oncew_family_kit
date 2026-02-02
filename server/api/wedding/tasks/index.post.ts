import { getDatabase } from '../../../utils/database';
import { useAuthSession } from '../../../utils/session';
import { WeddingTask } from '../../../models/schema';

const db = getDatabase();

export default defineEventHandler(async (event) => {
  const session = await useAuthSession(event);
  if (!session?.data?.id) {
    throw createError({
      statusCode: 401,
      message: 'Unauthenticated'
    });
  }

  const body = await readBody<Partial<WeddingTask>>(event);
  
  if (!body.title || !body.category) {
    throw createError({
      statusCode: 400,
      message: 'Missing required fields'
    });
  }

  const now = new Date().toISOString();
  
  const result = db.prepare(`
    INSERT INTO wedding_tasks (title, description, due_date, status, category, created_at, updated_at)
    VALUES (@title, @description, @due_date, @status, @category, @created_at, @updated_at)
  `).run({
    title: body.title,
    description: body.description || null,
    due_date: body.due_date || null,
    status: body.status || 'pending',
    category: body.category,
    created_at: now,
    updated_at: now
  });

  return { id: result.lastInsertRowid };
});
