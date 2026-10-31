import { config } from '../config.ts'
import { mtnMomo } from './mtn-momo.ts'
import { simulator } from './simulator.ts'

export const provider = config.PAYMENT_PROVIDER === 'mtn-momo' ? mtnMomo : simulator
export type { PaymentProvider } from './types.ts'
