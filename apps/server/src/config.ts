import { z } from 'zod'

const envSchema = z.object({
  PUBLIC_URL: z.url().default('http://localhost:3100/useablepay'),
  HOST: z.string().default('127.0.0.1'),
  PORT: z.coerce.number().int().default(3100),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  ADMIN_EMAILS: z.string().default(''),
  APP_CURRENCY: z.string().length(3).default('KWD'),
  CURRENCY_DECIMALS: z.coerce.number().int().min(0).max(3).default(3),
  PAYMENT_PROVIDER: z.enum(['simulator', 'mtn-momo']).default('simulator'),
  MOMO_BASE_URL: z.url().default('https://sandbox.momodeveloper.mtn.com'),
  MOMO_TARGET_ENVIRONMENT: z.string().default('sandbox'),
  MOMO_SUBSCRIPTION_KEY: z.string().default(''),
  MOMO_API_USER: z.string().default(''),
  MOMO_API_KEY: z.string().default(''),
  MOMO_SEND_CALLBACK: z.stringbool().default(false),
})

const parsed = envSchema.safeParse(process.env)
if (!parsed.success) {
  console.error('Invalid configuration:\n' + z.prettifyError(parsed.error))
  process.exit(1)
}
const env = parsed.data

const publicUrl = new URL(env.PUBLIC_URL)
const basePath = publicUrl.pathname.replace(/\/+$/, '')

if (env.PAYMENT_PROVIDER === 'mtn-momo' && (!env.MOMO_SUBSCRIPTION_KEY || !env.MOMO_API_USER || !env.MOMO_API_KEY)) {
  console.error('PAYMENT_PROVIDER=mtn-momo needs MOMO_SUBSCRIPTION_KEY, MOMO_API_USER and MOMO_API_KEY')
  process.exit(1)
}

export const config = {
  ...env,
  origin: publicUrl.origin,
  basePath,
  publicUrl: publicUrl.origin + basePath,
  secureCookies: publicUrl.protocol === 'https:',
  adminEmails: env.ADMIN_EMAILS.split(',').map((e) => e.trim().toLowerCase()).filter(Boolean),
}

export const url = (path = '/') => config.basePath + path
