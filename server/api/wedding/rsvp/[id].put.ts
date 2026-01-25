import { z } from 'zod';
import { getDatabase } from '../../../utils/database';
import { useAuthSession } from '../../../utils/session';

const db = getDatabase();

const rsvpUpdateSchema = z.object({
  name: z.string().min(1, '姓名不能为空'),
  phone: z.string().optional().nullable(),
  count: z.number().int().min(1, '人数至少为1'),
  remark: z.string().optional().nullable()
});

export default defineEventHandler(async (event) => {
  // 鉴权
  const session = await useAuthSession(event);
  if (!session?.data?.id) {
    throw createError({
      statusCode: 401,
      message: '未登录'
    });
  }

  const id = getRouterParam(event, 'id');
  if (!id) {
    throw createError({
      statusCode: 400,
      message: '缺少 ID'
    });
  }

  try {
    const body = await readBody(event);
    const { name, phone, count, remark } = rsvpUpdateSchema.parse(body);

    const now = new Date().toISOString();

    const result = db.prepare(
      'UPDATE wedding_rsvps SET name = ?, phone = ?, count = ?, remark = ?, updated_at = ? WHERE id = ?'
    ).run(name, phone || null, count, remark || null, now, id);

    if (result.changes === 0) {
      throw createError({
        statusCode: 404,
        message: '记录未找到'
      });
    }

    return {
      success: true,
      message: '更新成功'
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
