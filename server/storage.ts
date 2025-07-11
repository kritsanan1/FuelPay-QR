import { 
  users, 
  fuelTypes, 
  pumps, 
  transactions, 
  type User, 
  type InsertUser,
  type FuelType,
  type InsertFuelType,
  type Pump,
  type InsertPump,
  type Transaction,
  type InsertTransaction,
  type TransactionWithRelations
} from "@shared/schema";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Fuel Types
  getFuelTypes(): Promise<FuelType[]>;
  getFuelTypeById(id: number): Promise<FuelType | undefined>;
  createFuelType(fuelType: InsertFuelType): Promise<FuelType>;
  updateFuelTypePrice(id: number, pricePerLiter: string): Promise<FuelType>;
  
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
  getRecentTransactions(limit: number): Promise<TransactionWithRelations[]>;
  generateReceiptNumber(): Promise<string>;
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
}

export const storage = new DatabaseStorage();
