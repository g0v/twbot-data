
fs = require \fs
Crawler = require \crawler .Crawler

uri = 'http://ppp.pcc.gov.tw/PPP.Website/Case/AnnounceView.aspx'

count = 0

data_dir = '..'
cache_dir = 'cache'
output_file = data_dir + '/index.json'
output_fields = <[ id title uri category ann_type type administrasion times start_from end_at ]>

c = new Crawler {
  maxConnections: 10
}

cb = (err, result, $) !->
  do
    (i) <-! $ \.SecondTable .first! .next! .children \tr .each
    if $ this .children \th
      return
    data = {}
    (i) <-! $ this .children \td .each
    data[output_fields[i]] = $ this .text!
    data |> JSON.stringy |> fs.appendFileSync output_file _

  $ 'body' .html! |> fs.writeFileSync cache_dir + '/index' + count + '.html' _
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
