
fs = require \fs
Crawler = require \crawler .Crawler

uri = 'http://ppp.pcc.gov.tw/PPP.Website/Case/AnnounceView.aspx'

count = 0

c = new Crawler {
  maxConnections: 10
}

cb = (err, result, $) !->
  $ 'body' .html! |> fs.writeFileSync 'pages/index' + count + '.html' _
  ++count
  postarg = {
    __EVENTTARGET: 'ctl00$MainPlaceHolder$PagerList1$btnNext'
    __VIEWSTATE: $('#__VIEWSTATE').val!
    __EVENTVALIDATION: $('#__EVENTVALIDATION').val!
  }
  c.queue [{
    uri: uri
    method: \post
    form: postarg
    callback: cb
  }]

c.queue {
  uri: uri
  callback: cb
}
