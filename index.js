require('./globals.js')

const {rss, torrentTitles, transmissionConfig} = config;
const TorrentFeedLoader = require('./lib/torrent_feed_loader')
const Transmission = require('transmission-client').Transmission;

const rexps = torrentTitles.map(t => new RegExp(t))
const lastRunFile = __dirname + '/lastrun';

const Client = new Transmission(transmissionConfig);

const add = async ({title, link}, method) => {
  try {
    const addRes = await Client[method](link);
    logger.info(`added: ${title}`);
    await Client.start([addRes.id])
  } catch (e) {
    logger.error(`${title} - ${e.message}`)
  }
};

const tfl = new TorrentFeedLoader({rss, lastRunFile});

tfl.loadLastRun();

tfl.on('loadLastRun', (date) => {
  logger.info('last successful run was', date);
  tfl.startFetchTorrents(date)
});

tfl.on('torrentFeed', ({title, link}, {method}) => {
  const isWantedTorrent = rexps.find(t => title.match(t));
  if (isWantedTorrent) {
    logger.info(`found: ${title}`);
    add({title, link}, method)
  }
});

tfl.on('error', error => logger.error(error.message))
tfl.on('fetchTorrents', t => logger.info('fetchTorrents', t))
