import { 
  users, tasks, userTasks, referrals, boosts, userBoosts, transactions, settings,
  type User, type InsertUser, type Task, type InsertTask, type UserTask, 
  type Referral, type Boost, type InsertBoost, type UserBoost, type Transaction, 
  type InsertTransaction, type Setting
} from "@shared/schema";
import { db } from "./db";
import { eq, and, sql } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByTelegramId(telegramId: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<User>): Promise<User>;
  getAllUsers(): Promise<User[]>;
  updateUserBalance(id: number, amount: string): Promise<User>;
  
  // Task operations
  getAllTasks(): Promise<Task[]>;
  getActiveTask(): Promise<Task[]>;
  createTask(task: InsertTask): Promise<Task>;
  updateTask(id: number, task: Partial<Task>): Promise<Task>;
  
  // User task operations
  getUserTasks(userId: number): Promise<UserTask[]>;
  completeTask(userId: number, taskId: number): Promise<UserTask>;
  isTaskCompleted(userId: number, taskId: number): Promise<boolean>;
  
  // Referral operations
  getUserReferrals(userId: number): Promise<Referral[]>;
  createReferral(referrerId: number, referredId: number, level: number): Promise<Referral>;
  getReferralStats(userId: number): Promise<{ level1: number; level2: number; level3: number }>;
  
  // Boost operations
  getAllBoosts(): Promise<Boost[]>;
  getActiveBoosts(): Promise<Boost[]>;
  createBoost(boost: InsertBoost): Promise<Boost>;
  purchaseBoost(userId: number, boostId: number): Promise<UserBoost>;
  getUserActiveBoost(userId: number): Promise<UserBoost | undefined>;
  
  // Transaction operations
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  getUserTransactions(userId: number): Promise<Transaction[]>;
  getPendingWithdrawals(): Promise<Transaction[]>;
  updateTransactionStatus(id: number, status: string): Promise<Transaction>;
  
  // Settings operations
  getSetting(key: string): Promise<Setting | undefined>;
  setSetting(key: string, value: string): Promise<Setting>;
  
  // Farming operations
  startFarming(userId: number): Promise<User>;
  claimFarming(userId: number): Promise<User>;
  
  // Withdrawal validation
  canUserWithdraw(userId: number, amount: string): Promise<{
    canWithdraw: boolean;
    reason?: string;
  }>;
  
  // Deposit handling
  processDeposit(userId: number, amount: string): Promise<User>;
  
  // Admin operations
  getStats(): Promise<{
    totalUsers: number;
    totalUsdt: string;
    activeFarmers: number;
    pendingWithdrawals: number;
  }>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User> = new Map();
  private tasks: Map<number, Task> = new Map();
  private userTasks: Map<number, UserTask> = new Map();
  private referrals: Map<number, Referral> = new Map();
  private boosts: Map<number, Boost> = new Map();
  private userBoosts: Map<number, UserBoost> = new Map();
  private transactions: Map<number, Transaction> = new Map();
  private settings: Map<string, Setting> = new Map();
  
  private currentUserId = 1;
  private currentTaskId = 1;
  private currentUserTaskId = 1;
  private currentReferralId = 1;
  private currentBoostId = 1;
  private currentUserBoostId = 1;
  private currentTransactionId = 1;
  private currentSettingId = 1;

  constructor() {
    this.seedData();
  }

  private seedData() {
    // Seed default tasks
    const defaultTasks = [
      { title: "Join Telegram Channel", description: "Join our official Telegram channel", reward: "500", taskType: "telegram", taskUrl: "https://t.me/farmingpro", icon: "fab fa-telegram" },
      { title: "Follow Instagram", description: "Follow us on Instagram", reward: "300", taskType: "instagram", taskUrl: "https://instagram.com/farmingpro", icon: "fab fa-instagram" },
      { title: "Subscribe YouTube", description: "Subscribe to our YouTube channel", reward: "800", taskType: "youtube", taskUrl: "https://youtube.com/farmingpro", icon: "fab fa-youtube" },
    ];

    defaultTasks.forEach(task => {
      const taskData: Task = {
        id: this.currentTaskId++,
        ...task,
        isActive: true,
        createdAt: new Date(),
      };
      this.tasks.set(taskData.id, taskData);
    });

    // Seed default boosts
    const defaultBoosts = [
      { name: "Basic Boost", description: "2x farming for 24h", multiplier: "2.00", duration: 24, price: "100" },
      { name: "Premium Boost", description: "3x farming for 48h", multiplier: "3.00", duration: 48, price: "250" },
      { name: "VIP Boost", description: "5x farming for 7 days", multiplier: "5.00", duration: 168, price: "500" },
    ];

    defaultBoosts.forEach(boost => {
      const boostData: Boost = {
        id: this.currentBoostId++,
        ...boost,
        isActive: true,
      };
      this.boosts.set(boostData.id, boostData);
    });

    // Seed default settings
    const defaultSettings = [
      { key: "referral_level1_commission", value: "10" },
      { key: "referral_level2_commission", value: "5" },
      { key: "referral_level3_commission", value: "2" },
      { key: "deposit_enabled", value: "true" },
      { key: "withdrawal_enabled", value: "true" },
    ];

    defaultSettings.forEach(setting => {
      const settingData: Setting = {
        id: this.currentSettingId++,
        key: setting.key,
        value: setting.value,
        updatedAt: new Date(),
      };
      this.settings.set(setting.key, settingData);
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByTelegramId(telegramId: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.telegramId === telegramId);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const user: User = {
      id: this.currentUserId++,
      telegramId: insertUser.telegramId,
      username: insertUser.username,
      balance: "5000.00",
      totalEarned: "0.00",
      referralEarnings: "0.00",
      totalDeposited: "0.00",
      totalWithdrawn: "0.00",
      hasFirstDeposit: false,
      referrerId: insertUser.referrerId || null,
      farmingStartTime: null,
      farmingEndTime: null,
      farmingRate: "120.00",
      boostMultiplier: "1.00",
      boostEndTime: null,
      isActive: true,
      createdAt: new Date(),
    };
    this.users.set(user.id, user);
    
    // Handle referral creation
    if (user.referrerId) {
      await this.createReferral(user.referrerId, user.id, 1);
    }
    
    return user;
  }

  async updateUser(id: number, updateData: Partial<User>): Promise<User> {
    const user = this.users.get(id);
    if (!user) throw new Error('User not found');
    
    const updatedUser = { ...user, ...updateData };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async updateUserBalance(id: number, amount: string): Promise<User> {
    const user = this.users.get(id);
    if (!user) throw new Error('User not found');
    
    const currentBalance = parseFloat(user.balance);
    const newBalance = currentBalance + parseFloat(amount);
    
    return await this.updateUser(id, { balance: newBalance.toString() });
  }

  async getAllTasks(): Promise<Task[]> {
    return Array.from(this.tasks.values());
  }

  async getActiveTask(): Promise<Task[]> {
    return Array.from(this.tasks.values()).filter(task => task.isActive);
  }

  async createTask(insertTask: InsertTask): Promise<Task> {
    const task: Task = {
      id: this.currentTaskId++,
      ...insertTask,
      isActive: true,
      createdAt: new Date(),
    };
    this.tasks.set(task.id, task);
    return task;
  }

  async updateTask(id: number, updateData: Partial<Task>): Promise<Task> {
    const task = this.tasks.get(id);
    if (!task) throw new Error('Task not found');
    
    const updatedTask = { ...task, ...updateData };
    this.tasks.set(id, updatedTask);
    return updatedTask;
  }

  async getUserTasks(userId: number): Promise<UserTask[]> {
    return Array.from(this.userTasks.values()).filter(userTask => userTask.userId === userId);
  }

  async completeTask(userId: number, taskId: number): Promise<UserTask> {
    const userTask: UserTask = {
      id: this.currentUserTaskId++,
      userId,
      taskId,
      completedAt: new Date(),
    };
    this.userTasks.set(userTask.id, userTask);

    // Add reward to user balance
    const task = this.tasks.get(taskId);
    if (task) {
      await this.updateUserBalance(userId, task.reward);
      await this.createTransaction({
        userId,
        type: 'task',
        amount: task.reward,
        description: `Completed task: ${task.title}`,
      });
    }

    return userTask;
  }

  async isTaskCompleted(userId: number, taskId: number): Promise<boolean> {
    return Array.from(this.userTasks.values()).some(
      userTask => userTask.userId === userId && userTask.taskId === taskId
    );
  }

  async getUserReferrals(userId: number): Promise<Referral[]> {
    return Array.from(this.referrals.values()).filter(referral => referral.referrerId === userId);
  }

  async createReferral(referrerId: number, referredId: number, level: number): Promise<Referral> {
    const commissionSetting = await this.getSetting(`referral_level${level}_commission`);
    const commission = commissionSetting ? parseFloat(commissionSetting.value) : 0;

    const referral: Referral = {
      id: this.currentReferralId++,
      referrerId,
      referredId,
      level,
      commission: commission.toString(),
      createdAt: new Date(),
    };
    this.referrals.set(referral.id, referral);

    // Create referrals for upper levels
    if (level < 3) {
      const referrer = await this.getUser(referrerId);
      if (referrer && referrer.referrerId) {
        await this.createReferral(referrer.referrerId, referredId, level + 1);
      }
    }

    return referral;
  }

  async getReferralStats(userId: number): Promise<{ level1: number; level2: number; level3: number }> {
    const referrals = await this.getUserReferrals(userId);
    return {
      level1: referrals.filter(r => r.level === 1).length,
      level2: referrals.filter(r => r.level === 2).length,
      level3: referrals.filter(r => r.level === 3).length,
    };
  }

  async getAllBoosts(): Promise<Boost[]> {
    return Array.from(this.boosts.values());
  }

  async getActiveBoosts(): Promise<Boost[]> {
    return Array.from(this.boosts.values()).filter(boost => boost.isActive);
  }

  async createBoost(insertBoost: InsertBoost): Promise<Boost> {
    const boost: Boost = {
      id: this.currentBoostId++,
      ...insertBoost,
      isActive: true,
    };
    this.boosts.set(boost.id, boost);
    return boost;
  }

  async purchaseBoost(userId: number, boostId: number): Promise<UserBoost> {
    const boost = this.boosts.get(boostId);
    if (!boost) throw new Error('Boost not found');

    const user = await this.getUser(userId);
    if (!user) throw new Error('User not found');

    if (parseFloat(user.balance) < parseFloat(boost.price)) {
      throw new Error('Insufficient balance');
    }

    // Deduct balance
    await this.updateUserBalance(userId, `-${boost.price}`);

    // Create user boost
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + boost.duration);

    const userBoost: UserBoost = {
      id: this.currentUserBoostId++,
      userId,
      boostId,
      purchasedAt: new Date(),
      expiresAt,
    };
    this.userBoosts.set(userBoost.id, userBoost);

    // Update user boost multiplier
    await this.updateUser(userId, {
      boostMultiplier: boost.multiplier,
      boostEndTime: expiresAt,
    });

    // Create transaction
    await this.createTransaction({
      userId,
      type: 'boost',
      amount: `-${boost.price}`,
      description: `Purchased ${boost.name}`,
    });

    return userBoost;
  }

  async getUserActiveBoost(userId: number): Promise<UserBoost | undefined> {
    const now = new Date();
    return Array.from(this.userBoosts.values()).find(
      userBoost => userBoost.userId === userId && userBoost.expiresAt > now
    );
  }

  async createTransaction(insertTransaction: InsertTransaction): Promise<Transaction> {
    const transaction: Transaction = {
      id: this.currentTransactionId++,
      ...insertTransaction,
      status: 'completed',
      createdAt: new Date(),
    };
    this.transactions.set(transaction.id, transaction);
    return transaction;
  }

  async getUserTransactions(userId: number): Promise<Transaction[]> {
    return Array.from(this.transactions.values())
      .filter(transaction => transaction.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getPendingWithdrawals(): Promise<Transaction[]> {
    return Array.from(this.transactions.values())
      .filter(transaction => transaction.type === 'withdrawal' && transaction.status === 'pending');
  }

  async updateTransactionStatus(id: number, status: string): Promise<Transaction> {
    const transaction = this.transactions.get(id);
    if (!transaction) throw new Error('Transaction not found');
    
    const updatedTransaction = { ...transaction, status };
    this.transactions.set(id, updatedTransaction);
    return updatedTransaction;
  }

  async getSetting(key: string): Promise<Setting | undefined> {
    return this.settings.get(key);
  }

  async setSetting(key: string, value: string): Promise<Setting> {
    const existing = this.settings.get(key);
    const setting: Setting = {
      id: existing?.id || this.currentSettingId++,
      key,
      value,
      updatedAt: new Date(),
    };
    this.settings.set(key, setting);
    return setting;
  }

  async startFarming(userId: number): Promise<User> {
    const user = await this.getUser(userId);
    if (!user) throw new Error('User not found');

    const now = new Date();
    const endTime = new Date(now.getTime() + 4 * 60 * 60 * 1000); // 4 hours

    return await this.updateUser(userId, {
      farmingStartTime: now,
      farmingEndTime: endTime,
    });
  }

  async claimFarming(userId: number): Promise<User> {
    const user = await this.getUser(userId);
    if (!user) throw new Error('User not found');

    if (!user.farmingStartTime || !user.farmingEndTime) {
      throw new Error('No active farming session');
    }

    const now = new Date();
    if (now < user.farmingEndTime) {
      throw new Error('Farming not yet complete');
    }

    // Calculate earnings
    const hours = (user.farmingEndTime.getTime() - user.farmingStartTime.getTime()) / (1000 * 60 * 60);
    const baseEarnings = hours * parseFloat(user.farmingRate);
    const boostedEarnings = baseEarnings * parseFloat(user.boostMultiplier);

    // Update user balance and stats
    await this.updateUserBalance(userId, boostedEarnings.toString());
    const updatedUser = await this.updateUser(userId, {
      totalEarned: (parseFloat(user.totalEarned) + boostedEarnings).toString(),
      farmingStartTime: null,
      farmingEndTime: null,
    });

    // Create transaction
    await this.createTransaction({
      userId,
      type: 'farming',
      amount: boostedEarnings.toString(),
      description: `Farming completed: ${hours}h × ${user.farmingRate} USDT/h × ${user.boostMultiplier}x`,
    });

    return updatedUser;
  }

  async canUserWithdraw(userId: number, amount: string): Promise<{
    canWithdraw: boolean;
    reason?: string;
  }> {
    const user = await this.getUser(userId);
    if (!user) {
      return { canWithdraw: false, reason: "User not found" };
    }

    const withdrawAmount = parseFloat(amount);
    
    // Minimum withdrawal $12
    if (withdrawAmount < 12) {
      return { canWithdraw: false, reason: "Minimum withdrawal is $12" };
    }

    // Must have first deposit of $5
    if (!user.hasFirstDeposit) {
      return { canWithdraw: false, reason: "You must make a first deposit of $5 before withdrawing" };
    }

    // Must have $3 deposit for each withdrawal
    const totalWithdrawn = parseFloat(user.totalWithdrawn);
    const totalDeposited = parseFloat(user.totalDeposited);
    const requiredDeposit = (totalWithdrawn / 1) * 3; // $3 for each previous withdrawal

    if (totalDeposited < 5 + requiredDeposit) {
      const needed = (5 + requiredDeposit - totalDeposited).toFixed(2);
      return { canWithdraw: false, reason: `You need to deposit $${needed} more to withdraw` };
    }

    // Check sufficient balance
    if (parseFloat(user.balance) < withdrawAmount) {
      return { canWithdraw: false, reason: "Insufficient balance" };
    }

    return { canWithdraw: true };
  }

  async processDeposit(userId: number, amount: string): Promise<User> {
    const user = await this.getUser(userId);
    if (!user) throw new Error('User not found');

    const depositAmount = parseFloat(amount);
    const newTotalDeposited = parseFloat(user.totalDeposited) + depositAmount;
    
    // Check if this is first deposit
    const isFirstDeposit = !user.hasFirstDeposit && depositAmount >= 5;

    // Update user balance and deposit stats
    await this.updateUserBalance(userId, amount);
    const updatedUser = await this.updateUser(userId, {
      totalDeposited: newTotalDeposited.toString(),
      hasFirstDeposit: user.hasFirstDeposit || isFirstDeposit,
    });

    // Create transaction
    await this.createTransaction({
      userId,
      type: 'deposit',
      amount: amount,
      description: isFirstDeposit ? 'First deposit - Withdrawal enabled' : 'Deposit to wallet',
    });

    return updatedUser;
  }

  async getStats(): Promise<{
    totalUsers: number;
    totalUsdt: string;
    activeFarmers: number;
    pendingWithdrawals: number;
  }> {
    const allUsers = await this.getAllUsers();
    const totalUsdt = allUsers.reduce((sum, user) => sum + parseFloat(user.balance), 0);
    const activeFarmers = allUsers.filter(user => user.farmingStartTime && user.farmingEndTime).length;
    const pendingWithdrawals = (await this.getPendingWithdrawals()).length;

    return {
      totalUsers: allUsers.length,
      totalUsdt: totalUsdt.toFixed(2),
      activeFarmers,
      pendingWithdrawals,
    };
  }
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByTelegramId(telegramId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.telegramId, telegramId));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values({
        telegramId: insertUser.telegramId,
        username: insertUser.username,
        balance: "5000.00",
        totalEarned: "0.00",
        referralEarnings: "0.00",
        totalDeposited: "0.00",
        totalWithdrawn: "0.00",
        hasFirstDeposit: false,
        referrerId: insertUser.referrerId || null,
        farmingStartTime: null,
        farmingEndTime: null,
        farmingRate: "120.00",
        boostMultiplier: "1.00",
        boostEndTime: null,
        isActive: true,
      })
      .returning();
    return user;
  }

  async updateUser(id: number, updateData: Partial<User>): Promise<User> {
    const [user] = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, id))
      .returning();
    if (!user) throw new Error('User not found');
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async updateUserBalance(id: number, amount: string): Promise<User> {
    const user = await this.getUser(id);
    if (!user) throw new Error('User not found');
    
    const currentBalance = parseFloat(user.balance);
    const changeAmount = parseFloat(amount);
    const newBalance = (currentBalance + changeAmount).toFixed(2);
    
    return await this.updateUser(id, { balance: newBalance });
  }

  async getAllTasks(): Promise<Task[]> {
    return await db.select().from(tasks);
  }

  async getActiveTask(): Promise<Task[]> {
    return await db.select().from(tasks).where(eq(tasks.isActive, true));
  }

  async createTask(insertTask: InsertTask): Promise<Task> {
    const [task] = await db
      .insert(tasks)
      .values(insertTask)
      .returning();
    return task;
  }

  async updateTask(id: number, updateData: Partial<Task>): Promise<Task> {
    const [task] = await db
      .update(tasks)
      .set(updateData)
      .where(eq(tasks.id, id))
      .returning();
    if (!task) throw new Error('Task not found');
    return task;
  }

  async getUserTasks(userId: number): Promise<UserTask[]> {
    return await db.select().from(userTasks).where(eq(userTasks.userId, userId));
  }

  async completeTask(userId: number, taskId: number): Promise<UserTask> {
    const [userTask] = await db
      .insert(userTasks)
      .values({
        userId,
        taskId,
      })
      .returning();
    return userTask;
  }

  async isTaskCompleted(userId: number, taskId: number): Promise<boolean> {
    const [userTask] = await db
      .select()
      .from(userTasks)
      .where(and(eq(userTasks.userId, userId), eq(userTasks.taskId, taskId)));
    return !!userTask;
  }

  async getUserReferrals(userId: number): Promise<Referral[]> {
    return await db.select().from(referrals).where(eq(referrals.referrerId, userId));
  }

  async createReferral(referrerId: number, referredId: number, level: number): Promise<Referral> {
    const [referral] = await db
      .insert(referrals)
      .values({
        referrerId,
        referredId,
        level,
        commission: level === 1 ? "0.10" : level === 2 ? "0.05" : "0.02",
      })
      .returning();
    return referral;
  }

  async getReferralStats(userId: number): Promise<{ level1: number; level2: number; level3: number }> {
    const stats = await db
      .select({
        level: referrals.level,
        count: sql<number>`count(*)::int`
      })
      .from(referrals)
      .where(eq(referrals.referrerId, userId))
      .groupBy(referrals.level);

    const result = { level1: 0, level2: 0, level3: 0 };
    stats.forEach(stat => {
      if (stat.level === 1) result.level1 = stat.count;
      if (stat.level === 2) result.level2 = stat.count;
      if (stat.level === 3) result.level3 = stat.count;
    });
    
    return result;
  }

  async getAllBoosts(): Promise<Boost[]> {
    return await db.select().from(boosts);
  }

  async getActiveBoosts(): Promise<Boost[]> {
    return await db.select().from(boosts).where(eq(boosts.isActive, true));
  }

  async createBoost(insertBoost: InsertBoost): Promise<Boost> {
    const [boost] = await db
      .insert(boosts)
      .values(insertBoost)
      .returning();
    return boost;
  }

  async purchaseBoost(userId: number, boostId: number): Promise<UserBoost> {
    const boost = await db.select().from(boosts).where(eq(boosts.id, boostId));
    if (!boost[0]) throw new Error('Boost not found');

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + boost[0].duration);

    const [userBoost] = await db
      .insert(userBoosts)
      .values({
        userId,
        boostId,
        expiresAt,
      })
      .returning();
    return userBoost;
  }

  async getUserActiveBoost(userId: number): Promise<UserBoost | undefined> {
    const [userBoost] = await db
      .select()
      .from(userBoosts)
      .where(and(eq(userBoosts.userId, userId), sql`${userBoosts.expiresAt} > NOW()`))
      .orderBy(sql`${userBoosts.expiresAt} DESC`)
      .limit(1);
    return userBoost || undefined;
  }

  async createTransaction(insertTransaction: InsertTransaction): Promise<Transaction> {
    const [transaction] = await db
      .insert(transactions)
      .values({
        ...insertTransaction,
        status: "pending",
      })
      .returning();
    return transaction;
  }

  async getUserTransactions(userId: number): Promise<Transaction[]> {
    return await db
      .select()
      .from(transactions)
      .where(eq(transactions.userId, userId))
      .orderBy(sql`${transactions.createdAt} DESC`);
  }

  async getPendingWithdrawals(): Promise<Transaction[]> {
    return await db
      .select()
      .from(transactions)
      .where(and(eq(transactions.type, "withdrawal"), eq(transactions.status, "pending")));
  }

  async updateTransactionStatus(id: number, status: string): Promise<Transaction> {
    const [transaction] = await db
      .update(transactions)
      .set({ status })
      .where(eq(transactions.id, id))
      .returning();
    if (!transaction) throw new Error('Transaction not found');
    return transaction;
  }

  async getSetting(key: string): Promise<Setting | undefined> {
    const [setting] = await db.select().from(settings).where(eq(settings.key, key));
    return setting || undefined;
  }

  async setSetting(key: string, value: string): Promise<Setting> {
    const existing = await this.getSetting(key);
    if (existing) {
      const [setting] = await db
        .update(settings)
        .set({ value, updatedAt: new Date() })
        .where(eq(settings.key, key))
        .returning();
      return setting;
    } else {
      const [setting] = await db
        .insert(settings)
        .values({ key, value })
        .returning();
      return setting;
    }
  }

  async startFarming(userId: number): Promise<User> {
    const farmingStartTime = new Date();
    const farmingEndTime = new Date();
    farmingEndTime.setHours(farmingEndTime.getHours() + 4);

    return await this.updateUser(userId, {
      farmingStartTime,
      farmingEndTime,
    });
  }

  async claimFarming(userId: number): Promise<User> {
    const user = await this.getUser(userId);
    if (!user) throw new Error('User not found');

    if (!user.farmingEndTime || new Date() < user.farmingEndTime) {
      throw new Error('Farming not ready to claim');
    }

    const farmingRate = parseFloat(user.farmingRate);
    const boostMultiplier = parseFloat(user.boostMultiplier);
    const earnings = (farmingRate * 4 * boostMultiplier).toFixed(2);

    const newBalance = (parseFloat(user.balance) + parseFloat(earnings)).toFixed(2);
    const newTotalEarned = (parseFloat(user.totalEarned) + parseFloat(earnings)).toFixed(2);

    await this.createTransaction({
      userId,
      type: "farming",
      amount: earnings,
      description: "Farming reward claimed",
    });

    return await this.updateUser(userId, {
      balance: newBalance,
      totalEarned: newTotalEarned,
      farmingStartTime: null,
      farmingEndTime: null,
    });
  }

  async canUserWithdraw(userId: number, amount: string): Promise<{
    canWithdraw: boolean;
    reason?: string;
  }> {
    const user = await this.getUser(userId);
    if (!user) {
      return { canWithdraw: false, reason: "User not found" };
    }

    const withdrawAmount = parseFloat(amount);
    
    // Minimum withdrawal $12
    if (withdrawAmount < 12) {
      return { canWithdraw: false, reason: "Minimum withdrawal is $12" };
    }

    // Must have first deposit of $5
    if (!user.hasFirstDeposit) {
      return { canWithdraw: false, reason: "You must make a first deposit of $5 before withdrawing" };
    }

    // Must have $3 deposit for each withdrawal
    const totalWithdrawn = parseFloat(user.totalWithdrawn);
    const totalDeposited = parseFloat(user.totalDeposited);
    const requiredDeposit = (totalWithdrawn / 1) * 3; // $3 for each previous withdrawal

    if (totalDeposited < 5 + requiredDeposit) {
      const needed = (5 + requiredDeposit - totalDeposited).toFixed(2);
      return { canWithdraw: false, reason: `You need to deposit $${needed} more to withdraw` };
    }

    // Check sufficient balance
    if (parseFloat(user.balance) < withdrawAmount) {
      return { canWithdraw: false, reason: "Insufficient balance" };
    }

    return { canWithdraw: true };
  }

  async processDeposit(userId: number, amount: string): Promise<User> {
    const user = await this.getUser(userId);
    if (!user) throw new Error('User not found');

    const depositAmount = parseFloat(amount);
    const newTotalDeposited = parseFloat(user.totalDeposited) + depositAmount;
    
    // Check if this is first deposit
    const isFirstDeposit = !user.hasFirstDeposit && depositAmount >= 5;

    // Update user balance and deposit stats
    await this.updateUserBalance(userId, amount);
    const updatedUser = await this.updateUser(userId, {
      totalDeposited: newTotalDeposited.toString(),
      hasFirstDeposit: user.hasFirstDeposit || isFirstDeposit,
    });

    // Create transaction
    await this.createTransaction({
      userId,
      type: 'deposit',
      amount: amount,
      description: isFirstDeposit ? 'First deposit - Withdrawal enabled' : 'Deposit to wallet',
    });

    return updatedUser;
  }

  async getStats(): Promise<{
    totalUsers: number;
    totalUsdt: string;
    activeFarmers: number;
    pendingWithdrawals: number;
  }> {
    const allUsers = await this.getAllUsers();
    const totalUsdt = allUsers.reduce((sum, user) => sum + parseFloat(user.balance), 0);
    const activeFarmers = allUsers.filter(user => user.farmingStartTime && user.farmingEndTime).length;
    const pendingWithdrawals = (await this.getPendingWithdrawals()).length;

    return {
      totalUsers: allUsers.length,
      totalUsdt: totalUsdt.toFixed(2),
      activeFarmers,
      pendingWithdrawals,
    };
  }
}

