var request = require('request');
var cheerio = require('cheerio');
var http = require('http');
var fs = require('fs');
var landno = require('./lib/landno');

var areas = JSON.parse(fs.readFileSync('crawler/section.json', 'utf-8')).area;
var indextable = JSON.parse(fs.readFileSync('index.json', 'utf-8'));
var addressbook=new Array();

function findSections(parentstring){
	keys= Object.keys(areas);
	for(var i=0;i<keys.length;i++){
		var keyCity=keys[i].substr(0,2);
		var keyArea=keys[i].substr(3);
		var cityIdx=parentstring.indexOf(keyCity);
		var areaIdx=parentstring.indexOf(keyArea);
		if(cityIdx!=-1)
		{
			var substring=parentstring.substr(cityIdx);
			//console.log('find city',substring);
			return cityIdx;
		}
		if(areaIdx!=-1)
		{
			var substring=parentstring.substr(areaIdx);
			//console.log('find area',substring);
			return areaIdx;
		}
	}
	return 0;
}

function ParseMapAddress(testurl, testID){
  request(testurl, function (error, response, data) {
    var $ = cheerio.load(data); 
    $('#tbHistory').find('tr').each(function(rowindex, row) { 
      if($(this).attr('id'))
  	  { 
        var id=$(this).attr('id').substr(2);
		var secondurl='http://ppp.pcc.gov.tw/PPP.Website/Case/LoadUserControl.aspx?Path=./Controls/Case/govland/HistoryConverter.ascx&Params=EntityID:'+id; 
		request(secondurl, function (error, response, data) {
		  var $ = cheerio.load(data);
		  //case 1
		  $('.SecondTable').find('th').each(function(rowindex, row) {   
	        if($(this).text()=='使用政府土地設施資訊')
	        { 
		      var parentstring=$(this).next().text();
		      var endIdx=parentstring.indexOf('地號');
			  var target=parentstring.substr(0,endIdx);
		      var startIdx=findSections(target);
		      var address=target.substr(startIdx);
		      console.log('ParseMapAddress',address); 
        var r;
        if ((r = new RegExp(landno.cityPattern()).exec(address)) != null) {
          var city = r[1];
          if ((r = landno.parseLandno(city, address)).length != 0) {
            var no = r[0].join('');
            console.log(no);
            landno.coordinates(no, function (err, coor) {
              if (! err && coor != null && coor.length == 2) {
                addressbook.push({
                  type: 'Feature',
                  properties: {
                    'ID': testID,
                    'MapAddress': address
                  },
                  geometry: {
                    type: 'Point',
                    coordinates: coor
                  }
                });
              }
            })
          }
        }

			  fs.writeFileSync('addressbook.json', JSON.stringify(addressbook), "UTF-8", {'flags': 'w+'});
			}  
		  });	 
		});
	  }
	});    	
  });	  
}

for(var i=0;i<indextable.length;i++)
{
	var testurl=indextable[i].uri;
	var target=testurl.substr(testurl.indexOf('AnnounceNo'));
	var targetID=target.substr(target.indexOf('=')+1);
	targetID=targetID.substr(0,targetID.indexOf('&'));
	var targeturl='http://ppp.pcc.gov.tw/PPP.Website/Case/LoadUserControl.aspx?Path=./Controls/Case/govland/ViewHistory.ascx&Params=AnnounceNo%3A'+targetID;
	ParseMapAddress(targeturl, targetID);
}
