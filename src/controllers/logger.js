const winston = require('winston');
const config = require('../../config');

const logger = new (winston.Logger)();

if (config.logFile) {
  logger.add(winston.transports.File, {
    level: 'debug',
    timestamp: true,
    filename: config.logFile,
  });
}

logger.add(winston.transports.Console, {
  level: 'info',
  timestamp: true,
});

module.exports = logger;
