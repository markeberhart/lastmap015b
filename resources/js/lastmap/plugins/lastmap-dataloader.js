lastmap.setDataOptions = function(args){

	this.dataOptions = args;
    this.backgroundData['dataRequests'] = {};
    this.backgroundData['proxyRequests'] = {};
	this.dataOptions.dates = lastmap.setDefaultDates(lastmap.dataOptions.defaultDates);
	this.dataOptions.dates['currentDate'] = {
		'year':     this.dataOptions.dates.defaultUIDateStart.year(),
		'month':    this.dataOptions.dates.defaultUIDateStart.month()+1,
		'day':      this.dataOptions.dates.defaultUIDateStart.date(),
		'date':		this.dataOptions.dates.defaultUIDateStart
	}

	this.dataOptions.dates['currentUIRange'] = {};
	this.dataOptions.dates.currentUIRange.currentDatesArray = [];
	this.dataOptions.dates.currentUIRange.currentDatesObject = {};
	this.dataOptions.dates.currentUIRange['dateStart'] =  {
		'year':     this.dataOptions.dates.defaultUIDateStart.year(),
		'month':    this.dataOptions.dates.defaultUIDateStart.month()+1,
		'day':      this.dataOptions.dates.defaultUIDateStart.date(),
		'date':		this.dataOptions.dates.defaultUIDateStart
	}
	this.dataOptions.dates.currentUIRange['dateEnd'] =  {
		'year':     this.dataOptions.dates.defaultUIDateEnd.year(),
		'month':    this.dataOptions.dates.defaultUIDateEnd.month()+1,
		'day':      this.dataOptions.dates.defaultUIDateEnd.date(),
		'date':		this.dataOptions.dates.defaultUIDateEnd
	}

    var _cnt = 0;// Get quick count of how many data layers we have
    for(dl in lastmap.dataLayers){
        if(!lastmap.backgroundData.datesByLayerName[dl]){
            lastmap.backgroundData.datesByLayerName[dl] = [];
        }
        _cnt++;
	}

    // Pass the number of data layers we have to lastmap.numOfDataLayers
	lastmap.numOfDataLayers = _cnt;
    lastmap.numOfDataFilesToLoad = 0;
    lastmap.numOfDataFilesLoaded = 0;
    lastmap.setDefaultDataLayerVisibility();
    lastmap.createDataServiceUrls();
    lastmap.loadAllDataLayers();
    /*




	//console.log(this.dataOptions.dates);


	//console.log(lastmap.dataLayers);

   // lastmap.numOfDataLayers;
	//lastmap.numOfDataLayersLoaded = 0;

    */
}

lastmap.setDefaultDates = function(args){
	var _obj = {};

	if(typeof args.dateEnd === 'string'){
		_obj.dateEnd = new moment(args.dateEnd).utc();
		_obj.dateStart = new moment(args.dateEnd).utc();
		_obj.defaultUIDateStart = new moment(args.dateStart).utc();
		_obj.defaultUIDateEnd = new moment(args.dateEnd).utc();
	}else{
		_t = new moment();
		_obj.dateEnd = new moment().utc().subtract(args.dateEnd,'days');
		_obj.dateStart = new moment().utc().subtract(args.dateEnd,'days');
		_obj.defaultUIDateStart = new moment().utc().subtract(args.dateStart,'days');
		_obj.defaultUIDateEnd = new moment().utc().subtract(args.dateEnd,'days');
	}


	if(typeof args.dateStart === 'string'){
		_obj.dateStart = new moment(args.dateStart).utc();
	}else{
		_obj.dateStart.utc().subtract(args.dateStart,'days');
		//args.dateEnd.subtract(args.dateStart,'days');
		//_obj.dateStart = args.dateEnd.subtract(args.dateStart,'days');
		//console.log(args.dateStart,args.dateEnd);
		//args.dateStart = args.dateEnd.subtract(args.dateStart,'days');
		//var _bt =  new moment(args.dateEnd).subtract(2,'days');
		//var _bt =  args.dateEnd.subtract(args.dateStart,'days');
		//console.log(args);//_bt.format('YYYY MM DD'));
	}

	//_obj.dateStart.add(1, 'days');
	//_obj.dateEnd.add(1, 'days');

	if(typeof args.defaultUIDateEnd === 'string'){
		_obj.defaultUIDateEnd = new moment(args.defaultUIDateEnd).utc();
	}else{
		_obj.defaultUIDateEnd.utc().subtract(args.defaultUIDateEnd,'days');
	}
	if(typeof args.defaultUIDateStart === 'string'){
		_obj.defaultUIDateStart = new moment(args.defaultUIDateStart).utc();
	}else{
		_obj.defaultUIDateStart.utc().subtract(args.defaultUIDateStart,'days');
	}

	//_obj.defaultUIDateStart.add(-1,'days');
	//_obj.defaultUIDateEnd.add(1,'days');

	return _obj;
}

