import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { motion } from "framer-motion";
import { Receipt, Printer, X, MapPin, Phone, Calendar, Clock, Fuel, CreditCard } from "lucide-react";

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: any;
}

export default function ReceiptModal({ isOpen, onClose, transaction }: ReceiptModalProps) {
  if (!transaction) return null;

  const handlePrint = () => {
    // In a real implementation, this would send to a thermal printer
    window.print();
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return new Date().toLocaleDateString('th-TH');
    const date = new Date(dateString);
    return date.toLocaleDateString('th-TH', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatTime = (dateString?: string) => {
    if (!dateString) return new Date().toLocaleTimeString('th-TH');
    const date = new Date(dateString);
    return date.toLocaleTimeString('th-TH', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  const generateReceiptNumber = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const timestamp = Date.now().toString().slice(-6);
    return `RC-${year}${month}${day}${timestamp}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md p-0">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white rounded-lg overflow-hidden"
        >
          {/* Header */}
          <div className="bg-energy-orange text-white p-6 text-center">
            <Receipt className="w-8 h-8 mx-auto mb-2" />
            <h2 className="text-xl font-bold">ใบเสร็จรับเงิน</h2>
          </div>

          {/* Receipt Content */}
          <div className="p-6 space-y-4" id="receipt-content">
            {/* Station Info */}
            <div className="text-center border-b pb-4">
              <h3 className="font-bold text-lg text-dark">PTT Station วิภาวดี</h3>
              <div className="text-sm text-gray-600 space-y-1">
                <div className="flex items-center justify-center">
                  <MapPin className="w-3 h-3 mr-1" />
                  <span>123 ถนนวิภาวดีรังสิต กรุงเทพฯ 10900</span>
                </div>
                <div className="flex items-center justify-center">
                  <Phone className="w-3 h-3 mr-1" />
                  <span>โทร: 02-123-4567</span>
                </div>
              </div>
            </div>
            
            {/* Transaction Details */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="flex items-center">
                  <Calendar className="w-4 h-4 mr-1 text-gray-400" />
                  วันที่:
                </span>
                <span>{formatDate(transaction.createdAt)} {formatTime(transaction.createdAt)}</span>
              </div>
              <div className="flex justify-between">
                <span>เลขที่ใบเสร็จ:</span>
                <span>{transaction.receiptNumber || generateReceiptNumber()}</span>
              </div>
              <div className="flex justify-between">
                <span>หัวจ่าย:</span>
                <span>หัวจ่าย {transaction.pump?.number || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span>รหัสธุรกรรม:</span>
                <span className="text-xs">{transaction.transactionId}</span>
              </div>
            </div>

            <Separator />

            {/* Fuel Details */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="flex items-center">
                  <Fuel className="w-4 h-4 mr-1 text-energy-orange" />
                  ประเภทน้ำมัน:
                </span>
                <span>{transaction.fuelType?.name || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span>ราคา/ลิตร:</span>
                <span>{transaction.pricePerLiter ? parseFloat(transaction.pricePerLiter).toFixed(2) : '0.00'} ฿</span>
              </div>
              <div className="flex justify-between">
                <span>ปริมาณ:</span>
                <span>{transaction.volume ? parseFloat(transaction.volume).toFixed(2) : '0.00'} ลิตร</span>
              </div>
            </div>

            <Separator />

            {/* Payment Summary */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="flex items-center">
                  <CreditCard className="w-4 h-4 mr-1 text-deep-blue" />
                  วิธีชำระเงิน:
                </span>
                <span>PromptPay QR Code</span>
              </div>
              <div className="flex justify-between font-bold text-lg border-t pt-2">
                <span>ยอดรวม:</span>
                <span className="text-energy-orange">
                  {transaction.amount ? parseFloat(transaction.amount).toFixed(2) : '0.00'} ฿
                </span>
              </div>
            </div>

            <Separator />

            {/* Footer */}
            <div className="text-center text-sm text-gray-600 space-y-1">
              <p>ขอบคุณที่ใช้บริการ</p>
              <p>PTT Station - คุณภาพที่เชื่อถือได้</p>
              <p className="text-xs">เก็บใบเสร็จนี้ไว้เป็นหลักฐาน</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3 p-6 pt-0">
            <Button
              onClick={handlePrint}
              className="flex-1 bg-deep-blue hover:bg-deep-blue/90 text-white font-bold py-3 touch-target"
            >
              <Printer className="mr-2 h-4 w-4" />
              พิมพ์
            </Button>
            <Button
              onClick={onClose}
              variant="outline"
              className="flex-1 font-bold py-3 touch-target"
            >
              <X className="mr-2 h-4 w-4" />
              ปิด
            </Button>
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}
