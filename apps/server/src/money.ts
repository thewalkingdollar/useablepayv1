import { config } from './config.ts'

const factor = 10 ** config.CURRENCY_DECIMALS

export const toMinor = (major: number) => Math.round(major * factor)

export const formatAmount = (minor: number) => (minor / factor).toFixed(config.CURRENCY_DECIMALS)

export const formatMoney = (minor: number, currency = config.APP_CURRENCY) =>
  `${currency} ${(minor / factor).toLocaleString('en-US', { minimumFractionDigits: config.CURRENCY_DECIMALS, maximumFractionDigits: config.CURRENCY_DECIMALS })}`

export const minAmountMinor = toMinor(0.1)
export const maxAmountMinor = toMinor(500)