// Set visibility object for each layer to use later with legend
lastmap.setDefaultDataLayerVisibility = function() {
	lastmap.leafletMap["layers"] = {};
	for(dl in lastmap.dataLayers){
		if(lastmap.dataLayers[dl].legend.displayOnStart){
			lastmap.dataLayers[dl]['isVisible'] = true;
		}else{
			lastmap.dataLayers[dl]['isVisible'] = false;
		}
        lastmap.dataLayers[dl]['layerName'] = dl;
        lastmap.leafletMap["layers"][dl] = L.layerGroup();
	}
}

lastmap.createDataServiceUrls = function() {
	for(dl in lastmap.dataLayers){
        var _url 	= lastmap.dataLayers[dl].apiInfo.url;
        var _isOnline = (_url.indexOf("http")>=0);
        //console.log(_isOnline);
        if(_isOnline){
             _url = lastmap.createOnlineUrl(_url);
        }
        _url = lastmap.getProxyUrl(_url,lastmap.dataLayers[dl].apiInfo.proxyUrl);
        lastmap.dataLayers[dl].apiInfo.url = _url;
        lastmap.dataLayers[dl]['loadingStatus'] = {'mustDownload':false,'proxyLayer':false,'pendingDownload':false,'downloadCompleted':false,'downloadError':false};
        lastmap.dataLayers[dl].apiInfo['fileType'] = lastmap.checkFiletype(_url);
        var _args = {'layer':dl,'url':_url};
        lastmap.checkIfMustDownloadLayerData(_args);

	}

}

lastmap.checkIfMustDownloadLayerData = function(args){
     // Create list of urls to load
    // Add the url and layer name to the lastmap.backgroundData.dataRequests object
    if(!lastmap.backgroundData.dataRequests[args.url]){
        lastmap.backgroundData.dataRequests[args.url] = args.layer;
        lastmap.dataLayers[args.layer]['loadingStatus'].mustDownload = true;
        // Keep track of the number of urls we're actually loading
        // versus the number of layers
        lastmap.numOfDataFilesToLoad++;
    }else{
        lastmap.backgroundData.proxyRequests[args.layer] = args.url;
        lastmap.dataLayers[args.layer]['loadingStatus'].proxyLayer = lastmap.backgroundData.dataRequests[args.url];
    }
}

