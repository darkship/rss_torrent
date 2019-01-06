const FeedParser = require("feedparser");
const request = require("request");
const EventEmitter = require("events");

class TorrentFeedLoader extends EventEmitter {
  constructor({rss, lastRunFile}) {
    super();
    Object.assign(this, {rss, lastRunFile});
    this.rssIt = rss[Symbol.iterator]();
  }

  isPublicationAfterLastRun(lastrun, publicationDate) {
    return !lastrun || lastrun.getTime() < publicationDate.getTime();
  }

  isTorrentNameListed(torrentTitles, title) {
    return torrentTitles.find(t => title.match(t));
  }

  fetchTorrents({value, done}, lastrun) {
    if (done) {
      this.emit("allFeedsFetched");
      return;
    }

    this.emit("fetching", value.url);

    const feedparser = new FeedParser();
    feedparser.on("readable", () => {
      let item;
      while (item = feedparser.read()) {
        if (this.isPublicationAfterLastRun(lastrun, item.pubdate) && this.isTorrentNameListed(value.torrentTitles, item.title)) {
          this.emit("foundMatching", item, value);
        }
      }
    });

    const req = request(value.url);
    req.on("error", (error) => {
      this.emit("error", error);
    });

    req.on("response", (res) => {
      if (res.statusCode !== 200) {
        this.emit("error", new Error(`Bad status code: ${res.statusCode}`));
      } else {
        req.pipe(feedparser);
        process.nextTick(() => this.fetchTorrents(this.rssIt.next()));

      }
    });
  }

  startFetchTorrents(date) {
    this.fetchTorrents(this.rssIt.next(), date);
  }
}

module.exports = TorrentFeedLoader;
