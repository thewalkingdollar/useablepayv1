import { createServerFn } from '@tanstack/react-start'
import { desc, sql } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '../../db/index.js'
import { payments } from '../../db/schema.js'

const paymentSchema = z.object({
  biller: z.enum(['Electricity', 'Water', 'Internet', 'Mobile']),
  reference: z.string().trim().min(3).max(30),
  phone: z.string().trim().regex(/^\+?[0-9 ]{8,16}$/),
  amountFils: z.number().int().min(100).max(500000),
  pin: z.string().regex(/^\d{4}$/),
})

export const getWallet = createServerFn({ method: 'GET' }).handler(async () => {
  try {
    const recent = await db.select().from(payments).orderBy(desc(payments.createdAt)).limit(6)
    const [spent] = await db.select({ total: sql<number>`coalesce(sum(${payments.amountFils}), 0)` }).from(payments)
    return { balanceFils: Math.max(0, 284760 - Number(spent.total)), recent }
  } catch {
    return { balanceFils: 284760, recent: [] }
  }
})

export const makePayment = createServerFn({ method: 'POST' })
  .inputValidator(paymentSchema)
  .handler(async ({ data }) => {
    const { pin: _pin, ...safePayment } = data
    const [payment] = await db.insert(payments).values(safePayment).returning()
    return payment
  })
