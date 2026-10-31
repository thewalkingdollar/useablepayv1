import type { Session } from '../auth.ts'
import { url } from '../config.ts'
import { formatMoney } from '../money.ts'
import type { Payment } from '../payments.ts'
import { billerIcon, html, icon } from './html.ts'
import { adminLayout, csrfField } from './layout.ts'
import type { Biller } from './customer.ts'
import { emptyState, formatDate, pager, statusPill } from './shared.ts'

export type Overview = {
  volumeMinor: number
  todayMinor: number
  completed: number
  pending: number
  failed: number
  customers: number
  daily: { day: string, total: number }[]
}

function paymentsTable(session: Session, payments: Payment[]) {
  if (!payments.length) return emptyState('No payments found', 'Payments matching this view appear here.')
  return html`<div class="table-wrap"><table>
    <thead><tr><th scope="col">#</th><th scope="col">Customer</th><th scope="col">Biller</th><th scope="col">Account</th><th scope="col" class="num">Amount</th><th scope="col">Status</th><th scope="col">Date</th><th scope="col"><span class="sr-only">Actions</span></th></tr></thead>
    <tbody>${payments.map((p) => html`<tr>
      <td class="mono">${p.id}</td>
      <td><strong>${p.customer_name}</strong><small>${p.customer_email}</small></td>
      <td><span class="cell-biller">${billerIcon(p.biller, 16)} ${p.biller}</span></td>
      <td class="mono">${p.reference}<small>${p.phone}</small></td>
      <td class="num mono">${formatMoney(p.amount_minor, p.currency)}</td>
      <td>${statusPill(p.status)}${p.failure_reason ? html`<small>${p.failure_reason}</small>` : ''}</td>
      <td>${formatDate(p.created_at)}</td>
      <td>${p.status === 'pending' ? html`<form method="post" action="${url(`/admin/payments/${p.id}/refresh`)}">${csrfField(session)}<button class="icon-button" aria-label="Check status of payment ${p.id}" title="Check with provider">${icon('refresh', 16)}</button></form>` : ''}</td>
    </tr>`)}</tbody>
  </table></div>`
}

export function overviewPage(session: Session, o: Overview, recent: Payment[]) {
  const max = Math.max(1, ...o.daily.map((d) => d.total))
  return adminLayout(session, '/admin', 'Overview', html`
<header class="console-head"><div><p class="eyebrow dark">OPERATOR CONSOLE</p><h1>Overview</h1></div></header>
<section class="stats" aria-label="Key figures">
  <article class="stat feature"><span>Settled volume</span><strong>${formatMoney(o.volumeMinor)}</strong><small>${formatMoney(o.todayMinor)} today</small></article>
  <article class="stat"><span>Completed</span><strong>${o.completed}</strong><small>payments</small></article>
  <article class="stat"><span>Awaiting approval</span><strong>${o.pending}</strong><small><a href="${url('/admin/payments?status=pending')}">Review pending</a></small></article>
  <article class="stat"><span>Failed</span><strong>${o.failed}</strong><small>declined or timed out</small></article>
  <article class="stat"><span>Customers</span><strong>${o.customers}</strong><small><a href="${url('/admin/customers')}">View all</a></small></article>
</section>
<section class="panel">
  <div class="panel-head"><h2>Settled volume, last 14 days</h2></div>
  <div class="bars" role="img" aria-label="Daily settled volume for the last 14 days">
    ${o.daily.map((d) => html`<div class="bar" title="${d.day}: ${formatMoney(d.total)}"><span style="height:${Math.round((d.total / max) * 100)}%"></span><small>${d.day.slice(8)}</small></div>`)}
  </div>
</section>
<section class="panel">
  <div class="panel-head"><h2>Latest payments</h2><a class="text-button" href="${url('/admin/payments')}">All payments ${icon('arrow', 15)}</a></div>
  ${paymentsTable(session, recent)}
</section>`)
}

