import { z } from 'zod';
import { getDatabase } from '../../utils/database';

const db = getDatabase();
const rsvpSchema = z.object({
  name: z.string().min(1, '姓名不能为空'),
  phone: z.string().optional(),
  count: z.number().int().min(1, '人数至少为1').default(1),
  remark: z.string().optional()
});

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);
    const { name, phone, count, remark } = rsvpSchema.parse(body);

    const now = new Date().toISOString();

    const result = db.prepare(
      'INSERT INTO wedding_rsvps (name, phone, count, remark, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(name, phone || null, count, remark || null, now, now);

    return {
      success: true,
      id: result.lastInsertRowid,
      message: '提交成功'
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw createError({
        statusCode: 400,
        message: '输入验证失败',
        data: error.errors
      });
    }
    throw error;
  }
});
