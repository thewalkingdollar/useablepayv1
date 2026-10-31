import { url } from '../config.ts'
import { html } from './html.ts'
import { authLayout } from './layout.ts'

export function loginPage(error = '', email = '') {
  return authLayout('Sign in', html`
<form class="auth-form" method="post" action="${url('/login')}">
  <h2>Welcome back</h2>
  <p class="muted">Sign in to pay bills and see your activity.</p>
  ${error ? html`<p class="form-error" role="alert">${error}</p>` : ''}
  <label>Email<input type="email" name="email" value="${email}" autocomplete="email" required autofocus></label>
  <label>Password<input type="password" name="password" autocomplete="current-password" required></label>
  <button class="pay-button">Sign in</button>
  <p class="switch">New to UseablePay? <a href="${url('/signup')}">Create an account</a></p>
</form>`)
}

export function signupPage(error = '', values: { name?: string, email?: string, phone?: string } = {}) {
  return authLayout('Create account', html`
<form class="auth-form" method="post" action="${url('/signup')}">
  <h2>Create your account</h2>
  <p class="muted">Use the number of the mobile money wallet you pay from.</p>
  ${error ? html`<p class="form-error" role="alert">${error}</p>` : ''}
  <label>Full name<input name="name" value="${values.name ?? ''}" autocomplete="name" minlength="2" maxlength="80" required></label>
  <label>Email<input type="email" name="email" value="${values.email ?? ''}" autocomplete="email" required></label>
  <label>Mobile money number<input name="phone" value="${values.phone ?? ''}" inputmode="tel" autocomplete="tel" placeholder="+256 7xx xxx xxx" required></label>
  <label>Password<input type="password" name="password" autocomplete="new-password" minlength="10" required><small>At least 10 characters.</small></label>
  <button class="pay-button">Create account</button>
  <p class="switch">Already have an account? <a href="${url('/login')}">Sign in</a></p>
</form>`)
}
