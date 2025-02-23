import { getServerSession } from '#auth'
import { compare } from 'bcryptjs';
import { z } from 'zod';
import { getDatabase } from '../../utils/database';
import { User } from '~/server/models/schema';
import { useAuth } from '~/composable/auth';
import { hash, useAuthSession } from '~/server/utils/session';

const db = getDatabase();
const loginSchema = z.object({
  email: z.string(),
  password: z.string()
});

export default defineEventHandler(async (event) => {
  try {
    const session = await useAuthSession(event)
    const body = await readBody(event);
    const { email, password } = loginSchema.parse(body);

    // 查找用户
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email) as User;
    if (!user) {
      throw createError({
        statusCode: 401,
        message: '用户名或密码错误'
      });
    }

    // 验证密码
    const isValidPassword = await compare(password, user.password);
    if (!isValidPassword) {
      throw createError({
        statusCode: 401,
        message: '用户名或密码错误'
      });
    }

    await session.update({
      id: user.id,
      username: user.username,
      email: user.email,
    })
    // 返回符合 Nuxt Auth Session 格式的用户信息
    return {
      id: user.id,
      email: user.email,
      username: user.username,
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