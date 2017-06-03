const FeedParser = require('feedparser');
const request = require('request');
const EventEmitter = require('events')
const fs = require('fs')

const linkTypes = ['magnet', 'torrent']

class TorrentFeedLoader extends EventEmitter {
  constructor({rss, lastrunFile}) {
    super()
    Object.assign(this, {rss, lastrunFile})
    this.rssIt = rss[Symbol.iterator]()
  }

  loadLastrun() {
    fs.readFile(this.lastrunFile, (err, data) => {
      let lastRun = null
      if (err && err.code == 'ENOENT') {
        // console.log('file does not exist')
      } else if (err) {
        this.emit('error', err)
        return
      } else {
        lastRun = new Date(data)
      }
      this.emit('loadLastrun', lastRun)
    })
  }
  setLastRun(){
    fs.writeFile(this.lastrunFile, new Date(), (err) => {
      if(err){
        this.emit('error', err)
      }
    })
  }

  fetchTorrents({value, done}, lastrun) {
    if (done) return
    this.emit('fetchTorrents', value)
    const feedparser = new FeedParser()

    feedparser.on('readable', () => {
      let item;
      while (item = feedparser.read()) {

        if(!lastrun || lastrun.getTime()< item.pubdate.getTime()){
          this.emit('torrentFeed', item, value)
        }
      }
    });
    const req = request(value.url)
    req.on('error', (error) =>{
      this.emit('error', error)
    });

    req.on('response', (res) => {
      if (res.statusCode !== 200) {
        this.emit('error', new Error('Bad status code'))
      }
      else {
        req.pipe(feedparser);
        process.nextTick(() => {
          this.fetchTorrents(this.rssIt.next())
        })

      }
    })
  }

  startFetchTorrents(date){
    this.fetchTorrents(this.rssIt.next(), date)
  }
}

module.exports= TorrentFeedLoader
module.exports.linkTypes = linkTypes
