import { getDatabase } from '~/server/utils/database'
import { useAuthSession } from '~/server/utils/session'

const db = getDatabase()
export default defineEventHandler(async (event) => {
  try {

    const session = await useAuthSession(event)
    if (!session?.data?.id) {
      throw createError({
        statusCode: 401,
        message: '未登录'
      })
    }

    const user = db.prepare('SELECT id, username, email FROM users WHERE id = ?').get(Number(session.data.id))

    if (!user) {
      throw createError({
        statusCode: 404,
        message: '用户不存在'
      })
    }

    return user
  } catch (error) {
    console.error('获取用户信息失败:', error)
    throw error
  }
})