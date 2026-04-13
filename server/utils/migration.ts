import { Database } from 'better-sqlite3';
import { defineEventHandler, readBody, getQuery, createError } from 'h3';
import { getDatabase } from '../utils/database';
import { useAuthSession } from '../utils/session';
import { 
  UserRecord, 
  RecordValue, 
  CustomRecordType, 
  RecordField,
  generateId,
  validateFieldValue 
} from '../models/universal-schema';

export default defineEventHandler(async (event) => {
  const method = event.method;
  const db = getDatabase();
  const session = await useAuthSession(event);
  
  const userId = session.data.id;
  if (!userId) {
    throw createError({
      statusCode: 401,
      message: '请先登录'
    });
  }

  // GET - 获取记录
  if (method === 'GET') {
    const query = getQuery(event);
    const recordTypeId = query.recordTypeId as string;
    const recordId = query.recordId as string;
    const type = query.type as string || 'user'; // user, group, all
    const page = parseInt(query.page as string) || 1;
    const limit = parseInt(query.limit as string) || 20;
    const offset = (page - 1) * limit;

    try {
      // 如果指定了recordId，返回单个记录的详细信息
      if (recordId) {
        return await getRecordDetail(db, recordId, userId);
      }

      // 如果指定了recordTypeId，返回该类型的记录列表
      if (recordTypeId) {
        return await getRecordsByType(db, recordTypeId, userId, type, limit, offset);
      }

      // 否则返回所有记录
      return await getAllRecords(db, userId, type, limit, offset);

    } catch (error) {
      console.error('获取记录失败:', error);
      throw createError({
        statusCode: 500,
        message: '获取记录失败'
      });
    }
  }

  // POST - 创建新记录
  if (method === 'POST') {
    const body = await readBody(event);
    const { recordTypeId, recordDate, recordTime, location, moodContext, notes, tags, fieldValues } = body;

    if (!recordTypeId || !recordDate || !fieldValues) {
      throw createError({
        statusCode: 400,
        message: '缺少必要字段'
      });
    }

    try {
      return await createRecord(db, {
        userId: userId.toString(),
        recordTypeId,
        recordDate,
        recordTime,
        location,
        moodContext,
        notes,
        tags: tags || [],
        fieldValues
      });
    } catch (error) {
      console.error('创建记录失败:', error);
      throw createError({
        statusCode: 500,
        message: '创建记录失败'
      });
    }
  }

  // PUT - 更新记录
  if (method === 'PUT') {
    const query = getQuery(event);
    const recordId = query.recordId as string;

    if (!recordId) {
      throw createError({
        statusCode: 400,
        message: '缺少记录ID'
      });
    }

    const body = await readBody(event);

    try {
      return await updateRecord(db, recordId, userId.toString(), body);
    } catch (error) {
      console.error('更新记录失败:', error);
      throw createError({
        statusCode: 500,
        message: '更新记录失败'
      });
    }
  }

  // DELETE - 删除记录
  if (method === 'DELETE') {
    const query = getQuery(event);
    const recordId = query.recordId as string;

    if (!recordId) {
      throw createError({
        statusCode: 400,
        message: '缺少记录ID'
      });
    }

    try {
      return await deleteRecord(db, recordId, userId.toString());
    } catch (error) {
      console.error('删除记录失败:', error);
      throw createError({
        statusCode: 500,
        message: '删除记录失败'
      });
    }
  }

  throw createError({
    statusCode: 405,
    message: '不支持的请求方法'
  });
});

// 获取记录详情
async function getRecordDetail(db: Database, recordId: string, userId: number) {
  const record = db.prepare(`
    SELECT ur.*, rt.name as record_type_name, rt.icon, rt.color
    FROM user_records ur
    JOIN record_types rt ON ur.record_type_id = rt.id
    WHERE ur.id = ? AND ur.user_id = ?
  `).get(recordId, userId);

  if (!record) {
    throw createError({
      statusCode: 404,
      message: '记录不存在'
    });
  }

  // 获取字段值
  const fieldValues = db.prepare(`
    SELECT rv.*, rf.name as field_name, rf.label, rf.type
    FROM record_values rv
    JOIN record_fields rf ON rv.field_id = rf.id
    WHERE rv.user_record_id = ?
    ORDER BY rf.sort_order
  `).all(recordId);

  return {
    ...record,
    location: record.location ? JSON.parse(record.location) : null,
    moodContext: record.mood_context ? JSON.parse(record.mood_context) : null,
    tags: JSON.parse(record.tags),
    fieldValues: fieldValues.map(fv => ({
      ...fv,
      value: JSON.parse(fv.value_data)
    }))
  };
}

