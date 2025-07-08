import { storage } from "./storage";

const BOT_TOKEN = "7600661170:AAHXoZ7ibxneM-BFEusTg8r8NdAEaZV8P7s";
const TELEGRAM_API_URL = `https://api.telegram.org/bot${BOT_TOKEN}`;
const WEBAPP_URL = process.env.NODE_ENV === 'production' 
  ? 'https://your-replit-domain.replit.app' 
  : 'http://localhost:5000';

interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
}

interface TelegramMessage {
  message_id: number;
  from: TelegramUser;
  chat: {
    id: number;
    type: string;
  };
  date: number;
  text?: string;
}

interface TelegramUpdate {
  update_id: number;
  message?: TelegramMessage;
}

export async function sendMessage(chatId: number, text: string, keyboard?: any) {
  const payload = {
    chat_id: chatId,
    text,
    parse_mode: 'HTML',
    reply_markup: keyboard
  };

  try {
    const response = await fetch(`${TELEGRAM_API_URL}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    return await response.json();
  } catch (error) {
    console.error('Error sending message:', error);
    return null;
  }
}

export async function setWebhook(webhookUrl: string) {
  try {
    const response = await fetch(`${TELEGRAM_API_URL}/setWebhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: webhookUrl,
        allowed_updates: ['message']
      }),
    });

    return await response.json();
  } catch (error) {
    console.error('Error setting webhook:', error);
    return null;
  }
}

