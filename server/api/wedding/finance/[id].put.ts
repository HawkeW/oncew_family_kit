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

  const id = event.context.params?.id;
  const body = await readBody<Partial<WeddingFinance>>(event);
  
  const now = new Date().toISOString();

  db.prepare(`
    UPDATE wedding_finances 
    SET type = @type, category = @category, amount = @amount, description = @description, record_date = @record_date, updated_at = @updated_at
    WHERE id = @id
  `).run({
    id,
    type: body.type,
    category: body.category,
    amount: body.amount,
    description: body.description || null,
    record_date: body.record_date,
    updated_at: now
  });

  return { success: true };
});
