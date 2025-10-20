import { Database } from 'better-sqlite3';
import { defineEventHandler, getRouterParam, createError } from 'h3';
import { getDatabase } from '../../utils/database';
import { useAuthSession } from '../../utils/session';
import type { GroupInvitation } from '../../models/schema';

export default defineEventHandler(async (event) => {
  const method = event.method;
  const token = getRouterParam(event, 'token');
  const db = getDatabase();

  if (!token) {
    throw createError({
      statusCode: 400,
      message: '缺少邀请令牌'
    });
  }

  // GET - 获取邀请详情
  if (method === 'GET') {
    try {
      const invitation = db.prepare(`
        SELECT gi.*, g.name as group_name, g.description as group_description,
               u.username as invited_by_name,
               (SELECT COUNT(*) FROM group_members WHERE group_id = gi.group_id) as member_count
        FROM group_invitations gi
        LEFT JOIN groups g ON gi.group_id = g.id
        LEFT JOIN users u ON gi.invited_by = u.id
        WHERE gi.invite_token = ?
      `).get(token) as (GroupInvitation & {
        group_name: string;
        group_description: string;
        invited_by_name: string;
        member_count: number;
      }) | undefined;

      if (!invitation) {
        throw createError({
          statusCode: 404,
          message: '邀请不存在'
        });
      }

      // 检查邀请是否已过期
      if (new Date(invitation.expires_at) < new Date()) {
        return {
          ...invitation,
          expired: true
        };
      }

      // 获取当前用户的session信息
      let currentUserResponse = null;
      try {
        const session = await useAuthSession(event);
        if (session?.data?.id) {
          // 查询当前用户对此邀请的处理状态
          const userResponse = db.prepare(`
            SELECT action, responded_at 
            FROM invitation_responses 
            WHERE invite_token = ? AND user_id = ?
          `).get(token, session.data.id) as { action: string; responded_at: string } | undefined;

          if (userResponse) {
            currentUserResponse = userResponse;
          }
        }
      } catch (error) {
        // 如果获取session失败（用户未登录），继续返回邀请信息，但不包含用户状态
        console.log('用户未登录或session获取失败');
      }

      return {
        ...invitation,
        expired: false,
        current_user_response: currentUserResponse
      };
    } catch (error) {
      console.error('获取邀请详情失败:', error);
      throw createError({
        statusCode: 500,
        message: '获取邀请详情失败'
      });
    }
  }

  throw createError({
    statusCode: 405,
    message: '不支持的请求方法'
  });
});