import { pgTable, text, serial, integer, boolean, decimal, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").unique(),
  role: text("role").default("customer").notNull(), // customer, admin, operator
  stripeCustomerId: text("stripe_customer_id"),
  isActive: boolean("is_active").notNull().default(true),
  lastLoginAt: timestamp("last_login_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const fuelTypeEnum = pgEnum("fuel_type", ["gasoline91", "gasoline95", "e20", "diesel"]);
export const paymentStatusEnum = pgEnum("payment_status", ["pending", "processing", "success", "failed", "cancelled"]);
export const transactionStatusEnum = pgEnum("transaction_status", ["pending", "completed", "cancelled", "dispensing"]);
export const paymentMethodEnum = pgEnum("payment_method", ["promptpay", "stripe", "cash"]);
export const auditActionEnum = pgEnum("audit_action", ["create", "update", "delete", "login", "logout", "payment", "dispensing"]);

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
  userId: integer("user_id"),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  volume: decimal("volume", { precision: 10, scale: 3 }),
  pricePerLiter: decimal("price_per_liter", { precision: 10, scale: 2 }).notNull(),
  paymentMethod: paymentMethodEnum("payment_method").notNull().default("promptpay"),
  paymentStatus: paymentStatusEnum("payment_status").notNull().default("pending"),
  transactionStatus: transactionStatusEnum("transaction_status").notNull().default("pending"),
  qrCodeUrl: text("qr_code_url"),
  promptPayReference: text("promptpay_reference"),
  stripePaymentIntentId: text("stripe_payment_intent_id"),
  receiptNumber: text("receipt_number"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// New tables for admin functionality
export const auditLogs = pgTable("audit_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id"),
  action: auditActionEnum("action").notNull(),
  tableName: text("table_name"),
  recordId: text("record_id"),
  oldValues: text("old_values"), // JSON string
  newValues: text("new_values"), // JSON string
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const systemConfig = pgTable("system_config", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(),
  value: text("value").notNull(),
  description: text("description"),
  isPublic: boolean("is_public").notNull().default(false),
  updatedBy: integer("updated_by"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const maintenanceRecords = pgTable("maintenance_records", {
  id: serial("id").primaryKey(),
  pumpId: integer("pump_id").notNull(),
  description: text("description").notNull(),
  performedBy: integer("performed_by").notNull(),
  scheduledDate: timestamp("scheduled_date"),
  completedDate: timestamp("completed_date"),
  status: text("status").notNull().default("scheduled"), // scheduled, in_progress, completed, cancelled
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
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
  user: one(users, {
    fields: [transactions.userId],
    references: [users.id],
  }),
}));

export const pumpRelations = relations(pumps, ({ many }) => ({
  transactions: many(transactions),
  maintenanceRecords: many(maintenanceRecords),
}));

export const fuelTypeRelations = relations(fuelTypes, ({ many }) => ({
  transactions: many(transactions),
}));

export const userRelations = relations(users, ({ many }) => ({
  transactions: many(transactions),
  auditLogs: many(auditLogs),
  performedMaintenance: many(maintenanceRecords),
}));

export const auditLogRelations = relations(auditLogs, ({ one }) => ({
  user: one(users, {
    fields: [auditLogs.userId],
    references: [users.id],
  }),
}));

export const maintenanceRecordRelations = relations(maintenanceRecords, ({ one }) => ({
  pump: one(pumps, {
    fields: [maintenanceRecords.pumpId],
    references: [pumps.id],
  }),
  performedBy: one(users, {
    fields: [maintenanceRecords.performedBy],
    references: [users.id],
  }),
}));

export const systemConfigRelations = relations(systemConfig, ({ one }) => ({
  updatedBy: one(users, {
    fields: [systemConfig.updatedBy],
    references: [users.id],
  }),
}));

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
  role: true,
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

export const insertAuditLogSchema = createInsertSchema(auditLogs).omit({
  id: true,
  createdAt: true,
});

export const insertSystemConfigSchema = createInsertSchema(systemConfig).omit({
  id: true,
  updatedAt: true,
});

export const insertMaintenanceRecordSchema = createInsertSchema(maintenanceRecords).omit({
  id: true,
  createdAt: true,
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertFuelType = z.infer<typeof insertFuelTypeSchema>;
export type FuelType = typeof fuelTypes.$inferSelect;
export type InsertPump = z.infer<typeof insertPumpSchema>;
export type Pump = typeof pumps.$inferSelect;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type Transaction = typeof transactions.$inferSelect;
export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;
export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertSystemConfig = z.infer<typeof insertSystemConfigSchema>;
export type SystemConfig = typeof systemConfig.$inferSelect;
export type InsertMaintenanceRecord = z.infer<typeof insertMaintenanceRecordSchema>;
export type MaintenanceRecord = typeof maintenanceRecords.$inferSelect;

export type TransactionWithRelations = Transaction & {
  pump: Pump;
  fuelType: FuelType;
  user?: User;
};

export type MaintenanceRecordWithRelations = Omit<MaintenanceRecord, 'performedBy'> & {
  pump: Pump;
  performedBy: User;
};

export type AuditLogWithRelations = AuditLog & {
  user?: User;
};
