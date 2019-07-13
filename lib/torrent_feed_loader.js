const FeedParser = require("feedparser");
const Request = require("request");
const EventEmitter = require("events");

module.exports = class TorrentFeedLoader extends EventEmitter {
  constructor({ url }) {
    super();
    Object.assign(this, {
      url,
      feedParser: new FeedParser()
    });
    this.bind();

    this.feedParser
      .on("readable", this.onReadable)
      .on("end", this.onEnd)
      .on("error", this.onError);
  }

  bind() {
    this.onEnd = this.onEnd.bind(this);
    this.onError = this.onError.bind(this);
    this.onReadable = this.onReadable.bind(this);
    this.onResponse = this.onResponse.bind(this);
  }

  onEnd() {
    this.emit("done");
  }

  onError(error) {
    this.emit("error", error);
  }

  onReadable() {
    let item;
    while ((item = this.feedParser.read())) {
      this.emit("torrent", item);
    }
  }

  onResponse(request, response) {
    if (response.statusCode !== 200) {
      this.emit("error", new Error(`Bad status code: ${res.statusCode}`));
    } else {
      request.pipe(this.feedParser);
    }
  }

  fetch() {
    const request = Request(this.url);
    request
      .on("error", this.onError)
      .on("response", response => this.onResponse(request, response));
  }
};
