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

  const finances = db.prepare('SELECT * FROM wedding_finances ORDER BY record_date DESC, created_at DESC').all();
  
  // Calculate summary
  const summary = db.prepare(`
    SELECT 
      SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as total_income,
      SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as total_expense
    FROM wedding_finances
  `).get() as { total_income: number, total_expense: number };

  return {
    list: finances,
    summary: {
        total_income: summary.total_income || 0,
        total_expense: summary.total_expense || 0,
        balance: (summary.total_income || 0) - (summary.total_expense || 0)
    }
  };
});
