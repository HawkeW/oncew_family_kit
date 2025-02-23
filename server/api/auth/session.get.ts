import { useAuthSession } from "~/server/utils/session"

export default eventHandler(async (event) => {
  const session = await useAuthSession(event)
  console.log('session handler', session)
  return session.data
})