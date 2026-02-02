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

  const id = event.context.params?.id;
  
  db.prepare('DELETE FROM wedding_timelines WHERE id = ?').run(id);

  return { success: true };
});
