import { getDatabase } from '../../../utils/database';
import { useAuthSession } from '../../../utils/session';

const db = getDatabase();

export default defineEventHandler(async (event) => {
  const session = await useAuthSession(event);
  if (!session?.data?.id) {
    throw createError({
      statusCode: 401,
      message: 'Unauthenticated'
    });
  }

  const tasks = db.prepare('SELECT * FROM wedding_tasks ORDER BY due_date ASC, created_at DESC').all();
  
  return {
    list: tasks
  };
});
