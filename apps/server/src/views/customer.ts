import type { Session } from '../auth.ts'
import { config, url } from '../config.ts'
import { formatMoney, maxAmountMinor, minAmountMinor, formatAmount } from '../money.ts'
import type { Payment } from '../payments.ts'
import { provider } from '../providers/index.ts'
import { billerIcon, html, icon } from './html.ts'
import { csrfField, customerLayout } from './layout.ts'
import { emptyState, formatDate, pager, paymentRow, statusPill } from './shared.ts'

export type Biller = { id: number, name: string, category: string, active: boolean }
export type PayForm = { billerId?: string, reference?: string, phone?: string, amount?: string }

export function dashboardPage(session: Session, data: { billers: Biller[], recent: Payment[], monthMinor: number, pending: number, completed: number }, form: PayForm = {}, error = '') {
  const { user } = session
  const selected = form.billerId ?? String(data.billers[0]?.id ?? '')
  const step = 1 / 10 ** config.CURRENCY_DECIMALS
  return customerLayout(session, '/', 'Home', html`
<section class="welcome">
  <div>
    <p class="eyebrow dark">HELLO, ${user.name.split(' ')[0]!.toUpperCase()}</p>
    <h1>What are we paying today?</h1>
  </div>
  <article class="wallet-card">
    <div class="wallet-top"><span class="mini-brand"><span class="brand-mark tiny"><span></span></span> useablecoin</span>${icon('phone', 22)}</div>
    <p>Paid this month</p>
    <h2>${formatMoney(data.monthMinor).replace(config.APP_CURRENCY + ' ', '')} <small>${config.APP_CURRENCY === 'KWD' ? 'UC' : config.APP_CURRENCY}</small></h2>
    <div class="rate"><span>${data.completed} completed · ${data.pending} awaiting approval</span>${config.APP_CURRENCY === 'KWD' ? html`<strong>1 UC = KWD 1.000</strong>` : ''}</div>
  </article>
</section>

<section class="pay-grid" aria-labelledby="pay-title">
  <form class="payment-panel" method="post" action="${url('/pay')}" data-amount-form>
    ${csrfField(session)}
    <h2 id="pay-title" class="panel-title">Pay a bill</h2>
    ${error ? html`<p class="form-error" role="alert">${error}</p>` : ''}
    <fieldset class="biller-grid">
      <legend>Choose a biller</legend>
      ${data.billers.map((b) => html`<label class="biller">
        <input type="radio" name="billerId" value="${b.id}" ${String(b.id) === selected ? html`checked` : ''} required>
        <span class="activity-icon ${b.name.toLowerCase()}">${billerIcon(b.name)}</span><strong>${b.name}</strong><small>${b.category}</small>
      </label>`)}
    </fieldset>
    ${data.billers.length ? '' : emptyState('No billers available', 'An operator needs to enable at least one biller.')}
    <label>Bill / account number<input name="reference" value="${form.reference ?? ''}" minlength="3" maxlength="30" autocomplete="off" required></label>
    <label>Mobile money number<input name="phone" value="${form.phone ?? user.phone}" inputmode="tel" pattern="\\+?[0-9 ]{8,16}" autocomplete="tel" required></label>
    <label>Amount
      <span class="amount-input"><span>${config.APP_CURRENCY}</span><input name="amount" value="${form.amount ?? ''}" type="number" inputmode="decimal" step="${step}" min="${formatAmount(minAmountMinor)}" max="${formatAmount(maxAmountMinor)}" required data-amount></span>
    </label>
    <button class="pay-button" type="submit" ${data.billers.length ? '' : html`disabled`}>Send approval to my phone ${icon('arrow', 20)}</button>
    <p class="fine-print">${icon('shield', 14)} ${provider.label} sends a prompt to this number. You approve with your PIN on your phone. UseablePay never sees or stores it.</p>
  </form>
  <section class="activity" aria-labelledby="recent-title">
    <div class="section-heading"><h2 id="recent-title">Recent moves</h2><a class="text-button" href="${url('/payments')}">View all ${icon('arrow', 15)}</a></div>
    <div class="activity-list">${data.recent.length ? data.recent.map(paymentRow) : emptyState('Your first payment lands here', 'Choose a bill to start your UseablePay activity.')}</div>
  </section>
</section>`)
}

export function historyPage(session: Session, payments: Payment[], page: number, hasMore: boolean) {
  return customerLayout(session, '/payments', 'Activity', html`
<div class="section-heading"><div><p class="eyebrow dark">YOUR RECENT MOVES</p><h1>Activity</h1></div></div>
<div class="activity-list card">${payments.length ? payments.map(paymentRow) : emptyState('No payments yet', 'Payments you make appear here.')}</div>
${pager('/payments', page, hasMore)}`)
}

export function paymentPage(session: Session, payment: Payment) {
  const pending = payment.status === 'pending'
  return customerLayout(session, '/payments', `Payment #${payment.id}`, html`
<section class="receipt" ${pending ? html`data-poll="${url(`/payments/${payment.id}/status.json`)}"` : ''} aria-live="polite">
  ${pending ? html`<noscript><meta http-equiv="refresh" content="5"></noscript>` : ''}
  <div class="receipt-icon ${payment.status}">${icon(pending ? 'phone' : payment.status === 'completed' ? 'check' : 'x', 30)}</div>
  ${pending ? html`<p class="eyebrow dark">CHECK YOUR PHONE</p><h1>Approve the prompt on ${payment.phone}</h1>
    <p class="receipt-copy">Enter your mobile money PIN on your phone to confirm. This page updates when ${provider.label} confirms the payment.</p><div class="pulse" aria-hidden="true"></div>`
  : payment.status === 'completed' ? html`<p class="eyebrow dark">PAID AND SETTLED</p><h1>That bill is done.</h1>`
  : html`<p class="eyebrow dark">PAYMENT NOT COMPLETED</p><h1>Nothing was charged.</h1><p class="receipt-copy">${payment.failure_reason ?? 'The payment was not approved.'}</p>`}
  <dl class="receipt-lines">
    <div><dt>Status</dt><dd>${statusPill(payment.status)}</dd></div>
    <div><dt>Biller</dt><dd>${payment.biller}</dd></div>
    <div><dt>Account</dt><dd>${payment.reference}</dd></div>
    <div><dt>Amount</dt><dd><strong>${formatMoney(payment.amount_minor, payment.currency)}</strong></dd></div>
    <div><dt>Paid from</dt><dd>${payment.phone}</dd></div>
    <div><dt>Date</dt><dd>${formatDate(payment.created_at)}</dd></div>
    ${payment.provider_transaction_id ? html`<div><dt>Provider ref.</dt><dd class="mono">${payment.provider_transaction_id}</dd></div>` : ''}
  </dl>
  <div class="receipt-actions">
    ${pending ? html`<a class="button ghost" href="${url(`/payments/${payment.id}`)}">${icon('refresh', 16)} Check now</a>` : ''}
    ${payment.status === 'failed' ? html`<a class="button" href="${url('/')}">Try again</a>` : html`<a class="button ${pending ? 'ghost' : ''}" href="${url('/')}">Back home</a>`}
  </div>
</section>`)
}
