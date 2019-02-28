const EventEmitter = require("events");
const fs = require("fs");

module.exports = class LastRunHandler extends EventEmitter {
  constructor({ lastRunFilePath }) {
    super();
    Object.assign(this, {
      lastRunFilePath
    });
  }

  loadLastRun(reRun) {
    if (reRun) {
      this.emit("loaded", null);
      return;
    }
    fs.readFile(this.lastRunFilePath, (error, data) => {
      let lastRun = null;
      if (error) {
        if (error.code !== "ENOENT") {
          this.emit("error", error);
          return;
        }
      }
      const readDate = new Date(data);
      if (!isNaN(readDate.getTime())) {
        lastRun = readDate;
      }

      this.emit("loaded", lastRun);
    });
  }

  saveLastRun() {
    const lastRunDate = new Date();
    fs.writeFile(this.lastRunFilePath, lastRunDate, error => {
      if (error) {
        this.emit("error", error);
        return;
      }
      this.emit("saved", lastRunDate);
    });
  }
};
