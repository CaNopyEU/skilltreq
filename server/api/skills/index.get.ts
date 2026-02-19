import { db } from '../../utils/db'
import { skills } from '../../../db/schema'

export default defineEventHandler(async () => {
  return await db.select().from(skills)
})
