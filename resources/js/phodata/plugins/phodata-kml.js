phodata.samples.kml = {
	"type":"kml",
	"totalRecords":10,
	"lineDelimiter":"\r\n", //"<br>"
	"properties":[
		{"name":"latitude","type":"latitude","latMax":39,"latMin":30,"latCount":15,"decimalPlaces":4},
		{"name":"longitude","type":"longitude","lonMax":-78,"lonMin":-80,"lonCount":20,"decimalPlaces":4},
		{"name":"name","type":"string","minChars":5,"maxChars":25,"minWords":1,"maxWords":2,"count":25,"func":null},
		{"name":"summary","type":"string","minChars":25,"maxChars":50,"minWords":2,"maxWords":3,"count":100,"func":null},
		{"name":"category","type":"string","minChars":5,"maxChars":10,"minWords":1,"maxWords":2,"count":1,"func":null},
		{"name":"type","type":"number","minNum":1,"maxNum":10,"func":null},
		{"name":"timestamp","type":"datetime","minDate":"1/31/2003","maxDate":"12/23/2011","minTime":"01:23:45","maxTime":"18:30:00","count":100,"format":"MM/DD/YYYY hh:mm:ss","func":null},
		{"name":"color","type":"custom","values":["red","yellow","orange","green","blue","purple"],"func":null}
	]
};

phodata.kml = function() {
	console.log("phodata.kml called.");
	var _properties = this.createProperties();
	var _data = {};
		_data.Document = {};
		_data.Document.Folder = [];
	for (r=0; r<this.schema.totalRecords; r++) {
		var _i = _properties.getInstance();
		var Placemark = {};
			Placemark.description = {};
			Placemark.TimeStamp = {};
		// Check if description is explicitly provided. If so, don't
		// create an Object and simply associate desired text to
		// Description string of Placemark.
		var _noDesc = true;
		if(_i['description']){
			Placemark.description = _i.description;
			_noDesc = false;
		}
		for(t in _i){
			if(_i['name']){
				Placemark['name'] = _i.name;
			}
			if(_noDesc){
				Placemark.description[t] = _i[t]+this.schema.lineDelimiter;
			}
			if(t=="timestamp"){
				Placemark.TimeStamp = _i[t];
			}
		}
		Placemark.Point = {coordinates:(_i.longitude+","+_i.latitude+",0")};
		_data.Document.Folder.push(Placemark);
	}
	_data = {type:this.type,data:_data};
	return _data;
}

phodata.kml.getText = function(data) {
	console.log("phodata.kml.getText");
	var _text = '';
	if(data.type=='kml'){
		console.log("building kml...");
		//_text += '<?xml version="1.0" encoding="UTF-8" ?>';
		_text += '<kml xmlns="http://www.opengis.net/kml/2.2" xmlns:gx="http://www.google.com/kml/ext/2.2">';
		_text += '<Document><name>Sample Data Courtesy of PhoData</name>';
		_text += '<Folder><name>Sample KML Courtesy of PhoData</name>';

		for(r in data.data.Document.Folder){
			var _r = data.data.Document.Folder[r];
			var _description = '';
			// If the description is of type "Object"...
			if((typeof _r.description)=="object"){
				for(d in _r.description){
					var _itemName = d.charAt(0).toUpperCase() + d.slice(1).toLowerCase();
					_description += (_itemName + ': ' + _r.description[d]);
				}
			}else{ // If the description is NOT of type "Object" (eg. "String" or "Number")
				_description = _r.description;
			}
			console.log(_description);
			_text += '<Placemark>';
			if(_r.name){
				_text += '<name>'+_r.name+'</name>';
			}
			_text += '<description>'+_description+'</description>';
			_text += '<Point><coordinates>'+_r.Point.coordinates+'</coordinates></Point>';
			_text += '<TimeStamp><when>'+_r.TimeStamp+'</when></TimeStamp>';
			_text += '</Placemark>';
		}
		_text += '</Folder></Document></kml>';
		var _args = {'filetype':data.type,'text':_text};
		phodata.createFile(_args);
	}
}