lastmap.createOnlineUrl = function(_url){
    //if(lastmap.dataLayers[dl].apiInfo.fieldNameForDate!=null){
    var _ds 	= new moment(lastmap.dataOptions.dates.dateStart);//.format(lastmap.dataLayers[dl].apiInfo.dateFormat); // get date for this layer in a format the API will accept (eg. UNIX, YYYY-MM-DDZ, etc)
    var _de 	= new moment(lastmap.dataOptions.dates.dateEnd);//.format(lastmap.dataLayers[dl].apiInfo.dateFormat); // get date for this layer in a format the API will accept (eg. UNIX, YYYY-MM-DDZ, etc)
    //console.log(_ds.get('date'));
    _ds.add(lastmap.dataLayers[dl].apiInfo.dateStartOffset, 'days');
    _de.add(lastmap.dataLayers[dl].apiInfo.dateEndOffset, 'days');
    //console.log(_ds.get('date'));
    _ds = _ds.format(lastmap.dataLayers[dl].apiInfo.dateFormat);
    _de = _de.format(lastmap.dataLayers[dl].apiInfo.dateFormat);
    //console.log(lastmap.dataLayers[dl].legend.legendTitle,_time);
    _url = _url.replace("{{west}}", lastmap.dataOptions.dataBounds.southWest[1]);
    _url = _url.replace("{{south}}", lastmap.dataOptions.dataBounds.southWest[0]);
    _url = _url.replace("{{east}}", lastmap.dataOptions.dataBounds.northEast[1]);
    _url = _url.replace("{{north}}", lastmap.dataOptions.dataBounds.northEast[0]);
    _url = _url.replace(/\{{fieldNameForDate}}/g, lastmap.dataLayers[dl].apiInfo.fieldNameForDate); // uses regular expression to replace ALL (the "g" is for global) matching instances of fieldNameForDate
    _url = _url.replace("{{dateStart}}",_ds); // replace start date with the start date we calculated earlier
    _url = _url.replace("{{dateEnd}}",_de); // replace end date with the end date we calculated earlier
    return _url;
}

lastmap.getProxyUrl = function(_url,_proxyUrl){
    switch(_proxyUrl) {
        case null:
            _url = _url;
            break;
        case 'default':
            _url = lastmap.dataOptions.defaultProxyUrl + _url;
            break;
        default: //custom url
            _url = _proxyUrl + _url;
    }
    return _url;
}

lastmap.loadAllDataLayers = function(){
    console.log(lastmap.numOfDataFilesToLoad,lastmap.numOfDataFilesLoaded);
    //console.log("lastmap.numOfDataFilesToLoad",lastmap.numOfDataFilesToLoad);
   // for(r in lastmap.backgroundData.dataRequests){
        //console.log("Requesting: ",lastmap.backgroundData.dataRequests[r],r);
    //}
    //Loop through all layers and load the url we created

    //var _filt = lastmap.dataLayers.filter
	for(dl in lastmap.dataLayers){
        var _mustDownload = lastmap.dataLayers[dl].loadingStatus.mustDownload;
        if(_mustDownload){
            var _filetype = lastmap.dataLayers[dl].apiInfo.fileType;
            switch(_filetype) {
                case "json":
                    lastmap.downloadDataJSON(dl);
                    break;
                case "geojson":
                    lastmap.downloadDataJSON(dl);
                    break;
                case "shp":
                    lastmap.downloadDataSHP(dl);
                    break;
            }

        }

        //console.log(lastmap.dataLayers[dl].loadingStatus.mustDownload);
	}
    //console.log(lastmap.numOfDataFilesToLoad,lastmap.numOfDataFilesLoaded);
}

lastmap.loadAllProxyDataLayers = function(){
    console.log('NOW LOAD PROXIES...');//,lastmap.backgroundData.proxyRequests);
   // var _arr1 = ['apples','bananas','cherries','dates','emus'];
    //var _arr2 = _arr1.slice(0);
    //_arr1.pop();
    //_arr1.pop();
    //console.log(_arr1,_arr2);
    var _obj1 = {'one':'a','two':'b','three':'c','four':'d','five':'e'};
    var _obj2 = $.extend(true,{},_obj1);
    delete _obj1.five;

    var _obj3 = {};
    console.log(_obj1,_obj2,$.isEmptyObject(_obj3));

    for(p in lastmap.backgroundData.proxyRequests){
        var _proxyUrl = lastmap.backgroundData.proxyRequests[p];
        var _targLayer = lastmap.backgroundData.dataRequests[_proxyUrl];


        // create copy of original data object
        // TODO TO DO: states1 is being directly used as states2 so a real/separate copy is not being created
        // need to figure-out how to fix issue of maybe a "global" version of object being used
        // for proxy layers to reference for new copies to then, in turn, filter on
        // For some reason, this does not seem to be "happening" until after
        // the filtering has taken place.
        // TODO: fix copying of data and dataArray. Each has sub-arrays and objects that make normal
        // methods (methods that do not do deep-diving) non-operable.
        lastmap.dataLayers[p].apiInfo.data = $.extend(true,{},lastmap.dataLayers[_targLayer].apiInfo.data);
        lastmap.dataLayers[p].apiInfo.dataArray = $.extend(true,[],lastmap.dataLayers[_targLayer].apiInfo.dataArray);


        //lastmap.dataLayers[p].apiInfo.dataArray = Array.//Array.assign([],lastmap.dataLayers[_targLayer].apiInfo.dataArray);
        //lastmap.dataLayers[p].apiInfo.dataArray = lastmap.dataLayers[_targLayer].apiInfo.dataArray.slice(0); //create copy of data array (usable data to built shapes)
        //console.log(lastmap.dataLayers[_targLayer].apiInfo.dataArray[0].features[0].properties.NAME, lastmap.dataLayers[p].apiInfo.dataArray[0].features[0].properties.NAME);
        console.log(p + " is proxy of " + _targLayer + " (load success)");
    }

}