export async function handleTelegramUpdate(update: TelegramUpdate) {
  if (!update.message) return;

  const message = update.message;
  const chatId = message.chat.id;
  const text = message.text || '';
  const user = message.from;

  try {
    // Check if user exists in database
    let dbUser = await storage.getUserByTelegramId(user.id.toString());

    if (text === '/start') {
      // Handle referral code
      const startParam = text.split(' ')[1];
      let referrerId: number | undefined;

      if (startParam && startParam.startsWith('ref_')) {
        referrerId = parseInt(startParam.replace('ref_', ''));
      }

      if (!dbUser) {
        // Create new user
        dbUser = await storage.createUser({
          telegramId: user.id.toString(),
          username: user.username || user.first_name,
          referrerId: referrerId || undefined,
        });

        await sendMessage(chatId, 
          `🌱 <b>Welcome to Farming Pro!</b>\n\n` +
          `Start earning USDT by farming, completing tasks, and referring friends.\n\n` +
          `💰 <b>Starting balance:</b> 5,000 USDT\n` +
          `⏰ <b>Farming rate:</b> 120 USDT/hour\n` +
          `🔗 <b>3-level referral system</b>\n\n` +
          `Click the button below to open the app:`,
          {
            inline_keyboard: [[
              {
                text: '🚀 Open Farming Pro',
                web_app: { url: WEBAPP_URL }
              }
            ]]
          }
        );
      } else {
        await sendMessage(chatId,
          `🌱 <b>Welcome back to Farming Pro!</b>\n\n` +
          `💰 <b>Current balance:</b> ${parseFloat(dbUser.balance).toLocaleString()} USDT\n` +
          `📊 <b>Total earned:</b> ${parseFloat(dbUser.totalEarned).toLocaleString()} USDT\n\n` +
          `Click the button below to continue farming:`,
          {
            inline_keyboard: [[
              {
                text: '🚀 Open Farming Pro',
                web_app: { url: WEBAPP_URL }
              }
            ]]
          }
        );
      }
    } else if (text === '/farm') {
      if (dbUser) {
        await sendMessage(chatId,
          `🌱 <b>Farming Pro Dashboard</b>\n\n` +
          `💰 <b>Balance:</b> ${parseFloat(dbUser.balance).toLocaleString()} USDT\n` +
          `⏰ <b>Farming Rate:</b> ${parseFloat(dbUser.farmingRate).toLocaleString()} USDT/hour\n` +
          `🚀 <b>Boost:</b> ${parseFloat(dbUser.boostMultiplier)}x\n\n` +
          `Click the button below to open the farming app:`,
          {
            inline_keyboard: [[
              {
                text: '🚀 Open Farming Pro',
                web_app: { url: WEBAPP_URL }
              }
            ]]
          }
        );
      } else {
        await sendMessage(chatId, '❌ Please start the bot first with /start');
      }
    } else if (text === '/balance') {
      if (dbUser) {
        await sendMessage(chatId,
          `💰 <b>Your Balance</b>\n\n` +
          `💵 <b>Current:</b> ${parseFloat(dbUser.balance).toLocaleString()} USDT\n` +
          `📈 <b>Total Earned:</b> ${parseFloat(dbUser.totalEarned).toLocaleString()} USDT\n` +
          `👥 <b>Referral Earnings:</b> ${parseFloat(dbUser.referralEarnings).toLocaleString()} USDT\n` +
          `💎 <b>Total Deposited:</b> ${parseFloat(dbUser.totalDeposited || "0").toLocaleString()} USDT\n` +
          `📤 <b>Total Withdrawn:</b> ${parseFloat(dbUser.totalWithdrawn || "0").toLocaleString()} USDT`
        );
      } else {
        await sendMessage(chatId, '❌ Please start the bot first with /start');
      }
    } else if (text === '/referral') {
      if (dbUser) {
        const stats = await storage.getReferralStats(dbUser.id);
        const referralLink = `https://t.me/usdtm1nerr_bot?start=ref_${dbUser.id}`;
        
        await sendMessage(chatId,
          `👥 <b>Your Referral Program</b>\n\n` +
          `🔗 <b>Your referral link:</b>\n${referralLink}\n\n` +
          `📊 <b>Referral Stats:</b>\n` +
          `• Level 1: ${stats.level1} users (10%)\n` +
          `• Level 2: ${stats.level2} users (5%)\n` +
          `• Level 3: ${stats.level3} users (2%)\n\n` +
          `💰 <b>Total referral earnings:</b> ${parseFloat(dbUser.referralEarnings).toLocaleString()} USDT`,
          {
            inline_keyboard: [[
              {
                text: '📤 Share Referral Link',
                url: `https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent('Join me on Farming Pro and start earning USDT!')}`
              }
            ]]
          }
        );
      } else {
        await sendMessage(chatId, '❌ Please start the bot first with /start');
      }
    } else if (text === '/help') {
      await sendMessage(chatId,
        `🆘 <b>Farming Pro Help</b>\n\n` +
        `<b>Commands:</b>\n` +
        `/start - Start the bot and open app\n` +
        `/balance - Check your balance\n` +
        `/referral - View referral stats\n` +
        `/help - Show this help message\n\n` +
        `<b>Features:</b>\n` +
        `🌱 Farm USDT every 4 hours\n` +
        `📋 Complete social tasks for rewards\n` +
        `👥 3-level referral system\n` +
        `🚀 Boost system for faster farming\n` +
        `💰 Deposit and withdrawal system\n\n` +
        `<b>Withdrawal Requirements:</b>\n` +
        `• Minimum withdrawal: $12\n` +
        `• First deposit: $5 (to enable withdrawals)\n` +
        `• Deposit $3 for each withdrawal\n\n` +
        `Click /start to begin farming!`
      );
    } else {
      // Default response for unknown commands
      await sendMessage(chatId,
        `🤖 I don't understand that command.\n\n` +
        `Use /help to see available commands or click below to open the app:`,
        {
          inline_keyboard: [[
            {
              text: '🚀 Open Farming Pro',
              web_app: { url: WEBAPP_URL }
            }
          ]]
        }
      );
    }
  } catch (error) {
    console.error('Error handling telegram update:', error);
    await sendMessage(chatId, '❌ Something went wrong. Please try again later.');
  }
}

export async function initializeTelegramBot() {
  console.log('🤖 Initializing Telegram Bot...');
  
  // Set webhook if in production
  if (process.env.NODE_ENV === 'production') {
    const webhookUrl = `${WEBAPP_URL}/api/telegram/webhook`;
    const result = await setWebhook(webhookUrl);
    console.log('📡 Webhook setup result:', result);
  } else {
    console.log('🔧 Development mode - webhook not set');
  }
}