import { createFileRoute, useRouter } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import { useState } from 'react'
import { ArrowDownLeft, ArrowUpRight, Bolt, Check, ChevronDown, Droplets, Eye, EyeOff, Fingerprint, Globe2, History, House, Menu, Phone, ReceiptText, ShieldCheck, Signal, Sparkles, Wifi, X } from 'lucide-react'
import { getWallet, makePayment } from '../server/payments.functions'

export const Route = createFileRoute('/')({ loader: () => getWallet(), component: Home })

const billers = [
  { name: 'Electricity', label: 'MEW Power', icon: Bolt, tone: 'lime' },
  { name: 'Water', label: 'Water bill', icon: Droplets, tone: 'blue' },
  { name: 'Internet', label: 'Home internet', icon: Wifi, tone: 'peach' },
  { name: 'Mobile', label: 'Mobile top-up', icon: Phone, tone: 'pink' },
] as const
type Biller = (typeof billers)[number]['name']
const money = (fils: number) => (fils / 1000).toLocaleString('en-KW', { minimumFractionDigits: 3, maximumFractionDigits: 3 })

function Home() {
  const wallet = Route.useLoaderData()
  const router = useRouter()
  const pay = useServerFn(makePayment)
  const [balanceVisible, setBalanceVisible] = useState(true)
  const [selected, setSelected] = useState<Biller>('Electricity')
  const [amount, setAmount] = useState('18.750')
  const [reference, setReference] = useState('4098 2167')
  const [phone, setPhone] = useState('+965 5501 8842')
  const [sheet, setSheet] = useState<'closed' | 'pin' | 'success'>('closed')
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const amountFils = Math.round(Number(amount) * 1000)
  const valid = Number.isFinite(amountFils) && amountFils >= 100 && reference.trim().length >= 3 && phone.replace(/\D/g, '').length >= 8

  async function confirmPayment() {
    if (pin.length !== 4) return
    setSubmitting(true); setError('')
    try {
      await pay({ data: { biller: selected, reference, phone, amountFils, pin } })
      setSheet('success'); await router.invalidate()
    } catch { setError('Payment could not be completed. Please try again.') }
    finally { setSubmitting(false) }
  }

  return <main className="app-shell">
    <header className="topbar">
      <a className="brand" href="#top" aria-label="UseablePay home"><span className="brand-mark"><span /></span><span>useable<span className="brand-accent">pay</span></span></a>
      <nav className="desktop-nav" aria-label="Primary navigation"><a className="active" href="#top"><House size={16} /> Home</a><a href="#pay"><ReceiptText size={16} /> Pay bills</a><a href="#activity"><History size={16} /> Activity</a></nav>
      <div className="profile"><div className="avatar">NA</div><div><strong>Noura A.</strong><small>Good morning</small></div><ChevronDown size={16} /></div>
      <button className="menu-button" aria-label="Open menu"><Menu /></button>
    </header>

    <section className="hero" id="top">
      <div className="hero-copy"><p className="eyebrow"><Sparkles size={15} /> YOUR MONEY, MADE USEABLE</p><h1>Tap the bill.<br /><em>Pay it.</em> Move on.</h1><p className="hero-sub">From electricity to your phone plan, settle any bill with mobile money in a few calm taps.</p><div className="trust-row"><span><ShieldCheck size={18} /> PIN-secured</span><span><Signal size={18} /> Instant confirmation</span><span><Globe2 size={18} /> Built for Kuwait</span></div></div>
      <div className="wallet-card-wrap"><div className="orbit orbit-one" /><div className="orbit orbit-two" /><div className="coin coin-a">U</div><div className="coin coin-b">U</div>
        <article className="wallet-card"><div className="wallet-top"><span className="mini-brand"><span className="brand-mark tiny"><span /></span> useablecoin</span><Fingerprint size={29} /></div><p>Available balance <button onClick={() => setBalanceVisible(!balanceVisible)} aria-label="Toggle balance">{balanceVisible ? <Eye size={17} /> : <EyeOff size={17} />}</button></p><h2>{balanceVisible ? money(wallet.balanceFils) : '••••••'} <small>UC</small></h2><div className="rate"><span>1 UseableCoin</span><strong>= KWD 1.000</strong></div><div className="card-bottom"><span>•••• 2048</span><span className="contactless">)))</span></div></article>
      </div>
    </section>

    <section className="pay-section" id="pay">
      <div className="section-heading"><div><p className="eyebrow dark">ONE TAP AWAY</p><h2>What are we paying today?</h2></div><span className="step-pill">01 / Choose a bill</span></div>
      <div className="pay-grid"><div className="biller-picker"><div className="biller-grid">{billers.map(({ name, label, icon: Icon, tone }) => <button key={name} className={`biller ${tone} ${selected === name ? 'selected' : ''}`} onClick={() => setSelected(name)}><span className="biller-icon"><Icon /></span><strong>{name}</strong><small>{label}</small>{selected === name && <span className="selected-dot"><Check size={12} /></span>}</button>)}</div><div className="more-billers"><span>More billers arrive every month</span><span>School fees</span><span>Subscriptions</span><span>Government</span></div></div>
        <form className="payment-panel" onSubmit={(e) => { e.preventDefault(); if (valid) setSheet('pin') }}><div className="panel-top"><div><span className="panel-kicker">PAYING</span><strong>{selected}</strong></div><div className="live-dot"><span /> Live</div></div><label>Bill / account number<input value={reference} onChange={(e) => setReference(e.target.value)} inputMode="numeric" required /></label><label>Mobile money number<input value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" required /></label><label>Amount</label><div className="amount-input"><span>KWD</span><input value={amount} onChange={(e) => setAmount(e.target.value)} inputMode="decimal" aria-label="Amount in Kuwaiti dinar" /><small>= {Number(amount || 0).toFixed(3)} UC</small></div><button className="pay-button" type="submit" disabled={!valid}>Tap to pay <ArrowUpRight size={20} /></button><p className="fine-print"><ShieldCheck size={14} /> A mobile money PIN is requested securely on the next step.</p></form>
      </div>
    </section>

    <section className="activity-section" id="activity"><div className="section-heading compact"><div><p className="eyebrow dark">YOUR RECENT MOVES</p><h2>Clear at a glance.</h2></div><button className="text-button">View all <ArrowUpRight size={16} /></button></div><div className="activity-list">{wallet.recent.length ? wallet.recent.map((item) => { const itemBiller = billers.find((b) => b.name === item.biller) || billers[0]; const Icon = itemBiller.icon; return <div className="activity-row" key={item.id}><span className={`activity-icon ${itemBiller.tone}`}><Icon /></span><div><strong>{item.biller}</strong><small>{item.reference} · Completed</small></div><time>{new Date(item.createdAt).toLocaleDateString('en-KW', { day: 'numeric', month: 'short' })}</time><b>− {money(item.amountFils)} UC</b></div> }) : <div className="empty-activity"><span><ArrowDownLeft /></span><div><strong>Your first payment lands here</strong><p>Choose a bill above to start your UseablePay activity.</p></div></div>}</div></section>
    <footer><div className="brand footer-brand"><span className="brand-mark"><span /></span>useable<span className="brand-accent">pay</span></div><p>Money that keeps up with real life.</p><span>UseableCoin = KWD 1.000</span></footer>

    {sheet !== 'closed' && <div className="modal-backdrop" role="presentation" onMouseDown={(e) => { if (e.target === e.currentTarget && !submitting) setSheet('closed') }}><section className="pin-sheet" role="dialog" aria-modal="true" aria-label={sheet === 'success' ? 'Payment successful' : 'Confirm payment'}><button className="close-button" onClick={() => setSheet('closed')} aria-label="Close"><X /></button>{sheet === 'pin' ? <><div className="pin-icon"><Fingerprint /></div><p className="eyebrow dark">MOBILE MONEY APPROVAL</p><h2>Confirm {money(amountFils)} KWD</h2><p className="sheet-copy">Enter the 4-digit PIN for <strong>{phone}</strong>. Your PIN is used for this approval only and is never stored.</p><div className="pin-dots" aria-label={`${pin.length} of 4 PIN digits entered`}>{[0,1,2,3].map((n) => <span className={pin.length > n ? 'filled' : ''} key={n} />)}</div><div className="keypad">{[1,2,3,4,5,6,7,8,9].map((n) => <button key={n} onClick={() => pin.length < 4 && setPin(pin + n)}>{n}</button>)}<span /><button onClick={() => pin.length < 4 && setPin(pin + '0')}>0</button><button onClick={() => setPin(pin.slice(0, -1))} aria-label="Delete digit">⌫</button></div>{error && <p className="form-error">{error}</p>}<button className="confirm-button" disabled={pin.length !== 4 || submitting} onClick={confirmPayment}>{submitting ? 'Confirming securely…' : 'Confirm payment'}</button><p className="demo-note">Demo mode · use any four digits</p></> : <div className="success-state"><div className="success-check"><Check /></div><p className="eyebrow dark">PAID AND SETTLED</p><h2>That bill is done.</h2><p>{money(amountFils)} KWD was converted 1:1 to UseableCoin and paid to {selected}.</p><div className="receipt-line"><span>UseableCoin used</span><strong>{money(amountFils)} UC</strong></div><button className="confirm-button" onClick={() => { setSheet('closed'); setPin('') }}>Back home</button></div>}</section></div>}
  </main>
}