lastmap.allDataLayersAreReadyToFilter = function(){
    /*
    If there was no download error (it's still false), then set
    the downloadCompleted property to true
    */
    for(dl in lastmap.dataLayers){
        if(!lastmap.dataLayers[dl].loadingStatus.downloadError){
            lastmap.dataLayers[dl].loadingStatus.downloadCompleted = true;
        }
    }
    lastmap.filterAllLayers();
}

/*
Checks to see if the number of files to be downloaded matches the
number already downloaded. If so, then create the proxy layers- "proxy" layers
are layers that copy & reuse data from previously downloaded layers so we're not
downloading the same data multiple times.
*/
lastmap.checkGlobalDownloadStatus = function(){
    if(lastmap.numOfDataFilesToLoad == lastmap.numOfDataFilesLoaded){
        lastmap.loadAllProxyDataLayers();
        lastmap.allDataLayersAreReadyToFilter();
    }
}

lastmap.downloadDataJSON = function(layer){
    //console.log('lastmap.downloadDataJSON');
    var _url = lastmap.dataLayers[layer].apiInfo.url;
    var _loadingStatus = lastmap.dataLayers[layer].loadingStatus;
    //console.log(_url);
    _loadingStatus.pendingDownload = true;
    d3.json(_url, function(error,data) {
        _loadingStatus.pendingDownload = false;
        if(error){
            _loadingStatus.downloadCompleted = false;
            //lastmap.numOfDataFilesToLoad--;
            _loadingStatus.downloadError = true;
            lastmap.dataLayers[layer].apiInfo['data'] = null;
            lastmap.DownloadError(layer);
            //lastmap.checkGlobalDownloadStatus();
            //console.log(layer,"json error");
        }else{

            _loadingStatus.downloadCompleted = true;
            //lastmap.numOfDataFilesLoaded++;
            lastmap.dataLayers[layer].apiInfo['data'] = data;
            lastmap.DownloadSuccess(layer);
            //lastmap.checkGlobalDownloadStatus();
            lastmap.decodeDataJSON(layer);
        }
    });
    //console.log(lastmap.dataLayers[layer]);
}

lastmap.decodeDataJSON = function(layer){
    var _data = lastmap.dataLayers[layer].apiInfo.data;
    var _arr = [];
    var _filetype = lastmap.dataLayers[dl].apiInfo.fileType;
    switch(_data.type) {
        case "FeatureCollection":
            _arr[0] = _data;
            break;
        case "Topology":
            for(k in _data.objects){
                _arr.push(topojson.feature(_data, _data.objects[k]));
            }
            break;
        default: //In case it's ESRI/ARC JSON
            var _esri = esriConverter();
            var _fromEsri = _esri.toGeoJson(_data);
            _arr[0] = _fromEsri;
            break;
    }
    lastmap.dataLayers[layer].apiInfo['dataArray'] = _arr;
}

