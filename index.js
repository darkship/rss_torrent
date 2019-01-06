const logger = require("./lib/logger.js").logger;
const config = require("./lib/config");
const TorrentFeedLoader = require("./lib/torrent_feed_loader");
const LastRunHandler = require("./lib/last_run_handler");
const Transmission = require("transmission-client").Transmission;

const {rss, transmissionConfig} = config;
const lastRunFile = __dirname + "/lastrun";

const Client = new Transmission(transmissionConfig);

const add = async ({title, link, method}) => {
  try {
    const addRes = await Client[method](link);
    await Client.start([addRes.id]);

    logger.info(`added: ${title}`);

  } catch (e) {
    logger.error(`${title} - ${e.message}`);

    if (e.message !== "duplicate torrent") {
      process.exit(1);
    }
  }
};

const lastRunHandler = new LastRunHandler({lastRunFile});
const lastRun = lastRunHandler.loadLastRunSync();
logger.info(`Last successful run was ${lastRun}`);

const torrentFeedLoader = new TorrentFeedLoader({rss});

torrentFeedLoader.on("fetching", (url) => logger.info(`Fetch url=${url}`));
torrentFeedLoader.on("allFeedsFetched", () => logger.info("All feeds fetched"));
torrentFeedLoader.on("foundMatching", ({title, link}, {method}) => {
  logger.info(`Found: ${title}`);
  add({title, link, method});
});
torrentFeedLoader.on("error", error => {
  logger.error(error.message);
  process.exit(1);
});

torrentFeedLoader.startFetchTorrents(lastRun);

process.on("exit", (code) => {
  if (code === 0) {
    lastRunHandler.setLastRunSync();
    logger.info(`Finished`);
    return;
  }
  logger.info(`Finished with nodeJs error ${code}`);
});