// 根据类型获取记录
async function getRecordsByType(db: Database, recordTypeId: string, userId: number, type: string, limit: number, offset: number) {
  let whereClause = 'WHERE ur.record_type_id = ?';
  let params = [recordTypeId];

  if (type === 'user') {
    whereClause += ' AND ur.user_id = ?';
    params.push(userId);
  } else if (type === 'group') {
    whereClause += ` AND ur.user_id IN (
      SELECT gm2.user_id 
      FROM group_members gm1
      JOIN group_members gm2 ON gm1.group_id = gm2.group_id
      WHERE gm1.user_id = ? AND gm2.user_id != ?
    )`;
    params.push(userId, userId);
  } else if (type === 'all') {
    whereClause += ` AND (ur.user_id = ? OR ur.user_id IN (
      SELECT gm2.user_id 
      FROM group_members gm1
      JOIN group_members gm2 ON gm1.group_id = gm2.group_id
      WHERE gm1.user_id = ? AND gm2.user_id != ?
    ))`;
    params.push(userId, userId, userId);
  }

  const records = db.prepare(`
    SELECT ur.*, rt.name as record_type_name, rt.icon, rt.color, u.username
    FROM user_records ur
    JOIN record_types rt ON ur.record_type_id = rt.id
    LEFT JOIN users u ON ur.user_id = u.id
    ${whereClause}
    ORDER BY ur.record_date DESC, ur.record_time DESC
    LIMIT ? OFFSET ?
  `).all(...params, limit, offset);

  // 获取总数
  const totalCount = db.prepare(`
    SELECT COUNT(*) as count
    FROM user_records ur
    ${whereClause}
  `).get(...params) as { count: number };

  return {
    records: records.map(record => ({
      ...record,
      location: record.location ? JSON.parse(record.location) : null,
      moodContext: record.mood_context ? JSON.parse(record.mood_context) : null,
      tags: JSON.parse(record.tags)
    })),
    pagination: {
      page: Math.floor(offset / limit) + 1,
      limit,
      total: totalCount.count,
      totalPages: Math.ceil(totalCount.count / limit)
    }
  };
}

// 获取所有记录
async function getAllRecords(db: Database, userId: number, type: string, limit: number, offset: number) {
  let whereClause = 'WHERE 1=1';
  let params: any[] = [];

  if (type === 'user') {
    whereClause += ' AND ur.user_id = ?';
    params.push(userId);
  } else if (type === 'group') {
    whereClause += ` AND ur.user_id IN (
      SELECT gm2.user_id 
      FROM group_members gm1
      JOIN group_members gm2 ON gm1.group_id = gm2.group_id
      WHERE gm1.user_id = ? AND gm2.user_id != ?
    )`;
    params.push(userId, userId);
  } else if (type === 'all') {
    whereClause += ` AND (ur.user_id = ? OR ur.user_id IN (
      SELECT gm2.user_id 
      FROM group_members gm1
      JOIN group_members gm2 ON gm1.group_id = gm2.group_id
      WHERE gm1.user_id = ? AND gm2.user_id != ?
    ))`;
    params.push(userId, userId, userId);
  }

  const records = db.prepare(`
    SELECT ur.*, rt.name as record_type_name, rt.icon, rt.color, u.username
    FROM user_records ur
    JOIN record_types rt ON ur.record_type_id = rt.id
    LEFT JOIN users u ON ur.user_id = u.id
    ${whereClause}
    ORDER BY ur.record_date DESC, ur.record_time DESC
    LIMIT ? OFFSET ?
  `).all(...params, limit, offset);

  const totalCount = db.prepare(`
    SELECT COUNT(*) as count
    FROM user_records ur
    ${whereClause}
  `).get(...params) as { count: number };

  return {
    records: records.map(record => ({
      ...record,
      location: record.location ? JSON.parse(record.location) : null,
      moodContext: record.mood_context ? JSON.parse(record.mood_context) : null,
      tags: JSON.parse(record.tags)
    })),
    pagination: {
      page: Math.floor(offset / limit) + 1,
      limit,
      total: totalCount.count,
      totalPages: Math.ceil(totalCount.count / limit)
    }
  };
}

