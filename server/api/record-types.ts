import { Database } from 'better-sqlite3';
import { defineEventHandler, readBody, getQuery, createError } from 'h3';
import { getDatabase } from '../utils/database';
import { useAuthSession } from '../utils/session';
import { 
  CustomRecordType, 
  RecordField, 
  RecordCategory,
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

  // GET - 获取记录类型
  if (method === 'GET') {
    const query = getQuery(event);
    const recordTypeId = query.recordTypeId as string;
    const categoryId = query.categoryId as string;
    const includeSystem = query.includeSystem === 'true';

    try {
      if (recordTypeId) {
        return await getRecordTypeDetail(db, recordTypeId, userId);
      }

      return await getRecordTypes(db, userId, categoryId, includeSystem);

    } catch (error) {
      console.error('获取记录类型失败:', error);
      throw createError({
        statusCode: 500,
        message: '获取记录类型失败'
      });
    }
  }

  // POST - 创建自定义记录类型
  if (method === 'POST') {
    const body = await readBody(event);
    const { name, description, icon, color, categoryId, fields } = body;

    if (!name || !categoryId || !fields || !Array.isArray(fields)) {
      throw createError({
        statusCode: 400,
        message: '缺少必要字段'
      });
    }

    try {
      return await createRecordType(db, {
        name,
        description,
        icon,
        color,
        categoryId,
        fields,
        userId: userId.toString()
      });
    } catch (error) {
      console.error('创建记录类型失败:', error);
      throw createError({
        statusCode: 500,
        message: '创建记录类型失败'
      });
    }
  }

  // PUT - 更新记录类型
  if (method === 'PUT') {
    const query = getQuery(event);
    const recordTypeId = query.recordTypeId as string;

    if (!recordTypeId) {
      throw createError({
        statusCode: 400,
        message: '缺少记录类型ID'
      });
    }

    const body = await readBody(event);

    try {
      return await updateRecordType(db, recordTypeId, userId.toString(), body);
    } catch (error) {
      console.error('更新记录类型失败:', error);
      throw createError({
        statusCode: 500,
        message: '更新记录类型失败'
      });
    }
  }

  // DELETE - 删除记录类型
  if (method === 'DELETE') {
    const query = getQuery(event);
    const recordTypeId = query.recordTypeId as string;

    if (!recordTypeId) {
      throw createError({
        statusCode: 400,
        message: '缺少记录类型ID'
      });
    }

    try {
      return await deleteRecordType(db, recordTypeId, userId.toString());
    } catch (error) {
      console.error('删除记录类型失败:', error);
      throw createError({
        statusCode: 500,
        message: '删除记录类型失败'
      });
    }
  }

  throw createError({
    statusCode: 405,
    message: '不支持的请求方法'
  });
});

// 获取记录类型详情
async function getRecordTypeDetail(db: Database, recordTypeId: string, userId: number) {
  const recordType = db.prepare(`
    SELECT rt.*, rc.name as category_name, rc.icon as category_icon
    FROM record_types rt
    JOIN record_categories rc ON rt.category_id = rc.id
    WHERE rt.id = ? AND (rt.is_system = 1 OR rt.created_by = ?)
  `).get(recordTypeId, userId);

  if (!recordType) {
    throw createError({
      statusCode: 404,
      message: '记录类型不存在'
    });
  }

  // 获取字段定义
  const fields = db.prepare(`
    SELECT * FROM record_fields 
    WHERE record_type_id = ? 
    ORDER BY sort_order
  `).all(recordTypeId);

  return {
    ...recordType,
    fields: fields.map(field => ({
      ...field,
      validation: field.validation ? JSON.parse(field.validation) : null,
      options: field.options ? JSON.parse(field.options) : null,
      display: field.display ? JSON.parse(field.display) : null
    }))
  };
}

// 获取记录类型列表
async function getRecordTypes(db: Database, userId: number, categoryId?: string, includeSystem: boolean = true) {
  let whereClause = 'WHERE (rt.is_system = 1 OR rt.created_by = ?)';
  let params = [userId];

  if (!includeSystem) {
    whereClause = 'WHERE rt.created_by = ?';
  }

  if (categoryId) {
    whereClause += ' AND rt.category_id = ?';
    params.push(categoryId);
  }

  const recordTypes = db.prepare(`
    SELECT rt.*, rc.name as category_name, rc.icon as category_icon,
           COUNT(ur.id) as record_count
    FROM record_types rt
    JOIN record_categories rc ON rt.category_id = rc.id
    LEFT JOIN user_records ur ON rt.id = ur.record_type_id AND ur.user_id = ?
    ${whereClause}
    GROUP BY rt.id
    ORDER BY rt.is_system DESC, rt.created_at DESC
  `).all(userId, ...params);

  // 获取分类列表
  const categories = db.prepare(`
    SELECT * FROM record_categories 
    ORDER BY sort_order, name
  `).all();

  return {
    recordTypes,
    categories
  };
}

