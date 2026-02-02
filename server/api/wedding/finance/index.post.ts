import { getDatabase } from '../../../utils/database';
import { useAuthSession } from '../../../utils/session';
import { WeddingFinance } from '../../../models/schema';

const db = getDatabase();

export default defineEventHandler(async (event) => {
  const session = await useAuthSession(event);
  if (!session?.data?.id) {
    throw createError({
      statusCode: 401,
      message: 'Unauthenticated'
    });
  }

  const body = await readBody<Partial<WeddingFinance>>(event);
  
  if (!body.type || !body.category || body.amount === undefined || !body.record_date) {
    throw createError({
      statusCode: 400,
      message: 'Missing required fields'
    });
  }

  const now = new Date().toISOString();
  
  const result = db.prepare(`
    INSERT INTO wedding_finances (type, category, amount, description, record_date, created_at, updated_at)
    VALUES (@type, @category, @amount, @description, @record_date, @created_at, @updated_at)
  `).run({
    type: body.type,
    category: body.category,
    amount: body.amount,
    description: body.description || null,
    record_date: body.record_date,
    created_at: now,
    updated_at: now
  });

  return { id: result.lastInsertRowid };
});
