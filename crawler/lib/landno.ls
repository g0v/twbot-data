
api_url = \http://jimmyhub.net:9192/?address=

request = require \request
fs = require \fs
{ map, filter, join, keys, split, unique } = require \prelude-ls

cache = {}

module.exports.coordinates = coordinates = (addr, cb) ->
  return unless cb
  if cache[addr]
    return cb null, cache[addr]
  (err, response, body) <- request api_url + addr
  if err
    return cb err
  data = JSON.parse body
  if data.length < 2
    return cb err
  cache[addr] = [ data.1.cx, data.1.cy ]
  cb null, cache[addr]

landno-data = fs.readFileSync __dirname + \/landno.json |> JSON.parse

module.exports.area-pattern = area-pattern = (city) ->
  landno-data.area
  |> keys
  |> filter (a) -> (a.search city) > -1
  |> map (a) -> a.replace city, ''
  |> join '|'
  |> (s) -> '(' + s + ')'

module.exports.section-pattern = section-pattern = (city, area) ->
  landno-data.section[landno-data.area.[city + area]]
  |> keys
  |> join '|'
  |> (s) -> '(' + s + ')'

module.exports.parse-landno = parse-landno = (city, text) ->
  landno = []
  (p = (area-pattern city) + '([^\\d]+(?:、|\\d|\\-)+)') #|> console.log
  pattern = new RegExp p, \g
  while ((result = pattern.exec text) != null)
    result[0] #|> console.log
    (area = result[1]) #|> console.log
    (p2 = (section-pattern city, area) + '((?:、|\\d|\\-)*)') #|> console.log
    pattern2 = new RegExp p2, \g
    while ((result2 = pattern2.exec result[2]) != null)
      result2[0] #|> console.log
      (sec = result2[1]) #|> console.log
      landno ++= map ((n) -> join \|, [city, area, sec, n]), (split '、' result2[2])
  landno = unique landno
  map ((n) -> split \|, n), landno

