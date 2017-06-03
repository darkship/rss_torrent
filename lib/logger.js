const config = require('./config.js');
const winston = require('winston');

const logger = new (winston.Logger)({
  transports: [
    new winston.transports.Console(config.logger || {})
  ]
});
module.exports.logger= logger;