// 创建记录
async function createRecord(db: Database, data: {
  userId: string;
  recordTypeId: string;
  recordDate: string;
  recordTime?: string;
  location?: any;
  moodContext?: any;
  notes?: string;
  tags: string[];
  fieldValues: Record<string, any>;
}) {
  const recordId = generateId();
  const now = new Date().toISOString();

  // 获取记录类型的字段定义
  const fields = db.prepare(`
    SELECT * FROM record_fields 
    WHERE record_type_id = ? 
    ORDER BY sort_order
  `).all(data.recordTypeId) as RecordField[];

  // 验证字段值
  for (const field of fields) {
    const value = data.fieldValues[field.name];
    if (!validateFieldValue(field, value)) {
      throw createError({
        statusCode: 400,
        message: `字段 ${field.label} 验证失败`
      });
    }
  }

  try {
    db.exec('BEGIN TRANSACTION');

    // 插入用户记录
    db.prepare(`
      INSERT INTO user_records (
        id, user_id, record_type_id, record_date, record_time, 
        location, mood_context, notes, tags, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      recordId,
      parseInt(data.userId),
      data.recordTypeId,
      data.recordDate,
      data.recordTime || null,
      data.location ? JSON.stringify(data.location) : null,
      data.moodContext ? JSON.stringify(data.moodContext) : null,
      data.notes || null,
      JSON.stringify(data.tags),
      now,
      now
    );

    // 插入字段值
    for (const field of fields) {
      const value = data.fieldValues[field.name];
      if (value !== null && value !== undefined && value !== '') {
        db.prepare(`
          INSERT INTO record_values (
            id, user_record_id, field_id, value_type, value_data, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(
          generateId(),
          recordId,
          field.id,
          field.type,
          JSON.stringify(value),
          now,
          now
        );
      }
    }

    db.exec('COMMIT');

    return {
      id: recordId,
      message: '记录创建成功'
    };

  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }
}

// 更新记录
async function updateRecord(db: Database, recordId: string, userId: string, data: any) {
  // 检查记录是否存在且属于当前用户
  const existingRecord = db.prepare(`
    SELECT * FROM user_records 
    WHERE id = ? AND user_id = ?
  `).get(recordId, parseInt(userId));

  if (!existingRecord) {
    throw createError({
      statusCode: 404,
      message: '记录不存在'
    });
  }

  const now = new Date().toISOString();

  try {
    db.exec('BEGIN TRANSACTION');

    // 更新用户记录基本信息
    const updates = [];
    const values = [];

    if (data.recordDate) {
      updates.push('record_date = ?');
      values.push(data.recordDate);
    }
    if (data.recordTime !== undefined) {
      updates.push('record_time = ?');
      values.push(data.recordTime);
    }
    if (data.location !== undefined) {
      updates.push('location = ?');
      values.push(data.location ? JSON.stringify(data.location) : null);
    }
    if (data.moodContext !== undefined) {
      updates.push('mood_context = ?');
      values.push(data.moodContext ? JSON.stringify(data.moodContext) : null);
    }
    if (data.notes !== undefined) {
      updates.push('notes = ?');
      values.push(data.notes);
    }
    if (data.tags !== undefined) {
      updates.push('tags = ?');
      values.push(JSON.stringify(data.tags));
    }

    updates.push('updated_at = ?');
    values.push(now);

    if (updates.length > 1) { // 除了updated_at还有其他更新
      const sql = `UPDATE user_records SET ${updates.join(', ')} WHERE id = ?`;
      values.push(recordId);
      db.prepare(sql).run(...values);
    }

    // 更新字段值
    if (data.fieldValues) {
      // 删除现有字段值
      db.prepare('DELETE FROM record_values WHERE user_record_id = ?').run(recordId);

      // 获取字段定义
      const fields = db.prepare(`
        SELECT rf.* FROM record_fields rf
        JOIN user_records ur ON rf.record_type_id = ur.record_type_id
        WHERE ur.id = ?
        ORDER BY rf.sort_order
      `).all(recordId) as RecordField[];

      // 插入新的字段值
      for (const field of fields) {
        const value = data.fieldValues[field.name];
        if (value !== null && value !== undefined && value !== '') {
          if (!validateFieldValue(field, value)) {
            throw createError({
              statusCode: 400,
              message: `字段 ${field.label} 验证失败`
            });
          }

          db.prepare(`
            INSERT INTO record_values (
              id, user_record_id, field_id, value_type, value_data, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
          `).run(
            generateId(),
            recordId,
            field.id,
            field.type,
            JSON.stringify(value),
            now,
            now
          );
        }
      }
    }

    db.exec('COMMIT');

    return { message: '记录更新成功' };

  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }
}

// 删除记录
async function deleteRecord(db: Database, recordId: string, userId: string) {
  // 检查记录是否存在且属于当前用户
  const existingRecord = db.prepare(`
    SELECT * FROM user_records 
    WHERE id = ? AND user_id = ?
  `).get(recordId, parseInt(userId));

  if (!existingRecord) {
    throw createError({
      statusCode: 404,
      message: '记录不存在'
    });
  }

  try {
    db.exec('BEGIN TRANSACTION');

    // 删除字段值（由于外键约束，会自动删除）
    db.prepare('DELETE FROM record_values WHERE user_record_id = ?').run(recordId);

    // 删除记录
    db.prepare('DELETE FROM user_records WHERE id = ?').run(recordId);

    db.exec('COMMIT');

    return { message: '记录删除成功' };

  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }
}