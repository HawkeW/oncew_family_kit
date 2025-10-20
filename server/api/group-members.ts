import { Database } from 'better-sqlite3';
import { defineEventHandler, readBody, getQuery, createError } from 'h3';
import { getDatabase } from '../utils/database';
import type { GroupMember } from '../models/schema';
import { useAuthSession } from '../utils/session';

export default defineEventHandler(async (event) => {
  const method = event.method;
  const db = getDatabase();
  const session = await useAuthSession(event);

  // GET - 获取群组成员列表
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

      const members = db.prepare(`
        SELECT gm.*, u.username, u.email
        FROM group_members gm
        LEFT JOIN users u ON gm.user_id = u.id
        WHERE gm.group_id = ?
        ORDER BY gm.role DESC, gm.joined_at ASC
      `).all(groupId);
      
      return members;
    } catch (error) {
      console.error('获取群组成员失败:', error);
      throw createError({
        statusCode: 500,
        message: '获取群组成员失败'
      });
    }
  }

  // POST - 添加群组成员
  if (method === 'POST') {
    const body = await readBody<{ group_id: number; user_email: string; role?: string }>(event);
    const userId = session.data.id;
    
    if (!userId) {
      throw createError({
        statusCode: 401,
        message: '请先登录'
      });
    }

    // 验证必填字段
    if (!body.group_id || !body.user_email) {
      throw createError({
        statusCode: 400,
        message: '缺少必要字段'
      });
    }

    try {
      // 检查当前用户是否为群组管理员
      const adminCheck = db.prepare(`
        SELECT role FROM group_members 
        WHERE group_id = ? AND user_id = ? AND role = 'admin'
      `).get(body.group_id, userId);

      if (!adminCheck) {
        throw createError({
          statusCode: 403,
          message: '只有管理员可以添加成员'
        });
      }

      // 根据邮箱查找用户
      const targetUser = db.prepare(`
        SELECT id FROM users WHERE email = ?
      `).get(body.user_email) as { id: number } | undefined;

      if (!targetUser) {
        throw createError({
          statusCode: 404,
          message: '用户不存在'
        });
      }

      // 检查用户是否已经是群组成员
      const existingMember = db.prepare(`
        SELECT id FROM group_members WHERE group_id = ? AND user_id = ?
      `).get(body.group_id, targetUser.id);

      if (existingMember) {
        throw createError({
          statusCode: 400,
          message: '用户已经是群组成员'
        });
      }

      const now = new Date().toISOString();
      const role = body.role || 'member';

      const result = db.prepare(`
        INSERT INTO group_members (group_id, user_id, role, joined_at)
        VALUES (?, ?, ?, ?)
      `).run(body.group_id, targetUser.id, role, now);

      return {
        id: result.lastInsertRowid,
        group_id: body.group_id,
        user_id: targetUser.id,
        role: role,
        joined_at: now
      };
    } catch (error) {
      console.error('添加群组成员失败:', error);
      throw createError({
        statusCode: 500,
        message: '添加群组成员失败'
      });
    }
  }

  // PUT - 更新成员角色
  if (method === 'PUT') {
    const query = getQuery(event);
    const memberId = query.id;
    const userId = session.data.id;

    if (!memberId) {
      throw createError({
        statusCode: 400,
        message: '缺少成员ID'
      });
    }

    if (!userId) {
      throw createError({
        statusCode: 401,
        message: '请先登录'
      });
    }

    const body = await readBody<{ role: string }>(event);

    if (!body.role || !['admin', 'member'].includes(body.role)) {
      throw createError({
        statusCode: 400,
        message: '无效的角色'
      });
    }

    try {
      // 获取要修改的成员信息
      const memberInfo = db.prepare(`
        SELECT group_id, user_id FROM group_members WHERE id = ?
      `).get(memberId) as { group_id: number; user_id: number } | undefined;

      if (!memberInfo) {
        throw createError({
          statusCode: 404,
          message: '成员不存在'
        });
      }

      // 检查当前用户是否为群组管理员
      const adminCheck = db.prepare(`
        SELECT role FROM group_members 
        WHERE group_id = ? AND user_id = ? AND role = 'admin'
      `).get(memberInfo.group_id, userId);

      if (!adminCheck) {
        throw createError({
          statusCode: 403,
          message: '只有管理员可以修改成员角色'
        });
      }

      // 不能修改自己的角色
      if (memberInfo.user_id === userId) {
        throw createError({
          statusCode: 400,
          message: '不能修改自己的角色'
        });
      }

      const result = db.prepare(`
        UPDATE group_members SET role = ? WHERE id = ?
      `).run(body.role, memberId);

      if (result.changes === 0) {
        throw createError({
          statusCode: 404,
          message: '成员不存在'
        });
      }

      return { message: '更新成功' };
    } catch (error) {
      console.error('更新成员角色失败:', error);
      throw createError({
        statusCode: 500,
        message: '更新成员角色失败'
      });
    }
  }

  // DELETE - 移除群组成员
  if (method === 'DELETE') {
    const query = getQuery(event);
    const memberId = query.id;
    const userId = session.data.id;

    if (!memberId) {
      throw createError({
        statusCode: 400,
        message: '缺少成员ID'
      });
    }

    if (!userId) {
      throw createError({
        statusCode: 401,
        message: '请先登录'
      });
    }

    try {
      // 获取要删除的成员信息
      const memberInfo = db.prepare(`
        SELECT group_id, user_id FROM group_members WHERE id = ?
      `).get(memberId) as { group_id: number; user_id: number } | undefined;

      if (!memberInfo) {
        throw createError({
          statusCode: 404,
          message: '成员不存在'
        });
      }

      // 检查权限：管理员可以移除任何成员，普通成员只能退出群组（移除自己）
      const currentUserMember = db.prepare(`
        SELECT role FROM group_members 
        WHERE group_id = ? AND user_id = ?
      `).get(memberInfo.group_id, userId) as { role: string } | undefined;

      if (!currentUserMember) {
        throw createError({
          statusCode: 403,
          message: '您不是该群组成员'
        });
      }

      if (currentUserMember.role !== 'admin' && memberInfo.user_id !== userId) {
        throw createError({
          statusCode: 403,
          message: '只有管理员可以移除其他成员'
        });
      }

      // 检查是否为群组创建者
      const group = db.prepare(`
        SELECT created_by FROM groups WHERE id = ?
      `).get(memberInfo.group_id) as { created_by: number } | undefined;

      if (group && group.created_by === memberInfo.user_id) {
        throw createError({
          statusCode: 400,
          message: '不能移除群组创建者'
        });
      }

      const result = db.prepare('DELETE FROM group_members WHERE id = ?').run(memberId);

      if (result.changes === 0) {
        throw createError({
          statusCode: 404,
          message: '成员不存在'
        });
      }

      return { message: '移除成功' };
    } catch (error) {
      console.error('移除群组成员失败:', error);
      throw createError({
        statusCode: 500,
        message: '移除群组成员失败'
      });
    }
  }

  throw createError({
    statusCode: 405,
    message: '不支持的请求方法'
  });
});