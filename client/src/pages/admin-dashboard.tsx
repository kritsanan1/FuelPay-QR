import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  BarChart3, 
  Users, 
  Fuel, 
  Activity,
  Settings,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  DollarSign,
  Wrench
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface AdminStats {
  totalTransactions: number;
  totalRevenue: string;
  totalVolume: string;
  averageTransaction: string;
  totalUsers: number;
  totalPumps: number;
  activePumps: number;
}

interface AuditLog {
  id: number;
  action: string;
  tableName: string;
  recordId: string;
  createdAt: string;
  user?: {
    id: number;
    username: string;
  };
}

interface MaintenanceRecord {
  id: number;
  description: string;
  status: string;
  scheduledDate: string | null;
  completedDate: string | null;
  createdAt: string;
  pump: {
    id: number;
    number: number;
  };
  performedBy: {
    id: number;
    username: string;
  };
}

export default function AdminDashboard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedPump, setSelectedPump] = useState<number | null>(null);
  const [priceUpdate, setPriceUpdate] = useState({ fuelTypeId: 0, price: "" });

  // Fetch admin statistics
  const { data: stats, isLoading: statsLoading } = useQuery<AdminStats>({
    queryKey: ['/api/admin/stats'],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Fetch users
  const { data: users = [] } = useQuery({
    queryKey: ['/api/admin/users'],
  });

  // Fetch audit logs
  const { data: auditLogs = [] } = useQuery<AuditLog[]>({
    queryKey: ['/api/admin/audit-logs'],
  });

  // Fetch maintenance records
  const { data: maintenanceRecords = [] } = useQuery<MaintenanceRecord[]>({
    queryKey: ['/api/admin/maintenance'],
  });

  // Fetch pumps and fuel types
  const { data: pumps = [] } = useQuery({
    queryKey: ['/api/pumps'],
  });

  const { data: fuelTypes = [] } = useQuery({
    queryKey: ['/api/fuel-types'],
  });

  // Update pump status mutation
  const updatePumpStatus = useMutation({
    mutationFn: async ({ pumpId, isActive, isOnline }: { pumpId: number; isActive: boolean; isOnline: boolean }) => {
      const response = await apiRequest("PUT", `/api/admin/pumps/${pumpId}/status`, { isActive, isOnline });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/pumps'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/stats'] });
      toast({ title: "สถานะปั๊มอัปเดตแล้ว", description: "เปลี่ยนสถานะปั๊มสำเร็จ" });
    },
    onError: (error: any) => {
      toast({ 
        title: "เกิดข้อผิดพลาด", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  // Update fuel price mutation
  const updateFuelPrice = useMutation({
    mutationFn: async ({ fuelTypeId, pricePerLiter }: { fuelTypeId: number; pricePerLiter: string }) => {
      const response = await apiRequest("PUT", `/api/admin/fuel-types/${fuelTypeId}/price`, { pricePerLiter });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/fuel-types'] });
      setPriceUpdate({ fuelTypeId: 0, price: "" });
      toast({ title: "ราคาน้ำมันอัปเดตแล้ว", description: "เปลี่ยนราคาน้ำมันสำเร็จ" });
    },
    onError: (error: any) => {
      toast({ 
        title: "เกิดข้อผิดพลาด", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  const handlePumpStatusToggle = (pumpId: number, field: 'isActive' | 'isOnline', currentValue: boolean) => {
    const pump = pumps.find(p => p.id === pumpId);
    if (!pump) return;

    updatePumpStatus.mutate({
      pumpId,
      isActive: field === 'isActive' ? !currentValue : pump.isActive,
      isOnline: field === 'isOnline' ? !currentValue : pump.isOnline,
    });
  };

  const handlePriceUpdate = () => {
    if (priceUpdate.fuelTypeId && priceUpdate.price) {
      updateFuelPrice.mutate({
        fuelTypeId: priceUpdate.fuelTypeId,
        pricePerLiter: priceUpdate.price,
      });
    }
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('th-TH');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="secondary" className="bg-green-100 text-green-800">เสร็จสิ้น</Badge>;
      case 'in_progress':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">กำลังดำเนินการ</Badge>;
      case 'scheduled':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800">จัดตารางแล้ว</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (statsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
          <p className="text-gray-600">ระบบจัดการสถานีบริการน้ำมัน</p>
        </div>

        {/* Statistics Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">รายการทั้งหมด</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalTransactions || 0}</div>
              <p className="text-xs text-muted-foreground">ธุรกรรมทั้งหมด</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">รายได้รวม</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">฿{stats?.totalRevenue || "0.00"}</div>
              <p className="text-xs text-muted-foreground">บาท</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">ปริมาณน้ำมัน</CardTitle>
              <Fuel className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalVolume || "0.000"}</div>
              <p className="text-xs text-muted-foreground">ลิตร</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">ปั๊มออนไลน์</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats?.activePumps || 0}/{stats?.totalPumps || 0}
              </div>
              <p className="text-xs text-muted-foreground">ปั๊มที่ใช้งานได้</p>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Management Tabs */}
        <Tabs defaultValue="pumps" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="pumps">ปั๊มน้ำมัน</TabsTrigger>
            <TabsTrigger value="fuel-prices">ราคาน้ำมัน</TabsTrigger>
            <TabsTrigger value="users">ผู้ใช้งาน</TabsTrigger>
            <TabsTrigger value="maintenance">บำรุงรักษา</TabsTrigger>
            <TabsTrigger value="audit">บันทึกการเปลี่ยนแปลง</TabsTrigger>
          </TabsList>

          <TabsContent value="pumps" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>จัดการปั๊มน้ำมัน</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {pumps.map((pump: any) => (
                    <div key={pump.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                          <Fuel className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-medium">ปั๊มที่ {pump.number}</h3>
                          <div className="flex space-x-2 mt-1">
                            {pump.isActive ? (
                              <Badge variant="secondary" className="bg-green-100 text-green-800">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                เปิดใช้งาน
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="bg-red-100 text-red-800">
                                <XCircle className="w-3 h-3 mr-1" />
                                ปิดใช้งาน
                              </Badge>
                            )}
                            {pump.isOnline ? (
                              <Badge variant="secondary" className="bg-green-100 text-green-800">
                                ออนไลน์
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="bg-gray-100 text-gray-800">
                                ออฟไลน์
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          variant={pump.isActive ? "destructive" : "default"}
                          size="sm"
                          onClick={() => handlePumpStatusToggle(pump.id, 'isActive', pump.isActive)}
                          disabled={updatePumpStatus.isPending}
                        >
                          {pump.isActive ? "ปิดใช้งาน" : "เปิดใช้งาน"}
                        </Button>
                        <Button
                          variant={pump.isOnline ? "secondary" : "default"}
                          size="sm"
                          onClick={() => handlePumpStatusToggle(pump.id, 'isOnline', pump.isOnline)}
                          disabled={updatePumpStatus.isPending}
                        >
                          {pump.isOnline ? "ตัดการเชื่อมต่อ" : "เชื่อมต่อ"}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="fuel-prices" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>จัดการราคาน้ำมัน</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {fuelTypes.map((fuel: any) => (
                  <div key={fuel.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h3 className="font-medium">{fuel.name}</h3>
                      <p className="text-sm text-gray-600">ราคาปัจจุบัน: ฿{parseFloat(fuel.pricePerLiter).toFixed(2)}/ลิตร</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Input
                        type="number"
                        placeholder="ราคาใหม่"
                        value={priceUpdate.fuelTypeId === fuel.id ? priceUpdate.price : ""}
                        onChange={(e) => setPriceUpdate({ fuelTypeId: fuel.id, price: e.target.value })}
                        className="w-24"
                        step="0.01"
                      />
                      <Button
                        onClick={() => {
                          setPriceUpdate({ fuelTypeId: fuel.id, price: fuel.pricePerLiter });
                          handlePriceUpdate();
                        }}
                        disabled={updateFuelPrice.isPending || !priceUpdate.price}
                        size="sm"
                      >
                        อัปเดต
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>ผู้ใช้งานในระบบ</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {users.map((user: any) => (
                    <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <Users className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-medium">{user.username}</h3>
                          <div className="flex items-center space-x-2 mt-1">
                            <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                              {user.role}
                            </Badge>
                            <Badge variant={user.isActive ? 'secondary' : 'destructive'}>
                              {user.isActive ? 'ใช้งานได้' : 'ปิดใช้งาน'}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600">
                            เข้าใช้ล่าสุด: {user.lastLoginAt ? formatDateTime(user.lastLoginAt) : 'ไม่เคยเข้าใช้'}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="maintenance" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>บันทึกการบำรุงรักษา</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {maintenanceRecords.map((record) => (
                    <div key={record.id} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <Wrench className="w-4 h-4 text-gray-600" />
                          <span className="font-medium">ปั๊มที่ {record.pump.number}</span>
                          {getStatusBadge(record.status)}
                        </div>
                        <span className="text-sm text-gray-600">
                          {formatDateTime(record.createdAt)}
                        </span>
                      </div>
                      <p className="text-gray-700 mb-2">{record.description}</p>
                      <div className="text-sm text-gray-600">
                        <p>ดำเนินการโดย: {record.performedBy.username}</p>
                        {record.scheduledDate && (
                          <p>กำหนดการ: {formatDateTime(record.scheduledDate)}</p>
                        )}
                        {record.completedDate && (
                          <p>เสร็จสิ้น: {formatDateTime(record.completedDate)}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="audit" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>บันทึกการเปลี่ยนแปลง</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {auditLogs.map((log) => (
                    <div key={log.id} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline">{log.action}</Badge>
                          <span className="text-sm text-gray-600">{log.tableName}</span>
                        </div>
                        <span className="text-sm text-gray-600">
                          {formatDateTime(log.createdAt)}
                        </span>
                      </div>
                      <div className="text-sm text-gray-700">
                        <p>ผู้ใช้: {log.user?.username || 'ระบบ'}</p>
                        <p>รายการ ID: {log.recordId}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}