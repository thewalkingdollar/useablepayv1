import { config } from '../config.ts'
import type { PaymentProvider } from './types.ts'

let token: { value: string, expiresAt: number } | null = null

async function accessToken() {
  if (token && token.expiresAt > Date.now() + 60_000) return token.value
  const res = await fetch(`${config.MOMO_BASE_URL}/collection/token/`, {
    method: 'POST',
    headers: {
      Authorization: 'Basic ' + Buffer.from(`${config.MOMO_API_USER}:${config.MOMO_API_KEY}`).toString('base64'),
      'Ocp-Apim-Subscription-Key': config.MOMO_SUBSCRIPTION_KEY,
    },
  })
  if (!res.ok) throw new Error(`MTN MoMo token request failed (${res.status})`)
  const body = await res.json() as { access_token: string, expires_in: number }
  token = { value: body.access_token, expiresAt: Date.now() + body.expires_in * 1000 }
  return token.value
}

async function headers() {
  return {
    Authorization: `Bearer ${await accessToken()}`,
    'X-Target-Environment': config.MOMO_TARGET_ENVIRONMENT,
    'Ocp-Apim-Subscription-Key': config.MOMO_SUBSCRIPTION_KEY,
  }
}

export const mtnMomo: PaymentProvider = {
  name: 'mtn-momo',
  label: 'MTN Mobile Money',
  async requestPayment(request) {
    const res = await fetch(`${config.MOMO_BASE_URL}/collection/v1_0/requesttopay`, {
      method: 'POST',
      headers: {
        ...await headers(),
        'X-Reference-Id': request.reference,
        'Content-Type': 'application/json',
        ...(config.MOMO_SEND_CALLBACK ? { 'X-Callback-Url': `${config.publicUrl}/provider/mtn-momo/callback` } : {}),
      },
      body: JSON.stringify({
        amount: request.amount,
        currency: request.currency,
        externalId: request.reference,
        payer: { partyIdType: 'MSISDN', partyId: request.phone.replace(/\D/g, '') },
        payerMessage: request.payerMessage.slice(0, 160),
        payeeNote: request.payeeNote.slice(0, 160),
      }),
    })
    if (res.status !== 202) {
      const detail = await res.text().catch(() => '')
      throw new Error(`MTN MoMo rejected the request (${res.status}) ${detail}`.trim())
    }
  },
  async getStatus(reference) {
    const res = await fetch(`${config.MOMO_BASE_URL}/collection/v1_0/requesttopay/${encodeURIComponent(reference)}`, { headers: await headers() })
    if (!res.ok) throw new Error(`MTN MoMo status lookup failed (${res.status})`)
    const body = await res.json() as { status: string, financialTransactionId?: string, reason?: string | { code?: string, message?: string } }
    const reason = typeof body.reason === 'string' ? body.reason : body.reason?.message || body.reason?.code
    if (body.status === 'SUCCESSFUL') return { status: 'completed', transactionId: body.financialTransactionId }
    if (body.status === 'FAILED' || body.status === 'REJECTED' || body.status === 'TIMEOUT') return { status: 'failed', reason: reason || body.status.toLowerCase() }
    return { status: 'pending' }
  },
}
