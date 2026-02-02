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

  const id = event.context.params?.id;
  const body = await readBody<Partial<WeddingTask>>(event);
  
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
