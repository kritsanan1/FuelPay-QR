import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  QrCode, 
  CreditCard, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Loader2, 
  RefreshCw,
  History,
  Receipt,
  Phone,
  Play
} from "lucide-react";

interface PaymentPanelProps {
  transaction: any;
  onShowHistory: () => void;
  onShowReceipt: () => void;
}

export default function PaymentPanel({ 
  transaction, 
  onShowHistory, 
  onShowReceipt 
}: PaymentPanelProps) {
  const [paymentStatus, setPaymentStatus] = useState<'waiting' | 'processing' | 'success' | 'failed'>('waiting');
  const [countdown, setCountdown] = useState(30);
  const [progressValue, setProgressValue] = useState(0);
  const { toast } = useToast();

  // Check payment status mutation
  const checkPaymentMutation = useMutation({
    mutationFn: (transactionId: string) => apiRequest('GET', `/api/check-payment/${transactionId}`),
    onSuccess: (response: any) => {
      setPaymentStatus(response.paymentStatus);
      if (response.paymentStatus === 'success') {
        toast({
          title: "ชำระเงินสำเร็จ!",
          description: "สามารถเริ่มจ่ายน้ำมันได้แล้ว",
          className: "bg-success-green text-white"
        });
      } else if (response.paymentStatus === 'failed') {
        toast({
          title: "การชำระเงินล้มเหลว",
          description: "กรุณาลองใหม่อีกครั้ง",
          variant: "destructive"
        });
      }
    }
  });

  // Start dispensing mutation
  const startDispensingMutation = useMutation({
    mutationFn: (transactionId: string) => apiRequest('POST', `/api/start-dispensing/${transactionId}`),
    onSuccess: () => {
      toast({
        title: "เริ่มจ่ายน้ำมันแล้ว",
        description: "กรุณาไปที่หัวจ่ายเพื่อรับน้ำมัน",
        className: "bg-success-green text-white"
      });
    }
  });

  // Auto-check payment status when transaction is created
  useEffect(() => {
    if (transaction?.transactionId && paymentStatus === 'waiting') {
      setPaymentStatus('processing');
      
      const interval = setInterval(() => {
        checkPaymentMutation.mutate(transaction.transactionId);
      }, 3000); // Check every 3 seconds

      const countdownInterval = setInterval(() => {
        setCountdown(prev => {
          const newValue = prev - 1;
          setProgressValue(((30 - newValue) / 30) * 100);
          
          if (newValue <= 0) {
            clearInterval(interval);
            clearInterval(countdownInterval);
            if (paymentStatus === 'processing') {
              setPaymentStatus('failed');
            }
          }
          return newValue;
        });
      }, 1000);

      return () => {
        clearInterval(interval);
        clearInterval(countdownInterval);
      };
    }
  }, [transaction?.transactionId]);

  // Update payment status from transaction prop
  useEffect(() => {
    if (transaction?.paymentStatus) {
      setPaymentStatus(transaction.paymentStatus);
    }
  }, [transaction?.paymentStatus]);

  const handleStartDispensing = () => {
    if (transaction?.transactionId) {
      startDispensingMutation.mutate(transaction.transactionId);
    }
  };

  const handleRetryPayment = () => {
    setPaymentStatus('waiting');
    setCountdown(30);
    setProgressValue(0);
  };

  const getStatusIcon = () => {
    switch (paymentStatus) {
      case 'waiting':
        return <Clock className="w-8 h-8 text-gray-400" />;
      case 'processing':
        return <Loader2 className="w-8 h-8 text-warning-yellow animate-spin" />;
      case 'success':
        return <CheckCircle className="w-8 h-8 text-success-green" />;
      case 'failed':
        return <XCircle className="w-8 h-8 text-red-500" />;
      default:
        return <Clock className="w-8 h-8 text-gray-400" />;
    }
  };

  const getStatusText = () => {
    switch (paymentStatus) {
      case 'waiting':
        return {
          title: 'รอการชำระเงิน',
          description: 'กรุณาสแกน QR Code เพื่อชำระเงิน'
        };
      case 'processing':
        return {
          title: 'กำลังตรวจสอบ...',
          description: 'รอสักครู่ ระบบกำลังตรวจสอบการชำระเงิน'
        };
      case 'success':
        return {
          title: 'ชำระเงินสำเร็จ!',
          description: 'สามารถจ่ายน้ำมันได้แล้ว'
        };
      case 'failed':
        return {
          title: 'การชำระเงินล้มเหลว',
          description: 'กรุณาลองใหม่อีกครั้ง'
        };
      default:
        return {
          title: 'รอการชำระเงิน',
          description: 'กรุณาสแกน QR Code เพื่อชำระเงิน'
        };
    }
  };

  const statusInfo = getStatusText();

  return (
    <div className="space-y-6">
      {/* QR Code Display */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <QrCode className="text-deep-blue mr-2" />
            QR Code สำหรับชำระเงิน
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center">
            {transaction?.qrCodeUrl ? (
              <motion.div
                initial={{ scale: 0, rotate: 0 }}
                animate={{ scale: 1, rotate: 360 }}
                transition={{ duration: 1, ease: "easeOut" }}
              >
                <div className="bg-white p-4 rounded-xl border-2 border-gray-200 mb-4 shadow-lg">
                  <img 
                    src={transaction.qrCodeUrl} 
                    alt="QR Code" 
                    className="w-full max-w-64 mx-auto rounded-lg"
                  />
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-2">สแกน QR Code ด้วยแอปธนาคาร</p>
                  <div className="flex justify-center space-x-2 mb-4">
                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">PromptPay</span>
                    <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">ทุกธนาคาร</span>
                  </div>
                  <p className="text-xs text-gray-500">
                    จำนวนเงิน: <span className="font-bold text-energy-orange">{transaction.amount} ฿</span>
                  </p>
                </div>
              </motion.div>
            ) : (
              <div className="bg-gray-100 rounded-xl p-8 mb-4">
                <QrCode className="text-6xl text-gray-400 mb-4 mx-auto" />
                <p className="text-gray-500 font-medium">QR Code จะแสดงที่นี่</p>
                <p className="text-sm text-gray-400 mt-2">เมื่อคุณเลือกน้ำมันและจำนวนเงินแล้ว</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Payment Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <CreditCard className="text-success-green mr-2" />
            สถานะการชำระเงิน
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center">
            <motion.div
              key={paymentStatus}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="mb-4"
            >
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3 bg-gray-50">
                {getStatusIcon()}
              </div>
              <p className="font-semibold text-lg mb-1">{statusInfo.title}</p>
              <p className="text-sm text-gray-500">{statusInfo.description}</p>
            </motion.div>

            {/* Action Buttons */}
            {paymentStatus === 'success' && (
              <Button
                onClick={handleStartDispensing}
                disabled={startDispensingMutation.isPending}
                className="bg-success-green hover:bg-success-green/90 text-white font-bold py-3 px-6 rounded-lg touch-target"
              >
                {startDispensingMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Play className="mr-2 h-4 w-4" />
                )}
                เริ่มจ่ายน้ำมัน
              </Button>
            )}

            {paymentStatus === 'failed' && (
              <Button
                onClick={handleRetryPayment}
                className="bg-energy-orange hover:bg-energy-orange/90 text-white font-bold py-3 px-6 rounded-lg touch-target"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                ลองชำระใหม่
              </Button>
            )}

            {/* Progress Bar for Processing */}
            {paymentStatus === 'processing' && (
              <div className="mt-4">
                <Progress value={progressValue} className="mb-2" />
                <p className="text-xs text-gray-500">
                  กำลังตรวจสอบ... <span className="font-bold">{countdown}</span> วินาที
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>เมนูด่วน</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Button
              onClick={onShowHistory}
              variant="outline"
              className="w-full bg-deep-blue hover:bg-deep-blue/90 text-white border-deep-blue font-medium py-3 touch-target"
            >
              <History className="mr-2 h-4 w-4" />
              ประวัติการทำรายการ
            </Button>
            
            <Button
              onClick={onShowReceipt}
              disabled={paymentStatus !== 'success'}
              variant="outline"
              className="w-full font-medium py-3 touch-target disabled:opacity-50"
            >
              <Receipt className="mr-2 h-4 w-4" />
              พิมพ์ใบเสร็จ
            </Button>
            
            <Button
              variant="outline"
              className="w-full bg-warning-yellow hover:bg-warning-yellow/90 text-dark border-warning-yellow font-medium py-3 touch-target"
            >
              <Phone className="mr-2 h-4 w-4" />
              ติดต่อเจ้าหน้าที่
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
