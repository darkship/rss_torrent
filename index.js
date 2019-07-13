const Transmission = require("transmission-client").Transmission;

const logger = require("./lib/logger");
const { config, resetRun, dontStartTorrents } = require("./lib/parameters");

const TorrentFeedLoader = require("./lib/torrent_feed_loader");
const LastRunHandler = require("./lib/last_run_handler");
const TransmissionHandler = require("./lib/transmission_handler");
const RssTorrentHandler = require("./lib/rss_torrent_handler");

const { rssConfigs, transmissionConfig } = config;

const transmissionClient = new Transmission(transmissionConfig);

const getLastRunFilePath = rssConfigId => `${__dirname}/lastrun_${rssConfigId}`;

if (resetRun) {
  logger.info(`Last successful run is reseted`);
}
if (dontStartTorrents) {
  logger.info(`Torrents won't be started`);
}

logger.info(`\nStarting...`);

const allRssTorrentHandlers = [];

Object.keys(rssConfigs).forEach(rssConfigId => {
  const rssConfig = rssConfigs[rssConfigId];
  const lastRunFilePath = getLastRunFilePath(rssConfigId);
  const onError = error => {
    logger.error(`${rssConfigId}: ${error.toString()}`);
  };

  const lastRunHandler = new LastRunHandler({ lastRunFilePath });
  const torrentFeedLoader = new TorrentFeedLoader({ url: rssConfig.url });
  const torrentClientHandler = new TransmissionHandler(
    transmissionClient,
    rssConfig.method
  );

  const rssTorrentHandler = new RssTorrentHandler({
    name: rssConfigId,
    lastRunHandler,
    torrentFeedLoader,
    torrentClientHandler,
    torrentTitles: rssConfig.torrentTitles
  });
  allRssTorrentHandlers.push(rssTorrentHandler);

  lastRunHandler.on("error", onError).on("loaded", lastRun => {
    logger.info(`${rssConfigId}: Last successful run was ${lastRun}`);
  });

  torrentFeedLoader.on("error", onError).on("foundMatching", ({ title }) => {
    logger.info(`${rssConfigId}: Found: ${title}`);
  });

  torrentClientHandler
    .on("error", onError)
    .on("added", title => {
      logger.info(`${rssConfigId}: added torrent: ${title}`);
    })
    .on("duplicate", title => {
      logger.warn(`${rssConfigId}: duplicate torrent: ${title}`);
    });

  rssTorrentHandler.start({ resetRun, dontStartTorrents });
});

process.on("exit", () => {
  allRssTorrentHandlers.forEach(rssTorrentHandler => {
    const {
      torrentsFound,
      torrentsAdded,
      torrentsDuplicated,
      torrentsErrors,
      errors
    } = rssTorrentHandler.stats();

    logger.info(`${rssTorrentHandler.name}: Finished with
    errors: ${errors},
    torrents
      found:${torrentsFound},
      added: ${torrentsAdded},
      duplicates: ${torrentsDuplicated},
      errors: ${torrentsErrors}`);
  });
  logger.info("Exit");
});
