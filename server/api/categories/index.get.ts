import { db } from '../../utils/db'
import { categories } from '../../../db/schema'

export default defineEventHandler(async () => {
  return await db.select().from(categories)
})
