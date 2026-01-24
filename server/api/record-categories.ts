import { Database } from 'better-sqlite3';
import { defineEventHandler, readBody, getQuery, createError } from 'h3';
import { getDatabase } from '../utils/database';
import { useAuthSession } from '../utils/session';
import { RecordCategory, generateId } from '../models/universal-schema';

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

  // GET - 获取记录分类
  if (method === 'GET') {
    const query = getQuery(event);
    const categoryId = query.categoryId as string;
    const includeStats = query.includeStats === 'true';

    try {
      if (categoryId) {
        return await getCategoryDetail(db, categoryId, userId);
      }

      return await getCategories(db, userId, includeStats);

    } catch (error) {
      console.error('获取记录分类失败:', error);
      throw createError({
        statusCode: 500,
        message: '获取记录分类失败'
      });
    }
  }

  // POST - 创建自定义分类
  if (method === 'POST') {
    const body = await readBody(event);
    const { name, description, icon, color } = body;

    if (!name) {
      throw createError({
        statusCode: 400,
        message: '分类名称不能为空'
      });
    }

    try {
      return await createCategory(db, {
        name,
        description,
        icon,
        color,
        userId: userId.toString()
      });
    } catch (error) {
      console.error('创建分类失败:', error);
      throw createError({
        statusCode: 500,
        message: '创建分类失败'
      });
    }
  }

  // PUT - 更新分类
  if (method === 'PUT') {
    const query = getQuery(event);
    const categoryId = query.categoryId as string;

    if (!categoryId) {
      throw createError({
        statusCode: 400,
        message: '缺少分类ID'
      });
    }

    const body = await readBody(event);

    try {
      return await updateCategory(db, categoryId, userId.toString(), body);
    } catch (error) {
      console.error('更新分类失败:', error);
      throw createError({
        statusCode: 500,
        message: '更新分类失败'
      });
    }
  }

  // DELETE - 删除分类
  if (method === 'DELETE') {
    const query = getQuery(event);
    const categoryId = query.categoryId as string;

    if (!categoryId) {
      throw createError({
        statusCode: 400,
        message: '缺少分类ID'
      });
    }

    try {
      return await deleteCategory(db, categoryId, userId.toString());
    } catch (error) {
      console.error('删除分类失败:', error);
      throw createError({
        statusCode: 500,
        message: '删除分类失败'
      });
    }
  }

  throw createError({
    statusCode: 405,
    message: '不支持的请求方法'
  });
});

// 获取分类详情
async function getCategoryDetail(db: Database, categoryId: string, userId: number) {
  const category = db.prepare(`
    SELECT * FROM record_categories WHERE id = ?
  `).get(categoryId);

  if (!category) {
    throw createError({
      statusCode: 404,
      message: '分类不存在'
    });
  }

  // 获取该分类下的记录类型
  const recordTypes = db.prepare(`
    SELECT rt.*, COUNT(ur.id) as record_count
    FROM record_types rt
    LEFT JOIN user_records ur ON rt.id = ur.record_type_id AND ur.user_id = ?
    WHERE rt.category_id = ? AND (rt.is_system = 1 OR rt.created_by = ?)
    GROUP BY rt.id
    ORDER BY rt.is_system DESC, rt.created_at DESC
  `).all(userId, categoryId, userId);

  return {
    ...category,
    recordTypes
  };
}

// 获取分类列表
async function getCategories(db: Database, userId: number, includeStats: boolean = false) {
  let sql = `
    SELECT rc.*
    FROM record_categories rc
    ORDER BY rc.sort_order, rc.name
  `;

  if (includeStats) {
    sql = `
      SELECT rc.*,
             COUNT(DISTINCT rt.id) as record_type_count,
             COUNT(DISTINCT ur.id) as record_count
      FROM record_categories rc
      LEFT JOIN record_types rt ON rc.id = rt.category_id 
        AND (rt.is_system = 1 OR rt.created_by = ?)
      LEFT JOIN user_records ur ON rt.id = ur.record_type_id AND ur.user_id = ?
      GROUP BY rc.id
      ORDER BY rc.sort_order, rc.name
    `;
  }

  const categories = includeStats 
    ? db.prepare(sql).all(userId, userId)
    : db.prepare(sql).all();

  return { categories };
}