lastmap.downloadDataSHP = function(layer){
    var _data = lastmap.dataLayers[layer].apiInfo.data;
    var _arr = [];
    var _filetype = lastmap.dataLayers[dl].apiInfo.fileType;
    var _loadingStatus = lastmap.dataLayers[layer].loadingStatus;
    var _url = lastmap.dataLayers[layer].apiInfo.url;
        _url = _url.substring(0,_url.lastIndexOf("."));

    var _shpLoader = shp(_url).then(
        function(data){ //If successful loading
            //console.log("Loaded Shapefile!");
            _loadingStatus.downloadCompleted = true;
            //lastmap.numOfDataFilesLoaded++;
            lastmap.dataLayers[layer].apiInfo['data'] = data;
            lastmap.dataLayers[layer].apiInfo['dataArray'] = data.features;
            //console.log("298");
            lastmap.DownloadSuccess(layer);
            //lastmap.checkGlobalDownloadStatus();
            lastmap.decodeDataJSON(layer); //TODO make sure we get geojson into an array format like the others
        },
        function(event){ //If fails to load
            //console.log("Sorry, could not load Shapefile.");
            _loadingStatus.downloadCompleted = false;
            //lastmap.numOfDataFilesToLoad--;
            _loadingStatus.downloadError = true;
            lastmap.dataLayers[layer].apiInfo['data'] = null;
            lastmap.dataLayers[layer].apiInfo['dataArray'] = null;
            //console.log("308");
            lastmap.DownloadError(layer);
            //lastmap.checkGlobalDownloadStatus();
        }
    );
        _shpLoader['layer'] = layer;
}

lastmap.DownloadSuccess = function(layer){
    console.log(layer,"lastmap.DownloadSuccess");
    lastmap.numOfDataFilesLoaded++;
    lastmap.checkGlobalDownloadStatus();
     //console.log("-------------------------------");
}

lastmap.DownloadError = function(layer){
    console.log(layer,"lastmap.DownloadError");
    lastmap.numOfDataFilesToLoad--;
    lastmap.checkGlobalDownloadStatus();
}

lastmap.getDownloadErrorObject = function(){
    var _tempObj = {};
    for(dl in lastmap.dataLayers){
        if(lastmap.dataLayers[dl].loadingStatus.downloadError){
            _tempObj[dl] = lastmap.dataLayers[dl];
        }
    }
    return _tempObj;
}

lastmap.getDownloadSuccessObject = function(){
    var _tempObj = {};
    for(dl in lastmap.dataLayers){
        if(lastmap.dataLayers[dl].loadingStatus.downloadCompleted){
            _tempObj[dl] = lastmap.dataLayers[dl];
        }
    }
    return _tempObj;
}

lastmap.getLoadingStatusObject = function(){
    //lastmap.dataLayers[dl].loadingStatus, for(dl in lastmap.dataLayers){
    var _tempObj = {};
    for(dl in lastmap.dataLayers){
        _tempObj[dl] = lastmap.dataLayers[dl].loadingStatus;
    }
    return _tempObj;
}

lastmap.checkFiletype = function(url){
    var pInd,ft;
    if(url.lastIndexOf(".")){
        pInd = url.lastIndexOf(".")+1;
        ft = url.substring(pInd,url.length);
        if(ft.indexOf("/")<0){
            return ft;
        }else if(url.indexOf('json')>=0 || url.indexOf("JSON")>=0){
            return 'json';
        }else if(url.indexOf('geojson')>=0 || url.indexOf("GEOJSON")>=0){
            return 'json';
        }else{
            return null;
        }
    }
}


lastmap.filterAllLayers = function(){
    for(dl in lastmap.dataLayers){
       lastmap.dataLayers[dl].apiInfo.dataArray = lastmap.filterLayer(dl);
    }
     console.log(lastmap.dataLayers);
}