// 创建记录类型
async function createRecordType(db: Database, data: {
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  categoryId: string;
  fields: any[];
  userId: string;
}) {
  const recordTypeId = generateId();
  const now = new Date().toISOString();

  // 验证分类是否存在
  const category = db.prepare('SELECT * FROM record_categories WHERE id = ?').get(data.categoryId);
  if (!category) {
    throw createError({
      statusCode: 400,
      message: '分类不存在'
    });
  }

  // 验证字段定义
  for (let i = 0; i < data.fields.length; i++) {
    const field = data.fields[i];
    if (!field.name || !field.label || !field.type) {
      throw createError({
        statusCode: 400,
        message: `字段 ${i + 1} 缺少必要属性`
      });
    }

    // 验证字段类型
    const validTypes = ['date', 'time', 'date-time', 'number', 'text', 'textarea', 'select'];
    if (!validTypes.includes(field.type)) {
      throw createError({
        statusCode: 400,
        message: `字段 ${field.label} 的类型不支持`
      });
    }

    // 如果是select类型，必须有options
    if (field.type === 'select' && (!field.options || !Array.isArray(field.options) || field.options.length === 0)) {
      throw createError({
        statusCode: 400,
        message: `选择字段 ${field.label} 必须提供选项`
      });
    }
  }

  try {
    db.exec('BEGIN TRANSACTION');

    // 插入记录类型
    db.prepare(`
      INSERT INTO record_types (
        id, name, description, icon, color, category_id, 
        is_system, created_by, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?, ?)
    `).run(
      recordTypeId,
      data.name,
      data.description || null,
      data.icon || null,
      data.color || '#3B82F6',
      data.categoryId,
      parseInt(data.userId),
      now,
      now
    );

    // 插入字段定义
    for (let i = 0; i < data.fields.length; i++) {
      const field = data.fields[i];
      db.prepare(`
        INSERT INTO record_fields (
          id, record_type_id, name, label, type, required, 
          validation, options, display, sort_order, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        generateId(),
        recordTypeId,
        field.name,
        field.label,
        field.type,
        field.required ? 1 : 0,
        field.validation ? JSON.stringify(field.validation) : null,
        field.options ? JSON.stringify(field.options) : null,
        field.display ? JSON.stringify(field.display) : null,
        i + 1,
        now,
        now
      );
    }

    db.exec('COMMIT');

    return {
      id: recordTypeId,
      message: '记录类型创建成功'
    };

  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }
}

// 更新记录类型
async function updateRecordType(db: Database, recordTypeId: string, userId: string, data: any) {
  // 检查记录类型是否存在且可编辑
  const existingType = db.prepare(`
    SELECT * FROM record_types 
    WHERE id = ? AND (is_system = 0 AND created_by = ?)
  `).get(recordTypeId, parseInt(userId));

  if (!existingType) {
    throw createError({
      statusCode: 404,
      message: '记录类型不存在或无权编辑'
    });
  }

  const now = new Date().toISOString();

  try {
    db.exec('BEGIN TRANSACTION');

    // 更新记录类型基本信息
    const updates = [];
    const values = [];

    if (data.name) {
      updates.push('name = ?');
      values.push(data.name);
    }
    if (data.description !== undefined) {
      updates.push('description = ?');
      values.push(data.description);
    }
    if (data.icon !== undefined) {
      updates.push('icon = ?');
      values.push(data.icon);
    }
    if (data.color !== undefined) {
      updates.push('color = ?');
      values.push(data.color);
    }
    if (data.categoryId) {
      // 验证分类是否存在
      const category = db.prepare('SELECT * FROM record_categories WHERE id = ?').get(data.categoryId);
      if (!category) {
        throw createError({
          statusCode: 400,
          message: '分类不存在'
        });
      }
      updates.push('category_id = ?');
      values.push(data.categoryId);
    }

    updates.push('updated_at = ?');
    values.push(now);

    if (updates.length > 1) {
      const sql = `UPDATE record_types SET ${updates.join(', ')} WHERE id = ?`;
      values.push(recordTypeId);
      db.prepare(sql).run(...values);
    }

    // 更新字段定义
    if (data.fields && Array.isArray(data.fields)) {
      // 删除现有字段
      db.prepare('DELETE FROM record_fields WHERE record_type_id = ?').run(recordTypeId);

      // 插入新字段
      for (let i = 0; i < data.fields.length; i++) {
        const field = data.fields[i];
        
        if (!field.name || !field.label || !field.type) {
          throw createError({
            statusCode: 400,
            message: `字段 ${i + 1} 缺少必要属性`
          });
        }

        db.prepare(`
          INSERT INTO record_fields (
            id, record_type_id, name, label, type, required, 
            validation, options, display, sort_order, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          generateId(),
          recordTypeId,
          field.name,
          field.label,
          field.type,
          field.required ? 1 : 0,
          field.validation ? JSON.stringify(field.validation) : null,
          field.options ? JSON.stringify(field.options) : null,
          field.display ? JSON.stringify(field.display) : null,
          i + 1,
          now,
          now
        );
      }
    }

    db.exec('COMMIT');

    return { message: '记录类型更新成功' };

  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }
}

// 删除记录类型
async function deleteRecordType(db: Database, recordTypeId: string, userId: string) {
  // 检查记录类型是否存在且可删除
  const existingType = db.prepare(`
    SELECT * FROM record_types 
    WHERE id = ? AND (is_system = 0 AND created_by = ?)
  `).get(recordTypeId, parseInt(userId));

  if (!existingType) {
    throw createError({
      statusCode: 404,
      message: '记录类型不存在或无权删除'
    });
  }

  // 检查是否有关联的记录
  const recordCount = db.prepare(`
    SELECT COUNT(*) as count FROM user_records WHERE record_type_id = ?
  `).get(recordTypeId) as { count: number };

  if (recordCount.count > 0) {
    throw createError({
      statusCode: 400,
      message: '该记录类型下还有记录，无法删除'
    });
  }

  try {
    db.exec('BEGIN TRANSACTION');

    // 删除字段定义
    db.prepare('DELETE FROM record_fields WHERE record_type_id = ?').run(recordTypeId);

    // 删除记录类型
    db.prepare('DELETE FROM record_types WHERE id = ?').run(recordTypeId);

    db.exec('COMMIT');

    return { message: '记录类型删除成功' };

  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }
}