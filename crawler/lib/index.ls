
fs = require \fs

count = 0

data_dir = '..'
cache_dir = 'cache'
output_file = data_dir + '/index.json'
output_fields = <[ id href category ann_type type administrasion times start_from end_at ]>
base_uri = 'http://ppp.pcc.gov.tw/PPP.Website/Case'
uri = base_uri + '/AnnounceView.aspx'

parse-cases = (crawler, $) ->

parser = (crawler) ->
  cb = (err, result, $) !->
    add-index = !->
      (i, d) <-! $ \.SecondTable .first!.next!.children!.each
      if ($ this).children \th .size > 0
        return
      data = {}
      data.uri = base_uri + '/' + ($ this).children \td .first!.next!.children \a .attr \href
      data.title = ($ this).children \td .first!.next!.text!
      ($ this).children \td .each (i) !->
        data[output_fields[i]] = ($ this).text!
      data |> JSON.stringify |> (d) -> d + ',' |> fs.appendFileSync output_file, _
      #data |> JSON.stringify |> console.log
      data.title |> console.log

    crawl-next-page = !->
      postarg = {
        __EVENTTARGET: 'ctl00$MainPlaceHolder$PagerList1$btnNext'
        __VIEWSTATE: $('#__VIEWSTATE').val!
        __EVENTVALIDATION: $('#__EVENTVALIDATION').val!
      }
      crawler.queue [{
        uri: uri
        method: \post
        form: postarg
        callback: cb
      }]

    add-index!
    crawl-next-page!

exports.parser = parser
