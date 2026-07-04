type LogLevel = "info" | "warn" | "error";

export const logger = {
  log: (level: LogLevel, message: string, meta: Record<string, any> = {}) => {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...meta,
    };

    const output = import.meta.env.DEV 
      ? JSON.stringify(logEntry, null, 2) 
      : JSON.stringify(logEntry);

    if (level === "error") {
      console.error(output);
    } else if (level === "warn") {
      console.warn(output);
    } else {
      console.info(output);
    }
  },
  info: (msg: string, meta?: Record<string, any>) => logger.log("info", msg, meta),
  warn: (msg: string, meta?: Record<string, any>) => logger.log("warn", msg, meta),
  error: (msg: string, meta?: Record<string, any>) => logger.log("error", msg, meta),
};