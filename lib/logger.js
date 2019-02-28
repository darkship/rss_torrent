const config = require("./parameters.js").config;
const winston = require("winston");

module.exports = winston.createLogger({
  format: winston.format.combine(
    winston.format.splat(),
    winston.format.simple()
  ),
  transports: [new winston.transports.Console(config.logger || {})]
});
