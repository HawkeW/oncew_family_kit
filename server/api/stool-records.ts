import { Database } from 'better-sqlite3';
import { defineEventHandler, readBody, getQuery, createError } from 'h3';
import { getDatabase } from '../utils/database';
import type { StoolRecord } from '../models/schema';

export default defineEventHandler(async (event) => {
  const method = event.method;
  const db = getDatabase();

  // GET - 获取所有便便记录
  if (method === 'GET') {
    try {
      const records = db.prepare('SELECT * FROM stool_records ORDER BY date DESC').all();
      return records;
    } catch (error) {
      console.error('获取便便记录失败:', error);
      throw createError({
        statusCode: 500,
        message: '获取便便记录失败'
      });
    }
  }

  // POST - 添加新便便记录
  if (method === 'POST') {
    const body = await readBody<Partial<StoolRecord>>(event);

    // 验证必填字段
    if (!body.date || !body.comfort_level || !body.consistency) {
      throw createError({
        statusCode: 400,
        message: '缺少必要字段'
      });
    }

    try {
      const now = new Date().toISOString();
      const result = db.prepare(`
        INSERT INTO stool_records (
          date, comfort_level, consistency, notes, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?)
      `).run(
        body.date,
        body.comfort_level,
        body.consistency,
        body.notes || null,
        now,
        now
      );

      return {
        id: result.lastInsertRowid,
        ...body,
        created_at: now,
        updated_at: now
      };
    } catch (error) {
      console.error('添加便便记录失败:', error);
      throw createError({
        statusCode: 500,
        message: '添加便便记录失败'
      });
    }
  }

  // PUT - 更新便便记录
  if (method === 'PUT') {
    const query = getQuery(event);
    const id = query.id;

    if (!id) {
      throw createError({
        statusCode: 400,
        message: '缺少记录ID'
      });
    }

    const body = await readBody<Partial<StoolRecord>>(event);

    try {
      const now = new Date().toISOString();
      const updates = [];
      const values = [];

      if (body.date) {
        updates.push('date = ?');
        values.push(body.date);
      }
      if (body.comfort_level) {
        updates.push('comfort_level = ?');
        values.push(body.comfort_level);
      }
      if (body.consistency) {
        updates.push('consistency = ?');
        values.push(body.consistency);
      }
      if ('notes' in body) {
        updates.push('notes = ?');
        values.push(body.notes || null);
      }

      updates.push('updated_at = ?');
      values.push(now);

      const sql = `UPDATE stool_records SET ${updates.join(', ')} WHERE id = ?`;
      values.push(id);

      const result = db.prepare(sql).run(...values);

      if (result.changes === 0) {
        throw createError({
          statusCode: 404,
          message: '记录不存在'
        });
      }

      return { message: '更新成功' };
    } catch (error) {
      console.error('更新便便记录失败:', error);
      throw createError({
        statusCode: 500,
        message: '更新便便记录失败'
      });
    }
  }

  // DELETE - 删除便便记录
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
      const result = db.prepare('DELETE FROM stool_records WHERE id = ?').run(id);

      if (result.changes === 0) {
        throw createError({
          statusCode: 404,
          message: '记录不存在'
        });
      }

      return { message: '删除成功' };
    } catch (error) {
      console.error('删除便便记录失败:', error);
      throw createError({
        statusCode: 500,
        message: '删除便便记录失败'
      });
    }
  }

  throw createError({
    statusCode: 405,
    message: '不支持的请求方法'
  });
});