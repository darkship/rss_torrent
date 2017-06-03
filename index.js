const {rss, torrnentTitles, transmissionConfig} = require('./config.json');
const TorrentFeedLoader = require('./lib/torrent_feed_loader')
const Transmission = require('transmission-client').Transmission;

const rexps = torrnentTitles.map(t => new RegExp(t))
const lastrunFile = __dirname + '/lastrun';

const Client = new Transmission(transmissionConfig);

const add= async (link, method) => {
  try {
    const addRes = await Client[method](link);
    console.log(addRes);
    await Client.start([addRes.id])
  } catch(e){
    const msg = e.toString();
    if(msg === 'Error: duplicate torrent'){
      console.error(msg)
    } else {
      console.error(e)
    }
  }
};
const addMagnet = (link)=> add(link,'addMagnet');
const addURL = (link)=> add(link,'addURL');
const addHash = (link)=> add(link,'addHash');

const tfl = new TorrentFeedLoader({rss, lastrunFile});

tfl.loadLastrun();

tfl.on('loadLastrun', (date) => {
  console.log('last run was', date);
  tfl.startFetchTorrents(date)
  tfl.setLastRun()
});

tfl.on('torrentFeed', ({title, link}, {type}) => {
  const isWantedTorrent = rexps.find(t=> title.match(t));
  if(isWantedTorrent) {
    console.log(title);
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

tfl.on('error', error => console.error)