lastmap.filterLayer = function(layer){
    console.log("Filtering "+ layer);
    var _dataArray      = lastmap.dataLayers[layer].apiInfo.dataArray;
    var _dateField      = lastmap.dataLayers[layer].apiInfo.fieldNameForDate;
    var _filterOutArr   = lastmap.dataLayers[layer].apiInfo.filterOut;
    //console.log(_dataArray);
    for(k in _dataArray){
        var _features = _dataArray[k].features;
        for(f in _features){
            var _notDeleted = true;
            for(fo in _filterOutArr){
                 var _filterOutArgs = {};
                _filterOutArgs = {
                    'property':_filterOutArr[fo].property,
                    'operator':_filterOutArr[fo].operator,
                    'val1':_features[f].properties[_filterOutArr[fo].property],
                    'val2':_filterOutArr[fo].value
                };
                if(lastmap.getFilter(_filterOutArgs)){
                   //console.log(_features[f].properties[_filter.property]);
                    delete _features[f];
                    //console.log(f,"delete " + _features[f]);
                    _notDeleted = false;
                    break;
                }

            }

            if(_notDeleted){
                var _time;
                if(_features[f].properties[_dateField]){
                    _time = _features[f].properties[_dateField];
                }else{
                    _time ='2016-09-22';
                }
                _features[f].properties["idate"] = _time;
                _features[f].properties["itime"] = lastmap.getCommonTime(_time);
                _features[f].properties["prettytime"] = lastmap.getCommonTime(_time).prettytime;
                _features[f].properties["numbertime"] = lastmap.getCommonTime(_time).numbertime;
                _features[f].properties["layerName"] = layer;
                //console.log(_time,_features[f].properties["idate"],_features[f].properties["itime"],_features[f].properties["numbertime"]);
                var _isInUIRange = lastmap.dateIsInUIRange(_features[f].properties["itime"].date);
                if(_isInUIRange){
                    //If this feature/object's date falls within the current UI Date Range,
                    //then add it to lastmap.dataOptions.dates.currentUIRange.currentDatesObject
                    lastmap.dataOptions.dates.currentUIRange.currentDatesArray[_features[f].properties["numbertime"]] = _features[f].properties["itime"];
                    lastmap.dataOptions.dates.currentUIRange.currentDatesObject[_features[f].properties["numbertime"]] = _features[f].properties["itime"];
                }
            }
        }
    }
    return _dataArray;
}


lastmap.getFilter = function(args){
    switch(args.operator) {
        case "!=":
            return args.val1 != args.val2;
        case "==":
            return args.val1 == args.val2;
        case "+":
            return args.val1 + args.val2;
        case "-":
            return args.val1 - args.val2;
        case "*":
            return args.val1 * args.val2;
        case "/":
            return args.val1 / args.val2;
        case "<":
            return args.val1 < args.val2;
        case ">":
            return args.val1 > args.val2;
        case "<=":
            return args.val1 <= args.val2;
        case ">=":
            return args.val1 >= args.val2;
        case "LIKE"||"like"||"IS LIKE"||"is like":
            return (String(args.val1).indexOf(String(val2))>=0);
        case "NOT LIKE"||"not like"||"!LIKE"||"!like":
            return (String(args.val1).indexOf(String(val2))<0);
    }
}


lastmap.plotDataLayer = function(args) {
    //console.log("plotDataLayer",args);

    var _data = args.data;
    var _layerInfo = lastmap.dataLayers[args.layer];

    for(k in _data){
        //console.log(_data[k]);
        var _sticon = lastmap.getDataIconOrStyleObj(_layerInfo);
        var _features = _data[k].features;
        var _args = {'features':_features,'style':_sticon,'layerInfo':_layerInfo};
        //var _next = Number(k)+1;

        switch (_sticon.shape) {
            case 'point':
                lastmap.createPoints(_args);
                break;
            case 'line':
                lastmap.createLines(_args);
                break;
            case 'polygon':
                lastmap.createPolygons(_args);
                break;
            default:
				// fallback to here
        }
    }
    /*
	// Need to figure-in both HTTP and FILE methods to "load" data
    var _url = args.apiInfo.url;
    //if(lastmap.proxyUrl){
        //_url = lastmap.proxyUrl + _url;
    //}
	d3.json(_url, function(error, data) {


        lastmap.numOfDataLayersLoaded++; // increment the number of layers loaded
        lastmap.checkAllDataLoaded(args);
	});
    */
}

