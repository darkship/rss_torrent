const fs = require("fs");

class LastRunHandler {
  constructor({lastRunFile}) {
    Object.assign(this, {lastRunFile});
  }

  loadLastRunSync() {
    try {
      const readDate = new Date(fs.readFileSync(this.lastRunFile));
      if (!isNaN(readDate.getTime())) {
        return readDate;
      }
    } catch (e) {
      if (e.code === "ENOENT") {
        // console.log('file does not exist')
      } else {
        throw e;
      }
    }
    return null;
  }

  setLastRunSync() {
    fs.writeFileSync(this.lastRunFile, new Date());
  }
}

module.exports = LastRunHandler;
