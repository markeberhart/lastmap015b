!function() {
    datagobbler = {};
    datagobbler.dataLayers = {};
    datagobbler.version = '0.0.1';
    datagobbler.ui = {};
    datagobbler.ui.layers = {};
    datagobbler.numOfDataFilesToLoad = 0;
    datagobbler.numOfDataFilesLoaded = 0;
    datagobbler.numOfDataFilesToFilter = 0;
    datagobbler.numOfDataFilesFiltered = 0;
    datagobbler.backgroundData = {
        byDate: {},
        featuresByLayerName:{},
        allData:[],
        allDates:[]
    };

    datagobbler.getData = function(_url,_cb){
        d3.json(_url, function(error,data) {
            if(error){
                //console.log(error,"JSON error");
            }else{
                datagobbler.ondataLoaded = _cb;
                //console.log(data);
                //_cb(data);
                datagobbler.dataLayers = data.dataLayers;
                datagobbler.setDataOptions(data.dataOptions);
            }
        });
    }

    datagobbler.setDataOptions = function(args){
        //console.log("datagobbler.setDataOptions");
        this.dataOptions = args;
        this.dataOptions.defaultDates['idateStart'] = this.getCommonTime(this.dataOptions.defaultDates.dateStart);
        this.dataOptions.defaultDates['idateEnd'] = this.getCommonTime(this.dataOptions.defaultDates.dateEnd);
        this.backgroundData['dataRequests'] = {};
        this.backgroundData['proxyRequests'] = {};
        this.dataOptions.dates = datagobbler.setDefaultDates(datagobbler.dataOptions.defaultDates);
        this.dataOptions.dates['currentDate'] = {
            'year':     this.dataOptions.dates.defaultUIDateStart.year(),
            'month':    this.dataOptions.dates.defaultUIDateStart.month()+1,
            'day':      this.dataOptions.dates.defaultUIDateStart.date(),
            'date': this.dataOptions.dates.defaultUIDateStart
        }
        this.dataOptions.dates['currentUIRange'] = {};
        this.dataOptions.dates.currentUIRange.currentDatesArray = [];
        this.dataOptions.dates.currentUIRange.currentDatesObject = {};
        this.dataOptions.dates.currentUIRange['dateStart'] =  {
            'year':     this.dataOptions.dates.defaultUIDateStart.year(),
            'month':    this.dataOptions.dates.defaultUIDateStart.month()+1,
            'day':      this.dataOptions.dates.defaultUIDateStart.date(),
            'date': this.dataOptions.dates.defaultUIDateStart
        };
        this.dataOptions.dates.currentUIRange['dateEnd'] =  {
            'year':     this.dataOptions.dates.defaultUIDateEnd.year(),
            'month':    this.dataOptions.dates.defaultUIDateEnd.month()+1,
            'day':      this.dataOptions.dates.defaultUIDateEnd.date(),
            'date': this.dataOptions.dates.defaultUIDateEnd
        };
        var _cnt = 0;// Get quick count of how many data layers we have
        for(dl in datagobbler.dataLayers){
            if(!datagobbler.backgroundData.featuresByLayerName[dl]){
                datagobbler.backgroundData.featuresByLayerName[dl] = {};
                datagobbler.backgroundData.featuresByLayerName[dl]['allData'] = [];
                datagobbler.backgroundData.featuresByLayerName[dl]['byDate'] = {};
                datagobbler.backgroundData.featuresByLayerName[dl]['byProperties'] = {};
                datagobbler.backgroundData.featuresByLayerName[dl]['errors'] = {};
            }
            _cnt++;
        }

        // Pass the number of data layers we have to datagobbler.numOfDataLayers datagobbler.numOfDataLayers = _cnt;
        //datagobbler.setDefaultDataLayerVisibility();
        datagobbler.createDataServiceUrls();
        datagobbler.loadAllDataLayers();
    }

    datagobbler.setDefaultDates = function(args){
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
        }

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

        return _obj;
    }

    // Set visibility object for each layer to use later with legend
    datagobbler.setDefaultDataLayerVisibility = function() {
        //console.log("datagobbler.setDefaultDataLayerVisibility");
        for(dl in datagobbler.dataLayers){
            if(datagobbler.dataLayers[dl].legend.displayOnStart){
                datagobbler.dataLayers[dl]['isVisible'] = true;
            }else{
                datagobbler.dataLayers[dl]['isVisible'] = false;
                datagobbler.dataLayers[dl]['layerName'] = dl;
                // datagobbler.ui.layers[dl] = L.layerGroup();
            }
        }
    }

    datagobbler.createDataServiceUrls = function() {
        for(dl in datagobbler.dataLayers){
            var _url = datagobbler.dataLayers[dl].apiInfo.url;
            var _isOnline = (_url.indexOf("http")>=0);
            //console.log(_isOnline);
            if(_isOnline){
                _url = datagobbler.createOnlineUrl(_url);
            }
            _url = datagobbler.getProxyUrl(_url,datagobbler.dataLayers[dl].apiInfo.proxyUrl);
            datagobbler.dataLayers[dl].apiInfo.url = _url; datagobbler.dataLayers[dl]['loadingStatus'] = {'mustDownload':false,'proxyLayer':false,'pendingDownload':false,'downloadCompleted':false,'downloadError':false};
            //datagobbler.dataLayers[dl].apiInfo['fileType'] = datagobbler.checkFiletype(_url);
            //console.log(_url,datagobbler.checkFiletype(_url));
            _url = encodeURIComponent(_url);
            var _args = {'layer':dl,'url':_url};
            datagobbler.checkIfMustDownloadLayerData(_args);
            //console.log("Normal URL: ",_url);
            //console.log("Encoded URL: ",encodeURIComponent(_url));
        }
    }

    datagobbler.checkIfMustDownloadLayerData = function(args){
         // Create list of urls to load
        // Add the url and layer name to the datagobbler.backgroundData.dataRequests object
        if(!datagobbler.backgroundData.dataRequests[args.url]){
    //console.log("add request: ", args.layer);
            datagobbler.backgroundData.dataRequests[args.url] = args.layer;
            datagobbler.dataLayers[args.layer]['loadingStatus'].mustDownload = true;
            // Keep track of the number of urls we're actually loading
            // versus the number of layers
            datagobbler.numOfDataFilesToLoad++;
        }else{
    //console.log("add proxy: ", args.layer); datagobbler.dataLayers[args.layer]['loadingStatus'].mustDownload = false;
            datagobbler.backgroundData.proxyRequests[args.layer] = args.url;
            datagobbler.dataLayers[args.layer]['loadingStatus'].proxyLayer = datagobbler.backgroundData.dataRequests[args.url];
        }
         //we will filter every layer, but not download every layer
    }

    datagobbler.createOnlineUrl = function(_url){
        //if(datagobbler.dataLayers[dl].apiInfo.dateInfo.fieldNameForDate!=null){
        var _ds = new moment(datagobbler.dataOptions.dates.dateStart);//.format(datagobbler.dataLayers[dl].apiInfo.dateInfo.dateFormat); // get date for this layer in a format the API will accept (eg. UNIX, YYYY-MM-DDZ, etc)
        var _de = new moment(datagobbler.dataOptions.dates.dateEnd);//.format(datagobbler.dataLayers[dl].apiInfo.dateInfo.dateFormat); // get date for this layer in a format the API will accept (eg. UNIX, YYYY-MM-DDZ, etc)
        //console.log(_ds.get('date'));
        _ds.add(datagobbler.dataLayers[dl].apiInfo.dateStartOffset, 'days');
        _de.add(datagobbler.dataLayers[dl].apiInfo.dateEndOffset, 'days');
        //console.log(_ds.get('date'));
        _ds = _ds.format(datagobbler.dataLayers[dl].apiInfo.dateInfo.dateFormat);
        _de = _de.format(datagobbler.dataLayers[dl].apiInfo.dateInfo.dateFormat);
        //console.log(datagobbler.dataLayers[dl].legend.legendTitle,_time);
        _url = _url.replace("{{west}}", datagobbler.dataOptions.dataBounds.southWest[1]);
        _url = _url.replace("{{south}}", datagobbler.dataOptions.dataBounds.southWest[0]);
        _url = _url.replace("{{east}}", datagobbler.dataOptions.dataBounds.northEast[1]);
        _url = _url.replace("{{north}}", datagobbler.dataOptions.dataBounds.northEast[0]);
        _url = _url.replace(/\{{fieldNameForDate}}/g, datagobbler.dataLayers[dl].apiInfo.dateInfo.fieldNameForDate); // uses regular expression to replace ALL (the "g" is for global) matching instances of fieldNameForDate
        _url = _url.replace("{{dateStart}}",_ds); // replace start date with the start date we calculated earlier
        _url = _url.replace("{{dateEnd}}",_de); // replace end date with the end date we calculated earlier
        return _url;
    }

    datagobbler.getProxyUrl = function(_url,_proxyUrl){
        switch(_proxyUrl) {
            case null:
                _url = _url;
                break;
            case 'default':
                _url = datagobbler.dataOptions.defaultProxyUrl + _url;
                break;
            default: //custom url
                _url = _proxyUrl + _url;
        }
        return _url;
    }

    datagobbler.loadAllDataLayers = function(){
        //console.log(datagobbler.numOfDataFilesToLoad,datagobbler.numOfDataFilesLoaded);
        //console.log("datagobbler.numOfDataFilesToLoad",datagobbler.numOfDataFilesToLoad);
        for(dl in datagobbler.dataLayers){
            var _mustDownload = datagobbler.dataLayers[dl].loadingStatus.mustDownload;
            if(_mustDownload){
                var _filetype = datagobbler.dataLayers[dl].apiInfo.fileType;
                switch(_filetype) {
                    case "json":
                        datagobbler.downloadDataJSON(dl);
                        break;
                    case "geojson":
                        datagobbler.downloadDataJSON(dl);
                        break;
                    case "shp":
                        datagobbler.downloadDataSHP(dl);
                        break;
                    case "csv":
                        datagobbler.downloadDataCSV(dl);
                        break;
                    case "zip":
                        datagobbler.downloadDataZIP(dl);
                        break;
                }
            }
        }
        //console.log(datagobbler.dataLayers[dl].loadingStatus.mustDownload);
        //console.log(datagobbler.numOfDataFilesToLoad,datagobbler.numOfDataFilesLoaded);
    }

    datagobbler.loadAllProxyDataLayers = function(){
        //console.log('NOW LOAD PROXIES...');//,datagobbler.dataLayers);//,datagobbler.backgroundData.proxyRequests);
        for(p in datagobbler.backgroundData.proxyRequests){

            var _proxyUrl = datagobbler.backgroundData.proxyRequests[p];
            var _targLayer = datagobbler.backgroundData.dataRequests[_proxyUrl];

            //console.log("===> ",_targLayer,datagobbler.dataLayers[_targLayer].layerOkToFilter);
            // create copy of original data object
            // TODO TO DO: states1 is being directly used as states2 so a real/separate copy is not being created
            // need to figure-out how to fix issue of maybe a "global" version of object being used
            // for proxy layers to reference for new copies to then, in turn, filter on
            // For some reason, this does not seem to be "happening" until after
            // the filtering has taken place.
            // TODO: fix copying of data and dataArray. Each has sub-arrays and objects that make normal
            // methods (methods that do not do deep-diving) non-operable.
            datagobbler.dataLayers[p].apiInfo.data = $.extend(true,{},datagobbler.dataLayers[_targLayer].apiInfo.data);
            datagobbler.dataLayers[p].apiInfo.dataArray = $.extend(true,[],datagobbler.dataLayers[_targLayer].apiInfo.dataArray);

            if(datagobbler.dataLayers[_targLayer].layerOkToFilter){
                datagobbler.layerOkToFilter(p);
            }else{
                datagobbler.layerNotOkToFilter(p);
                //console.log("DON'T DO ANYTHING WITH " + p +", because " + _targLayer + " did not download!");
                var _error = {'notes':'This is a proxy layer that pulls from a golden copy. The gold copy did not download, which means the derrivative/proxy copy could not be created.','proxyLayer':p,'targetLayer':_targLayer};
                datagobbler.logSystemErrorForLayer({'layer':p,'errorEvent':_error});
            }
        }

    }

    datagobbler.downloadDataJSON = function(layer){
        //console.log('datagobbler.downloadDataJSON');
        var _url = datagobbler.dataLayers[layer].apiInfo.url;
        var _loadingStatus = datagobbler.dataLayers[layer].loadingStatus;
        //console.log(_url);
        _loadingStatus.pendingDownload = true;
        d3.json(_url, function(error,data) { //console.log('JSON done.',data,_url);
            _loadingStatus.pendingDownload = false;
            if(error){
                _loadingStatus.downloadCompleted = false;
                _loadingStatus.downloadError = true;
                datagobbler.dataLayers[layer].apiInfo['data'] = null;
                datagobbler.DownloadError(layer,error);
                //console.log(layer,"==== >> JSON error <<====");
            }else{
                _loadingStatus.downloadCompleted = true;
                datagobbler.dataLayers[layer].apiInfo['data'] = data;
                datagobbler.DownloadSuccess(layer);
                datagobbler.decodeDataJSON(layer);
    //console.log("JSON data: ",data);
            }
        });

    }

    datagobbler.decodeDataJSON = function(layer){
        var _data = datagobbler.dataLayers[layer].apiInfo.data;
        var _arr = [];
        var _filetype = datagobbler.dataLayers[dl].apiInfo.fileType;
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
        //console.log("decodeDataJSON-arr: ",_arr)
        datagobbler.dataLayers[layer].apiInfo['dataArray'] = _arr;
        datagobbler.checkGlobalDownloadStatus();
        //console.log(datagobbler.dataLayers,"datagobbler.decodeDataJSON",_arr);
    }

    datagobbler.downloadDataSHP = function(layer){
        var _data = datagobbler.dataLayers[layer].apiInfo.data;
        var _arr = [];
        var _filetype = datagobbler.dataLayers[dl].apiInfo.fileType;
        var _loadingStatus = datagobbler.dataLayers[layer].loadingStatus;
        var _url = datagobbler.dataLayers[layer].apiInfo.url;
            _url = _url.substring(0,_url.lastIndexOf("."));
        var _shpLoader = shp(_url).then(
            function(data){ //If successful loading
                //console.log("Loaded Shapefile!");
                _loadingStatus.downloadCompleted = true;
                datagobbler.dataLayers[layer].apiInfo['data'] = data;
                datagobbler.dataLayers[layer].apiInfo['dataArray'] = data.features;
                datagobbler.DownloadSuccess(layer);
                datagobbler.decodeDataJSON(layer); //TODO make sure we get geojson into an array format like the others
            },
            function(event){ //If fails to load
                //console.log("Sorry, could not load Shapefile.");
                _loadingStatus.downloadCompleted = false;
                _loadingStatus.downloadError = true;
                datagobbler.dataLayers[layer].apiInfo['data'] = null;
                datagobbler.dataLayers[layer].apiInfo['dataArray'] = null;
                datagobbler.DownloadError(layer,event);
            }
        );
    _shpLoader['layer'] = layer;
    }

    datagobbler.downloadDataZIP = function(layer){
        var _data = datagobbler.dataLayers[layer].apiInfo.data;
        var _arr = [];
        var _filetype = datagobbler.dataLayers[dl].apiInfo.fileType;
        var _loadingStatus = datagobbler.dataLayers[layer].loadingStatus;
        var _url = datagobbler.dataLayers[layer].apiInfo.url;
            _url = _url.substring(0,_url.lastIndexOf("."));
            _url=_url+".zip";
        var _shpLoader = shp(_url).then(
            function(data){ //If successful loading
                //console.log("Loaded Shapefile!");
                _loadingStatus.downloadCompleted = true;
                datagobbler.dataLayers[layer].apiInfo['data'] = data;
                datagobbler.dataLayers[layer].apiInfo['dataArray'] = data.features;
                datagobbler.DownloadSuccess(layer);
                datagobbler.decodeDataJSON(layer); //TODO make sure we get geojson into an array format like the others
            },
            function(event){ //If fails to load
                //console.log("Sorry, could not load Shapefile.",event);
                datagobbler.logSystemErrorForLayer({'layer':layer,'errorEvent':event});
                _loadingStatus.downloadCompleted = false;
                _loadingStatus.downloadError = true;
                datagobbler.dataLayers[layer].apiInfo['data'] = null;
                datagobbler.dataLayers[layer].apiInfo['dataArray'] = null;
                datagobbler.DownloadError(layer,event);
            }
        );
        _shpLoader['layer'] = layer;
    }

    datagobbler.downloadDataCSV = function(layer){
        console.log('datagobbler.downloadDataCSV');
        var _loadingStatus = datagobbler.dataLayers[layer].loadingStatus;
        var _url = datagobbler.dataLayers[layer].apiInfo.url;
        datagobbler.dataLayers[layer].apiInfo['fileName'] = ( _url.substring(_url.lastIndexOf("/")+1,_url.lastIndexOf(".")) + "." + datagobbler.dataLayers[dl].apiInfo.fileType);
            //_url = _url.substring(0,_url.lastIndexOf("."));
        //console.log();
        _loadingStatus.pendingDownload = true;
        $.ajax({
            type: "GET",
            url: _url,
            dataType: "text",
            success: function(csv) {
                //var csvj = datagobbler.csvToJson(csv);
                ///*
                _loadingStatus.downloadCompleted = true;
                datagobbler.dataLayers[layer].apiInfo['data'] = datagobbler.csvToJson(csv);//data;
                datagobbler.DownloadSuccess(layer);
                datagobbler.decodeDataCSV(layer);
                //*/
            },
            error: function(error) {
                _loadingStatus.downloadCompleted = false;
                _loadingStatus.downloadError = true;
                datagobbler.dataLayers[layer].apiInfo['data'] = null;
                datagobbler.DownloadError(layer,error);
            }
        });
    }


    datagobbler.csvToJson = function(csv){
        var lines = csv.split("\n");
        var result = [];
        var headers = lines[0].split(",");
        console.log(lines[0],headers);
        for(var i=0;i<lines.length-1;i++){
            //var obj = Object.create(null);
            var currentline = lines[i].split(",");
            //var csvObj = new csvLine(headers,currentline);
            //console.log(csvObj);
            var csvObj = {};
            for(h in headers){
                csvObj[headers[h].replace(/^\s+|\s+$/g,"")] = currentline[h];
            }
            //console.log(csvObj);
            result.push(csvObj);
        }
        //console.log(result);
        return result;
    }

    datagobbler.decodeDataCSV2 = function(layer){
        //console.log("CSV Data: ", datagobbler.dataLayers[layer].apiInfo.data);
        //datagobbler.dataLayers[p].apiInfo.data = $.extend(true,{},datagobbler.dataLayers[_targLayer].apiInfo.data);
        //var _data       = datagobbler.dataLayers[layer].apiInfo.data;
        console.log(datagobbler.dataLayers[layer].apiInfo);

    }

    //TODO: Check to see if filtering is deleting items and fix!
    datagobbler.decodeDataCSV = function(layer){
        console.log("CSV Data: ", datagobbler.dataLayers[layer].apiInfo.data);
        //datagobbler.dataLayers[p].apiInfo.data = $.extend(true,{},datagobbler.dataLayers[_targLayer].apiInfo.data);
        var _data       = datagobbler.dataLayers[layer].apiInfo.data;//$.extend(true,[],datagobbler.dataLayers[layer].apiInfo.data);
        var _fileType   = datagobbler.dataLayers[layer].apiInfo.fileType;
        var _geomType   = datagobbler.dataLayers[layer].apiInfo.ifNotGeoReferencedData.geometryType;
        var _latStr     = datagobbler.dataLayers[layer].apiInfo.ifNotGeoReferencedData.fieldToUseForLatitude;
        var _lonStr     = datagobbler.dataLayers[layer].apiInfo.ifNotGeoReferencedData.fieldToUseForLongitude;
        var _features = [];
        var _geojsonObj = {"type":"FeatureCollection","fileName":datagobbler.dataLayers[layer].apiInfo['fileName']};
        var _arr = [];
        //for(i in _data){
        for (i = 0; i < _data.length; i++) {
            var _do = _data[i];//$.extend(true,{},_data[i]);
            var _lat = Number(_do[_latStr]);
            var _lon = Number(_do[_lonStr]);
            //console.log(_do,_lat,_lon);

            ///*
            var _featureObj = {
                "geometry":{
                        "type":"Point",
                        "coordinates":[_lon,_lat]
                },
                "properties":_do,
                "type":"Feature"
            };
           // */
            //var _featureObj = {"num":i};
            _features.push(_featureObj);

        }
        //console.log(_data,"_features",_features);

        _geojsonObj.features = _features;
        _arr.push(_geojsonObj);
        console.log(_arr);
        datagobbler.dataLayers[layer].apiInfo['dataArray'] = _arr;
        datagobbler.checkGlobalDownloadStatus();
        //console.log("datagobbler.dataLayers",datagobbler.dataLayers);

        //return _geojsonObj;
    }

    /*
    //var csv is the CSV file with headers


    */

    datagobbler.logSystemErrorForLayer = function(args){
        datagobbler.backgroundData.featuresByLayerName[args.layer].errors['systemError'] = args.errorEvent;
    }

    datagobbler.DownloadSuccess = function(layer){
        //console.log(layer,"datagobbler.DownloadSuccess");
        datagobbler.layerOkToFilter(layer);
        datagobbler.numOfDataFilesLoaded++;
        //datagobbler.numOfDataFilesToFilter++;
         //console.log("-------------------------------");
    }

    datagobbler.DownloadError = function(layer,errorEvent){
        //console.log(layer,"datagobbler.DownloadError");
        datagobbler.logSystemErrorForLayer({'layer':layer,'errorEvent':errorEvent});
        datagobbler.layerNotOkToFilter(layer);
        datagobbler.numOfDataFilesToLoad--;
        //datagobbler.backgroundData.featuresByLayerName[layer].errors.push("Error downloading data.");
        //datagobbler.numOfDataFilesToFilter--;
    }

    datagobbler.getDownloadErrorObject = function(){
        var _tempObj = {};
        for(dl in datagobbler.dataLayers){
            if(datagobbler.dataLayers[dl].loadingStatus.downloadError){
                _tempObj[dl] = datagobbler.dataLayers[dl];
            }
        }
        return _tempObj;
    }

    datagobbler.getDownloadSuccessObject = function(){
        var _tempObj = {};
        for(dl in datagobbler.dataLayers){
            if(datagobbler.dataLayers[dl].loadingStatus.downloadCompleted){
                _tempObj[dl] = datagobbler.dataLayers[dl];
            }
        }
        return _tempObj;
    }

    datagobbler.getLoadingStatusObject = function(){
        //datagobbler.dataLayers[dl].loadingStatus, for(dl in datagobbler.dataLayers){
        var _tempObj = {};
        for(dl in datagobbler.dataLayers){
            _tempObj[dl] = datagobbler.dataLayers[dl].loadingStatus;
        }
        return _tempObj;
    }

    datagobbler.layerOkToFilter = function(layer){
        datagobbler.numOfDataFilesToFilter++;
       datagobbler.dataLayers[layer]['layerOkToFilter'] = true;
    }

    datagobbler.layerNotOkToFilter = function(layer){
       datagobbler.dataLayers[layer]['layerOkToFilter'] = false;
    }

    /*
    Checks to see if the number of files to be downloaded matches the number already downloaded. If so, then create the proxy layers- "proxy" layers are layers that copy & reuse data from previously downloaded layers so we're not downloading the same data multiple times.
    */
    datagobbler.checkGlobalDownloadStatus = function(){
        //console.log("datagobbler.checkGlobalDownloadStatus",datagobbler.numOfDataFilesToLoad,datagobbler.numOfDataFilesLoaded);
        if(datagobbler.numOfDataFilesToLoad == datagobbler.numOfDataFilesLoaded){
            datagobbler.loadAllProxyDataLayers();
            datagobbler.allDataLayersAreReadyToFilter();
        }
    }

    datagobbler.allDataLayersAreReadyToFilter = function(){
        /*
        If there was no download error (it's still false), then set
        the downloadCompleted property to true
        */
        for(dl in datagobbler.dataLayers){
            //console.log("datagobbler.dataLayers[dl].loadingStatus: ",datagobbler.dataLayers[dl].loadingStatus);
            if(!datagobbler.dataLayers[dl].loadingStatus.downloadError){
                datagobbler.dataLayers[dl].loadingStatus.downloadCompleted = true;
            }
        }
        datagobbler.filterAllLayers();
    }

    datagobbler.filterAllLayers = function(){
        //console.log("datagobbler.filterAllLayers",datagobbler.dataLayers);
        for(dl in datagobbler.dataLayers){
            if(datagobbler.dataLayers[dl].layerOkToFilter){
                datagobbler.dataLayers[dl].apiInfo.dataArray = datagobbler.filterLayer(dl);
            }
        }

        console.log(datagobbler.numOfDataFilesToLoad,datagobbler.backgroundData);
        datagobbler.ondataLoaded(datagobbler.backgroundData);
        //if()
        //console.log("datagobbler.numOfDataFilesToFilter: "+datagobbler.numOfDataFilesToFilter,"datagobbler.numOfDataFilesFiltered: "+datagobbler.numOfDataFilesFiltered)
    }

    datagobbler.filterLayer = function(layer){
        console.log("Filtering "+ layer);
        var _dataArray      = datagobbler.dataLayers[layer].apiInfo.dataArray;
        var _dateField      = datagobbler.dataLayers[layer].apiInfo.dateInfo.fieldNameForDate;
        var _filterOutArr   = datagobbler.dataLayers[layer].apiInfo.filterOut;
        //console.log(layer,_dataArray);
        for(k in _dataArray){
            console.log(_dataArray[k]);
            var _features = _dataArray[k].features;
            for(f in _features){
                var _notDeleted = true;
                if(_filterOutArr.length>0){
                    for(fo in _filterOutArr){
                         var _filterOutArgs = {};
                        _filterOutArgs = {
                            'property':_filterOutArr[fo].property,
                            'operator':_filterOutArr[fo].operator,
                            'val1':_features[f].properties[_filterOutArr[fo].property],
                            'val2':_filterOutArr[fo].value
                        };
                        if(datagobbler.getFilter(_filterOutArgs)){
                           //console.log(_features[f].properties[_filter.property]);
                            if(layer=="lorem-ipsum"){
                                //console.log(f,"delete " + _features[f].properties.FEATURE_CONFIDENCE);
                            }
                            console.log("filterOut");
                            delete _features[f];
                            _notDeleted = false;
                            break;
                        }

                    }
                }
                if(_notDeleted){
                    console.log("SAVE THIS: ",_features[f]);
                    _features[f].properties["layerName"] = layer;
                    var _incDate = datagobbler.dataLayers[layer].apiInfo.dateInfo.includeDate.toLowerCase();

                    if(_incDate=="true"){
                        var _time;
                        if(_features[f].properties[_dateField]){
                            _time = _features[f].properties[_dateField];
                        }else{
                            _time = datagobbler.dataLayers[layer].apiInfo.dateInfo.dateToUseIfNoDateInData;
                        }
                        _features[f].properties["idate"] = _time;
                        _features[f].properties["itime"] = datagobbler.getCommonTime(_time);
                        _features[f].properties["prettytime"] = datagobbler.getCommonTime(_time).prettytime;
                        _features[f].properties["numbertime"] = datagobbler.getCommonTime(_time).numbertime;

                        if(_features[f].properties["itime"].isInGlobalDateRange){
                            //console.log("false!");
                            if(datagobbler.dateIsInUIRange(_features[f].properties["itime"].date)){
                                datagobbler.dataOptions.dates.currentUIRange.currentDatesArray[_features[f].properties["numbertime"]] = _features[f].properties["itime"];
                                datagobbler.dataOptions.dates.currentUIRange.currentDatesObject[_features[f].properties["numbertime"]] = _features[f].properties["itime"];
                            }
                            datagobbler.addToBackgroundData(layer,_features[f]);
                        }else{
                            console.log("need to delete");
                            delete _features[f];
                        }

                    }else{
                        console.log("NO TIME");
                        datagobbler.addToBackgroundData(layer,_features[f]);
                    }

                }
            }
            //console.log(_features);
        }
        datagobbler.numOfDataFilesFiltered++;
        return _dataArray;
    }

    datagobbler.filterLayerOld = function(layer){
        console.log("Filtering "+ layer);
        var _dataArray      = datagobbler.dataLayers[layer].apiInfo.dataArray;
        var _dateField      = datagobbler.dataLayers[layer].apiInfo.dateInfo.fieldNameForDate;
        var _filterOutArr   = datagobbler.dataLayers[layer].apiInfo.filterOut;
        //console.log(layer,_dataArray);
        for(k in _dataArray){
            console.log(_dataArray[k]);
            var _features = _dataArray[k].features;
            for(f in _features){
                var _notDeleted = true;
                if(_filterOutArr.length>0){
                    for(fo in _filterOutArr){
                         var _filterOutArgs = {};
                        _filterOutArgs = {
                            'property':_filterOutArr[fo].property,
                            'operator':_filterOutArr[fo].operator,
                            'val1':_features[f].properties[_filterOutArr[fo].property],
                            'val2':_filterOutArr[fo].value
                        };
                        if(datagobbler.getFilter(_filterOutArgs)){
                           //console.log(_features[f].properties[_filter.property]);
                            if(layer=="lorem-ipsum"){
                                //console.log(f,"delete " + _features[f].properties.FEATURE_CONFIDENCE);
                            }

                            delete _features[f];
                            _notDeleted = false;
                            break;
                        }

                    }
                }
                if(_notDeleted){
                    //console.log("SAVE THIS: ",datagobbler.dataLayers[layer].apiInfo.dateInfo.includeDate);
                    _features[f].properties["layerName"] = layer;
                    var _incDate = datagobbler.dataLayers[layer].apiInfo.dateInfo.includeDate.toLowerCase();

                    if(_incDate=="true"){
                        var _time;
                        if(_features[f].properties[_dateField]){
                            _time = _features[f].properties[_dateField];
                        }else{
                            _time = datagobbler.dataLayers[layer].apiInfo.dateInfo.dateToUseIfNoDateInData;
                        }
                        _features[f].properties["idate"] = _time;
                        _features[f].properties["moment"]= moment(_time).utc();
                        _features[f].properties["itime"] = datagobbler.getCommonTime(_time);
                        _features[f].properties["prettytime"] = datagobbler.getCommonTime(_time).prettytime;
                        _features[f].properties["numbertime"] = datagobbler.getCommonTime(_time).numbertime;

                        //check to see if date is within global range requested
                        // in config file
                        //var _dateStart = datagobbler.dataOptions.defaultDates.idateStart.date;
                        //var _isAfterDateEnd = _features[f].properties["itime"].date.isAfter(datagobbler.dataOptions.defaultDates.idateEnd.date);

                        //console.log( _features[f].properties["itime"].isInGlobalDateRange );

                        if(_features[f].properties["itime"].isInGlobalDateRange){
                            //console.log("false!");
                            if(datagobbler.dateIsInUIRange(_features[f].properties["itime"].date)){
                                datagobbler.dataOptions.dates.currentUIRange.currentDatesArray[_features[f].properties["numbertime"]] = _features[f].properties["itime"];
                                datagobbler.dataOptions.dates.currentUIRange.currentDatesObject[_features[f].properties["numbertime"]] = _features[f].properties["itime"];
                            }
                            datagobbler.addToBackgroundData(layer,_features[f]);
                        }else{
                            //console.log("need to delete");
                            delete _features[f];
                        }
                    }else{
                        //console.log("NO TIME");
                        datagobbler.addToBackgroundData(layer,_features[f]);
                    }

                }
            }
        }
        datagobbler.numOfDataFilesFiltered++;
        return _dataArray;
    }

    datagobbler.getCommonTime = function(time) {
        var _time = time;
        // Use MomentJS to create a more feature-rich date object that can read multuiple date/time formats automatically
        // This reduces the amount of custom parsing we need to perform for various dates
        _time = moment(time).utc();
        var _yyyy = String(_time.year());
        var _mm = String(_time.get('month')+1);
        var _dd = String(_time.get('date'));
        var _isInGlobalDateRange = true;
        function getDouble(num){ //returns a number like 6 or 7 as "06" or "07"
            num = Number(num);
            return num > 9 ? "" + num: "0" + num;
        }
        if(datagobbler.dataOptions.defaultDates.idateStart && datagobbler.dataOptions.defaultDates.idateEnd){
            _isInGlobalDateRange = datagobbler.dateIsInGlobalDateRange(_time);
            //.isBetween(datagobbler.dataOptions.defaultDates.idateStart.date,datagobbler.dataOptions.defaultDates.idateEnd.date);
        }
        if(_isInGlobalDateRange){
            /*
            Here we are creating the framework of the "datagobbler.backgroundData.byDate" object that we created in datagobbler.backgroundData. It is looking to see if an object has been created yet that corresponds to the date of the current UI object (point/polyline/polygon).
            If no object for that year/month/day exists, an empty object/placeholder is created.
            */
            if(!datagobbler.backgroundData.byDate[_yyyy]){
                datagobbler.backgroundData.byDate[_yyyy] = {};
            }
            if(!datagobbler.backgroundData.byDate[_yyyy][_mm]){
                datagobbler.backgroundData.byDate[_yyyy][_mm] = {};
            }
            if(!datagobbler.backgroundData.byDate[_yyyy][_mm][_dd]){
                datagobbler.backgroundData.byDate[_yyyy][_mm][_dd] = [];
            }
        }
        /*
        Create an object to pass basic year/month/day info to any script calling this function
        */
        var _timeObj = {
            'year':_yyyy,
            'month':_mm,
            'day':_dd,
            'date':_time,
            'prettytime':(_mm+"/"+_dd+"/"+_yyyy),
            'numbertime':(Number(_yyyy+getDouble(_mm)+getDouble(_dd))),
            'isInGlobalDateRange':_isInGlobalDateRange
        }
        return _timeObj;
    }

    datagobbler.dateIsInGlobalDateRange = function(date) {
        var _rsd = datagobbler.dataOptions.defaultDates.idateStart.date;
        var _red = datagobbler.dataOptions.defaultDates.idateEnd.date;
        var _isInRange = false;
        //console.log(_rsd <= date && date <=_red);
        if(_rsd <= date && date <=_red){
            _isInRange = true;
            //console.log(datagobbler.getCommonTime(date).prettytime);
        }
        return _isInRange;
    }
    datagobbler.dateIsInUIRange = function(date) {
        var _rsd = datagobbler.dataOptions.dates.currentUIRange.dateStart.date;
        var _red = datagobbler.dataOptions.dates.currentUIRange.dateEnd.date;
        var _isInRange = false;
        //console.log(_rsd <= date && date <=_red);
        if(_rsd <= date && date <=_red){
            _isInRange = true;
            //console.log(datagobbler.getCommonTime(date).prettytime);
        }
        return _isInRange;
    }

    datagobbler.getFilter = function(args){
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

    datagobbler.addPropertyObjects = function(feature){

    }

    datagobbler.addToBackgroundData = function(layer,feature) {

        //TODO: create custom objects from requested properties (see if property exists first!)
        //Use examples from above for data facilities.
        //datagobbler.backgroundData.featuresByLayerName[layer].byProperties
        var _hasPropertyObjects = datagobbler.dataLayers[layer].apiInfo.byPropertyObjects.length;
        //console.log(layer,datagobbler.dataLayers[layer].apiInfo.byPropertyObjects.length);
        if(_hasPropertyObjects>0){ //if we defined or requested byProperty objects in config.json
            //console.log("has property objects!",_hasPropertyObjects);
            for(p in datagobbler.dataLayers[layer].apiInfo.byPropertyObjects){
                var _prop = datagobbler.dataLayers[layer].apiInfo.byPropertyObjects[p];

                if(!datagobbler.backgroundData.featuresByLayerName[layer].byProperties[_prop]){
                    datagobbler.backgroundData.featuresByLayerName[layer].byProperties[_prop] = {};
                }
                if(datagobbler.backgroundData.featuresByLayerName[layer].byProperties[_prop]){
                    var _val = feature.properties[_prop];
                    if(!datagobbler.backgroundData.featuresByLayerName[layer].byProperties[_prop][_val]){
                        datagobbler.backgroundData.featuresByLayerName[layer].byProperties[_prop][_val] = [];
                        //console.log(_val);
                    }
                    if(datagobbler.backgroundData.featuresByLayerName[layer].byProperties[_prop][_val]){
                       datagobbler.backgroundData.featuresByLayerName[layer].byProperties[_prop][_val].push(feature);
                    }
                    //if(!datagobbler.backgroundData.featuresByLayerName[layer].byProperties[_prop]){
                }
            }
            //console.log("---------------------------------")
        }//else{
          //console.log("NO property objects!",_hasPropertyObjects);
       // }


        // Call the function that adds/stores the ui object by year->month->day
        // Create the object to store the UI point/polyline/polygon
        //var _obj = {'object':args.object};
        //Add data and date to indexes to help with racking/stacking information by date later on in UI
        datagobbler.backgroundData.allData.push(feature);
        datagobbler.backgroundData.featuresByLayerName[layer]['allData'].push(feature);

        if(feature.properties.itime){

            var _yyyy = feature.properties.itime.year;
            var _mm = feature.properties.itime.month;
            var _dd = feature.properties.itime.day;

            if(!datagobbler.backgroundData.featuresByLayerName[layer]['byDate'][_yyyy]){
                datagobbler.backgroundData.featuresByLayerName[layer]['byDate'][_yyyy] = {};
            }
            if(!datagobbler.backgroundData.featuresByLayerName[layer]['byDate'][_yyyy][_mm]){
                datagobbler.backgroundData.featuresByLayerName[layer]['byDate'][_yyyy][_mm] = {};
            }
            if(!datagobbler.backgroundData.featuresByLayerName[layer]['byDate'][_yyyy][_mm][_dd]){
                datagobbler.backgroundData.featuresByLayerName[layer]['byDate'][_yyyy][_mm][_dd] = [];
            }

            datagobbler.backgroundData.allDates[feature.properties.itime.numbertime] = feature.properties.itime;
            // Add the object to the array corresponding to the year->month->day that the UI object represents
            datagobbler.backgroundData.byDate[feature.properties.itime.year][feature.properties.itime.month][feature.properties.itime.day].push(feature);
            datagobbler.backgroundData.featuresByLayerName[layer]['byDate'][feature.properties.itime.year][feature.properties.itime.month][feature.properties.itime.day].push(feature);
            //console.log(feature);
        }
    }

}();
