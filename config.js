const argv = require('minimist')(process.argv.slice(2));
const fs = require('fs');
let config = {};

if(argv.config){
  const configStr = fs.readFileSync(argv.config, {encoding: 'utf-8'});
  console.log(configStr)
  config = JSON.parse(configStr)
}

module.exports = config;