lastmap.dateIsInUIRange = function(date) {
	var _rsd = lastmap.dataOptions.dates.currentUIRange.dateStart.date;
	var _red = lastmap.dataOptions.dates.currentUIRange.dateEnd.date;
	var _isInRange = false;
	//console.log(_rsd <= date && date <=_red);
	if(_rsd <= date && date <=_red){
		_isInRange = true;
		//console.log(lastmap.getCommonTime(date).prettytime);
	}
	return _isInRange;
}

lastmap.checkAllDataLoaded = function(args) {
	lastmap.loaderWin.setLoaderText("Please stand by, loading "+args.legend.legendTitle);
	//console.log(lastmap.numOfDataLayers,lastmap.numOfDataLayersLoaded);
	if(lastmap.numOfDataLayers==lastmap.numOfDataLayersLoaded){
		//lastmap.loaderWin.closeLoader();
        lastmap.loaderWin.setLoaderText("Data layers loaded, stand by for basemap...");
		//console.log(lastmap.backgroundData);
		lastmap.setDefaultObjectDisplay();
	}
}

lastmap.getCommonTime = function(time) {
	var _time = time;

	// Use MomentJS to create a more feature-rich date object that can read multuiple date/time formats automatically
	// This reduces the amount of custom parsing we need to perform for various dates
	_time = moment(time).utc();

	var _yyyy = String(_time.year());
	var _mm = String(_time.get('month')+1);
	var _dd = String(_time.get('date'));

	function getDouble(num){ //returns a number like 6 or 7 as "06" or "07"
		num = Number(num);
		return num > 9 ? "" + num: "0" + num;
	}

	/*
	Here we are creating the framework of the "lastmap.backgroundData.byDate" object
	that we created in lastmap.backgroundData. It is looking to see if an object
	has been created yet that corresponds to the date of the current UI object (point/polyline/polygon).
	If no object for that year/month/day exists, an empty object/placeholder is created.
	*/
	if(!lastmap.backgroundData.byDate[_yyyy]){
		lastmap.backgroundData.byDate[_yyyy] = {};
	}
	if(!lastmap.backgroundData.byDate[_yyyy][_mm]){
		lastmap.backgroundData.byDate[_yyyy][_mm] = {};
	}
	if(!lastmap.backgroundData.byDate[_yyyy][_mm][_dd]){
		lastmap.backgroundData.byDate[_yyyy][_mm][_dd] = [];
	}

	/*
	Create an object to pass basic year/month/day info to
	any script calling this function
	*/
	var _timeObj = {
		'year':_yyyy,
		'month':_mm,
		'day':_dd,
		'date':_time,
		'prettytime':(_mm+"/"+_dd+"/"+_yyyy),
		'numbertime':(Number(_yyyy+getDouble(_mm)+getDouble(_dd)))
	}

	return _timeObj;
}

lastmap.getDataIconOrStyleObj = function(args) {
	var _styleIconObj;

	//console.log(args);
	/*
	Loop through zoom levels from current zoom level down looking for
	the nearest icon or style associated with this data layer and zoom level.
	Once it's found, exit the routine and continue on.
	*/
	for(var i=lastmap.leafletMap.getZoom(); i>=0; i--){
		if(args.dataStyles[i]){
			_styleIconObj = args.dataStyles[i];
			break;
		}
	}
	return _styleIconObj;
}

lastmap.backgroundData = {

	// instantiate the "byDate" object
	byDate: {},
    datesByLayerName: {},
    allData: [],
	allDates: []

};

lastmap.addToBackgroundData = function(args) {
	// Call the function that adds/stores the ui object by year->month->day
	// Create the object to store the UI point/polyline/polygon
	var _obj = {'object':args.object};

	//Add data and date to indexes to help with racking/stacking information by date later on in UI
	lastmap.backgroundData.allData.push(args);
	lastmap.backgroundData.allDates[args.properties.itime.numbertime] = args.properties.itime;

	// Add the object to the array corresponding to the year->month->day that the UI object represents
	lastmap.backgroundData.byDate[args.properties.itime.year][args.properties.itime.month][args.properties.itime.day].push(_obj);
	//console.log(lastmap.backgroundData.byDate);
}


