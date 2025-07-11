import { pgTable, text, serial, integer, boolean, decimal, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const fuelTypeEnum = pgEnum("fuel_type", ["gasoline91", "gasoline95", "e20", "diesel"]);
export const paymentStatusEnum = pgEnum("payment_status", ["pending", "processing", "success", "failed", "cancelled"]);
export const transactionStatusEnum = pgEnum("transaction_status", ["pending", "completed", "cancelled", "dispensing"]);

export const fuelTypes = pgTable("fuel_types", {
  id: serial("id").primaryKey(),
  type: fuelTypeEnum("type").notNull().unique(),
  name: text("name").notNull(),
  pricePerLiter: decimal("price_per_liter", { precision: 10, scale: 2 }).notNull(),
  isActive: boolean("is_active").notNull().default(true),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const pumps = pgTable("pumps", {
  id: serial("id").primaryKey(),
  number: integer("number").notNull().unique(),
  isActive: boolean("is_active").notNull().default(true),
  isOnline: boolean("is_online").notNull().default(true),
});

export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  transactionId: text("transaction_id").notNull().unique(),
  pumpId: integer("pump_id").notNull(),
  fuelTypeId: integer("fuel_type_id").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  volume: decimal("volume", { precision: 10, scale: 3 }),
  pricePerLiter: decimal("price_per_liter", { precision: 10, scale: 2 }).notNull(),
  paymentStatus: paymentStatusEnum("payment_status").notNull().default("pending"),
  transactionStatus: transactionStatusEnum("transaction_status").notNull().default("pending"),
  qrCodeUrl: text("qr_code_url"),
  promptPayReference: text("promptpay_reference"),
  receiptNumber: text("receipt_number"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const transactionRelations = relations(transactions, ({ one }) => ({
  pump: one(pumps, {
    fields: [transactions.pumpId],
    references: [pumps.id],
  }),
  fuelType: one(fuelTypes, {
    fields: [transactions.fuelTypeId],
    references: [fuelTypes.id],
  }),
}));

export const pumpRelations = relations(pumps, ({ many }) => ({
  transactions: many(transactions),
}));

export const fuelTypeRelations = relations(fuelTypes, ({ many }) => ({
  transactions: many(transactions),
}));

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertFuelTypeSchema = createInsertSchema(fuelTypes).omit({
  id: true,
  updatedAt: true,
});

export const insertPumpSchema = createInsertSchema(pumps).omit({
  id: true,
});

export const insertTransactionSchema = createInsertSchema(transactions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertFuelType = z.infer<typeof insertFuelTypeSchema>;
export type FuelType = typeof fuelTypes.$inferSelect;
export type InsertPump = z.infer<typeof insertPumpSchema>;
export type Pump = typeof pumps.$inferSelect;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type Transaction = typeof transactions.$inferSelect;
export type TransactionWithRelations = Transaction & {
  pump: Pump;
  fuelType: FuelType;
};
