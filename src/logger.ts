type LogLevel = "debug" | "info" | "warn" | "error";

const levelOrder: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

const envLevel = (process.env.LOG_LEVEL || "info").toLowerCase() as LogLevel;
const activeLevel: LogLevel = envLevel in levelOrder ? envLevel : "info";

const shouldLog = (level: LogLevel) =>
  levelOrder[level] >= levelOrder[activeLevel];

const formatMessage = (level: LogLevel, message: string) => {
  const ts = new Date().toISOString();
  return `[${ts}] ${level.toUpperCase()}: ${message}`;
};

export const logger = {
  debug: (message: string) => {
    if (shouldLog("debug")) {
      console.debug(formatMessage("debug", message));
    }
  },
  info: (message: string) => {
    if (shouldLog("info")) {
      console.info(formatMessage("info", message));
    }
  },
  warn: (message: string) => {
    if (shouldLog("warn")) {
      console.warn(formatMessage("warn", message));
    }
  },
  error: (message: string) => {
    if (shouldLog("error")) {
      console.error(formatMessage("error", message));
    }
  },
};
