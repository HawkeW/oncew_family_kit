import { z } from 'zod';
import { getDatabase } from '../../utils/database';
import { useAuthSession } from '../../utils/session';

const db = getDatabase();

function checkGroupMembership(db: any, groupId: number, userId: number): boolean {
  const member = db.prepare(`
    SELECT id FROM group_members WHERE group_id = ? AND user_id = ?
  `).get(groupId, userId);
  return !!member;
}

const rsvpSchema = z.object({
  name: z.string().min(1, '姓名不能为空'),
  phone: z.string().optional(),
  count: z.number().int().min(1, '人数至少为1').default(1),
  remark: z.string().optional(),
  group_id: z.number().int().positive('必须指定群组 ID')
});

export default defineEventHandler(async (event) => {
  try {
    const session = await useAuthSession(event);
    if (!session?.data?.id) {
      throw createError({
        statusCode: 401,
        message: '未登录'
      });
    }

    const body = await readBody(event);
    const { name, phone, count, remark, group_id } = rsvpSchema.parse(body);

    // 校验群组成员身份
    if (!checkGroupMembership(db, group_id, session.data.id)) {
      throw createError({
        statusCode: 403,
        message: '您不是该群组成员，无法添加记录'
      });
    }

    const now = new Date().toISOString();

    const result = db.prepare(
      'INSERT INTO wedding_rsvps (name, phone, count, remark, created_at, updated_at, group_id) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).run(name, phone || null, count, remark || null, now, now, group_id);

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