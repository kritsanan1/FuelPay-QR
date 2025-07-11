import { apiRequest } from "./queryClient";

export class PaymentAPI {
  static async createStripePaymentIntent(amount: number, transactionId: string): Promise<{ clientSecret: string; paymentIntentId: string }> {
    const response = await apiRequest("POST", "/api/stripe/create-payment-intent", {
      amount,
      currency: "thb",
      transactionId,
    });
    return response.json();
  }

  static async confirmStripePayment(paymentIntentId: string): Promise<{ status: string; transactionId: string }> {
    const response = await apiRequest("POST", "/api/stripe/confirm-payment", {
      paymentIntentId,
    });
    return response.json();
  }

  static async checkPaymentStatus(transactionId: string): Promise<{ paymentStatus: string; transactionStatus: string; transactionId: string }> {
    const response = await apiRequest("GET", `/api/check-payment/${transactionId}`);
    return response.json();
  }

  static async generatePromptPayQR(transaction: any): Promise<{ qrCodeUrl: string; transactionId: string; amount: number; volume: number; promptPayReference: string }> {
    const response = await apiRequest("POST", "/api/generate-qr", {
      pumpId: transaction.pumpId,
      fuelTypeId: transaction.fuelTypeId,
      amount: transaction.amount,
      volume: transaction.volume,
    });
    return response.json();
  }

  static async startDispensing(transactionId: string): Promise<{ message: string; transactionId: string }> {
    const response = await apiRequest("POST", `/api/start-dispensing/${transactionId}`);
    return response.json();
  }

  static async completeDispensing(transactionId: string, actualVolume: string): Promise<{ message: string; transactionId: string; actualVolume: string; receiptNumber: string }> {
    const response = await apiRequest("POST", `/api/complete-dispensing/${transactionId}`, {
      actualVolume,
    });
    return response.json();
  }
}