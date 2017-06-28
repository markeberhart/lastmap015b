phodata.samples.arcjson = {
	"type":"arcjson",
	"totalRecords":5,
	"properties":[
		{"name":"latitude","type":"latitude","latMax":39,"latMin":30,"latCount":15,"decimalPlaces":4},
		{"name":"longitude","type":"longitude","lonMax":-78,"lonMin":-80,"lonCount":20,"decimalPlaces":4},
		{"name":"location","type":"string","minChars":25,"maxChars":50,"minWords":2,"maxWords":3,"count":100,"func":null},
		{"name":"name","type":"string","minChars":5,"maxChars":25,"minWords":1,"maxWords":2,"count":25,"func":null},
		{"name":"category","type":"string","minChars":5,"maxChars":10,"minWords":1,"maxWords":2,"count":1,"func":null},
		{"name":"type","type":"number","minNum":1,"maxNum":10,"func":null},
		{"name":"timestamp","type":"datetime","minDate":"1/31/2003","maxDate":"12/23/2011","minTime":"01:23:45","maxTime":"18:30:00","count":100,"format":"MM/DD/YYYY hh:mm:ss","func":null},
		{"name":"color","type":"custom","values":["red","yellow","orange","green","blue","purple"],"func":null}
	]
};

phodata.arcjson = function() {
	console.log("phodata.arcjson called.");
	//this.createLatArray(this.schema.coordinates);
	//this.createLonArray(this.schema.coordinates);
	var _properties = this.createProperties();
	var _data = {"features":[]};
	for (r=0; r<this.schema.totalRecords; r++) {
		var _o = {"geometry":{"spatialReference":{"wkid":4326}},"attributes":{}};
		//_o.geometry.id = String(r);
		var _i = _properties.getInstance();
		_o.geometry.x = _i.longitude;
		_o.geometry.y = _i.latitude;
		_o.attributes = _i;
		_data.features.push(_o);
	}
	//JSON.stringify({ x: 5 });
	//this.download({filetype:"geojson",text:JSON.stringify(_data)});
	_data = {type:this.type,data:_data};
	return _data;
}

phodata.arcjson.getText = function(data) {
	var _text = JSON.stringify(data);
	if(data.type=="arcjson"){
		var _args = {'filetype':data.type,'text':_text};
		phodata.createFile(_args);
	}
}
