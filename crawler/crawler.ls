
Crawler = require \crawler .Crawler

uri = 'http://ppp.pcc.gov.tw/PPP.Website/Case/AnnounceView.aspx'
#uri = 'http://localhost:8000/test.html'

c = new Crawler {
  maxConnections: 10
}

c.queue {
  uri: uri
  callback: require \./lib/index .parser c
}
