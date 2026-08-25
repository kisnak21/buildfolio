import pino, { type DestinationStream, type LoggerOptions } from 'pino'

export const loggerOptions: LoggerOptions = {
  level: process.env.LOG_LEVEL || 'info',
  base: {
    service: 'buildfolio',
    env: process.env.NODE_ENV || 'development',
  },
  redact: {
    paths: [
      'password',
      'currentPassword',
      'newPassword',
      'token',
      'accessToken',
      'refreshToken',
      'verificationToken',
      'resetPasswordToken',
      'apiKey',
      'secret',
      'prompt',
      'input',
      'messages',
      'response',
      'completion',
      'content',
      '*.password',
      '*.token',
      '*.apiKey',
      '*.secret',
      '*.prompt',
      '*.input',
      '*.messages',
      '*.response',
      '*.completion',
      '*.content',
      'headers.authorization',
      'headers.cookie',
      '*.headers.authorization',
      '*.headers.cookie',
    ],
    remove: true,
  },
}

export const createLogger = (destination?: DestinationStream) =>
  destination ? pino(loggerOptions, destination) : pino(loggerOptions)

export const logger = createLogger()

export default logger
