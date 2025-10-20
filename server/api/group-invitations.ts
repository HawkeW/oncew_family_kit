import { Database } from 'better-sqlite3';
import { defineEventHandler, readBody, getQuery, createError, getHeader } from 'h3';
import { getDatabase } from '../utils/database';
import type { GroupInvitation, InvitationResponse } from '../models/schema';
import { useAuthSession } from '../utils/session';
import { randomBytes } from 'crypto';

export default defineEventHandler(async (event) => {
  const method = event.method;
  const db = getDatabase();
  const session = await useAuthSession(event);

  // GET - 获取群组的邀请列表
  if (method === 'GET') {
    const query = getQuery(event);
    const groupId = query.group_id;
    const userId = session.data.id;

    if (!groupId) {
      throw createError({
        statusCode: 400,
        message: '缺少群组ID'
      });
    }

    if (!userId) {
      throw createError({
        statusCode: 401,
        message: '请先登录'
      });
    }

    try {
      // 检查用户是否为群组管理员
      const memberInfo = db.prepare(`
        SELECT role FROM group_members 
        WHERE group_id = ? AND user_id = ?
      `).get(groupId, userId) as { role: string } | undefined;

      if (!memberInfo || memberInfo.role !== 'admin') {
        throw createError({
          statusCode: 403,
          message: '只有管理员可以查看邀请列表'
        });
      }

      const invitations = db.prepare(`
        SELECT gi.*, u.username as invited_by_name, g.name as group_name
        FROM group_invitations gi
        LEFT JOIN users u ON gi.invited_by = u.id
        LEFT JOIN groups g ON gi.group_id = g.id
        WHERE gi.group_id = ?
        ORDER BY gi.created_at DESC
      `).all(groupId);

      // 为每个邀请获取响应记录
      const invitationsWithResponses = invitations.map((invitation: any) => {
        const responses = db.prepare(`
          SELECT ir.*, u.username as user_name
          FROM invitation_responses ir
          LEFT JOIN users u ON ir.user_id = u.id
          WHERE ir.invite_token = ?
          ORDER BY ir.responded_at DESC
        `).all(invitation.invite_token);

        return {
          ...invitation,
          responses
        };
      });
      
      return invitationsWithResponses;
    } catch (error) {
      console.error('获取邀请列表失败:', error);
      throw createError({
        statusCode: 500,
        message: '获取邀请列表失败'
      });
    }
  }

  // POST - 创建群组邀请
  if (method === 'POST') {
    const body = await readBody<{ group_id: number; expires_hours?: number }>(event);
    const userId = session.data.id;
    
    if (!userId) {
      throw createError({
        statusCode: 401,
        message: '请先登录'
      });
    }

    // 验证必填字段
    if (!body.group_id) {
      throw createError({
        statusCode: 400,
        message: '缺少群组ID'
      });
    }

    try {
      // 检查用户是否为群组管理员
      const memberInfo = db.prepare(`
        SELECT role FROM group_members 
        WHERE group_id = ? AND user_id = ?
      `).get(body.group_id, userId) as { role: string } | undefined;

      if (!memberInfo || memberInfo.role !== 'admin') {
        throw createError({
          statusCode: 403,
          message: '只有管理员可以创建邀请'
        });
      }

      const now = new Date();
      const expiresHours = body.expires_hours || 24; // 默认24小时过期
      const expiresAt = new Date(now.getTime() + expiresHours * 60 * 60 * 1000);
      const inviteToken = randomBytes(4).toString('hex'); // 修改为4字节，生成8位16进制字符串

      const result = db.prepare(`
        INSERT INTO group_invitations (
          group_id, invited_by, invite_token, status, expires_at, created_at, updated_at
        ) VALUES (?, ?, ?, 'pending', ?, ?, ?)
      `).run(
        body.group_id,
        userId,
        inviteToken,
        expiresAt.toISOString(),
        now.toISOString(),
        now.toISOString()
      );

      return {
        id: result.lastInsertRowid,
        group_id: body.group_id,
        invited_by: userId,
        invite_token: inviteToken,
        status: 'pending',
        expires_at: expiresAt.toISOString(),
        created_at: now.toISOString(),
        updated_at: now.toISOString(),
        invite_url: `${getHeader(event, 'origin') || 'http://localhost:3001'}/invite/${inviteToken}`
      };
    } catch (error) {
      console.error('创建邀请失败:', error);
      throw createError({
        statusCode: 500,
        message: '创建邀请失败'
      });
    }
  }

  // PUT - 处理邀请响应（接受或拒绝）
  if (method === 'PUT') {
    const query = getQuery(event);
    const token = query.token as string;
    const userId = session.data.id;

    if (!token) {
      throw createError({
        statusCode: 400,
        message: '缺少邀请令牌'
      });
    }

    if (!userId) {
      throw createError({
        statusCode: 401,
        message: '请先登录'
      });
    }

    const body = await readBody<{ action: 'accept' | 'reject' }>(event);

    if (!body.action || !['accept', 'reject'].includes(body.action)) {
      throw createError({
        statusCode: 400,
        message: '无效的操作'
      });
    }

    try {
      // 获取邀请信息
      const invitation = db.prepare(`
        SELECT * FROM group_invitations WHERE invite_token = ?
      `).get(token) as GroupInvitation | undefined;

      if (!invitation) {
        throw createError({
          statusCode: 404,
          message: '邀请不存在'
        });
      }

      // 检查邀请是否已过期
      if (new Date(invitation.expires_at) < new Date()) {
        throw createError({
          statusCode: 400,
          message: '邀请已过期'
        });
      }

      // 移除邀请状态检查，允许多个用户使用同一个邀请链接
      // if (invitation.status !== 'pending') {
      //   throw createError({
      //     statusCode: 400,
      //     message: '邀请已被处理'
      //   });
      // }

      const now = new Date().toISOString();

      // 记录用户的响应到invitation_responses表
      try {
        db.prepare(`
          INSERT INTO invitation_responses (invite_token, user_id, action, responded_at)
          VALUES (?, ?, ?, ?)
        `).run(token, userId, body.action, now);
      } catch (error) {
        // 如果用户已经响应过这个邀请，检查是否是重复的接受操作
        const existingResponse = db.prepare(`
          SELECT action FROM invitation_responses 
          WHERE invite_token = ? AND user_id = ?
        `).get(token, userId) as { action: string } | undefined;

        if (existingResponse) {
          if (existingResponse.action === body.action) {
            throw createError({
              statusCode: 400,
              message: body.action === 'accept' ? '您已经接受过此邀请' : '您已经拒绝过此邀请'
            });
          } else {
            throw createError({
              statusCode: 400,
              message: '您已经对此邀请进行过操作'
            });
          }
        }
        throw error;
      }

      // 如果接受邀请，添加用户到群组
      if (body.action === 'accept') {
        // 检查用户是否已经是群组成员
        const existingMember = db.prepare(`
          SELECT id FROM group_members WHERE group_id = ? AND user_id = ?
        `).get(invitation.group_id, userId);

        if (!existingMember) {
          db.prepare(`
            INSERT INTO group_members (group_id, user_id, role, joined_at)
            VALUES (?, ?, 'member', ?)
          `).run(invitation.group_id, userId, now);
        } else {
          throw createError({
            statusCode: 400,
            message: '您已经是该群组成员'
          });
        }
      }

      return { 
        message: body.action === 'accept' ? '成功加入群组' : '已拒绝邀请'
      };
    } catch (error) {
      console.error('处理邀请失败:', error);
      throw createError({
        statusCode: 500,
        message: '处理邀请失败'
      });
    }
  }

  // DELETE - 删除/撤销邀请
  if (method === 'DELETE') {
    const query = getQuery(event);
    const invitationId = query.id;
    const userId = session.data.id;

    if (!invitationId) {
      throw createError({
        statusCode: 400,
        message: '缺少邀请ID'
      });
    }

    if (!userId) {
      throw createError({
        statusCode: 401,
        message: '请先登录'
      });
    }

    try {
      // 获取邀请信息
      const invitation = db.prepare(`
        SELECT group_id, invited_by FROM group_invitations WHERE id = ?
      `).get(invitationId) as { group_id: number; invited_by: number } | undefined;

      if (!invitation) {
        throw createError({
          statusCode: 404,
          message: '邀请不存在'
        });
      }

      // 检查权限：只有邀请创建者或群组管理员可以删除邀请
      const memberInfo = db.prepare(`
        SELECT role FROM group_members 
        WHERE group_id = ? AND user_id = ?
      `).get(invitation.group_id, userId) as { role: string } | undefined;

      if (invitation.invited_by !== userId && (!memberInfo || memberInfo.role !== 'admin')) {
        throw createError({
          statusCode: 403,
          message: '没有权限删除此邀请'
        });
      }

      const result = db.prepare('DELETE FROM group_invitations WHERE id = ?').run(invitationId);

      if (result.changes === 0) {
        throw createError({
          statusCode: 404,
          message: '邀请不存在'
        });
      }

      return { message: '邀请已删除' };
    } catch (error) {
      console.error('删除邀请失败:', error);
      throw createError({
        statusCode: 500,
        message: '删除邀请失败'
      });
    }
  }

  throw createError({
    statusCode: 405,
    message: '不支持的请求方法'
  });
});