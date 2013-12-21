
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
  data = []
  ending = ->
    data |> JSON.stringify |> fs.writeFileSync output_file, _
  cb = (err, result, $) !->
    add-index = !->
      (i) <-! $ \.SecondTable .first!.next!.children!.each
      return if ($ this).children \th .size > 0
      d = {}
      d.uri = base_uri + '/' + ($ this).children \td .first!.next!.children \a .attr \href
      d.title = ($ this).children \td .first!.next!.text!
      return unless d.title
      ($ this).children \td .each (i) !->
        d[output_fields[i]] = ($ this).text!
      data.push d
      d.title |> console.log

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
    if $ \#ctl00_MainPlaceHolder_PagerList1_btnNext .attr \disabled
      ending!
      return
    crawl-next-page!

exports.parser = parser
