import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertTaskSchema, insertBoostSchema, insertTransactionSchema } from "@shared/schema";
import { handleTelegramUpdate } from "./telegram";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  
  // User routes
  app.post("/api/users", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const user = await storage.createUser(userData);
      res.json(user);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  app.get("/api/users/:telegramId", async (req, res) => {
    try {
      const user = await storage.getUserByTelegramId(req.params.telegramId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json(user);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  app.get("/api/users", async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  app.put("/api/users/:id", async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const user = await storage.updateUser(userId, req.body);
      res.json(user);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  // Farming routes
  app.post("/api/farming/start", async (req, res) => {
    try {
      const { userId } = req.body;
      const user = await storage.startFarming(userId);
      res.json(user);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  app.post("/api/farming/claim", async (req, res) => {
    try {
      const { userId } = req.body;
      const user = await storage.claimFarming(userId);
      res.json(user);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  // Task routes
  app.get("/api/tasks", async (req, res) => {
    try {
      const tasks = await storage.getActiveTask();
      res.json(tasks);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  app.post("/api/tasks", async (req, res) => {
    try {
      const taskData = insertTaskSchema.parse(req.body);
      const task = await storage.createTask(taskData);
      res.json(task);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  app.get("/api/users/:userId/tasks", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const userTasks = await storage.getUserTasks(userId);
      res.json(userTasks);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  app.post("/api/users/:userId/tasks/:taskId/complete", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const taskId = parseInt(req.params.taskId);
      const userTask = await storage.completeTask(userId, taskId);
      res.json(userTask);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  // Referral routes
  app.get("/api/users/:userId/referrals", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const referrals = await storage.getUserReferrals(userId);
      res.json(referrals);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  app.get("/api/users/:userId/referral-stats", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const stats = await storage.getReferralStats(userId);
      res.json(stats);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  // Boost routes
  app.get("/api/boosts", async (req, res) => {
    try {
      const boosts = await storage.getActiveBoosts();
      res.json(boosts);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  app.post("/api/boosts", async (req, res) => {
    try {
      const boostData = insertBoostSchema.parse(req.body);
      const boost = await storage.createBoost(boostData);
      res.json(boost);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  app.post("/api/users/:userId/boosts/:boostId/purchase", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const boostId = parseInt(req.params.boostId);
      const userBoost = await storage.purchaseBoost(userId, boostId);
      res.json(userBoost);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  app.get("/api/users/:userId/active-boost", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const activeBoost = await storage.getUserActiveBoost(userId);
      res.json(activeBoost);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  // Transaction routes
  app.get("/api/users/:userId/transactions", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const transactions = await storage.getUserTransactions(userId);
      res.json(transactions);
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  });

  app.post("/api/transactions/deposit", async (req, res) => {
    try {
      const { userId, amount } = req.body;
      const user = await storage.processDeposit(userId, amount);
      res.json(user);
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  });

  app.post("/api/transactions/withdraw", async (req, res) => {
    try {
      const { userId, amount } = req.body;
      
      // Validate withdrawal eligibility
      const validation = await storage.canUserWithdraw(userId, amount);
      if (!validation.canWithdraw) {
        return res.status(400).json({ error: validation.reason });
      }

      // Process withdrawal
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Update user balance and withdrawal stats
      await storage.updateUserBalance(userId, `-${amount}`);
      const newTotalWithdrawn = parseFloat(user.totalWithdrawn) + parseFloat(amount);
      await storage.updateUser(userId, {
        totalWithdrawn: newTotalWithdrawn.toString(),
      });

      // Create withdrawal transaction (pending status)
      const transaction = await storage.createTransaction({
        userId,
        type: 'withdrawal',
        amount: `-${amount}`,
        description: 'Withdrawal request',
      });

      res.json(transaction);
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  });

  app.post("/api/transactions", async (req, res) => {
    try {
      const transactionData = insertTransactionSchema.parse(req.body);
      const transaction = await storage.createTransaction(transactionData);
      res.json(transaction);
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  });

  app.get("/api/admin/withdrawals", async (req, res) => {
    try {
      const withdrawals = await storage.getPendingWithdrawals();
      res.json(withdrawals);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  app.put("/api/transactions/:id/status", async (req, res) => {
    try {
      const transactionId = parseInt(req.params.id);
      const { status } = req.body;
      const transaction = await storage.updateTransactionStatus(transactionId, status);
      res.json(transaction);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  // Settings routes
  app.get("/api/settings/:key", async (req, res) => {
    try {
      const setting = await storage.getSetting(req.params.key);
      res.json(setting);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  app.put("/api/settings/:key", async (req, res) => {
    try {
      const { value } = req.body;
      const setting = await storage.setSetting(req.params.key, value);
      res.json(setting);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  // Admin stats
  app.get("/api/admin/stats", async (req, res) => {
    try {
      const stats = await storage.getStats();
      res.json(stats);
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  });

  // Telegram webhook
  app.post("/api/telegram/webhook", async (req, res) => {
    try {
      await handleTelegramUpdate(req.body);
      res.sendStatus(200);
    } catch (error) {
      console.error('Telegram webhook error:', error);
      res.sendStatus(500);
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
