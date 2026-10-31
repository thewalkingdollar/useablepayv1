export type PaymentRequest = {
  reference: string
  amount: string
  currency: string
  phone: string
  payerMessage: string
  payeeNote: string
}

export type ProviderResult = {
  status: 'pending' | 'completed' | 'failed'
  transactionId?: string
  reason?: string
}

export type PaymentProvider = {
  name: string
  label: string
  // Sends an approval prompt to the payer's phone; the payer approves with their own PIN on the device
  requestPayment(request: PaymentRequest): Promise<void>
  getStatus(reference: string): Promise<ProviderResult>
}
