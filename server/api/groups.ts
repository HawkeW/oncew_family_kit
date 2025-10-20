import { Database } from 'better-sqlite3';
import { defineEventHandler, readBody, getQuery, createError } from 'h3';
import { getDatabase } from '../utils/database';
import type { Group, GroupMember } from '../models/schema';
import { useAuthSession } from '../utils/session';

export default defineEventHandler(async (event) => {
  const method = event.method;
  const db = getDatabase();
  const session = await useAuthSession(event);

  // GET - 获取用户的群组列表
  if (method === 'GET') {
    const userId = session.data.id;
    if (!userId) {
      throw createError({
        statusCode: 401,
        message: '请先登录'
      });
    }

    try {
      const groups = db.prepare(`
        SELECT g.*, u.username as creator_name,
               (SELECT COUNT(*) FROM group_members WHERE group_id = g.id) as member_count
        FROM groups g
        LEFT JOIN users u ON g.created_by = u.id
        WHERE g.id IN (
          SELECT group_id FROM group_members WHERE user_id = ?
        )
        ORDER BY g.created_at DESC
      `).all(userId);
      
      return groups;
    } catch (error) {
      console.error('获取群组列表失败:', error);
      throw createError({
        statusCode: 500,
        message: '获取群组列表失败'
      });
    }
  }

  // POST - 创建新群组
  if (method === 'POST') {
    const body = await readBody<Partial<Group>>(event);
    const userId = session.data.id;
    
    if (!userId) {
      throw createError({
        statusCode: 401,
        message: '请先登录'
      });
    }

    // 验证必填字段
    if (!body.name) {
      throw createError({
        statusCode: 400,
        message: '群组名称不能为空'
      });
    }

    try {
      const now = new Date().toISOString();
      
      // 创建群组
      const groupResult = db.prepare(`
        INSERT INTO groups (name, description, created_by, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?)
      `).run(
        body.name,
        body.description || null,
        userId,
        now,
        now
      );

      const groupId = groupResult.lastInsertRowid;

      // 将创建者添加为群组管理员
      db.prepare(`
        INSERT INTO group_members (group_id, user_id, role, joined_at)
        VALUES (?, ?, 'admin', ?)
      `).run(groupId, userId, now);

      return {
        id: groupId,
        name: body.name,
        description: body.description,
        created_by: userId,
        created_at: now,
        updated_at: now
      };
    } catch (error) {
      console.error('创建群组失败:', error);
      throw createError({
        statusCode: 500,
        message: '创建群组失败'
      });
    }
  }

  // PUT - 更新群组信息
  if (method === 'PUT') {
    const query = getQuery(event);
    const groupId = query.id;
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

    const body = await readBody<Partial<Group>>(event);

    try {
      // 检查用户是否为群组管理员
      const memberInfo = db.prepare(`
        SELECT role FROM group_members 
        WHERE group_id = ? AND user_id = ?
      `).get(groupId, userId) as { role: string } | undefined;

      if (!memberInfo || memberInfo.role !== 'admin') {
        throw createError({
          statusCode: 403,
          message: '只有管理员可以修改群组信息'
        });
      }

      const now = new Date().toISOString();
      const updates = [];
      const values = [];

      if (body.name) {
        updates.push('name = ?');
        values.push(body.name);
      }
      if ('description' in body) {
        updates.push('description = ?');
        values.push(body.description || null);
      }

      updates.push('updated_at = ?');
      values.push(now);
      values.push(groupId);

      const sql = `UPDATE groups SET ${updates.join(', ')} WHERE id = ?`;
      const result = db.prepare(sql).run(...values);

      if (result.changes === 0) {
        throw createError({
          statusCode: 404,
          message: '群组不存在'
        });
      }

      return { message: '更新成功' };
    } catch (error) {
      console.error('更新群组失败:', error);
      throw createError({
        statusCode: 500,
        message: '更新群组失败'
      });
    }
  }

  // DELETE - 删除群组
  if (method === 'DELETE') {
    const query = getQuery(event);
    const groupId = query.id;
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
      // 检查用户是否为群组创建者
      const group = db.prepare(`
        SELECT created_by FROM groups WHERE id = ?
      `).get(groupId) as { created_by: number } | undefined;

      if (!group || group.created_by !== userId) {
        throw createError({
          statusCode: 403,
          message: '只有群组创建者可以删除群组'
        });
      }

      // 删除群组（会级联删除群组成员）
      const result = db.prepare('DELETE FROM groups WHERE id = ?').run(groupId);

      if (result.changes === 0) {
        throw createError({
          statusCode: 404,
          message: '群组不存在'
        });
      }

      return { message: '删除成功' };
    } catch (error) {
      console.error('删除群组失败:', error);
      throw createError({
        statusCode: 500,
        message: '删除群组失败'
      });
    }
  }

  throw createError({
    statusCode: 405,
    message: '不支持的请求方法'
  });
});