import { config, url } from '../config.ts'
import type { Session } from '../auth.ts'
import { provider } from '../providers/index.ts'
import { html, icon, type SafeHtml } from './html.ts'

const brand = html`<a class="brand" href="${url('/')}" aria-label="UseablePay home"><span class="brand-mark"><span></span></span><span>useable<span class="brand-accent">pay</span></span></a>`

function document(title: string, body: SafeHtml, bodyClass = '') {
  return html`<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title} · UseablePay</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Manrope:wght@400;500;600;700;800&family=Syne:wght@600;700;800&display=swap">
<link rel="stylesheet" href="${url('/assets/app.css')}">
<script src="${url('/assets/app.js')}" defer></script>
</head>
<body class="${bodyClass}">
<a class="skip-link" href="#main">Skip to content</a>
${body}
</body>
</html>`
}

export const csrfField = (session: Session) => html`<input type="hidden" name="_csrf" value="${session.csrfToken}">`

const initials = (name: string) => name.split(/\s+/).map((p) => p[0]).join('').slice(0, 2).toUpperCase()

function navLink(href: string, label: string, iconName: string, current: string) {
  const active = current === href
  return html`<a href="${url(href)}" class="${active ? 'active' : ''}" ${active ? html`aria-current="page"` : ''}>${icon(iconName, 17)}<span>${label}</span></a>`
}

const providerBadge = () =>
  provider.name === 'simulator' ? html`<span class="mode-badge" title="Set PAYMENT_PROVIDER=mtn-momo to take live payments">Simulator</span>` : html`<span class="mode-badge live">${provider.label} · ${config.MOMO_TARGET_ENVIRONMENT}</span>`

export function customerLayout(session: Session, current: string, title: string, content: SafeHtml) {
  const { user } = session
  return document(title, html`
<header class="topbar">
  ${brand}
  <nav class="main-nav" aria-label="Primary">
    ${navLink('/', 'Home', 'home', current)}
    ${navLink('/payments', 'Activity', 'history', current)}
    ${user.role === 'admin' ? navLink('/admin', 'Operator console', 'grid', current) : ''}
  </nav>
  <div class="profile">
    <span class="avatar" aria-hidden="true">${initials(user.name)}</span>
    <div><strong>${user.name}</strong><small>${user.phone}</small></div>
    <form method="post" action="${url('/logout')}">${csrfField(session)}<button class="icon-button" aria-label="Sign out">${icon('logout')}</button></form>
  </div>
</header>
${provider.name === 'simulator' ? html`<p class="sim-banner" role="note">${icon('shield', 15)} Simulator mode: no real money moves until a mobile money provider is connected.</p>` : ''}
<main id="main" class="page">${content}</main>`)
}

export function adminLayout(session: Session, current: string, title: string, content: SafeHtml) {
  return document(title, html`
<div class="console">
  <aside class="sidebar">
    ${brand}
    <p class="sidebar-label">Operator console</p>
    <nav aria-label="Operator">
      ${navLink('/admin', 'Overview', 'grid', current)}
      ${navLink('/admin/payments', 'Payments', 'receipt', current)}
      ${navLink('/admin/customers', 'Customers', 'users', current)}
      ${navLink('/admin/billers', 'Billers', 'building', current)}
    </nav>
    <div class="sidebar-foot">
      ${providerBadge()}
      <a href="${url('/')}">${icon('home', 16)} Customer view</a>
      <form method="post" action="${url('/logout')}">${csrfField(session)}<button>${icon('logout', 16)} Sign out</button></form>
    </div>
  </aside>
  <main id="main" class="console-main">${content}</main>
</div>`, 'console-body')
}

export function authLayout(title: string, content: SafeHtml) {
  return document(title, html`
<main id="main" class="auth-shell">
  <section class="auth-intro">
    ${brand}
    <p class="eyebrow">${icon('shield', 15)} YOUR MONEY, MADE USEABLE</p>
    <h1>Tap the bill.<br><em>Pay it.</em> Move on.</h1>
    <p>Settle electricity, water, internet and mobile bills from your mobile money wallet. You approve every payment on your own phone.</p>
  </section>
  <section class="auth-panel">${content}</section>
</main>`, 'auth-body')
}

export function messagePage(title: string, message: string) {
  return document(title, html`<main id="main" class="message-page"><div>${brand}<h1>${title}</h1><p>${message}</p><a class="button" href="${url('/')}">Back home</a></div></main>`)
}
