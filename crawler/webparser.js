var request = require('request');
var cheerio = require('cheerio');
var http = require('http');
var fs = require('fs');
var path= require('path');
var landno = require('./lib/landno');

var areas = JSON.parse(fs.readFileSync('section2.json', 'utf-8')).area;
var areaIDs = JSON.parse(fs.readFileSync('section2.json', 'utf-8')).areaID;
var sectionIDs = JSON.parse(fs.readFileSync('section2.json', 'utf-8')).section; 

var indextable = JSON.parse(fs.readFileSync('../index.json', 'utf-8'));
var addressbook={
  type: "FeatureCollection",
  features: []
};

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

function findCitybyArea(parentstring){
	keys= Object.keys(areas);
	var cityIdx=-1;
	var areaIdx=-1;
	for(var i=0;i<keys.length;i++){
		var keyCity=keys[i].substr(0,3);
		var keyArea=keys[i].substr(3);
		cityIdx=parentstring.indexOf(keyCity);
		areaIdx=parentstring.indexOf(keyArea);
		if(areaIdx!=-1)
		{
		  console.log('find area', keys[i], keyCity, keyArea);
		  break;
		}
	}
	return [cityIdx, areaIdx, keyCity];
}

function findAreabySection(parentstring){
	keys= Object.keys(sectionIDs);
	var areaidx=-1;
	var idx=-1;
	var find=0;
	var i, j;
	var area=''
	for(i=0;i<keys.length;i++){
		var sections=Object.keys( sectionIDs[keys[i]]);
		for(j=0;j<sections.length;j++){
			idx=parentstring.indexOf(sections[j]);
			if(idx!=-1){
				console.log('find seciton',sections[j], areaIDs[keys[i]]);
			    find=1;
				area=areaIDs[keys[i]];
				break;
				
				
			}
		}
		if(find){
		   var keyArea=area.substr(3);
		   areaidx=parentstring.indexOf(keyArea);
		   break;	
		}
		  
	}
	return [areaidx, idx,area];
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
			  
			  if(address.indexOf('臺北縣')!=-1 || address.indexOf('高雄縣')!=-1){
			    address=address.replace(new RegExp('鄉', 'g'),"區").replace(new RegExp('市', 'g'), "區").replace(new RegExp('鎮', 'g'), "區");
			  }
			  address=address.replace(new RegExp('台', 'g'),"臺").replace(new RegExp('臺北縣', 'g'),"新北市").replace(new RegExp('高雄縣', 'g'),"高雄市").replace("花蓮線","花蓮縣").replace(new RegExp('\r\n', 'g'),"");
			  
			  /*
			  //only have section and area, no city
			  resultArray=findCitybyArea(address);
			  if(resultArray[0]==-1 && resultArray[1]!=-1){
				 //insert city
			     address=address.substr(0,resultArray[1]) + resultArray[2] + address.substr(resultArray[1], address.length);	
			  }
			  */
			  var sectionArray=findAreabySection(address);
			  console.log(sectionArray);
			  if(sectionArray[1]!=-1){
			    //insert area
			    address=sectionArray[2]+address.substr(sectionArray[1],address.length);	
				if(address.indexOf(',')!=-1)
					address=address.substr(0,address.indexOf(','));
				if(	address.indexOf('、') !=-1)	
					address=address.substr(0,address.indexOf('、'));
			  }
			  else if(sectionArray[1]==-1){ 
			    address='';	 
			  }
			 
			  console.log(address);
			  if(address.length>0){
		          var poslandlink='http://posland.g0v.io/?address='+address;
				  console.log(poslandlink);
				  request(poslandlink, function (error, response, data) {
					  var result=JSON.parse(data);
					  if(result.length>2){
						  coor = [result[1].cx, result[1].cy];	
						  console.log(address, coor); 	
		                  addressbook.features.push({
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
		                  fs.writeFileSync('addressbook.json', JSON.stringify(addressbook), "UTF-8", {'flags': 'w+'});   
					  }  	    
				  });
			  }	  
			}  
		  });
	      /*$('.SecondTable').find('#ulUpfile a').each(function(rowindex, row) {   	
		    var link=$(this).attr('href');
			var linkname=$(this).text();
			var outputname=path.resolve(__dirname, 'attach',linkname); 
			console.log(link);
			console.log(outputname);
			if(linkname.indexOf('.doc')!=-1 || linkname.indexOf('.pdf')!=-1){
			    var tempFile = fs.createWriteStream(outputname);
			    var options = {
			        host : 'ppp.pcc.gov.tw',
			    	path : link,
			    	method: 'GET'
			    };
			    tempFile.on('open', function(fd) {
			  	  var request = http.request(options, function(res) { 
			  	    res.on('data', function(chunk) {
			         //webresult += chunk;
			  	      tempFile.write(chunk);
			  	    });
      
			        res.on('end', function () {
			         //var $ = cheerio.load(webresult); 
			  	      tempFile.end();
			         //fs.writeFile(filename, webresult);  
			         });    
			      });
    
			  	  request.on('error', function(e) {
			        console.error('error');
			        console.error(e);
			      });

			      request.end();	
			  });	
			}	
		  });*/	 
		});//request secondurl
	  }//attr id
	});//tbHistory.find  	
  });//reqeust testurl	  
}

for(var i=0;i<indextable.length;i++)
{
	var testurl=indextable[i].uri;
	var target=testurl.substr(testurl.indexOf('AnnounceNo'));
	var targetID=target.substr(target.indexOf('=')+1);
	targetID=targetID.substr(0,targetID.indexOf('&'));
	var targeturl='http://ppp.pcc.gov.tw/PPP.Website/Case/LoadUserControl.aspx?Path=./Controls/Case/govland/ViewHistory.ascx&Params=AnnounceNo%3A'+targetID;
	console.log('parsing ',i, targeturl, targetID);
	ParseMapAddress(targeturl, targetID);
}
