const argv = require('minimist')(process.argv.slice(2));
const logger = require('./logger').logger
const fs = require('fs');
let config = {};

if(argv.config){
  try{
    const configStr = fs.readFileSync(argv.config, {encoding: 'utf-8'});
    config = JSON.parse(configStr)
  } catch(e) {
    logger.error(e)
  }
}

module.exports = config;
