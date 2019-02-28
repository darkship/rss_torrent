const EventEmitter = require("events");
const duplicateTorrentError = "duplicate torrent";

module.exports = class TransmissionHandler extends EventEmitter {
  constructor(transmissionClient, method) {
    super();
    this.transmissionClient = transmissionClient;
    this.method = method;
    this.add = this.add.bind(this);
  }

  async add({ title, link }, start = true) {
    try {
      const addRes = await this.transmissionClient[this.method](link);
      this.emit("added", title);
      if (start) {
        await this.transmissionClient.start([addRes.id]);
      }
    } catch (e) {
      if (e.message === duplicateTorrentError) {
        this.emit("duplicate", title);
        return;
      }
      this.emit("error", e);
    }
  }
};
