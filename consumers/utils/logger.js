import { createLogger, format, transports } from 'winston';
import moment from 'moment-timezone';
const { combine, printf, colorize } = format;

const loggerFormat = printf(({ level, message, timestamp }) => {
  return `${timestamp} ${level}: ${message}`;
});

const log = createLogger({
  level: 'info',
  format: combine(
    colorize(),
    format.timestamp({
      format: () => moment().tz('Africa/Nairobi').format('YYYY-MM-DD HH:mm:ss')
    }),
    loggerFormat
  ),
  transports: [
    new transports.Console(),
    new transports.File({ filename: 'combined.log' }),
    new transports.File({ filename: 'errors.log', level: 'error' })
  ]
});

export default log;
