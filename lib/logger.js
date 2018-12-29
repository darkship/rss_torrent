const config = require("./config.js");
const winston = require("winston");

const logger = winston.createLogger({
  format: winston.format.combine(
    winston.format.splat(),
    winston.format.simple()
  ),
  transports: [
    new winston.transports.Console(config.logger || {})
  ]
});
module.exports.logger = logger;
