import { pgTable, serial, text, timestamp, integer } from 'drizzle-orm/pg-core'

export const payments = pgTable('payments', {
  id: serial().primaryKey(),
  biller: text().notNull(),
  reference: text().notNull(),
  phone: text().notNull(),
  amountFils: integer('amount_fils').notNull(),
  status: text().notNull().default('completed'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})
