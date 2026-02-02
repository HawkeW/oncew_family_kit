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

  const timelines = db.prepare('SELECT * FROM wedding_timelines ORDER BY start_time ASC').all();
  
  return {
    list: timelines
  };
});