// 创建分类
async function createCategory(db: Database, data: {
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  userId: string;
}) {
  const categoryId = generateId();
  const now = new Date().toISOString();

  // 检查分类名称是否已存在
  const existingCategory = db.prepare(`
    SELECT * FROM record_categories WHERE name = ?
  `).get(data.name);

  if (existingCategory) {
    throw createError({
      statusCode: 400,
      message: '分类名称已存在'
    });
  }

  // 获取最大排序值
  const maxSort = db.prepare(`
    SELECT MAX(sort_order) as max_sort FROM record_categories
  `).get() as { max_sort: number | null };

  const sortOrder = (maxSort.max_sort || 0) + 1;

  try {
    db.prepare(`
      INSERT INTO record_categories (
        id, name, description, icon, color, sort_order, 
        is_system, created_by, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?, ?)
    `).run(
      categoryId,
      data.name,
      data.description || null,
      data.icon || '📝',
      data.color || '#3B82F6',
      sortOrder,
      parseInt(data.userId),
      now,
      now
    );

    return {
      id: categoryId,
      message: '分类创建成功'
    };

  } catch (error) {
    throw error;
  }
}

// 更新分类
async function updateCategory(db: Database, categoryId: string, userId: string, data: any) {
  // 检查分类是否存在且可编辑
  const existingCategory = db.prepare(`
    SELECT * FROM record_categories 
    WHERE id = ? AND (is_system = 0 AND created_by = ?)
  `).get(categoryId, parseInt(userId));

  if (!existingCategory) {
    throw createError({
      statusCode: 404,
      message: '分类不存在或无权编辑'
    });
  }

  // 如果更新名称，检查是否重复
  if (data.name && data.name !== existingCategory.name) {
    const duplicateCategory = db.prepare(`
      SELECT * FROM record_categories WHERE name = ? AND id != ?
    `).get(data.name, categoryId);

    if (duplicateCategory) {
      throw createError({
        statusCode: 400,
        message: '分类名称已存在'
      });
    }
  }

  const now = new Date().toISOString();

  try {
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
    if (data.sortOrder !== undefined) {
      updates.push('sort_order = ?');
      values.push(data.sortOrder);
    }

    updates.push('updated_at = ?');
    values.push(now);

    if (updates.length > 1) {
      const sql = `UPDATE record_categories SET ${updates.join(', ')} WHERE id = ?`;
      values.push(categoryId);
      db.prepare(sql).run(...values);
    }

    return { message: '分类更新成功' };

  } catch (error) {
    throw error;
  }
}

// 删除分类
async function deleteCategory(db: Database, categoryId: string, userId: string) {
  // 检查分类是否存在且可删除
  const existingCategory = db.prepare(`
    SELECT * FROM record_categories 
    WHERE id = ? AND (is_system = 0 AND created_by = ?)
  `).get(categoryId, parseInt(userId));

  if (!existingCategory) {
    throw createError({
      statusCode: 404,
      message: '分类不存在或无权删除'
    });
  }

  // 检查是否有关联的记录类型
  const recordTypeCount = db.prepare(`
    SELECT COUNT(*) as count FROM record_types WHERE category_id = ?
  `).get(categoryId) as { count: number };

  if (recordTypeCount.count > 0) {
    throw createError({
      statusCode: 400,
      message: '该分类下还有记录类型，无法删除'
    });
  }

  try {
    db.prepare('DELETE FROM record_categories WHERE id = ?').run(categoryId);

    return { message: '分类删除成功' };

  } catch (error) {
    throw error;
  }
}