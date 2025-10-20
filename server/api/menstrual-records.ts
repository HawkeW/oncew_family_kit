import { Database } from 'better-sqlite3';
import { defineEventHandler, readBody, getQuery, createError } from 'h3';
import { getDatabase } from '../utils/database';
import type { MenstrualRecord } from '../models/schema';
import { useAuthSession } from '../utils/session';

export default defineEventHandler(async (event) => {
  const method = event.method;
  const db = getDatabase();
  const session = await useAuthSession(event);
  // GET - 获取所有经期记录
  if (method === 'GET') {
    const query = getQuery(event);
    const type = query.type as string || 'user'; // 默认为用户数据
    
    const userId = session.data.id
    if (!userId) {
      throw createError({
        statusCode: 401,
        message: '请先登录'
      });
    }

    try {
      let records;
      
      if (type === 'all') {
        // 查询群组成员和当前用户的数据
        records = db.prepare(`
          SELECT mr.*, u.username 
          FROM menstrual_records mr
          LEFT JOIN users u ON mr.user_id = u.id
          WHERE mr.user_id = ? 
          OR mr.user_id IN (
            SELECT gm2.user_id 
            FROM group_members gm1
            JOIN group_members gm2 ON gm1.group_id = gm2.group_id
            WHERE gm1.user_id = ? AND gm2.user_id != ?
          )
          ORDER BY mr.record_date DESC
        `).all(userId, userId, userId);
      } else if (type === 'group') {
        // 仅查询群组成员数据（不包括当前用户）
        records = db.prepare(`
          SELECT mr.*, u.username 
          FROM menstrual_records mr
          LEFT JOIN users u ON mr.user_id = u.id
          WHERE mr.user_id IN (
            SELECT gm2.user_id 
            FROM group_members gm1
            JOIN group_members gm2 ON gm1.group_id = gm2.group_id
            WHERE gm1.user_id = ? AND gm2.user_id != ?
          )
          ORDER BY mr.record_date DESC
        `).all(userId, userId);
      } else {
        // 默认：仅查询当前用户数据
        records = db.prepare('SELECT * FROM menstrual_records WHERE user_id = ? ORDER BY record_date DESC').all(userId);
      }
      
      return records;
    } catch (error) {
      console.error('获取经期记录失败:', error);
      throw createError({
        statusCode: 500,
        message: '获取经期记录失败'
      });
    }
  }

  // POST - 添加新经期记录
  if (method === 'POST') {
    const body = await readBody<Partial<MenstrualRecord>>(event);

    // 验证必填字段
    if (!body.record_date || !body.flow_level || !body.pain_level) {
      throw createError({
        statusCode: 400,
        message: '缺少必要字段'
      });
    }

    try {
      const now = new Date().toISOString();
      const userId = session.data.id;
      if (!userId) {
        throw createError({
          statusCode: 401,
          message: '请先登录'
        });
      }

      const result = db.prepare(`
        INSERT INTO menstrual_records (
          record_date, flow_level, pain_level, notes, created_at, updated_at, user_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(
        body.record_date,
        body.flow_level,
        body.pain_level,
        body.notes || null,
        now,
        now,
        userId
      );

      return {
        id: result.lastInsertRowid,
        ...body,
        created_at: now,
        updated_at: now
      };
    } catch (error) {
      console.error('添加经期记录失败:', error);
      throw createError({
        statusCode: 500,
        message: '添加经期记录失败'
      });
    }
  }

  // PUT - 更新经期记录
  if (method === 'PUT') {
    const query = getQuery(event);
    const id = query.id;

    if (!id) {
      throw createError({
        statusCode: 400,
        message: '缺少记录ID'
      });
    }

    const body = await readBody<Partial<MenstrualRecord>>(event);

    try {
      const now = new Date().toISOString();
      const updates = [];
      const values = [];

      if (body.record_date) {
        updates.push('record_date = ?');
        values.push(body.record_date);
      }
      if (body.flow_level) {
        updates.push('flow_level = ?');
        values.push(body.flow_level);
      }
      if (body.pain_level) {
        updates.push('pain_level = ?');
        values.push(body.pain_level);
      }
      if ('notes' in body) {
        updates.push('notes = ?');
        values.push(body.notes || null);
      }

      updates.push('updated_at = ?');
      values.push(now);

      const userId = session.data.id;
      if (!userId) {
        throw createError({
          statusCode: 401,
          message: '请先登录'
        });
      }

      const sql = `UPDATE menstrual_records SET ${updates.join(', ')} WHERE id = ? AND user_id = ?`;
      values.push(id);
      values.push(userId);

      const result = db.prepare(sql).run(...values);

      if (result.changes === 0) {
        throw createError({
          statusCode: 404,
          message: '记录不存在'
        });
      }

      return { message: '更新成功' };
    } catch (error) {
      console.error('更新经期记录失败:', error);
      throw createError({
        statusCode: 500,
        message: '更新经期记录失败'
      });
    }
  }

  // DELETE - 删除经期记录
  if (method === 'DELETE') {
    const query = getQuery(event);
    const id = query.id;

    if (!id) {
      throw createError({
        statusCode: 400,
        message: '缺少记录ID'
      });
    }

    try {
      const userId = session.data.id;
      if (!userId) {
        throw createError({
          statusCode: 401,
          message: '请先登录'
        });
      }

      const result = db.prepare('DELETE FROM menstrual_records WHERE id = ? AND user_id = ?').run(id, userId);

      if (result.changes === 0) {
        throw createError({
          statusCode: 404,
          message: '记录不存在'
        });
      }

      return { message: '删除成功' };
    } catch (error) {
      console.error('删除经期记录失败:', error);
      throw createError({
        statusCode: 500,
        message: '删除经期记录失败'
      });
    }
  }

  throw createError({
    statusCode: 405,
    message: '不支持的请求方法'
  });
});