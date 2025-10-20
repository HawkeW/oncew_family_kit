import { Database } from 'better-sqlite3';
import { defineEventHandler, getQuery, createError } from 'h3';
import { getDatabase } from '../../utils/database';
import { useAuthSession } from '../../utils/session';

export default defineEventHandler(async (event) => {
  const method = event.method;
  const db = getDatabase();
  const session = await useAuthSession(event);
  const groupId = getRouterParam(event, 'id');

  // GET - 获取单个群组详情
  if (method === 'GET') {
    const userId = session.data.id;
    
    if (!userId) {
      throw createError({
        statusCode: 401,
        message: '请先登录'
      });
    }

    if (!groupId) {
      throw createError({
        statusCode: 400,
        message: '缺少群组ID'
      });
    }

    try {
      // 检查用户是否为群组成员
      const memberCheck = db.prepare(`
        SELECT id FROM group_members WHERE group_id = ? AND user_id = ?
      `).get(groupId, userId);

      if (!memberCheck) {
        throw createError({
          statusCode: 403,
          message: '您不是该群组成员'
        });
      }

      // 获取群组详情
      const group = db.prepare(`
        SELECT g.*, u.username as creator_name,
               (SELECT COUNT(*) FROM group_members WHERE group_id = g.id) as member_count
        FROM groups g
        LEFT JOIN users u ON g.created_by = u.id
        WHERE g.id = ?
      `).get(groupId);

      if (!group) {
        throw createError({
          statusCode: 404,
          message: '群组不存在'
        });
      }
      
      return group;
    } catch (error) {
      console.error('获取群组详情失败:', error);
      throw createError({
        statusCode: 500,
        message: '获取群组详情失败'
      });
    }
  }

  throw createError({
    statusCode: 405,
    message: '不支持的请求方法'
  });
});