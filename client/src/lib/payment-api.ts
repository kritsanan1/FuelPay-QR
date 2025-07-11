import { apiRequest } from './queryClient';

export interface CreateTransactionRequest {
  pumpId: number;
  fuelTypeId: number;
  amount: string;
  volume?: string;
  inputMode: 'amount' | 'volume';
}

export interface CreateTransactionResponse {
  transactionId: string;
  qrCodeUrl: string;
  amount: string;
  volume: string;
  promptPayReference: string;
}

export interface PaymentStatusResponse {
  paymentStatus: 'pending' | 'processing' | 'success' | 'failed' | 'cancelled';
  transactionStatus: 'pending' | 'completed' | 'cancelled' | 'dispensing';
  transactionId: string;
}

export interface Transaction {
  id: number;
  transactionId: string;
  pumpId: number;
  fuelTypeId: number;
  amount: string;
  volume: string;
  pricePerLiter: string;
  paymentStatus: string;
  transactionStatus: string;
  qrCodeUrl?: string;
  promptPayReference?: string;
  receiptNumber?: string;
  createdAt: string;
  updatedAt: string;
  pump: {
    id: number;
    number: number;
    isActive: boolean;
    isOnline: boolean;
  };
  fuelType: {
    id: number;
    type: string;
    name: string;
    pricePerLiter: string;
    isActive: boolean;
  };
}

export class PaymentAPI {
  static async createTransaction(request: CreateTransactionRequest): Promise<CreateTransactionResponse> {
    const response = await apiRequest('POST', '/api/generate-qr', request);
    return response.json();
  }

  static async checkPaymentStatus(transactionId: string): Promise<PaymentStatusResponse> {
    const response = await apiRequest('GET', `/api/check-payment/${transactionId}`);
    return response.json();
  }

  static async startDispensing(transactionId: string): Promise<{ message: string; transactionId: string }> {
    const response = await apiRequest('POST', `/api/start-dispensing/${transactionId}`);
    return response.json();
  }

  static async completeDispensing(transactionId: string, actualVolume: string): Promise<{ message: string; transactionId: string; actualVolume: string; receiptNumber: string }> {
    const response = await apiRequest('POST', `/api/complete-dispensing/${transactionId}`, { actualVolume });
    return response.json();
  }

  static async getTransactions(limit: number = 10): Promise<Transaction[]> {
    const response = await apiRequest('GET', `/api/transactions?limit=${limit}`);
    return response.json();
  }

  static async getTransaction(transactionId: string): Promise<Transaction> {
    const response = await apiRequest('GET', `/api/transactions/${transactionId}`);
    return response.json();
  }

  static async getFuelTypes(): Promise<Array<{
    id: number;
    type: string;
    name: string;
    pricePerLiter: string;
    isActive: boolean;
  }>> {
    const response = await apiRequest('GET', '/api/fuel-types');
    return response.json();
  }

  static async getPumps(): Promise<Array<{
    id: number;
    number: number;
    isActive: boolean;
    isOnline: boolean;
  }>> {
    const response = await apiRequest('GET', '/api/pumps');
    return response.json();
  }

  static async initializeSystem(): Promise<{ message: string }> {
    const response = await apiRequest('POST', '/api/init');
    return response.json();
  }
}

// Helper functions for payment verification
export function isPaymentSuccessful(status: string): boolean {
  return status === 'success';
}

export function isPaymentPending(status: string): boolean {
  return status === 'pending' || status === 'processing';
}

export function isPaymentFailed(status: string): boolean {
  return status === 'failed' || status === 'cancelled';
}

export function canStartDispensing(paymentStatus: string, transactionStatus: string): boolean {
  return paymentStatus === 'success' && transactionStatus === 'pending';
}

export function isDispensing(transactionStatus: string): boolean {
  return transactionStatus === 'dispensing';
}

export function isCompleted(transactionStatus: string): boolean {
  return transactionStatus === 'completed';
}

// Format helpers
export function formatAmount(amount: string | number): string {
  return parseFloat(amount.toString()).toFixed(2);
}

export function formatVolume(volume: string | number): string {
  return parseFloat(volume.toString()).toFixed(3);
}

export function formatPricePerLiter(price: string | number): string {
  return parseFloat(price.toString()).toFixed(2);
}

export function calculateTotalAmount(volume: number, pricePerLiter: number): number {
  return volume * pricePerLiter;
}

export function calculateVolume(amount: number, pricePerLiter: number): number {
  return amount / pricePerLiter;
}
