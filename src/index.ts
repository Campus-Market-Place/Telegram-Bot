import axios from "axios";
import "dotenv/config";
import { Telegraf, Context, session } from "telegraf";

interface SessionData {
  token?: string;
}

interface MyContext extends Context {
  session: SessionData;
}

const token = process.env.BOT_TOKEN;
if (!token) {
  throw new Error("BOT_TOKEN is missing. Set it in .env or your environment.");
}

const bot = new Telegraf<MyContext>(token);

bot.use(session());

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const verifyTelegramConnection = async () => {
  const attempts = 3;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      await bot.telegram.getMe();
      return;
    } catch (error) {
      if (attempt === attempts) {
        const message = error instanceof Error ? error.message : String(error);
        throw new Error(
          `Unable to reach Telegram API after ${attempts} attempts. ${message}`
        );
      }

      await wait(1000 * attempt);
    }
  }
};

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
    console.log(`Generated token for user ${user.username}: ${token}`);

    ctx.session = { token };

    if (response.status === 201) {
      ctx.reply(`Welcome, ${user.first_name}! Your account has been created.`);
    } else {
      ctx.reply(`Welcome back, ${user.first_name}!`);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Login request failed:", message);
    ctx.reply("Login failed. Please try again in a moment.");
  }

//   ctx.reply(`Welcome, ${firstName}! Send any message and I will echo it back.`);
});

bot.on("text", (ctx) => {
  ctx.reply(`Echo: ${ctx.message.text}`);
});

verifyTelegramConnection()
  .then(() => bot.launch())
  .catch((error) => {
    const message = error instanceof Error ? error.message : String(error);
    console.error(message);
    process.exitCode = 1;
  });

process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
