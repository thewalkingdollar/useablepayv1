import type { PaymentProvider } from './types.ts'

const started = new Map<string, { at: number, decline: boolean }>()

// Approves after a few seconds so the full pending → completed journey can be tested without credentials.
// Numbers ending in 0000 are declined.
export const simulator: PaymentProvider = {
  name: 'simulator',
  label: 'Provider simulator',
  async requestPayment(request) {
    started.set(request.reference, { at: Date.now(), decline: request.phone.replace(/\D/g, '').endsWith('0000') })
  },
  async getStatus(reference) {
    const entry = started.get(reference)
    if (!entry) return { status: 'failed', reason: 'Simulator restarted before approval' }
    if (Date.now() - entry.at < 6000) return { status: 'pending' }
    started.delete(reference)
    return entry.decline ? { status: 'failed', reason: 'Payer declined the request' } : { status: 'completed', transactionId: `SIM-${reference.slice(0, 8).toUpperCase()}` }
  },
}
