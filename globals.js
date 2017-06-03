const logger = require('./lib/logger.js').logger;
const  config = require('./lib/config');
global.logger = logger;
global.config = config;

