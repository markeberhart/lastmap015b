/*
 PhoData is a JavaScript library for creating automated files for testing data-heavy applications
 (c) 2016, Mark Eberhart
*/

!function() {

    phodata = {};
	phodata.version = '0.0.1';
	phodata.myBody = this.document.getElementsByTagName('body');
	phodata.samples = {};
	//console.log(this.document.getElementsByTagName('body')[0]);

	phodata.createData = function(args) {
		this.onload = args.onload;
		this.schema = args.schema;
		this.type = this.schema.type;
		return this.init();
	}

	// JSON Stringify description of extra rules
	// that can be applied to objects when converting to string
	// https://msdn.microsoft.com/library/cc836459(v=vs.94).aspx

	phodata.init = function() {
		var _data;
		_data = this[this.type]();
		this.onload(_data);
		return _data;
	}

	phodata.createFile = function(args){
		var _now = new Date();
			_now = _now.getTime();
		var _filename = "data_"+_now+"."+args.filetype;
		var _link = window.document.createElement("a");
		_link.setAttribute("target","_blank");
		if(Blob !== undefined) {
			var blob = new Blob([args.text], {type: "text/plain"});
			_link.setAttribute("href", URL.createObjectURL(blob));
		} else {
			_link.setAttribute("href","data:text/plain," + encodeURIComponent(args.text));
		}
		_link.setAttribute("download",_filename);
		window.document.body.appendChild(_link);
		_link.click();
		window.document.body.removeChild(_link);
	}

	phodata.downloadData = function(data){
		this[this.type].getText(data);
		//console.log(this.type);
	}


	phodata.createLatArray = function(args) {//send args so we can do/lat/lon separately in CSV and other formats
		var _latMin 		= args.latMin,
			_latMax			= args.latMax,
			_decimalPlaces	= args.decimalPlaces
			this.latArray	=[];
		for(i=0; i<args.latCount; i++){
			this.latArray.push((Math.random() * ((_latMax) - (_latMin)) + (_latMin)).toFixed(_decimalPlaces) * 1);
		}
		return this.latArray;
	}

	phodata.createLonArray = function(args) {
		var _lonMin 		= args.lonMin,
			_lonMax			= args.lonMax,
			_decimalPlaces	= args.decimalPlaces
			this.lonArray	=[];
		for(i=0; i<args.lonCount; i++){
			this.lonArray.push((Math.random() * ((_lonMax) - (_lonMin)) + (_lonMin)).toFixed(_decimalPlaces) * 1);
		}
		return this.lonArray;
	}

	phodata.createProperties = function() {
		this.properties = {};
		for (var prop in this.schema.properties){
			var _property = this.schema.properties[prop];
			var _args = {};
			for(a in _property){
				_args[a] = _property[a];
			}
			this.properties[_property.name] = {};
			this.properties[_property.name]["name"] = _property.name;
			if(_property.type=="string"){
				this.properties[_property.name]["array"] = this.createStringArray(_args);
				this.properties[_property.name]["getInstance"] = function(){
					var _num = (Math.random()*(this.array.length-1)).toFixed(0);
					var _str = this.array[_num];
					return _str;
				};
			}
			if(_property.type=="datetime"){
				this.properties[_property.name]["args"] = _args;
				this.properties[_property.name]["array"] = this.createDateTimeArray(_args);
				this.properties[_property.name]["getInstance"] = function(){
					var _num = (Math.random()*(this.array.length-1)).toFixed(0);
					var _datetime = this.array[_num];
					var _dt = new Date(_datetime);
					//console.log(_datetime);
					return _datetime;
				};
			}
			if(_property.type=="number"){
				this.properties[_property.name]["args"] = _args;
				this.properties[_property.name]["getInstance"] = function(){
					var _num = (Math.random() * (this.args.maxNum - this.args.minNum) + (this.args.minNum)).toFixed(0);
					return _num;
				};
			}
			if(_property.type=="latitude"){
				this.properties[_property.name]["args"] = _args;
				this.properties[_property.name]["array"] = this.createLatArray(_args);
				this.properties[_property.name]["getInstance"] = function(){
					var _latIndex 	= (Math.random()*(this.array.length-1)).toFixed(0);
					var _lat = this.array[_latIndex];
					return _lat;
				};
			}
			if(_property.type=="longitude"){
				this.properties[_property.name]["args"] = _args;
				this.properties[_property.name]["array"] = this.createLonArray(_args);
				this.properties[_property.name]["getInstance"] = function(){
					var _lonIndex 	= (Math.random()*(this.array.length-1)).toFixed(0);
					var _lon = this.array[_lonIndex];
					return _lon;
				};
			}
			if(_property.type=="custom"){
				this.properties[_property.name]["args"] = _args;
				this.properties[_property.name]["getInstance"] = function(){
					var _num = (Math.random()*(this.args.values.length-1)).toFixed(0);
					return this.args.values[_num];
				};
			}
			this.properties["getInstance"] = function(){
				var _obj = {};
				for(p in this){ //cycle through each object type described in properties schema
					if(typeof this[p]=="object") _obj[this[p].name] = this[p].getInstance(); //avoid the function "getInstance"
				}
				return _obj;
			}
		}
		return this.properties;
	}

	phodata.createDateTimeArray = function(args) {
		var _arr 		= [];
		var _formatArr	= args.format.split(" ");
		var _dateFormatArr = _formatArr[0].split("/");
		var _timeFormatArr = _formatArr[1].split(":");
		var _indexYYYY 	= _dateFormatArr.indexOf("YYYY");
		var _indexMM 	= _dateFormatArr.indexOf("MM");
		var _indexDD 	= _dateFormatArr.indexOf("DD");
		var _indexhh 	= _timeFormatArr.indexOf("hh");
		var _indexmm 	= _timeFormatArr.indexOf("mm");
		var _indexss 	= _timeFormatArr.indexOf("ss");
		var _minTimeArr	= args.minTime.split(":");
		var _maxTimeArr	= args.maxTime.split(":");
		var _minDateArr = args.minDate.split("/");
		var _maxDateArr = args.maxDate.split("/");
		var _minDate 	= new Date(_minDateArr[_indexYYYY],_minDateArr[_indexMM],_minDateArr[_indexDD],_minTimeArr[_indexhh],_minTimeArr[_indexmm],_minTimeArr[_indexss]).getTime();
		var _maxDate 	= new Date(_maxDateArr[_indexYYYY],_maxDateArr[_indexMM],_maxDateArr[_indexDD],_maxTimeArr[_indexhh],_maxTimeArr[_indexmm],_maxTimeArr[_indexss]).getTime();
		for(i=0; i<args.count; i++){
			var _datetime = (Math.random() * (_maxDate - _minDate) + (_minDate)).toFixed(0);
				_datetime = new Date(Number(_datetime));
			//new Date(year, month[, day[, hour[, minutes[, seconds[, milliseconds]]]]]);
			//_datetimeStr =
			var _YYYY 	= this.checkForZero(_datetime.getFullYear());
			var _MM		= this.checkForZero(_datetime.getMonth()+1);
			var _DD		= this.checkForZero(_datetime.getDate());
			var _hh		= this.checkForZero(_datetime.getHours());
			var _mm		= this.checkForZero(_datetime.getMinutes());
			var _ss		= this.checkForZero(_datetime.getSeconds());
			var _datetimeStr = "";
			if(this.schema.type!="kml"){
				_datetimeStr = _MM+"/"+_DD+"/"+_YYYY+" "+_hh+":"+_mm+":"+_ss;
			}else{
				_datetimeStr = _YYYY+"-"+_MM+"-"+_DD+"T"+_hh+":"+_mm+":"+_ss+"+00:00";
			}
			_arr.push(_datetimeStr);//_datetime.toString());
		}
		return _arr;
	}

	// Thanks to Chris Hope for this bit of code!
	// http://www.electrictoolbox.com/pad-number-two-digits-javascript
	phodata.checkForZero = function(num) {
		return (num < 10 ? '0' : '') + num
	}

	phodata.createStringArray = function(args) {
		var _arr 	= [];
		for(i=0; i<args.count; i++){
			var _numWords = (Math.random() * (args.maxWords - args.minWords) + (args.minWords)).toFixed(0);
			var _numChars = (Math.random() * (args.maxChars - args.minChars) + (args.minChars)).toFixed(0);
			var _wordStr = "";
			for(n=0; n<_numWords; n++){
				var _wordIndex = (Math.random()*(this.wordArray.length-1)).toFixed(0);
				var _word = this.wordArray[_wordIndex];
					_word = _word.charAt(0).toUpperCase() + _word.slice(1).toLowerCase();
				if(n!=_numWords-1){
					_wordStr = _wordStr + _word + " ";
				}else{
					_wordStr = _wordStr + _word;
				}
			}
			_wordStr = _wordStr.substring(0,_numChars);
			if(_wordStr[_wordStr.length-1]==" "){
				_wordStr = _wordStr.substring(0,(_numChars-1));
			}
			_arr.push(_wordStr);
		}
		return _arr;
	}


	// phodata.wordArray borrowed from Lorem ipsum generator
	// @author C. Peter Chen of http://dev-notes.com
	// @date 20080812

	phodata.wordArray = ["lorem","ipsum","dolor","sit","amet","consectetur","adipisicing","elit","sed","do","eiusmod","tempor","incididunt","ut","labore","et","dolore","magna","aliqua","enim","ad","minim","veniam","quis","nostrud","exercitation","ullamco","laboris","nisi","ut","aliquip","ex","ea","commodo","consequat","duis","aute","irure","dolor","in","reprehenderit","in","voluptate","velit","esse","cillum","dolore","eu","fugiat","nulla","pariatur","excepteur","sint","occaecat","cupidatat","non","proident","sunt","culpa","qui","officia","deserunt","mollit","anim","id","est","laborum","sed","ut","perspiciatis","unde","omnis","iste","natus","error","sit","voluptatem","accusantium","doloremque","laudantium","totam","rem","aperiam","eaque","ipsa","quae","ab","illo","inventore","veritatis","et","quasi","architecto","beatae","vitae","dicta","sunt","explicabo","nemo","enim","ipsam","voluptatem","quia","voluptas","sit","aspernatur","aut","odit","aut","fugit","sed","quia","consequuntur","magni","dolores","eos","qui","ratione","voluptatem","sequi","nesciunt","neque","porro","quisquam","est","dolorem","ipsum","quia","dolor","sit","amet","consectetur","adipisci","velit","sed","quia","non","numquam","eius","modi","tempora","incidunt","ut","labore","et","dolore","magnam","aliquam","quaerat","voluptatem","ut","enim","ad","minima","veniam","quis","nostrum","exercitationem","ullam","corporis","suscipit","laboriosam","nisi","ut","aliquid","ex","ea","commodi","consequatur","quis","autem","vel","eum","iure","reprehenderit","qui","ea","voluptate","velit","esse","quam","nihil","molestiae","consequatur","vel","illum","qui","dolorem","eum","fugiat","quo","voluptas","nulla","pariatur","at","vero","eos","et","accusamus","et","iusto","odio","dignissimos","ducimus","blanditiis","praesentium","voluptatum","deleniti","atque","corrupti","quos","dolores","quas","molestias","excepturi","sint","obcaecati","cupiditate","non","provident","similique","sunt","culpa","qui","officia","deserunt","mollitia","animi","id","est","laborum","et","dolorum","fuga","harum","quidem","rerum","facilis","est","et","expedita","distinctio","Nam","libero","tempore","cum","soluta","nobis","est","eligendi","optio","cumque","nihil","impedit","quo","minus","id","quod","maxime","placeat","facere","possimus","omnis","voluptas","assumenda","est","omnis","dolor","repellendus","temporibus","autem","quibusdam","aut","officiis","debitis","aut","rerum","necessitatibus","saepe","eveniet","ut","et","voluptates","repudiandae","sint","molestiae","non","recusandae","itaque","earum","rerum","hic","tenetur","a","sapiente","delectus","aut","reiciendis","voluptatibus","maiores","alias","consequatur","aut","perferendis","doloribus","asperiores","repellat"];

	function getLoremIpsumText(elem) {
		var minWordCount = 15;
		var maxWordCount = 100;

		var randy = Math.floor(Math.random()*(maxWordCount - minWordCount)) + minWordCount;
		var ret = "";
		for(i = 0; i < randy; i++) {
			var newTxt = loremIpsumWordBank[Math.floor(Math.random() * (loremIpsumWordBank.length - 1))];
			if (ret.substring(ret.length-1,ret.length) == "." || ret.substring(ret.length-1,ret.length) == "?") {
				newTxt = newTxt.substring(0,1).toUpperCase() + newTxt.substring(1, newTxt.length);
			}
			ret += " " + newTxt;
		}
		return ret.substring(0,ret.length-1);
	}


}();
