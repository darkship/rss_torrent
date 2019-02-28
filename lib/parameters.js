const argv = require("minimist")(process.argv.slice(2));
const fs = require("fs");
let config = {};
let resetRun = false;
let dontStartTorrents = false;

if (argv.config) {
  try {
    const configStr = fs.readFileSync(argv.config, { encoding: "utf-8" });
    config = JSON.parse(configStr);
  } catch (e) {
    console.error(e);
  }
}

if (argv.resetRun) {
  resetRun = true;
}

if (argv.noStart) {
  dontStartTorrents = true;
}

module.exports = {
  config,
  resetRun,
  dontStartTorrents
};
