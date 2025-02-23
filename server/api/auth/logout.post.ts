import { useAuthSession } from "~/server/utils/session";

export default defineEventHandler(async (event) => {
  try {
    const session = await useAuthSession(event)
    await session.clear()

    return {
      message: '登出成功'
    };
  } catch (error) {
    throw createError({
      statusCode: 500,
      message: '登出失败'
    });
  }
});