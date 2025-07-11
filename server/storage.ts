import { 
  users, 
  fuelTypes, 
  pumps, 
  transactions,
  auditLogs,
  systemConfig,
  maintenanceRecords,
  type User, 
  type InsertUser,
  type FuelType,
  type InsertFuelType,
  type Pump,
  type InsertPump,
  type Transaction,
  type InsertTransaction,
  type TransactionWithRelations,
  type AuditLog,
  type InsertAuditLog,
  type AuditLogWithRelations,
  type SystemConfig,
  type InsertSystemConfig,
  type MaintenanceRecord,
  type InsertMaintenanceRecord,
  type MaintenanceRecordWithRelations
} from "@shared/schema";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, updates: Partial<User>): Promise<User>;
  updateUserStripeCustomerId(id: number, stripeCustomerId: string): Promise<User>;
  updateUserLastLogin(id: number): Promise<User>;
  getAllUsers(): Promise<User[]>;
  
  // Fuel Types
  getFuelTypes(): Promise<FuelType[]>;
  getFuelTypeById(id: number): Promise<FuelType | undefined>;
  createFuelType(fuelType: InsertFuelType): Promise<FuelType>;
  updateFuelTypePrice(id: number, pricePerLiter: string): Promise<FuelType>;
  updateFuelType(id: number, updates: Partial<FuelType>): Promise<FuelType>;
  
  // Pumps
  getPumps(): Promise<Pump[]>;
  getPumpById(id: number): Promise<Pump | undefined>;
  getPumpByNumber(number: number): Promise<Pump | undefined>;
  createPump(pump: InsertPump): Promise<Pump>;
  updatePumpStatus(id: number, isActive: boolean, isOnline: boolean): Promise<Pump>;
  
  // Transactions
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  getTransactionById(id: number): Promise<TransactionWithRelations | undefined>;
  getTransactionByTransactionId(transactionId: string): Promise<TransactionWithRelations | undefined>;
  updateTransactionPaymentStatus(id: number, status: "pending" | "processing" | "success" | "failed" | "cancelled"): Promise<Transaction>;
  updateTransactionStatus(id: number, status: "pending" | "completed" | "cancelled" | "dispensing"): Promise<Transaction>;
  updateTransactionVolume(id: number, volume: string): Promise<Transaction>;
  updateTransactionStripePaymentIntent(id: number, stripePaymentIntentId: string): Promise<Transaction>;
  getRecentTransactions(limit: number): Promise<TransactionWithRelations[]>;
  getTransactionsByUserId(userId: number, limit: number): Promise<TransactionWithRelations[]>;
  getTransactionStats(startDate?: Date, endDate?: Date): Promise<{
    totalTransactions: number;
    totalRevenue: string;
    totalVolume: string;
    averageTransaction: string;
  }>;
  generateReceiptNumber(): Promise<string>;
  
  // Audit Logs
  createAuditLog(auditLog: InsertAuditLog): Promise<AuditLog>;
  getAuditLogs(limit: number, offset: number): Promise<AuditLogWithRelations[]>;
  getAuditLogsByUserId(userId: number, limit: number): Promise<AuditLogWithRelations[]>;
  
  // System Configuration
  getSystemConfig(key: string): Promise<SystemConfig | undefined>;
  getAllSystemConfigs(includePrivate?: boolean): Promise<SystemConfig[]>;
  setSystemConfig(config: InsertSystemConfig): Promise<SystemConfig>;
  updateSystemConfig(key: string, value: string, updatedBy: number): Promise<SystemConfig>;
  
  // Maintenance Records
  createMaintenanceRecord(record: InsertMaintenanceRecord): Promise<MaintenanceRecord>;
  getMaintenanceRecords(limit: number): Promise<MaintenanceRecordWithRelations[]>;
  getMaintenanceRecordsByPumpId(pumpId: number): Promise<MaintenanceRecordWithRelations[]>;
  updateMaintenanceRecord(id: number, updates: Partial<MaintenanceRecord>): Promise<MaintenanceRecord>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async updateUserStripeCustomerId(id: number, stripeCustomerId: string): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ stripeCustomerId, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async updateUserLastLogin(id: number): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ lastLoginAt: new Date(), updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(desc(users.createdAt));
  }

  async getFuelTypes(): Promise<FuelType[]> {
    return await db.select().from(fuelTypes).where(eq(fuelTypes.isActive, true));
  }

  async getFuelTypeById(id: number): Promise<FuelType | undefined> {
    const [fuelType] = await db.select().from(fuelTypes).where(eq(fuelTypes.id, id));
    return fuelType || undefined;
  }

  async createFuelType(fuelType: InsertFuelType): Promise<FuelType> {
    const [created] = await db
      .insert(fuelTypes)
      .values(fuelType)
      .returning();
    return created;
  }

  async updateFuelTypePrice(id: number, pricePerLiter: string): Promise<FuelType> {
    const [updated] = await db
      .update(fuelTypes)
      .set({ pricePerLiter, updatedAt: new Date() })
      .where(eq(fuelTypes.id, id))
      .returning();
    return updated;
  }

  async updateFuelType(id: number, updates: Partial<FuelType>): Promise<FuelType> {
    const [updated] = await db
      .update(fuelTypes)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(fuelTypes.id, id))
      .returning();
    return updated;
  }

  async getPumps(): Promise<Pump[]> {
    return await db.select().from(pumps);
  }

  async getPumpById(id: number): Promise<Pump | undefined> {
    const [pump] = await db.select().from(pumps).where(eq(pumps.id, id));
    return pump || undefined;
  }

  async getPumpByNumber(number: number): Promise<Pump | undefined> {
    const [pump] = await db.select().from(pumps).where(eq(pumps.number, number));
    return pump || undefined;
  }

  async createPump(pump: InsertPump): Promise<Pump> {
    const [created] = await db
      .insert(pumps)
      .values(pump)
      .returning();
    return created;
  }

  async updatePumpStatus(id: number, isActive: boolean, isOnline: boolean): Promise<Pump> {
    const [updated] = await db
      .update(pumps)
      .set({ isActive, isOnline })
      .where(eq(pumps.id, id))
      .returning();
    return updated;
  }

  async createTransaction(transaction: InsertTransaction): Promise<Transaction> {
    const [created] = await db
      .insert(transactions)
      .values(transaction)
      .returning();
    return created;
  }

  async getTransactionById(id: number): Promise<TransactionWithRelations | undefined> {
    const [transaction] = await db
      .select()
      .from(transactions)
      .leftJoin(pumps, eq(transactions.pumpId, pumps.id))
      .leftJoin(fuelTypes, eq(transactions.fuelTypeId, fuelTypes.id))
      .where(eq(transactions.id, id));

    if (!transaction) return undefined;

    return {
      ...transaction.transactions,
      pump: transaction.pumps!,
      fuelType: transaction.fuel_types!,
    };
  }

  async getTransactionByTransactionId(transactionId: string): Promise<TransactionWithRelations | undefined> {
    const [transaction] = await db
      .select()
      .from(transactions)
      .leftJoin(pumps, eq(transactions.pumpId, pumps.id))
      .leftJoin(fuelTypes, eq(transactions.fuelTypeId, fuelTypes.id))
      .where(eq(transactions.transactionId, transactionId));

    if (!transaction) return undefined;

    return {
      ...transaction.transactions,
      pump: transaction.pumps!,
      fuelType: transaction.fuel_types!,
    };
  }

  async updateTransactionPaymentStatus(id: number, status: "pending" | "processing" | "success" | "failed" | "cancelled"): Promise<Transaction> {
    const [updated] = await db
      .update(transactions)
      .set({ paymentStatus: status, updatedAt: new Date() })
      .where(eq(transactions.id, id))
      .returning();
    return updated;
  }

  async updateTransactionStatus(id: number, status: "pending" | "completed" | "cancelled" | "dispensing"): Promise<Transaction> {
    const [updated] = await db
      .update(transactions)
      .set({ transactionStatus: status, updatedAt: new Date() })
      .where(eq(transactions.id, id))
      .returning();
    return updated;
  }

  async updateTransactionVolume(id: number, volume: string): Promise<Transaction> {
    const [updated] = await db
      .update(transactions)
      .set({ volume, updatedAt: new Date() })
      .where(eq(transactions.id, id))
      .returning();
    return updated;
  }

  async getRecentTransactions(limit: number): Promise<TransactionWithRelations[]> {
    const results = await db
      .select()
      .from(transactions)
      .leftJoin(pumps, eq(transactions.pumpId, pumps.id))
      .leftJoin(fuelTypes, eq(transactions.fuelTypeId, fuelTypes.id))
      .orderBy(desc(transactions.createdAt))
      .limit(limit);

    return results.map(row => ({
      ...row.transactions,
      pump: row.pumps!,
      fuelType: row.fuel_types!,
    }));
  }

  async generateReceiptNumber(): Promise<string> {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const timestamp = Date.now().toString().slice(-6);
    return `RC-${year}${month}${day}${timestamp}`;
  }

  // Additional transaction methods
  async updateTransactionStripePaymentIntent(id: number, stripePaymentIntentId: string): Promise<Transaction> {
    const [updated] = await db
      .update(transactions)
      .set({ stripePaymentIntentId, updatedAt: new Date() })
      .where(eq(transactions.id, id))
      .returning();
    return updated;
  }

  async getTransactionsByUserId(userId: number, limit: number): Promise<TransactionWithRelations[]> {
    const results = await db
      .select()
      .from(transactions)
      .leftJoin(pumps, eq(transactions.pumpId, pumps.id))
      .leftJoin(fuelTypes, eq(transactions.fuelTypeId, fuelTypes.id))
      .leftJoin(users, eq(transactions.userId, users.id))
      .where(eq(transactions.userId, userId))
      .orderBy(desc(transactions.createdAt))
      .limit(limit);

    return results.map(row => ({
      ...row.transactions,
      pump: row.pumps!,
      fuelType: row.fuel_types!,
      user: row.users || undefined,
    }));
  }

  async getTransactionStats(startDate?: Date, endDate?: Date): Promise<{
    totalTransactions: number;
    totalRevenue: string;
    totalVolume: string;
    averageTransaction: string;
  }> {
    // For now, return simple stats from all transactions
    const allTransactions = await db.select().from(transactions);
    const totalTransactions = allTransactions.length;
    const totalRevenue = allTransactions.reduce((sum, t) => sum + parseFloat(t.amount), 0);
    const totalVolume = allTransactions.reduce((sum, t) => sum + parseFloat(t.volume || '0'), 0);
    const averageTransaction = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;

    return {
      totalTransactions,
      totalRevenue: totalRevenue.toFixed(2),
      totalVolume: totalVolume.toFixed(3),
      averageTransaction: averageTransaction.toFixed(2),
    };
  }

  // Audit Log methods
  async createAuditLog(auditLog: InsertAuditLog): Promise<AuditLog> {
    const [created] = await db
      .insert(auditLogs)
      .values(auditLog)
      .returning();
    return created;
  }

  async getAuditLogs(limit: number, offset: number): Promise<AuditLogWithRelations[]> {
    const results = await db
      .select()
      .from(auditLogs)
      .leftJoin(users, eq(auditLogs.userId, users.id))
      .orderBy(desc(auditLogs.createdAt))
      .limit(limit)
      .offset(offset);

    return results.map(row => ({
      ...row.audit_logs,
      user: row.users || undefined,
    }));
  }

  async getAuditLogsByUserId(userId: number, limit: number): Promise<AuditLogWithRelations[]> {
    const results = await db
      .select()
      .from(auditLogs)
      .leftJoin(users, eq(auditLogs.userId, users.id))
      .where(eq(auditLogs.userId, userId))
      .orderBy(desc(auditLogs.createdAt))
      .limit(limit);

    return results.map(row => ({
      ...row.audit_logs,
      user: row.users || undefined,
    }));
  }

  // System Configuration methods
  async getSystemConfig(key: string): Promise<SystemConfig | undefined> {
    const [config] = await db.select().from(systemConfig).where(eq(systemConfig.key, key));
    return config || undefined;
  }

  async getAllSystemConfigs(includePrivate: boolean = false): Promise<SystemConfig[]> {
    if (includePrivate) {
      return await db.select().from(systemConfig);
    }
    return await db.select().from(systemConfig).where(eq(systemConfig.isPublic, true));
  }

  async setSystemConfig(config: InsertSystemConfig): Promise<SystemConfig> {
    const [created] = await db
      .insert(systemConfig)
      .values(config)
      .returning();
    return created;
  }

  async updateSystemConfig(key: string, value: string, updatedBy: number): Promise<SystemConfig> {
    const [updated] = await db
      .update(systemConfig)
      .set({ value, updatedBy, updatedAt: new Date() })
      .where(eq(systemConfig.key, key))
      .returning();
    return updated;
  }

  // Maintenance Record methods
  async createMaintenanceRecord(record: InsertMaintenanceRecord): Promise<MaintenanceRecord> {
    const [created] = await db
      .insert(maintenanceRecords)
      .values(record)
      .returning();
    return created;
  }

  async getMaintenanceRecords(limit: number): Promise<MaintenanceRecordWithRelations[]> {
    const results = await db
      .select()
      .from(maintenanceRecords)
      .leftJoin(pumps, eq(maintenanceRecords.pumpId, pumps.id))
      .leftJoin(users, eq(maintenanceRecords.performedBy, users.id))
      .orderBy(desc(maintenanceRecords.createdAt))
      .limit(limit);

    return results.map(row => {
      const record = row.maintenance_records;
      const pump = row.pumps!;
      const user = row.users!;
      return {
        id: record.id,
        pumpId: record.pumpId,
        description: record.description,
        scheduledDate: record.scheduledDate,
        completedDate: record.completedDate,
        status: record.status,
        notes: record.notes,
        createdAt: record.createdAt,
        pump,
        performedBy: user,
      } as MaintenanceRecordWithRelations;
    });
  }

  async getMaintenanceRecordsByPumpId(pumpId: number): Promise<MaintenanceRecordWithRelations[]> {
    const results = await db
      .select()
      .from(maintenanceRecords)
      .leftJoin(pumps, eq(maintenanceRecords.pumpId, pumps.id))
      .leftJoin(users, eq(maintenanceRecords.performedBy, users.id))
      .where(eq(maintenanceRecords.pumpId, pumpId))
      .orderBy(desc(maintenanceRecords.createdAt));

    return results.map(row => {
      const record = row.maintenance_records;
      const pump = row.pumps!;
      const user = row.users!;
      return {
        id: record.id,
        pumpId: record.pumpId,
        description: record.description,
        scheduledDate: record.scheduledDate,
        completedDate: record.completedDate,
        status: record.status,
        notes: record.notes,
        createdAt: record.createdAt,
        pump,
        performedBy: user,
      } as MaintenanceRecordWithRelations;
    });
  }

  async updateMaintenanceRecord(id: number, updates: Partial<MaintenanceRecord>): Promise<MaintenanceRecord> {
    const [updated] = await db
      .update(maintenanceRecords)
      .set(updates)
      .where(eq(maintenanceRecords.id, id))
      .returning();
    return updated;
  }
}

export const storage = new DatabaseStorage();
