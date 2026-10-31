import { url } from '../config.ts'
import { formatMoney } from '../money.ts'
import type { Payment } from '../payments.ts'
import { billerIcon, html, icon } from './html.ts'

const statusText = { pending: 'Awaiting approval', completed: 'Completed', failed: 'Failed' }
const statusIcon = { pending: 'clock', completed: 'check', failed: 'x' }

export const statusPill = (status: Payment['status']) => html`<span class="status ${status}">${icon(statusIcon[status], 13)} ${statusText[status]}</span>`

export const formatDate = (date: Date) => date.toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })

export function paymentRow(payment: Payment) {
  return html`<a class="activity-row" href="${url(`/payments/${payment.id}`)}">
    <span class="activity-icon ${payment.biller.toLowerCase()}">${billerIcon(payment.biller)}</span>
    <div><strong>${payment.biller}</strong><small>${payment.reference} · ${formatDate(payment.created_at)}</small></div>
    ${statusPill(payment.status)}
    <b>− ${formatMoney(payment.amount_minor, payment.currency)}</b>
  </a>`
}

export const emptyState = (title: string, text: string) => html`<div class="empty">${icon('receipt', 22)}<div><strong>${title}</strong><p>${text}</p></div></div>`

export function pager(base: string, page: number, hasMore: boolean, params: Record<string, string> = {}) {
  if (page === 1 && !hasMore) return ''
  const link = (p: number) => url(base) + '?' + new URLSearchParams({ ...params, page: String(p) })
  return html`<nav class="pager" aria-label="Pagination">
    ${page > 1 ? html`<a href="${link(page - 1)}">← Newer</a>` : html`<span></span>`}
    <span>Page ${page}</span>
    ${hasMore ? html`<a href="${link(page + 1)}">Older →</a>` : html`<span></span>`}
  </nav>`
}
