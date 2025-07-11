import { useState } from "react";
import { motion } from "framer-motion";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Fuel, Calculator, QrCode, Zap } from "lucide-react";

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

interface FuelSelectionProps {
  fuelTypes: FuelType[];
  pumps: Pump[];
  selectedPump: number;
  selectedFuel: FuelType | null;
  inputMode: 'amount' | 'volume';
  amount: number;
  volume: number;
  totalAmount: number;
  onPumpSelect: (pump: number) => void;
  onFuelSelect: (fuel: FuelType) => void;
  onInputModeChange: (mode: 'amount' | 'volume') => void;
  onAmountChange: (amount: number) => void;
  onVolumeChange: (volume: number) => void;
  onTransactionCreate: (transaction: any) => void;
}

export default function FuelSelection({
  fuelTypes,
  pumps,
  selectedPump,
  selectedFuel,
  inputMode,
  amount,
  volume,
  totalAmount,
  onPumpSelect,
  onFuelSelect,
  onInputModeChange,
  onAmountChange,
  onVolumeChange,
  onTransactionCreate
}: FuelSelectionProps) {
  const { toast } = useToast();

  const generateQRMutation = useMutation({
    mutationFn: (data: any) => apiRequest('POST', '/api/generate-qr', data),
    onSuccess: (response: any) => {
      onTransactionCreate(response);
      toast({
        title: "QR Code สร้างเสร็จแล้ว!",
        description: "กรุณาสแกน QR Code เพื่อชำระเงิน",
        className: "bg-success-green text-white"
      });
    },
    onError: (error: any) => {
      toast({
        title: "ไม่สามารถสร้าง QR Code ได้",
        description: error.message || "กรุณาลองใหม่อีกครั้ง",
        variant: "destructive"
      });
    }
  });

  const presetAmounts = [200, 500, 1000];
  const presetVolumes = [10, 20, 30];

  const handlePresetAmount = (preset: number) => {
    onAmountChange(preset);
    if (selectedFuel) {
      onVolumeChange(preset / parseFloat(selectedFuel.pricePerLiter));
    }
  };

  const handlePresetVolume = (preset: number) => {
    onVolumeChange(preset);
    if (selectedFuel) {
      onAmountChange(preset * parseFloat(selectedFuel.pricePerLiter));
    }
  };

  const handleAmountInput = (value: string) => {
    const numValue = parseFloat(value) || 0;
    onAmountChange(numValue);
    if (selectedFuel) {
      onVolumeChange(numValue / parseFloat(selectedFuel.pricePerLiter));
    }
  };

  const handleVolumeInput = (value: string) => {
    const numValue = parseFloat(value) || 0;
    onVolumeChange(numValue);
    if (selectedFuel) {
      onAmountChange(numValue * parseFloat(selectedFuel.pricePerLiter));
    }
  };

  const handleGenerateQR = () => {
    if (!selectedFuel || totalAmount <= 0) {
      toast({
        title: "ข้อมูลไม่ครบถ้วน",
        description: "กรุณาเลือกประเภทน้ำมันและกำหนดจำนวน",
        variant: "destructive"
      });
      return;
    }

    const selectedPumpData = pumps.find(p => p.number === selectedPump);
    if (!selectedPumpData) {
      toast({
        title: "ไม่พบหัวจ่าย",
        description: "กรุณาเลือกหัวจ่ายที่ถูกต้อง",
        variant: "destructive"
      });
      return;
    }

    generateQRMutation.mutate({
      pumpId: selectedPumpData.id,
      fuelTypeId: selectedFuel.id,
      amount: totalAmount.toFixed(2),
      volume: volume.toFixed(3),
      inputMode
    });
  };

  const getFuelTypeColor = (type: string) => {
    switch (type) {
      case 'gasoline91': return 'bg-red-500 hover:bg-red-600';
      case 'gasoline95': return 'bg-green-500 hover:bg-green-600';
      case 'e20': return 'bg-yellow-500 hover:bg-yellow-600';
      case 'diesel': return 'bg-blue-600 hover:bg-blue-700';
      default: return 'bg-gray-500 hover:bg-gray-600';
    }
  };

  const getFuelTypeNumber = (type: string) => {
    switch (type) {
      case 'gasoline91': return '91';
      case 'gasoline95': return '95';
      case 'e20': return 'E20';
      case 'diesel': return 'B7';
      default: return '?';
    }
  };

  const canGenerateQR = selectedFuel && totalAmount > 0;

  return (
    <div className="space-y-6">
      {/* Pump Selection */}
      <Card className="border-l-4 border-energy-orange">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Zap className="text-energy-orange mr-3" />
            เลือกหัวจ่าย
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            {pumps.map((pump) => (
              <motion.div
                key={pump.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button
                  variant={selectedPump === pump.number ? "default" : "outline"}
                  className={`w-full h-20 touch-target ${
                    selectedPump === pump.number 
                      ? 'bg-energy-orange hover:bg-energy-orange/90 text-white' 
                      : 'hover:bg-gray-50'
                  } ${!pump.isActive || !pump.isOnline ? 'opacity-50 cursor-not-allowed' : ''}`}
                  onClick={() => pump.isActive && pump.isOnline && onPumpSelect(pump.number)}
                  disabled={!pump.isActive || !pump.isOnline}
                >
                  <div className="text-center">
                    <Fuel className="text-2xl mb-2 mx-auto" />
                    <div className="font-bold">หัวจ่าย {pump.number}</div>
                    {(!pump.isActive || !pump.isOnline) && (
                      <div className="text-xs">ไม่พร้อมใช้งาน</div>
                    )}
                  </div>
                </Button>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Fuel Type Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Fuel className="text-deep-blue mr-3" />
            เลือกประเภทน้ำมัน
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {fuelTypes.map((fuelType) => (
              <motion.div
                key={fuelType.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button
                  variant="ghost"
                  className={`w-full h-24 touch-target ${getFuelTypeColor(fuelType.type)} text-white font-bold transition-all ${
                    selectedFuel?.id === fuelType.id ? 'ring-2 ring-white ring-offset-2 ring-offset-energy-orange' : ''
                  }`}
                  onClick={() => onFuelSelect(fuelType)}
                >
                  <div className="text-center">
                    <div className="text-2xl font-bold">{getFuelTypeNumber(fuelType.type)}</div>
                    <div className="text-sm">{fuelType.name.split(' ')[1] || fuelType.name}</div>
                    <div className="text-xs">{parseFloat(fuelType.pricePerLiter).toFixed(2)} ฿/ลิตร</div>
                  </div>
                </Button>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Amount Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calculator className="text-warning-yellow mr-3" />
            กำหนดจำนวน
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={inputMode} onValueChange={(value) => onInputModeChange(value as 'amount' | 'volume')}>
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="amount" className="touch-target">จำนวนเงิน (฿)</TabsTrigger>
              <TabsTrigger value="volume" className="touch-target">ปริมาณ (ลิตร)</TabsTrigger>
            </TabsList>

            <TabsContent value="amount" className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                {presetAmounts.map((preset) => (
                  <Button
                    key={preset}
                    variant="outline"
                    className="touch-target hover:bg-energy-orange hover:text-white"
                    onClick={() => handlePresetAmount(preset)}
                  >
                    {preset} ฿
                  </Button>
                ))}
              </div>
              <div className="flex items-center space-x-4">
                <Input
                  type="number"
                  placeholder="0"
                  min="1"
                  max="10000"
                  value={amount || ''}
                  onChange={(e) => handleAmountInput(e.target.value)}
                  className="text-xl font-bold text-center touch-target focus:border-energy-orange"
                />
                <div className="text-2xl font-bold text-gray-400">฿</div>
              </div>
            </TabsContent>

            <TabsContent value="volume" className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                {presetVolumes.map((preset) => (
                  <Button
                    key={preset}
                    variant="outline"
                    className="touch-target hover:bg-energy-orange hover:text-white"
                    onClick={() => handlePresetVolume(preset)}
                  >
                    {preset} ลิตร
                  </Button>
                ))}
              </div>
              <div className="flex items-center space-x-4">
                <Input
                  type="number"
                  placeholder="0"
                  min="1"
                  max="100"
                  step="0.1"
                  value={volume || ''}
                  onChange={(e) => handleVolumeInput(e.target.value)}
                  className="text-xl font-bold text-center touch-target focus:border-energy-orange"
                />
                <div className="text-2xl font-bold text-gray-400">ลิตร</div>
              </div>
            </TabsContent>
          </Tabs>

          {/* Order Summary */}
          <div className="mt-6 bg-gray-50 p-4 rounded-xl">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">ประเภทน้ำมัน:</span>
                <span className="font-semibold">
                  {selectedFuel ? selectedFuel.name : 'กรุณาเลือกประเภทน้ำมัน'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">หัวจ่าย:</span>
                <span className="font-semibold">หัวจ่าย {selectedPump}</span>
              </div>
              <div className="flex justify-between items-center border-t pt-2">
                <span className="text-gray-600">ยอดรวม:</span>
                <span className="text-2xl font-bold text-energy-orange">
                  {totalAmount.toFixed(2)} ฿
                </span>
              </div>
            </div>
          </div>

          {/* Generate QR Code Button */}
          <Button
            onClick={handleGenerateQR}
            disabled={!canGenerateQR || generateQRMutation.isPending}
            className="w-full mt-6 bg-energy-orange hover:bg-energy-orange/90 text-white font-bold py-4 px-6 text-lg touch-target"
          >
            {generateQRMutation.isPending ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                กำลังสร้าง QR Code...
              </>
            ) : (
              <>
                <QrCode className="mr-2" />
                สร้าง QR Code สำหรับชำระเงิน
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
