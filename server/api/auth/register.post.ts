import { hash } from 'bcryptjs';
import { z } from 'zod';
import { getDatabase } from '../../utils/database';

const db = getDatabase();
const registerSchema = z.object({
  username: z.string().min(3).max(20),
  password: z.string().min(6),
  email: z.string().email()
});

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);
    const { username, password, email } = registerSchema.parse(body);

    // 检查用户名是否已存在
    const existingUser = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
    if (existingUser) {
      throw createError({
        statusCode: 400,
        message: '用户名已存在'
      });
    }

    // 检查邮箱是否已存在
    const existingEmail = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existingEmail) {
      throw createError({
        statusCode: 400,
        message: '邮箱已被注册'
      });
    }

    // 加密密码
    const hashedPassword = await hash(password, 10);
    const now = new Date().toISOString();

    // 创建用户
    const result = db.prepare(
      'INSERT INTO users (username, password, email, created_at, updated_at) VALUES (?, ?, ?, ?, ?)'
    ).run(username, hashedPassword, email, now, now);

    return {
      id: result.lastInsertRowid,
      username,
      email
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw createError({
        statusCode: 400,
        message: '输入验证失败',
        data: error.errors
      });
    }
    throw error;
  }
});