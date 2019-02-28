const isAfterLastRun = (lastrun, publicationDate) => {
  return !lastrun || lastrun.getTime() < publicationDate.getTime();
};

const isTorrentNameListed = (torrentTitles, title) => {
  return torrentTitles.find(t => title.match(t));
};

module.exports = class RssTorrentHandler {
  constructor({ name, lastRunHandler, torrentFeedLoader, torrentClientHandler, torrentTitles }) {
    this.bind();
    Object.assign(this, {
      name,
      dontStartTorrents: false,
      torrentTitles,
      lastRunHandler,
      torrentFeedLoader,
      torrentClientHandler,
      allTorrentsAreFound: false,
      counters: {
        errors: 0,
        torrentsErrors: 0,
        torrentsFound: 0,
        torrentsAdded: 0,
        torrentsDuplicated: 0
      }
    });

    torrentClientHandler
      .on("added", this.onTorrentAdded)
      .on("duplicate", this.onTorrentDuplicate)
      .on("error", this.onTorrentError);

    torrentFeedLoader
      .on("done", this.onAllTorrentsLoaded)
      .on("torrent", this.onTorrentFound)
      .on("error", this.onError);

    lastRunHandler.on("loaded", this.onLastRunLoaded).on("error", this.onError);
  }

  bind() {
    this.start = this.start.bind(this);
    this.stats = this.stats.bind(this);

    this.onLastRunLoaded = this.onLastRunLoaded.bind(this);
    this.onAllTorrentsLoaded = this.onAllTorrentsLoaded.bind(this);
    this.onError = this.onError.bind(this);
    this.onFinishedWithNoError = this.onFinishedWithNoError.bind(this);
    this.onTorrentAdded = this.onTorrentAdded.bind(this);
    this.onTorrentDuplicate = this.onTorrentDuplicate.bind(this);
    this.onTorrentFound = this.onTorrentFound.bind(this);
    this.onTorrentError = this.onTorrentError.bind(this);
  }

  start({ resetRun = false, dontStartTorrents = false }) {
    this.dontStartTorrents = dontStartTorrents;
    resetRun ? this.torrentFeedLoader.fetch() : this.lastRunHandler.loadLastRun();
  }

  stats() {
    return { ...this.counters };
  }

  isFinished() {
    const counters = this.counters;
    return (
      this.allTorrentsAreFound &&
      counters.torrentsAdded +
      counters.torrentsDuplicated +
      counters.torrentsErrors ===
      counters.torrentsFound
    );
  }

  onFinishedWithNoError() {
    if (this.isFinished() && !this.counters.errors) {
      this.lastRunHandler.saveLastRun();
    }
  }

  onError() {
    this.counters.errors++;
  }

  onTorrentAdded() {
    this.counters.torrentsAdded++;
    this.onFinishedWithNoError();
  }

  onTorrentDuplicate() {
    this.counters.torrentsDuplicated++;
    this.onFinishedWithNoError();
  }

  onAllTorrentsLoaded() {
    this.allTorrentsAreFound = true;
    this.onFinishedWithNoError();
  }

  onTorrentFound({ title, link, pubdate }) {
    if (isTorrentNameListed(this.torrentTitles, title) && isAfterLastRun(this.lastRun, pubdate)) {
      this.counters.torrentsFound++;
      this.torrentClientHandler.add({ title, link }, !this.dontStartTorrents);
    }
  }

  onTorrentError() {
    this.counters.torrentsErrors++;
  }

  onLastRunLoaded(lastRun) {
    this.lastRun = lastRun;
    this.torrentFeedLoader.fetch();
  }
};
