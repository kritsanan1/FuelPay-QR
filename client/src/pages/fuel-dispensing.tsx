import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useWebSocket } from "@/hooks/use-websocket";
import FuelSelection from "@/components/fuel-selection";
import PaymentPanel from "@/components/payment-panel";
import TransactionHistory from "@/components/transaction-history";
import ReceiptModal from "@/components/receipt-modal";
import DispensingModal from "@/components/dispensing-modal";
import { Clock, Fuel, Wifi } from "lucide-react";

interface FuelType {
  id: number;
  type: string;
  name: string;
  pricePerLiter: string;
  isActive: boolean;
}

interface Pump {
  id: number;
  number: number;
  isActive: boolean;
  isOnline: boolean;
}

export default function FuelDispensingPage() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedPump, setSelectedPump] = useState<number>(1);
  const [selectedFuel, setSelectedFuel] = useState<FuelType | null>(null);
  const [inputMode, setInputMode] = useState<'amount' | 'volume'>('amount');
  const [amount, setAmount] = useState<number>(0);
  const [volume, setVolume] = useState<number>(0);
  const [currentTransaction, setCurrentTransaction] = useState<any>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [showDispensing, setShowDispensing] = useState(false);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // WebSocket for real-time updates
  const { lastMessage, connectionStatus } = useWebSocket();

  // Initialize the system
  const initMutation = useMutation({
    mutationFn: () => apiRequest('POST', '/api/init'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/fuel-types'] });
      queryClient.invalidateQueries({ queryKey: ['/api/pumps'] });
    },
    onError: (error) => {
      console.error('Initialization error:', error);
      toast({
        title: "ไม่สามารถเริ่มระบบได้",
        description: "กรุณาลองใหม่อีกครั้ง",
        variant: "destructive"
      });
    }
  });

  // Fetch fuel types
  const { data: fuelTypes = [], isLoading: loadingFuelTypes, error: fuelTypesError } = useQuery({
    queryKey: ['/api/fuel-types'],
    enabled: true,
    retry: 3,
    retryDelay: 1000
  });

  // Fetch pumps
  const { data: pumps = [], isLoading: loadingPumps, error: pumpsError } = useQuery({
    queryKey: ['/api/pumps'],
    enabled: true,
    retry: 3,
    retryDelay: 1000
  });

  // Initialize system on mount
  useEffect(() => {
    initMutation.mutate();
  }, []);

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Handle WebSocket messages
  useEffect(() => {
    if (lastMessage) {
      try {
        const message = JSON.parse(lastMessage);
        
        switch (message.type) {
        case 'payment_status_updated':
          if (currentTransaction?.transactionId === message.transactionId) {
            setCurrentTransaction(prev => ({
              ...prev,
              paymentStatus: message.paymentStatus
            }));
            
            if (message.paymentStatus === 'success') {
              toast({
                title: "ชำระเงินสำเร็จ!",
                description: "สามารถเริ่มจ่ายน้ำมันได้แล้ว",
                className: "bg-success-green text-white"
              });
            } else if (message.paymentStatus === 'failed') {
              toast({
                title: "การชำระเงินล้มเหลว",
                description: "กรุณาลองใหม่อีกครั้ง",
                variant: "destructive"
              });
            }
          }
          break;
          
        case 'dispensing_started':
          if (currentTransaction?.transactionId === message.transactionId) {
            setShowDispensing(true);
          }
          break;
          
        case 'dispensing_completed':
          if (currentTransaction?.transactionId === message.transactionId) {
            setShowDispensing(false);
            setShowReceipt(true);
            toast({
              title: "จ่ายน้ำมันเสร็จสิ้น",
              description: "ขอบคุณที่ใช้บริการ",
              className: "bg-success-green text-white"
            });
          }
          break;
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    }
  }, [lastMessage, currentTransaction, toast]);

  // Calculate total amount
  const totalAmount = inputMode === 'amount' ? amount : (selectedFuel ? volume * parseFloat(selectedFuel.pricePerLiter) : 0);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('th-TH', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getConnectionStatusColor = () => {
    switch (connectionStatus) {
      case 'Connected': return 'text-success-green';
      case 'Connecting': return 'text-warning-yellow';
      default: return 'text-red-500';
    }
  };

  if (loadingFuelTypes || loadingPumps) {
    return (
      <div className="min-h-screen bg-light flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-energy-orange border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-lg font-medium text-dark">กำลังโหลดระบบ...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-light text-dark">
      {/* Header */}
      <motion.header 
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-white shadow-lg border-b-4 border-energy-orange"
      >
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-energy-orange rounded-full flex items-center justify-center">
                <Fuel className="text-white text-xl" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-dark high-contrast">PTT Station</h1>
                <p className="text-sm text-gray-600">สาขา วิภาวดี - ระบบจ่ายน้ำมัน</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="bg-success-green/10 px-3 py-1 rounded-full">
                <span className="text-success-green text-sm font-medium flex items-center">
                  <Wifi className={`w-3 h-3 mr-1 ${getConnectionStatusColor()}`} />
                  ระบบปกติ
                </span>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600 flex items-center">
                  <Clock className="w-4 h-4 mr-1" />
                  เวลา
                </p>
                <p className="font-semibold">{formatTime(currentTime)}</p>
              </div>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Main Interface */}
      <main className="container mx-auto px-4 py-6 max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Fuel Selection Panel */}
          <motion.div 
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-2"
          >
            <FuelSelection
              fuelTypes={fuelTypes}
              pumps={pumps}
              selectedPump={selectedPump}
              selectedFuel={selectedFuel}
              inputMode={inputMode}
              amount={amount}
              volume={volume}
              totalAmount={totalAmount}
              onPumpSelect={setSelectedPump}
              onFuelSelect={setSelectedFuel}
              onInputModeChange={setInputMode}
              onAmountChange={setAmount}
              onVolumeChange={setVolume}
              onTransactionCreate={setCurrentTransaction}
            />
          </motion.div>

          {/* Payment Panel */}
          <motion.div 
            initial={{ x: 50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-1"
          >
            <PaymentPanel
              transaction={currentTransaction}
              onShowHistory={() => setShowHistory(true)}
              onShowReceipt={() => setShowReceipt(true)}
            />
          </motion.div>
        </div>
      </main>

      {/* Modals */}
      <TransactionHistory 
        isOpen={showHistory}
        onClose={() => setShowHistory(false)}
      />
      
      <ReceiptModal
        isOpen={showReceipt}
        onClose={() => setShowReceipt(false)}
        transaction={currentTransaction}
      />
      
      <DispensingModal
        isOpen={showDispensing}
        onClose={() => setShowDispensing(false)}
        transaction={currentTransaction}
      />
    </div>
  );
}