async function seedDatabase() {
  try {
    // Check if data already exists
    const existingTasks = await db.select().from(tasks).limit(1);
    if (existingTasks.length > 0) {
      console.log('Database already seeded');
      return;
    }

    console.log('Seeding database...');

    // Insert initial tasks
    const taskData = [
      {
        title: "Follow our Telegram",
        description: "Join our official Telegram channel for updates",
        reward: "50.00",
        taskType: "telegram",
        taskUrl: "https://t.me/farmingpro_official",
        icon: "MessageCircle"
      },
      {
        title: "Follow Instagram",
        description: "Follow our Instagram page",
        reward: "30.00",
        taskType: "instagram",
        taskUrl: "https://instagram.com/farmingpro",
        icon: "Instagram"
      },
      {
        title: "Subscribe YouTube",
        description: "Subscribe to our YouTube channel",
        reward: "75.00",
        taskType: "youtube",
        taskUrl: "https://youtube.com/@farmingpro",
        icon: "Youtube"
      }
    ];

    await db.insert(tasks).values(taskData);

    // Insert initial boosts
    const boostData = [
      {
        name: "Speed Boost",
        description: "Double your farming speed for 24 hours",
        multiplier: "2.00",
        duration: 24,
        price: "100.00"
      },
      {
        name: "Mega Boost",
        description: "Triple your farming speed for 12 hours",
        multiplier: "3.00",
        duration: 12,
        price: "200.00"
      },
      {
        name: "Ultra Boost",
        description: "5x farming speed for 6 hours",
        multiplier: "5.00",
        duration: 6,
        price: "300.00"
      }
    ];

    await db.insert(boosts).values(boostData);

    // Insert initial settings
    const settingData = [
      { key: "farming_rate", value: "120.00" },
      { key: "referral_level1_rate", value: "0.10" },
      { key: "referral_level2_rate", value: "0.05" },
      { key: "referral_level3_rate", value: "0.02" },
      { key: "min_withdrawal", value: "12.00" },
      { key: "first_deposit_requirement", value: "5.00" },
      { key: "withdrawal_deposit_fee", value: "3.00" }
    ];

    await db.insert(settings).values(settingData);

    console.log('Database seeded successfully');
  } catch (error) {
    console.error('Error seeding database:', error);
  }
}

export const storage = new DatabaseStorage();

// Seed database on startup
seedDatabase();