export function paymentsPage(session: Session, payments: Payment[], filters: { status: string, q: string }, page: number, hasMore: boolean) {
  const tabs = [['', 'All'], ['pending', 'Awaiting approval'], ['completed', 'Completed'], ['failed', 'Failed']]
  return adminLayout(session, '/admin/payments', 'Payments', html`
<header class="console-head"><div><p class="eyebrow dark">OPERATOR CONSOLE</p><h1>Payments</h1></div></header>
<form class="filters" method="get" action="${url('/admin/payments')}">
  <div class="tabs" role="group" aria-label="Filter by status">
    ${tabs.map(([value, label]) => html`<label class="tab"><input type="radio" name="status" value="${value}" ${filters.status === value ? html`checked` : ''} data-autosubmit>${label}</label>`)}
  </div>
  <label class="search"><span class="sr-only">Search payments</span><input type="search" name="q" value="${filters.q}" placeholder="Search account, phone, email"></label>
  <button class="button small">Apply</button>
</form>
<section class="panel">${paymentsTable(session, payments)}</section>
${pager('/admin/payments', page, hasMore, filters)}`)
}

export function customersPage(session: Session, customers: { id: number, name: string, email: string, phone: string, role: string, created_at: Date, payments: number, total: number }[]) {
  return adminLayout(session, '/admin/customers', 'Customers', html`
<header class="console-head"><div><p class="eyebrow dark">OPERATOR CONSOLE</p><h1>Customers</h1></div></header>
<section class="panel">${customers.length ? html`<div class="table-wrap"><table>
  <thead><tr><th scope="col">Name</th><th scope="col">Mobile money</th><th scope="col">Joined</th><th scope="col" class="num">Completed</th><th scope="col" class="num">Total paid</th></tr></thead>
  <tbody>${customers.map((c) => html`<tr>
    <td><strong>${c.name} ${c.role === 'admin' ? html`<span class="tag">Operator</span>` : ''}</strong><small>${c.email}</small></td>
    <td class="mono">${c.phone}</td>
    <td>${formatDate(c.created_at)}</td>
    <td class="num mono">${c.payments}</td>
    <td class="num mono">${formatMoney(c.total)}</td>
  </tr>`)}</tbody>
</table></div>` : emptyState('No customers yet', 'People who create an account appear here.')}</section>`)
}

export function billersPage(session: Session, billers: (Biller & { payments: number })[], error = '') {
  return adminLayout(session, '/admin/billers', 'Billers', html`
<header class="console-head"><div><p class="eyebrow dark">OPERATOR CONSOLE</p><h1>Billers</h1></div></header>
<div class="split">
  <section class="panel">
    <div class="panel-head"><h2>Available billers</h2></div>
    <ul class="biller-list">${billers.map((b) => html`<li>
      <span class="activity-icon ${b.name.toLowerCase()}">${billerIcon(b.name)}</span>
      <div><strong>${b.name}</strong><small>${b.category} · ${b.payments} payments</small></div>
      <span class="tag ${b.active ? 'on' : ''}">${b.active ? 'Active' : 'Hidden'}</span>
      <form method="post" action="${url(`/admin/billers/${b.id}/toggle`)}">${csrfField(session)}<button class="button small ghost">${b.active ? 'Hide' : 'Enable'}</button></form>
    </li>`)}</ul>
  </section>
  <form class="panel form-panel" method="post" action="${url('/admin/billers')}">
    ${csrfField(session)}
    <div class="panel-head"><h2>Add a biller</h2></div>
    ${error ? html`<p class="form-error" role="alert">${error}</p>` : ''}
    <label>Name<input name="name" minlength="2" maxlength="40" required></label>
    <label>Category
      <select name="category"><option value="utility">Utility</option><option value="telecom">Telecom</option><option value="education">Education</option><option value="government">Government</option><option value="other">Other</option></select>
    </label>
    <button class="button">Add biller</button>
  </form>
</div>`)
}
