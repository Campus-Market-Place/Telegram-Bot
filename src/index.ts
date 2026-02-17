
import "dotenv/config";
import express from "express";
import axios from "axios";
import { Telegraf, Context, session } from "telegraf";
import { logger } from "./logger.js";

interface SessionData {
  token?: string;
}

interface MyContext extends Context {
  session: SessionData;
}

const BOT_TOKEN = process.env.BOT_TOKEN;
if (!BOT_TOKEN) {
  throw new Error("BOT_TOKEN is missing.");
}

const WEBHOOK_URL = process.env.WEBHOOK_URL;
if (!WEBHOOK_URL) {
  throw new Error("WEBHOOK_URL is missing.");
}

const PORT = Number(process.env.PORT) || 3000;

const bot = new Telegraf<MyContext>(BOT_TOKEN);
bot.use(session());

/* =========================
   BOT HANDLERS
========================= */

bot.start(async (ctx) => {
  const user = ctx.from;

  try {
    const response = await axios.post(
      "https://backend-ikou.onrender.com/auth/login",
      {
        telegramId: user.id,
        username: user.username,
      }
    );

    const token = response.data.token;
    ctx.session = { token };

    if (response.status === 201) {
      await ctx.reply(
        `Welcome, ${user.first_name}! Your account has been created. 🎉`
      );
    } else {
      await ctx.reply(`Welcome back, ${user.first_name}!`);
    }
  } catch (error) {
    const message =
      error instanceof Error ? error.message : String(error);
    logger.error(`Login request failed: ${message}`);
    await ctx.reply("Login failed. Please try again later.");
  }
});

bot.on("text", async (ctx) => {
  await ctx.reply(`Echo: ${ctx.message.text}`);
});

/* =========================
   EXPRESS SERVER
========================= */

const app = express();
app.use(express.json());

app.post("/telegram/webhook", async (req, res) => {
  try {
    await bot.handleUpdate(req.body);
    res.sendStatus(200);
  } catch (error) {
    logger.error("Webhook handling error");
    res.sendStatus(500);
  }
});

app.get("/", (_req, res) => {
  res.send("Bot is running.");
});

/* =========================
   START SERVER
========================= */

app.listen(PORT, async () => {
  logger.info(`Server running on port ${PORT}`);

  try {
    // Set webhook to Render URL
    await bot.telegram.setWebhook(`${WEBHOOK_URL}/telegram/webhook`);
    logger.info("Webhook successfully set.");
  } catch (error) {
    const message =
      error instanceof Error ? error.message : String(error);
    logger.error(`Failed to set webhook: ${message}`);
  }
});

/* =========================
   GRACEFUL SHUTDOWN
========================= */

process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
