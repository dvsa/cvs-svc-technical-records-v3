import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL,
  format: winston.format.json(),
  transports: [
    new winston.transports.Console(),
  ],
});

// Use a colourised `simple()` format when not in production; `simple()` is more readable in the console.
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(winston.format.simple(), winston.format.colorize()),
  }));
}

export const logError = (message: string, error: unknown): void => {
  const errorInfo = error instanceof Error
    ? { errorMessage: error.message }
    : { error: String(error) };

  logger.error(message, { ...errorInfo });
};

export default logger;
