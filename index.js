require('./globals.js')

const {rss, torrentTitles, transmissionConfig} = config;
const TorrentFeedLoader = require('./lib/torrent_feed_loader')
const Transmission = require('transmission-client').Transmission;

const rexps = torrentTitles.map(t => new RegExp(t))
const lastRunFile = __dirname + '/lastrun';

const Client = new Transmission(transmissionConfig);

const add= async (link, method) => {
  try {
    const addRes = await Client[method](link);
    logger.info(addRes);
    await Client.start([addRes.id])
  } catch(e){
    const msg = e.toString();
    if(msg === 'Error: duplicate torrent'){
      logger.error(msg)
    } else {
      logger.error(e)
    }
  }
};
const addMagnet = (link)=> add(link,'addMagnet');
const addURL = (link)=> add(link,'addURL');
const addHash = (link)=> add(link,'addHash');

const tfl = new TorrentFeedLoader({rss, lastRunFile});

tfl.loadLastRun();

tfl.on('loadLastRun', (date) => {
  logger.info('last successful run was', date);
  tfl.startFetchTorrents(date)
});

tfl.on('torrentFeed', ({title, link}, {type}) => {
  const isWantedTorrent = rexps.find(t=> title.match(t));
  if(isWantedTorrent) {
    logger.info(title);
    switch (type){
      case 'magnet' :
        addMagnet(link);
        break;
      default:
        addURL(link);
        break
    }
  }
});

tfl.on('error', error => logger.error(error.message))
tfl.on('fetchTorrents', t => logger.info('fetchTorrents', t))
