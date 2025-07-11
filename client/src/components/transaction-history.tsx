import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { X, Calendar, Clock, Fuel, Droplets, DollarSign } from "lucide-react";

interface TransactionHistoryProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function TransactionHistory({ isOpen, onClose }: TransactionHistoryProps) {
  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ['/api/transactions'],
    enabled: isOpen
  });

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'success':
      case 'completed':
        return 'bg-success-green/20 text-success-green';
      case 'pending':
      case 'processing':
        return 'bg-warning-yellow/20 text-warning-yellow';
      case 'failed':
      case 'cancelled':
        return 'bg-red-100 text-red-500';
      default:
        return 'bg-gray-100 text-gray-500';
    }
  };

  const getStatusText = (paymentStatus: string, transactionStatus: string) => {
    if (paymentStatus === 'success' && transactionStatus === 'completed') {
      return 'สำเร็จ';
    } else if (paymentStatus === 'success' && transactionStatus === 'dispensing') {
      return 'กำลังจ่าย';
    } else if (paymentStatus === 'processing') {
      return 'กำลังตรวจสอบ';
    } else if (paymentStatus === 'failed') {
      return 'ล้มเหลว';
    } else if (transactionStatus === 'cancelled') {
      return 'ยกเลิก';
    }
    return 'รอดำเนินการ';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('th-TH', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('th-TH', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader className="bg-deep-blue text-white p-6 -m-6 mb-6 rounded-t-lg">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-bold flex items-center">
              <Calendar className="mr-2" />
              ประวัติการทำรายการ
            </DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-white hover:text-gray-200"
            >
              <X className="h-6 w-6" />
            </Button>
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-96">
          {isLoading ? (
            <div className="text-center py-8">
              <div className="w-8 h-8 border-2 border-energy-orange border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p>กำลังโหลดประวัติ...</p>
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">ไม่มีประวัติการทำรายการ</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 font-semibold">วันที่</th>
                    <th className="text-left py-3 font-semibold">เวลา</th>
                    <th className="text-left py-3 font-semibold">ประเภท</th>
                    <th className="text-left py-3 font-semibold">หัวจ่าย</th>
                    <th className="text-left py-3 font-semibold">ปริมาณ</th>
                    <th className="text-left py-3 font-semibold">จำนวนเงิน</th>
                    <th className="text-left py-3 font-semibold">สถานะ</th>
                  </tr>
                </thead>
                <tbody>
                  <AnimatePresence>
                    {transactions.map((transaction: any, index: number) => (
                      <motion.tr
                        key={transaction.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ delay: index * 0.1 }}
                        className="border-b border-gray-100 hover:bg-gray-50"
                      >
                        <td className="py-3">
                          <div className="flex items-center">
                            <Calendar className="w-4 h-4 mr-1 text-gray-400" />
                            {formatDate(transaction.createdAt)}
                          </div>
                        </td>
                        <td className="py-3">
                          <div className="flex items-center">
                            <Clock className="w-4 h-4 mr-1 text-gray-400" />
                            {formatTime(transaction.createdAt)}
                          </div>
                        </td>
                        <td className="py-3">
                          <div className="flex items-center">
                            <Fuel className="w-4 h-4 mr-1 text-energy-orange" />
                            {transaction.fuelType?.name || 'N/A'}
                          </div>
                        </td>
                        <td className="py-3">
                          หัวจ่าย {transaction.pump?.number || 'N/A'}
                        </td>
                        <td className="py-3">
                          <div className="flex items-center">
                            <Droplets className="w-4 h-4 mr-1 text-blue-500" />
                            {transaction.volume ? `${parseFloat(transaction.volume).toFixed(2)} ลิตร` : 'N/A'}
                          </div>
                        </td>
                        <td className="py-3">
                          <div className="flex items-center font-semibold text-energy-orange">
                            <DollarSign className="w-4 h-4 mr-1" />
                            {parseFloat(transaction.amount).toFixed(2)} ฿
                          </div>
                        </td>
                        <td className="py-3">
                          <Badge className={getStatusBadgeVariant(transaction.paymentStatus)}>
                            {getStatusText(transaction.paymentStatus, transaction.transactionStatus)}
                          </Badge>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
