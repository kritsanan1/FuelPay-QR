import { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { motion } from "framer-motion";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  Fuel, 
  AlertTriangle, 
  StopCircle, 
  Droplets, 
  DollarSign,
  CheckCircle
} from "lucide-react";

interface DispensingModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: any;
}

export default function DispensingModal({ isOpen, onClose, transaction }: DispensingModalProps) {
  const [dispensedVolume, setDispensedVolume] = useState(0);
  const [isDispensing, setIsDispensing] = useState(true);
  const [dispensingProgress, setDispensingProgress] = useState(0);
  const { toast } = useToast();

  const targetVolume = transaction?.volume ? parseFloat(transaction.volume) : 0;

  // Complete dispensing mutation
  const completeDispensingMutation = useMutation({
    mutationFn: (data: { transactionId: string; actualVolume: string }) => 
      apiRequest('POST', `/api/complete-dispensing/${data.transactionId}`, { actualVolume: data.actualVolume }),
    onSuccess: () => {
      setIsDispensing(false);
      toast({
        title: "จ่ายน้ำมันเสร็จสิ้น",
        description: "ธุรกรรมเสร็จสมบูรณ์",
        className: "bg-success-green text-white"
      });
      setTimeout(() => {
        onClose();
      }, 2000);
    }
  });

  // Simulate fuel dispensing
  useEffect(() => {
    if (!isOpen || !transaction || !isDispensing) return;

    const dispensingRate = 0.15; // liters per 100ms (realistic rate)
    const interval = setInterval(() => {
      setDispensedVolume(prev => {
        const newVolume = prev + dispensingRate;
        const progress = Math.min((newVolume / targetVolume) * 100, 100);
        setDispensingProgress(progress);
        
        // Complete dispensing when target is reached
        if (newVolume >= targetVolume) {
          clearInterval(interval);
          completeDispensingMutation.mutate({
            transactionId: transaction.transactionId,
            actualVolume: targetVolume.toFixed(3)
          });
          return targetVolume;
        }
        
        return newVolume;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [isOpen, transaction, isDispensing, targetVolume]);

  const handleStopDispensing = () => {
    setIsDispensing(false);
    completeDispensingMutation.mutate({
      transactionId: transaction.transactionId,
      actualVolume: dispensedVolume.toFixed(3)
    });
  };

  const handleForceClose = () => {
    setIsDispensing(false);
    setDispensedVolume(0);
    setDispensingProgress(0);
    onClose();
  };

  if (!transaction) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleForceClose}>
      <DialogContent 
        className="max-w-lg p-0 bg-black/75 border-none"
        hideCloseButton
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white rounded-lg overflow-hidden"
        >
          {/* Header */}
          <div className={`${isDispensing ? 'bg-success-green' : 'bg-energy-orange'} text-white p-6 text-center`}>
            <motion.div
              animate={{ 
                rotate: isDispensing ? [0, 5, -5, 0] : 0,
                scale: isDispensing ? [1, 1.05, 1] : 1
              }}
              transition={{ 
                duration: 2, 
                repeat: isDispensing ? Infinity : 0,
                ease: "easeInOut"
              }}
            >
              {isDispensing ? (
                <Fuel className="w-10 h-10 mx-auto mb-3" />
              ) : (
                <CheckCircle className="w-10 h-10 mx-auto mb-3" />
              )}
            </motion.div>
            <h2 className="text-2xl font-bold">
              {isDispensing ? 'กำลังจ่ายน้ำมัน' : 'จ่ายน้ำมันเสร็จสิ้น'}
            </h2>
          </div>

          {/* Content */}
          <div className="p-8 text-center space-y-6">
            {/* Volume Display */}
            <div className="space-y-2">
              <motion.div 
                className="text-6xl font-bold text-success-green"
                animate={{ 
                  scale: isDispensing ? [1, 1.02, 1] : 1
                }}
                transition={{ 
                  duration: 1, 
                  repeat: isDispensing ? Infinity : 0 
                }}
              >
                {dispensedVolume.toFixed(2)}
              </motion.div>
              <div className="text-lg text-gray-600 flex items-center justify-center">
                <Droplets className="w-5 h-5 mr-1 text-blue-500" />
                ลิตร
              </div>
              
              {/* Progress Bar */}
              <div className="w-full max-w-sm mx-auto">
                <Progress 
                  value={dispensingProgress} 
                  className="h-3 mb-2"
                />
                <div className="text-sm text-gray-500">
                  {dispensingProgress.toFixed(1)}% จาก {targetVolume.toFixed(2)} ลิตร
                </div>
              </div>
            </div>
            
            {/* Transaction Details */}
            <Card className="bg-gray-50">
              <CardContent className="p-4 space-y-2">
                <div className="flex justify-between">
                  <span>ประเภทน้ำมัน:</span>
                  <span className="font-semibold">{transaction.fuelType?.name || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span>หัวจ่าย:</span>
                  <span className="font-semibold">หัวจ่าย {transaction.pump?.number || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span>ยอดเงินที่จ่าย:</span>
                  <span className="font-semibold text-energy-orange flex items-center">
                    <DollarSign className="w-4 h-4 mr-1" />
                    {transaction.amount ? parseFloat(transaction.amount).toFixed(2) : '0.00'} ฿
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Warnings and Actions */}
            <div className="space-y-3">
              {isDispensing && (
                <>
                  <Card className="bg-warning-yellow/20 border-warning-yellow">
                    <CardContent className="p-3">
                      <div className="flex items-center text-warning-yellow">
                        <AlertTriangle className="w-5 h-5 mr-2" />
                        <span className="text-sm font-medium">
                          กรุณาไม่ออกจากหน้าจอระหว่างการจ่ายน้ำมัน
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Button
                    onClick={handleStopDispensing}
                    variant="destructive"
                    className="w-full py-3 font-bold touch-target"
                    disabled={completeDispensingMutation.isPending}
                  >
                    <StopCircle className="mr-2 h-5 w-5" />
                    หยุดจ่ายน้ำมัน
                  </Button>
                </>
              )}

              {!isDispensing && (
                <Card className="bg-success-green/20 border-success-green">
                  <CardContent className="p-3">
                    <div className="flex items-center text-success-green">
                      <CheckCircle className="w-5 h-5 mr-2" />
                      <span className="text-sm font-medium">
                        การจ่ายน้ำมันเสร็จสมบูรณ์
                      </span>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}
