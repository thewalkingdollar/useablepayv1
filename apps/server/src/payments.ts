import { randomUUID } from 'node:crypto'
import { config } from './config.ts'
import { one, query } from './db.ts'
import { formatAmount } from './money.ts'
import { provider } from './providers/index.ts'

export type Payment = {
  id: number
  user_id: number
  biller_id: number
  biller: string
  reference: string
  phone: string
  amount_minor: number
  currency: string
  status: 'pending' | 'completed' | 'failed'
  provider: string
  provider_reference: string
  provider_transaction_id: string | null
  failure_reason: string | null
  created_at: Date
  customer_name?: string
  customer_email?: string
}

export const paymentSelect = `SELECT p.*, b.name AS biller, u.name AS customer_name, u.email AS customer_email
  FROM payments p JOIN billers b ON b.id = p.biller_id JOIN users u ON u.id = p.user_id`

export async function createPayment(input: { userId: number, billerId: number, billerName: string, reference: string, phone: string, amountMinor: number }) {
  const providerReference = randomUUID()
  const payment = await one<{ id: number }>(
    `INSERT INTO payments (user_id, biller_id, reference, phone, amount_minor, currency, provider, provider_reference)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
    [input.userId, input.billerId, input.reference, input.phone, input.amountMinor, config.APP_CURRENCY, provider.name, providerReference],
  )
  try {
    await provider.requestPayment({
      reference: providerReference,
      amount: formatAmount(input.amountMinor),
      currency: config.APP_CURRENCY,
      phone: input.phone,
      payerMessage: `UseablePay: ${input.billerName} ${input.reference}`,
      payeeNote: `Payment #${payment!.id}`,
    })
  } catch (error) {
    console.error(error)
    await query(`UPDATE payments SET status = 'failed', failure_reason = $2, updated_at = now() WHERE id = $1`, [payment!.id, 'The mobile money provider could not start this payment'])
  }
  return payment!.id
}

// Asks the provider for the latest state of a pending payment, at most every few seconds
export async function refreshPayment(id: number, force = false) {
  const payment = await one<Payment & { checked_at: Date | null }>('SELECT * FROM payments WHERE id = $1', [id])
  if (!payment || payment.status !== 'pending') return
  if (!force && payment.checked_at && Date.now() - payment.checked_at.getTime() < 3000) return
  if (payment.provider !== provider.name) return
  try {
    const result = await provider.getStatus(payment.provider_reference)
    await query(
      `UPDATE payments SET status = $2, provider_transaction_id = COALESCE($3, provider_transaction_id), failure_reason = $4,
       checked_at = now(), updated_at = CASE WHEN $2 <> status THEN now() ELSE updated_at END WHERE id = $1 AND status = 'pending'`,
      [id, result.status, result.transactionId ?? null, result.reason ?? null],
    )
  } catch (error) {
    console.error(error)
    await query('UPDATE payments SET checked_at = now() WHERE id = $1', [id])
  }
}

export async function refreshByProviderReference(reference: string) {
  const row = await one<{ id: number }>('SELECT id FROM payments WHERE provider_reference = $1', [reference])
  if (row) await refreshPayment(row.id, true)
}
