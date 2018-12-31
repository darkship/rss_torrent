require("./globals.js");

const {rss, transmissionConfig} = config;
const TorrentFeedLoader = require("./lib/torrent_feed_loader");
const Transmission = require("transmission-client").Transmission;

const lastRunFile = __dirname + "/lastrun";

const Client = new Transmission(transmissionConfig);

let clientError = false;

const add = async ({title, link}, method) => {
  try {
    const addRes = await Client[method](link);
    await Client.start([addRes.id]);
    logger.info(`added: ${title}`);
  } catch (e) {
    logger.error(`${title} - ${e.message}`);
    if (e.message !== "duplicate torrent") {
      clientError = true;
    }
  }
};

const tfl = new TorrentFeedLoader({rss, lastRunFile});

tfl.loadLastRun();

tfl.on("loadLastRun", (date) => {
  logger.info(`last successful run was ${date}`);
  tfl.startFetchTorrents(date);
});

tfl.on("torrentFeed", ({title, link}, {method, torrentTitles}) => {
  const isWantedTorrent = torrentTitles.find(t => title.match(t));
  if (isWantedTorrent) {
    logger.info(`found: ${title}`);
    add({title, link}, method);
  }
});

tfl.on("done", () => !clientError && tfl.setLastRun());

tfl.on("error", error => logger.error(error.message));
tfl.on("fetchTorrents", ({url, method}) => logger.info(`fetchTorrents url=${url}, method=${method}`));
