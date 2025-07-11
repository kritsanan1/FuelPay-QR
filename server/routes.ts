import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import Stripe from "stripe";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-06-30.basil",
});
import { insertTransactionSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // WebSocket server for real-time updates
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  const clients = new Set<WebSocket>();

  wss.on('connection', (ws) => {
    clients.add(ws);
    console.log('Client connected. Total clients:', clients.size);

    ws.on('close', () => {
      clients.delete(ws);
      console.log('Client disconnected. Total clients:', clients.size);
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
    });
  });

  function broadcastToClients(message: any) {
    const messageStr = JSON.stringify(message);
    clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(messageStr);
      }
    });
  }

  // Initialize data if needed
  app.post('/api/init', async (req, res) => {
    try {
      // Create default fuel types if they don't exist
      const existingFuelTypes = await storage.getFuelTypes();
      if (existingFuelTypes.length === 0) {
        await storage.createFuelType({
          type: "gasoline91",
          name: "เบนซิน 91",
          pricePerLiter: "37.50",
          isActive: true
        });
        await storage.createFuelType({
          type: "gasoline95",
          name: "เบนซิน 95",
          pricePerLiter: "39.80",
          isActive: true
        });
        await storage.createFuelType({
          type: "e20",
          name: "E20",
          pricePerLiter: "35.20",
          isActive: true
        });
        await storage.createFuelType({
          type: "diesel",
          name: "ดีเซล B7",
          pricePerLiter: "32.90",
          isActive: true
        });
      }

      // Create default pumps if they don't exist
      const existingPumps = await storage.getPumps();
      if (existingPumps.length === 0) {
        for (let i = 1; i <= 4; i++) {
          await storage.createPump({
            number: i,
            isActive: true,
            isOnline: true
          });
        }
      }

      res.json({ message: "Initialization completed" });
    } catch (error) {
      console.error('Initialization error:', error);
      res.status(500).json({ message: "Initialization failed", error: String(error) });
    }
  });

  // Get fuel types
  app.get('/api/fuel-types', async (req, res) => {
    try {
      const fuelTypes = await storage.getFuelTypes();
      res.json(fuelTypes);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch fuel types", error: String(error) });
    }
  });

  // Get pumps
  app.get('/api/pumps', async (req, res) => {
    try {
      const pumps = await storage.getPumps();
      res.json(pumps);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch pumps", error: String(error) });
    }
  });

  // Generate QR Code and create transaction
  app.post('/api/generate-qr', async (req, res) => {
    try {
      const createTransactionSchema = z.object({
        pumpId: z.number(),
        fuelTypeId: z.number(),
        amount: z.string(),
        volume: z.string().optional(),
        inputMode: z.enum(['amount', 'volume'])
      });

      const { pumpId, fuelTypeId, amount, volume, inputMode } = createTransactionSchema.parse(req.body);

      // Get fuel type for price validation
      const fuelType = await storage.getFuelTypeById(fuelTypeId);
      if (!fuelType) {
        return res.status(400).json({ message: "Invalid fuel type" });
      }

      // Get pump for validation
      const pump = await storage.getPumpById(pumpId);
      if (!pump || !pump.isActive) {
        return res.status(400).json({ message: "Pump is not available" });
      }

      // Calculate volume/amount based on input mode
      let finalAmount = amount;
      let finalVolume = volume;

      if (inputMode === 'volume' && volume) {
        finalAmount = (parseFloat(volume) * parseFloat(fuelType.pricePerLiter)).toFixed(2);
      } else if (inputMode === 'amount' && amount) {
        finalVolume = (parseFloat(amount) / parseFloat(fuelType.pricePerLiter)).toFixed(3);
      }

      // Generate transaction ID
      const transactionId = `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      // Generate PromptPay QR Code URL
      const promptPayPhone = process.env.PROMPTPAY_PHONE || "0612345678";
      const qrCodeUrl = `https://promptpay.io/${promptPayPhone}/${finalAmount}.png`;

      // Create transaction
      const transaction = await storage.createTransaction({
        transactionId,
        pumpId,
        fuelTypeId,
        amount: finalAmount,
        volume: finalVolume,
        pricePerLiter: fuelType.pricePerLiter,
        paymentStatus: "pending",
        transactionStatus: "pending",
        qrCodeUrl,
        promptPayReference: `${promptPayPhone}-${finalAmount}`
      });

      // Broadcast new transaction to connected clients
      broadcastToClients({
        type: 'transaction_created',
        transaction: await storage.getTransactionById(transaction.id)
      });

      res.json({
        transactionId: transaction.transactionId,
        qrCodeUrl,
        amount: finalAmount,
        volume: finalVolume,
        promptPayReference: transaction.promptPayReference
      });
    } catch (error) {
      console.error('QR generation error:', error);
      res.status(500).json({ message: "Failed to generate QR code", error: String(error) });
    }
  });

  // Check payment status
  app.get('/api/check-payment/:transactionId', async (req, res) => {
    try {
      const { transactionId } = req.params;
      
      const transaction = await storage.getTransactionByTransactionId(transactionId);
      if (!transaction) {
        return res.status(404).json({ message: "Transaction not found" });
      }

      // Simulate payment verification with external API
      // In production, integrate with actual payment gateway API
      let newStatus = transaction.paymentStatus;
      
      if (transaction.paymentStatus === "pending") {
        // Simulate random payment success for demo (70% success rate)
        const randomResult = Math.random();
        if (randomResult > 0.7) {
          newStatus = "success";
          await storage.updateTransactionPaymentStatus(transaction.id, "success");
        } else if (randomResult > 0.3) {
          newStatus = "processing";
          await storage.updateTransactionPaymentStatus(transaction.id, "processing");
        }
      } else if (transaction.paymentStatus === "processing") {
        // After processing, randomly succeed or fail
        const randomResult = Math.random();
        if (randomResult > 0.2) {
          newStatus = "success";
          await storage.updateTransactionPaymentStatus(transaction.id, "success");
        } else {
          newStatus = "failed";
          await storage.updateTransactionPaymentStatus(transaction.id, "failed");
        }
      }

      // Broadcast status update if changed
      if (newStatus !== transaction.paymentStatus) {
        broadcastToClients({
          type: 'payment_status_updated',
          transactionId,
          paymentStatus: newStatus
        });
      }

      res.json({ 
        paymentStatus: newStatus,
        transactionStatus: transaction.transactionStatus,
        transactionId 
      });
    } catch (error) {
      console.error('Payment check error:', error);
      res.status(500).json({ message: "Failed to check payment status", error: String(error) });
    }
  });

  // Start fuel dispensing
  app.post('/api/start-dispensing/:transactionId', async (req, res) => {
    try {
      const { transactionId } = req.params;
      
      const transaction = await storage.getTransactionByTransactionId(transactionId);
      if (!transaction) {
        return res.status(404).json({ message: "Transaction not found" });
      }

      if (transaction.paymentStatus !== "success") {
        return res.status(400).json({ message: "Payment not completed" });
      }

      // Update transaction status to dispensing
      await storage.updateTransactionStatus(transaction.id, "dispensing");

      // Broadcast dispensing started
      broadcastToClients({
        type: 'dispensing_started',
        transactionId,
        transactionStatus: "dispensing"
      });

      res.json({ message: "Dispensing started", transactionId });
    } catch (error) {
      console.error('Start dispensing error:', error);
      res.status(500).json({ message: "Failed to start dispensing", error: String(error) });
    }
  });

  // Complete fuel dispensing
  app.post('/api/complete-dispensing/:transactionId', async (req, res) => {
    try {
      const { transactionId } = req.params;
      const { actualVolume } = req.body;
      
      const transaction = await storage.getTransactionByTransactionId(transactionId);
      if (!transaction) {
        return res.status(404).json({ message: "Transaction not found" });
      }

      // Update transaction with actual dispensed volume
      await storage.updateTransactionVolume(transaction.id, actualVolume);
      await storage.updateTransactionStatus(transaction.id, "completed");

      // Generate receipt number
      const receiptNumber = await storage.generateReceiptNumber();

      // Broadcast dispensing completed
      broadcastToClients({
        type: 'dispensing_completed',
        transactionId,
        actualVolume,
        receiptNumber,
        transactionStatus: "completed"
      });

      res.json({ 
        message: "Dispensing completed", 
        transactionId, 
        actualVolume,
        receiptNumber 
      });
    } catch (error) {
      console.error('Complete dispensing error:', error);
      res.status(500).json({ message: "Failed to complete dispensing", error: String(error) });
    }
  });

  // Get transaction history
  app.get('/api/transactions', async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const transactions = await storage.getRecentTransactions(limit);
      res.json(transactions);
    } catch (error) {
      console.error('Get transactions error:', error);
      res.status(500).json({ message: "Failed to fetch transactions", error: String(error) });
    }
  });

  // Get specific transaction details
  app.get('/api/transactions/:transactionId', async (req, res) => {
    try {
      const { transactionId } = req.params;
      const transaction = await storage.getTransactionByTransactionId(transactionId);
      
      if (!transaction) {
        return res.status(404).json({ message: "Transaction not found" });
      }

      res.json(transaction);
    } catch (error) {
      console.error('Get transaction error:', error);
      res.status(500).json({ message: "Failed to fetch transaction", error: String(error) });
    }
  });

  // Stripe payment endpoints
  app.post('/api/stripe/create-payment-intent', async (req, res) => {
    try {
      const { amount, currency = 'thb', transactionId } = req.body;
      
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to satang for THB
        currency,
        metadata: {
          transactionId,
        },
      });

      // Update transaction with Stripe payment intent ID
      const transaction = await storage.getTransactionByTransactionId(transactionId);
      if (transaction) {
        await storage.updateTransactionStripePaymentIntent(transaction.id, paymentIntent.id);
        await storage.updateTransactionPaymentStatus(transaction.id, "processing");
      }

      res.json({ 
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id
      });
    } catch (error: any) {
      console.error('Stripe payment intent error:', error);
      res.status(500).json({ message: "Error creating payment intent: " + error.message });
    }
  });

  app.post('/api/stripe/confirm-payment', async (req, res) => {
    try {
      const { paymentIntentId } = req.body;
      
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      
      if (paymentIntent.status === 'succeeded') {
        // Find transaction by payment intent ID and update status
        const transactions = await storage.getRecentTransactions(100);
        const transaction = transactions.find(t => t.stripePaymentIntentId === paymentIntentId);
        
        if (transaction) {
          await storage.updateTransactionPaymentStatus(transaction.id, "success");
          
          broadcastToClients({
            type: 'payment_status_updated',
            transactionId: transaction.transactionId,
            paymentStatus: 'success'
          });
        }
      }

      res.json({ 
        status: paymentIntent.status,
        transactionId: paymentIntent.metadata.transactionId 
      });
    } catch (error: any) {
      console.error('Stripe confirm payment error:', error);
      res.status(500).json({ message: "Error confirming payment: " + error.message });
    }
  });

  // Admin Dashboard Routes
  app.get('/api/admin/stats', async (req, res) => {
    try {
      const stats = await storage.getTransactionStats();
      const totalUsers = (await storage.getAllUsers()).length;
      const pumps = await storage.getPumps();
      const activePumps = pumps.filter(p => p.isActive && p.isOnline).length;

      res.json({
        ...stats,
        totalUsers,
        totalPumps: pumps.length,
        activePumps,
      });
    } catch (error: any) {
      console.error('Admin stats error:', error);
      res.status(500).json({ message: "Error fetching admin stats: " + error.message });
    }
  });

  app.get('/api/admin/users', async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      // Remove passwords from response
      const safeUsers = users.map(user => {
        const { password, ...safeUser } = user;
        return safeUser;
      });
      res.json(safeUsers);
    } catch (error: any) {
      console.error('Admin users error:', error);
      res.status(500).json({ message: "Error fetching users: " + error.message });
    }
  });

  app.get('/api/admin/audit-logs', async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;
      const logs = await storage.getAuditLogs(limit, offset);
      res.json(logs);
    } catch (error: any) {
      console.error('Admin audit logs error:', error);
      res.status(500).json({ message: "Error fetching audit logs: " + error.message });
    }
  });

  app.get('/api/admin/maintenance', async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 20;
      const records = await storage.getMaintenanceRecords(limit);
      res.json(records);
    } catch (error: any) {
      console.error('Admin maintenance error:', error);
      res.status(500).json({ message: "Error fetching maintenance records: " + error.message });
    }
  });

  app.post('/api/admin/maintenance', async (req, res) => {
    try {
      const { pumpId, description, performedBy, scheduledDate, notes } = req.body;
      
      const record = await storage.createMaintenanceRecord({
        pumpId,
        description,
        performedBy,
        scheduledDate: scheduledDate ? new Date(scheduledDate) : null,
        notes,
      });

      // Create audit log
      await storage.createAuditLog({
        userId: performedBy,
        action: "create",
        tableName: "maintenance_records",
        recordId: record.id.toString(),
        newValues: JSON.stringify(record),
      });

      res.json(record);
    } catch (error: any) {
      console.error('Create maintenance error:', error);
      res.status(500).json({ message: "Error creating maintenance record: " + error.message });
    }
  });

  app.put('/api/admin/pumps/:id/status', async (req, res) => {
    try {
      const { id } = req.params;
      const { isActive, isOnline } = req.body;
      
      const pump = await storage.updatePumpStatus(parseInt(id), isActive, isOnline);
      
      // Create audit log
      await storage.createAuditLog({
        userId: 1, // System user for now
        action: "update",
        tableName: "pumps",
        recordId: id,
        newValues: JSON.stringify({ isActive, isOnline }),
      });

      res.json(pump);
    } catch (error: any) {
      console.error('Update pump status error:', error);
      res.status(500).json({ message: "Error updating pump status: " + error.message });
    }
  });

  app.put('/api/admin/fuel-types/:id/price', async (req, res) => {
    try {
      const { id } = req.params;
      const { pricePerLiter } = req.body;
      
      const fuelType = await storage.updateFuelTypePrice(parseInt(id), pricePerLiter);
      
      // Create audit log
      await storage.createAuditLog({
        userId: 1, // System user for now
        action: "update",
        tableName: "fuel_types",
        recordId: id,
        newValues: JSON.stringify({ pricePerLiter }),
      });

      res.json(fuelType);
    } catch (error: any) {
      console.error('Update fuel price error:', error);
      res.status(500).json({ message: "Error updating fuel price: " + error.message });
    }
  });

  return httpServer;
}
