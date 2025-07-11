import { useState, useEffect } from "react";
import { useStripe, useElements, PaymentElement, Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, CreditCard } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

if (!import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
  throw new Error('Missing required Stripe key: VITE_STRIPE_PUBLIC_KEY');
}

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

interface StripePaymentFormProps {
  transaction: any;
  onPaymentSuccess: () => void;
  onPaymentError: (error: string) => void;
}

function StripePaymentForm({ transaction, onPaymentSuccess, onPaymentError }: StripePaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: window.location.origin,
        },
        redirect: 'if_required'
      });

      if (error) {
        onPaymentError(error.message || "Payment failed");
        toast({
          title: "การชำระเงินล้มเหลว",
          description: error.message,
          variant: "destructive",
        });
      } else {
        onPaymentSuccess();
        toast({
          title: "การชำระเงินสำเร็จ",
          description: "กำลังเริ่มจ่ายน้ำมัน",
        });
      }
    } catch (err: any) {
      onPaymentError(err.message || "Payment failed");
      toast({
        title: "การชำระเงินล้มเหลว",
        description: "เกิดข้อผิดพลาดในระบบ",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />
      <Button 
        type="submit" 
        disabled={!stripe || !elements || isLoading}
        className="w-full bg-[#FF6B35] hover:bg-[#E55A2B] text-white"
        size="lg"
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin mr-2" />
        ) : (
          <CreditCard className="w-4 h-4 mr-2" />
        )}
        ชำระเงิน ฿{parseFloat(transaction.amount).toFixed(2)}
      </Button>
    </form>
  );
}

interface StripePaymentProps {
  transaction: any;
  onPaymentSuccess: () => void;
  onPaymentError: (error: string) => void;
}

export default function StripePayment({ transaction, onPaymentSuccess, onPaymentError }: StripePaymentProps) {
  const [clientSecret, setClientSecret] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const createPaymentIntent = async () => {
      try {
        const response = await apiRequest("POST", "/api/stripe/create-payment-intent", {
          amount: parseFloat(transaction.amount),
          currency: "thb",
          transactionId: transaction.transactionId
        });

        const data = await response.json();
        setClientSecret(data.clientSecret);
      } catch (error: any) {
        onPaymentError(error.message || "Failed to initialize payment");
      } finally {
        setIsLoading(false);
      }
    };

    if (transaction?.transactionId) {
      createPaymentIntent();
    }
  }, [transaction, onPaymentError]);

  if (isLoading) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin mr-2" />
            กำลังเตรียมการชำระเงิน
          </CardTitle>
        </CardHeader>
      </Card>
    );
  }

  if (!clientSecret) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="text-red-600">เกิดข้อผิดพลาด</CardTitle>
        </CardHeader>
        <CardContent>
          <p>ไม่สามารถเตรียมการชำระเงินได้</p>
        </CardContent>
      </Card>
    );
  }

  const appearance = {
    theme: 'stripe' as const,
    variables: {
      colorPrimary: '#FF6B35',
      colorBackground: '#ffffff',
      colorText: '#30313d',
      colorDanger: '#df1b41',
      fontFamily: 'Ideal Sans, system-ui, sans-serif',
      spacingUnit: '4px',
      borderRadius: '8px',
    },
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-center">
          <CreditCard className="w-6 h-6 mx-auto mb-2" />
          ชำระด้วยบัตรเครดิต
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Elements stripe={stripePromise} options={{ clientSecret, appearance }}>
          <StripePaymentForm 
            transaction={transaction}
            onPaymentSuccess={onPaymentSuccess}
            onPaymentError={onPaymentError}
          />
        </Elements>
      </CardContent>
    </Card>
  );
}