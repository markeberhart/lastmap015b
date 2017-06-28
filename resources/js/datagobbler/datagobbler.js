!function() {
    datagobbler = {};
    datagobbler.data_layers = {};
    datagobbler.version = '0.0.1';
    datagobbler.ui = {};
    datagobbler.ui.layers = {};
    datagobbler.numOfDataFilesToLoad = 0;
    datagobbler.numOfDataFilesLoaded = 0;
    datagobbler.numOfDataFilesToFilter = 0;
    datagobbler.numOfDataFilesFiltered = 0;
    datagobbler.numRecords = 0;
    datagobbler.data = {
        by_date: {},
        by_layer_name:{},
        all_data:{
            geospatial:[],
            regular:[]
        },
        all_dates:[]
    };

    datagobbler.getData = function(options){
        var _url    = options.configFile;
        var _cb     = options.callbackFunction;
        var _lcb    = options.loadingCallbackFunction;
        d3.json(_url, function(error,data) {
            if(error){
                console.log(error,"JSON error");
            }else{
                datagobbler.ondataLoaded = _cb;
                datagobbler.ondataLoading = _lcb;
                //console.log(data);
                //_cb(data);
                datagobbler.data_layers = data.data_layers;
                datagobbler.data_options = data.data_options;
                datagobbler.data_options.dates = datagobbler.setDefaultDates(data.data_options.default_dates);
                datagobbler.setDataOptions();
            }
        });
    }

    datagobbler.setDataOptions = function(){
        //console.log(args);
        //this.data_options = args;
        //this.data_options.dates = datagobbler.setDefaultDates(datagobbler.data_options.default_dates);
        this.data_options.default_dates['idate_start'] = this.getCommonTime(this.data_options.dates.date_start,this.data_options.dates.date_format);
        this.data_options.default_dates['idate_end'] = this.getCommonTime(this.data_options.dates.date_end,this.data_options.dates.date_format);
        this.data['data_requests'] = {};
        this.data['proxy_requests'] = {};
        this.data_options.dates['currentDate'] = {
            'year':     this.data_options.dates.default_ui_date_start.year(),
            'month':    this.data_options.dates.default_ui_date_start.month()+1,
            'day':      this.data_options.dates.default_ui_date_start.date(),
            'date': this.data_options.dates.default_ui_date_start
        }
        this.data_options.dates['currentUIRange'] = {};
        this.data_options.dates.currentUIRange.currentDatesArray = [];
        this.data_options.dates.currentUIRange.currentDatesObject = {};
        this.data_options.dates.currentUIRange['date_start'] =  {
            'year':     this.data_options.dates.default_ui_date_start.year(),
            'month':    this.data_options.dates.default_ui_date_start.month()+1,
            'day':      this.data_options.dates.default_ui_date_start.date(),
            'date': this.data_options.dates.default_ui_date_start
        };
        this.data_options.dates.currentUIRange['date_end'] =  {
            'year':     this.data_options.dates.default_ui_date_end.year(),
            'month':    this.data_options.dates.default_ui_date_end.month()+1,
            'day':      this.data_options.dates.default_ui_date_end.date(),
            'date': this.data_options.dates.default_ui_date_end
        };
        var _cnt = 0;// Get quick count of how many data layers we have
        for(dl in datagobbler.data_layers){
            if(!datagobbler.data.by_layer_name[dl]){
                datagobbler.data.by_layer_name[dl] = {};
                datagobbler.data.by_layer_name[dl]['objects'] = [];
                datagobbler.data.by_layer_name[dl]['all_data'] = {regular:[],geospatial:[]};
                datagobbler.data.by_layer_name[dl]['by_date'] = {};
                datagobbler.data.by_layer_name[dl]['by_group'] = {};
                datagobbler.data.by_layer_name[dl]['errors'] = {};
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
        if(typeof args.date_end === 'string'){
            _obj.date_end = new moment(args.date_end).utc();
            _obj.date_start = new moment(args.date_end).utc();
            _obj.default_ui_date_start = new moment(args.date_start).utc();
            _obj.default_ui_date_end = new moment(args.date_end).utc();
        }else{
            _t = new moment();
            _obj.date_end = new moment().utc().add(args.date_end,'days');
            _obj.date_start = new moment().utc().add(args.date_end,'days');
            _obj.default_ui_date_start = new moment().utc().add(args.date_start,'days');
            _obj.default_ui_date_end = new moment().utc().add(args.date_end,'days');
        }

        if(typeof args.date_start === 'string'){
            _obj.date_start = new moment(args.date_start).utc();
        }else{
            _obj.date_start.utc().add(args.date_start,'days');
        }

        if(typeof args.default_ui_date_end === 'string'){
            _obj.default_ui_date_end = new moment(args.default_ui_date_end).utc();
        }else{
            _obj.default_ui_date_end.utc().add(args.default_ui_date_end,'days');
        }

        if(typeof args.default_ui_date_start === 'string'){
            _obj.default_ui_date_start = new moment(args.default_ui_date_start).utc();
        }else{
            _obj.default_ui_date_start.utc().add(args.default_ui_date_start,'days');
        }

        //var _offsetType = datagobbler.data_layers[dl].api_info.date_info.offset_type;
        //_ds.add(datagobbler.data_layers[dl].api_info.date_info.date_start_offset, _offsetType);
        //_de.add(datagobbler.data_layers[dl].api_info.date_info.date_end_offset, _offsetType);

        return _obj;
    }

    // Set visibility object for each layer to use later with legend
    datagobbler.setDefaultDataLayerVisibility = function() {
        //console.log("datagobbler.setDefaultDataLayerVisibility");
        for(dl in datagobbler.data_layers){
            if(datagobbler.data_layers[dl].legend.displayOnStart){
                datagobbler.data_layers[dl]['isVisible'] = true;
            }else{
                datagobbler.data_layers[dl]['isVisible'] = false;
                datagobbler.data_layers[dl]['layerName'] = dl;
                // datagobbler.ui.layers[dl] = L.layerGroup();
            }
        }
    }

    datagobbler.createDataServiceUrls = function() {
        for(dl in datagobbler.data_layers){
            var _url = datagobbler.data_layers[dl].api_info.url;
            var _isOnline = (_url.indexOf("http")>=0);
            //console.log(_isOnline);
            if(_isOnline){
                _url = datagobbler.createOnlineUrl(_url);
            }
            _url = datagobbler.getProxyUrl(_url,datagobbler.data_layers[dl].api_info.proxy_url);
            // Create an object to track whether a layer has loaded of not.
            datagobbler.data_layers[dl].api_info.url = _url; datagobbler.data_layers[dl]['loadingStatus'] = {'mustDownload':false,'proxyLayer':false,'pendingDownload':false,'downloadCompleted':false,'downloadError':false,'isFiltered':false};
            //datagobbler.data_layers[dl].api_info['file_type'] = datagobbler.checkFiletype(_url);
            //console.log(_url,datagobbler.checkFiletype(_url));
            _url = encodeURIComponent(_url);
            var _args = {'layer':dl,'url':_url};
            datagobbler.checkIfMustDownloadLayerData(_args);
        }
    }

    datagobbler.checkIfMustDownloadLayerData = function(args){
         // Create list of urls to load
        // Add the url and layer name to the datagobbler.data.data_requests object
        if(!datagobbler.data.data_requests[args.url]){
    //console.log("add request: ", args.layer);
            datagobbler.data.data_requests[args.url] = args.layer;
            datagobbler.data_layers[args.layer]['loadingStatus'].mustDownload = true;
            // Keep track of the number of urls we're actually loading
            // versus the number of layers
            datagobbler.numOfDataFilesToLoad++;
        }else{
    //console.log("add proxy: ", args.layer); datagobbler.data_layers[args.layer]['loadingStatus'].mustDownload = false;
            datagobbler.data.proxy_requests[args.layer] = args.url;
            datagobbler.data_layers[args.layer]['loadingStatus'].proxyLayer = datagobbler.data.data_requests[args.url];
        }
         //we will filter every layer, but not download every layer
    }

    datagobbler.createOnlineUrl = function(_url){
        //if(datagobbler.data_layers[dl].api_info.date_info.field_name_for_date!=null){
        var _ds = new moment(datagobbler.data_options.dates.date_start);//.format(datagobbler.data_layers[dl].api_info.date_info.date_format); // get date for this layer in a format the API will accept (eg. UNIX, YYYY-MM-DDZ, etc)
        var _de = new moment(datagobbler.data_options.dates.date_end);//.format(datagobbler.data_layers[dl].api_info.date_info.date_format); // get date for this layer in a format the API will accept (eg. UNIX, YYYY-MM-DDZ, etc)
        //console.log(_ds.get('date'));
        //var _offsetType = datagobbler.data_layers[dl].api_info.date_info.offset_type;
        //_ds.add(datagobbler.data_layers[dl].api_info.date_info.date_start_offset, _offsetType);
        //_de.add(datagobbler.data_layers[dl].api_info.date_info.date_end_offset, _offsetType);
        //console.log(_ds.get('date'));
        _ds = _ds.format(datagobbler.data_layers[dl].api_info.date_info.date_format);
        _de = _de.format(datagobbler.data_layers[dl].api_info.date_info.date_format);
        //console.log(datagobbler.data_layers[dl].legend.legendTitle,_time);
        _url = _url.replace("{{west}}", datagobbler.data_options.dataBounds.southWest[1]);
        _url = _url.replace("{{south}}", datagobbler.data_options.dataBounds.southWest[0]);
        _url = _url.replace("{{east}}", datagobbler.data_options.dataBounds.northEast[1]);
        _url = _url.replace("{{north}}", datagobbler.data_options.dataBounds.northEast[0]);
        _url = _url.replace(/\{{field_name_for_date}}/g, datagobbler.data_layers[dl].api_info.date_info.field_name_for_date); // uses regular expression to replace ALL (the "g" is for global) matching instances of field_name_for_date
        _url = _url.replace("{{date_start}}",_ds); // replace start date with the start date we calculated earlier
        _url = _url.replace("{{date_end}}",_de); // replace end date with the end date we calculated earlier
        return _url;
    }

    datagobbler.getProxyUrl = function(_url,_proxyUrl){
        switch(_proxyUrl) {
            case null:
                _url = _url;
                break;
            case 'default':
                _url = datagobbler.data_options.default_proxy_url + _url;
                break;
            default: //custom url
                _url = _proxyUrl + _url;
        }
        return _url;
    }

    datagobbler.showLoadingStatus = function(evt){
        for(s in evt.loadingStatusObject){
            if(evt.loadingStatusObject[s].proxyLayer){
                _pl = evt.loadingStatusObject[s].proxyLayer;
                evt.loadingStatusObject[s].downloadCompleted = evt.loadingStatusObject[_pl].downloadCompleted;
            }
            var _obj = {"layer":s,"title":datagobbler.data_layers[s].title,"loadingStatus":evt.loadingStatusObject[s]};
            datagobbler.ondataLoading(_obj);
        }
    }

    datagobbler.layerHasGeospatialData = function(layer,isGeo){
        datagobbler.data_layers[layer].api_info.has_geospatial_data = isGeo;
    }

    datagobbler.loadAllDataLayers = function(){
        //console.log(datagobbler);
        datagobbler['loader'] = document.createEvent("Event");
        datagobbler.loader.initEvent("loadingStatus",true,true);
        datagobbler.loader['loadingStatusObject'] = datagobbler.getLoadingStatusObject();
        document.addEventListener("loadingStatus",datagobbler.showLoadingStatus,false);

        //console.log(datagobbler.numOfDataFilesToLoad,datagobbler.numOfDataFilesLoaded);
        //console.log("datagobbler.numOfDataFilesToLoad",datagobbler.numOfDataFilesToLoad);
        for(dl in datagobbler.data_layers){
            var _mustDownload = datagobbler.data_layers[dl].loadingStatus.mustDownload;
            if(_mustDownload){
                var _filetype = datagobbler.data_layers[dl].api_info.file_type;
                switch(_filetype) {
                    case "topojson":
                        datagobbler.layerHasGeospatialData(dl,true);
                        datagobbler.downloadDataTOPOJSON(dl);
                        break;
                    case "geojson":
                        datagobbler.layerHasGeospatialData(dl,true);
                        datagobbler.downloadDataGEOJSON(dl);
                        break;
                    case "arcjson":
                        datagobbler.layerHasGeospatialData(dl,true);
                        datagobbler.downloadDataARCJSON(dl);
                        break;
                    case "shp":
                        datagobbler.layerHasGeospatialData(dl,true);
                        datagobbler.downloadDataSHP(dl);
                        break;
                    case "csv":
                        var _hasLatLonInfo = (datagobbler.data_layers[dl].api_info.if_not_geospatial_file_type.field_to_use_for_latitude !=null && datagobbler.data_layers[dl].api_info.if_not_geospatial_file_type.field_to_use_for_longitude !=null);
                        if(_hasLatLonInfo){;
                            datagobbler.layerHasGeospatialData(dl,true);
                        }else{
                            datagobbler.layerHasGeospatialData(dl,false);
                        }
                        datagobbler.downloadDataCSV(dl);
                        break;
                    case "shp.zip":
                        datagobbler.layerHasGeospatialData(dl,true);
                        datagobbler.downloadDataSHPZIP(dl);
                        break;
                }
            }
        }
        //console.log(datagobbler.data_layers[dl].loadingStatus.mustDownload);
        //console.log(datagobbler.numOfDataFilesToLoad,datagobbler.numOfDataFilesLoaded);
    }

    datagobbler.loadAllProxyDataLayers = function(){
        //console.log('NOW LOAD PROXIES...');//,datagobbler.data_layers);//,datagobbler.data.proxy_requests);
        for(p in datagobbler.data.proxy_requests){

            var _proxyUrl = datagobbler.data.proxy_requests[p];
            var _targLayer = datagobbler.data.data_requests[_proxyUrl];

            //console.log("===> ",_targLayer,datagobbler.data_layers[_targLayer].layerOkToFilter);
            // create copy of original data object
            // TODO TO DO: states1 is being directly used as states2 so a real/separate copy is not being created
            // need to figure-out how to fix issue of maybe a "global" version of object being used
            // for proxy layers to reference for new copies to then, in turn, filter on
            // For some reason, this does not seem to be "happening" until after
            // the filtering has taken place.
            // TODO: fix copying of data and objects. Each has sub-arrays and objects that make normal
            // methods (methods that do not do deep-diving) non-operable.
            datagobbler.data_layers[p].api_info.data = $.extend(true,{},datagobbler.data_layers[_targLayer].api_info.data);
            datagobbler.data_layers[p].api_info.objects = $.extend(true,[],datagobbler.data_layers[_targLayer].api_info.objects);

            if(datagobbler.data_layers[_targLayer].layerOkToFilter){
                datagobbler.layerOkToFilter(p);
            }else{
                datagobbler.layerNotOkToFilter(p);
                console.log("DON'T DO ANYTHING WITH " + p +", because " + _targLayer + " did not download!");
                var _error = {'notes':'This is a proxy layer that pulls from a golden copy. The gold copy did not download, which means the derrivative/proxy copy could not be created.','proxyLayer':p,'targetLayer':_targLayer};
                datagobbler.logSystemErrorForLayer({'layer':p,'errorEvent':_error});
            }
        }

    }

    datagobbler.getDataType = function(type){
        // accepts type as a string
        var _type = type.toLowerCase();
        var _geom_type;
        //console.log("datagobbler.getDataType: ",_type);

        switch(_type) {
            case "point":
                _geom_type = "point";
                break;
            case "linestring":
                _geom_type = "linestring";
                break;
            case "multilinestring":
                _geom_type = "multilinestring";
                break;
            case "polygon":
                _geom_type = "polygon";
                break;
            case "multipolygon":
                _geom_type = "multipolygon";
                break;
            default:
                _geom_type = null;
                break;
        }
        return {"name":"geometry_type","type":_geom_type};

    }

    datagobbler.downloadDataTOPOJSON = function(layer){
        //console.log('datagobbler.downloadDataJSON');
        var _url = datagobbler.data_layers[layer].api_info.url;
        var _loadingStatus = datagobbler.data_layers[layer].loadingStatus;
        //console.log(_url);
        _loadingStatus.pendingDownload = true;
        d3.json(_url, function(error,data) { //console.log('JSON done.',data,_url);
            _loadingStatus.pendingDownload = false;
            if(error){
                _loadingStatus.downloadCompleted = false;
                _loadingStatus.downloadError = true;
                datagobbler.data_layers[layer].api_info['data'] = null;
                datagobbler.DownloadError(layer,error);
                console.log(layer,"==== >> JSON error <<====");
            }else{
                _loadingStatus.downloadCompleted = true;

                datagobbler.data_layers[layer].api_info['data'] = data;
                datagobbler.DownloadSuccess(layer);
                datagobbler.decodeDataTOPOJSON(layer);
            }
        });

    }

    datagobbler.decodeDataTOPOJSON = function(layer){
        var _data = datagobbler.data_layers[layer].api_info.data;
        var _arr = [];
        var _filetype = datagobbler.data_layers[dl].api_info.file_type;
        for(k in _data.objects){
            var _obj = topojson.feature(_data, _data.objects[k]);
            _obj.has_geospatial_data = datagobbler.data_layers[layer].api_info.has_geospatial_data;
            //_obj.records = _obj.features;
            var _type = datagobbler.getDataType(_data.objects[k].geometries[0].type);
            _obj[_type.name] = _type.type;
            _obj.name = k;
            //console.log(_obj);
            //console.log(k,_data.objects[k].geometries[0].type);
            _arr.push(_obj);
        }

        datagobbler.data_layers[layer].api_info['objects'] = _arr;
        //console.log("Line 334: decodeDataTOPOJSON-objects: ",datagobbler.data_layers[layer].api_info.objects);
        //console.log(datagobbler);
        //console.log("decodeDataTOPOJSON-objects: ",_arr);
        datagobbler.checkGlobalDownloadStatus();
        //console.log(datagobbler.data_layers,"datagobbler.decodeTOPOJSON",_arr);
    }

    datagobbler.downloadDataGEOJSON = function(layer){
        //console.log('datagobbler.downloadDataJSON');
        var _url = datagobbler.data_layers[layer].api_info.url;
        var _loadingStatus = datagobbler.data_layers[layer].loadingStatus;
        //console.log(_url);
        _loadingStatus.pendingDownload = true;
        d3.json(_url, function(error,data) { //console.log('JSON done.',data,_url);
            _loadingStatus.pendingDownload = false;
            if(error){
                _loadingStatus.downloadCompleted = false;
                _loadingStatus.downloadError = true;
                datagobbler.data_layers[layer].api_info['data'] = null;
                datagobbler.DownloadError(layer,error);
                console.log(layer,"==== >> JSON error <<====");
            }else{
                //console.log("GEOJSON",data);
                _loadingStatus.downloadCompleted = true;
                datagobbler.data_layers[layer].api_info['data'] = data;
                datagobbler.DownloadSuccess(layer);
                datagobbler.decodeDataGEOJSON(layer);
            }
        });

    }

    datagobbler.decodeDataGEOJSON = function(layer){
        var _data = datagobbler.data_layers[layer].api_info.data;
        var _arr = [];
        var _filetype = datagobbler.data_layers[dl].api_info.file_type;
        //_arr[] = _data;
        //for (i = 0; i < _data.length; i++) {
        var _type = datagobbler.getDataType(_data.features[0].geometry.type);
        _data[_type.name] = _type.type;
        _data.has_geospatial_data = datagobbler.data_layers[layer].api_info.has_geospatial_data;
        _data.name = layer;
        _arr.push(_data);
        datagobbler.data_layers[layer].api_info['objects'] = _arr;
        //console.log("decodeDataGEOJSON-objects: ",_data,datagobbler.data_layers[layer].api_info.objects);
        datagobbler.checkGlobalDownloadStatus();
        //console.log(datagobbler.data_layers,"datagobbler.decodeDataJSON",_arr);
    }

     datagobbler.downloadDataARCJSON = function(layer){
        console.log('datagobbler.downloadDataARCJSON');
        var _url = datagobbler.data_layers[layer].api_info.url;
        var _loadingStatus = datagobbler.data_layers[layer].loadingStatus;
        //console.log(_url);
        _loadingStatus.pendingDownload = true;
        d3.json(_url, function(error,data) { //console.log('JSON done.',data,_url);
            _loadingStatus.pendingDownload = false;
            if(error){
                _loadingStatus.downloadCompleted = false;
                _loadingStatus.downloadError = true;
                datagobbler.data_layers[layer].api_info['data'] = null;
                datagobbler.DownloadError(layer,error);
                console.log(layer,"==== >> JSON error <<====");
            }else{
                _loadingStatus.downloadCompleted = true;
                var _esri = esriConverter();
                var _geojson = _esri.toGeoJson(data);
                datagobbler.data_layers[layer].api_info['data'] = _geojson;
                datagobbler.DownloadSuccess(layer);
                datagobbler.decodeDataGEOJSON(layer);
    //console.log("JSON data: ",data);
            }
        });

    }


    datagobbler.downloadDataSHP = function(layer){
        console.log("datagobbler.downloadDataSHP",layer);
        var _data = datagobbler.data_layers[layer].api_info.data;
        //var _arr = [];
        var _filetype = datagobbler.data_layers[dl].api_info.file_type;
        var _loadingStatus = datagobbler.data_layers[layer].loadingStatus;
        var _url = datagobbler.data_layers[layer].api_info.url;
            _url = _url.substring(0,_url.lastIndexOf("."));
        console.log("_url:",_url);
        var _shpLoader = shp(_url).then(
            function(data){ //If successful loading
                console.log("Loaded Shapefile!");
                _loadingStatus.downloadCompleted = true;
                var _arr = [];
                _arr[0] = data;
                datagobbler.data_layers[layer].api_info['data'] = _arr;
                //datagobbler.data_layers[layer].api_info['objects'] = data;
                datagobbler.DownloadSuccess(layer);
                datagobbler.decodeDataSHPGEOJSON(layer); //TODO make sure we get geojson into an array format like the others
            },
            function(event){ //If fails to load
                //console.log("Sorry, could not load Shapefile.");
                _loadingStatus.downloadCompleted = false;
                _loadingStatus.downloadError = true;
                datagobbler.data_layers[layer].api_info['data'] = null;
                datagobbler.data_layers[layer].api_info['objects'] = null;
                datagobbler.DownloadError(layer,event);
            }
        );
    _shpLoader['layer'] = layer;
    }

    datagobbler.downloadDataSHPZIP = function(layer){
        //console.log("datagobbler.downloadDataSHPZIP called");
        var _data = datagobbler.data_layers[layer].api_info.data;
        var _arr = [];
        var _filetype = datagobbler.data_layers[dl].api_info.file_type;
        var _loadingStatus = datagobbler.data_layers[layer].loadingStatus;
        var _url = datagobbler.data_layers[layer].api_info.url;
            _url = _url.substring(0,_url.lastIndexOf("."));
            _url=_url+".zip";
        var _shpLoader = shp(_url).then(
            function(data){ //If successful loading
                //console.log("downloadDataSHPZIP",data);
                _loadingStatus.downloadCompleted = true;
                datagobbler.data_layers[layer].api_info['data'] = data;
                datagobbler.DownloadSuccess(layer);
                datagobbler.decodeDataSHPGEOJSON(layer); //TODO make sure we get geojson into an array format like the others
            },
            function(event){ //If fails to load
                //console.log("Sorry, could not load Shapefile.",event);
                datagobbler.logSystemErrorForLayer({'layer':layer,'errorEvent':event});
                _loadingStatus.downloadCompleted = false;
                _loadingStatus.downloadError = true;
                datagobbler.data_layers[layer].api_info['data'] = null;
                datagobbler.data_layers[layer].api_info['objects'] = null;
                datagobbler.DownloadError(layer,event);
            }
        );
        _shpLoader['layer'] = layer;
    }

    datagobbler.decodeDataSHPGEOJSON = function(layer){

        var _data = datagobbler.data_layers[layer].api_info.data;
        //console.log("datagobbler.decodeDataSHPGEOJSON",_data);

        //console.log(_data);
        for(d in _data){
            var _type = datagobbler.getDataType(_data[d].features[0].geometry.type);
            //console.log(d,_type);
            _data[d][_type.name] = _type.type;
            if(_data[d].fileName){
                _data[d]['name'] = _data[d].fileName;
            }else{
                _data[d]['name'] = "default";
            }
            _data[d].has_geospatial_data = datagobbler.data_layers[layer].api_info.has_geospatial_data;
        }

        datagobbler.data_layers[layer].api_info['objects'] = _data;
        datagobbler.checkGlobalDownloadStatus();
    }

    datagobbler.downloadDataCSV = function(layer){

        var _loadingStatus = datagobbler.data_layers[layer].loadingStatus;
        var _url = datagobbler.data_layers[layer].api_info.url;
        datagobbler.data_layers[layer].api_info['fileName'] = ( _url.substring(_url.lastIndexOf("/")+1,_url.lastIndexOf(".")) + "." + datagobbler.data_layers[dl].api_info.file_type);
        _loadingStatus.pendingDownload = true;
        d3.csv(_url, function(error,data) { //console.log('JSON done.',data,_url);
            _loadingStatus.pendingDownload = false;
            if(error){
                _loadingStatus.downloadCompleted = false;
                _loadingStatus.downloadError = true;
                datagobbler.data_layers[layer].api_info['data'] = null;
                datagobbler.DownloadError(layer,error);
            }else{
                _loadingStatus.downloadCompleted = true;
                //console.log("CSV", data);
                datagobbler.data_layers[layer].api_info['data'] = data;
                datagobbler.DownloadSuccess(layer);
                datagobbler.decodeDataCSV(layer);
            }
        });
    }

    datagobbler.csvToJson = function(csv){
        var lines = csv.split("\n");
        var result = [];
        var headers = lines[0].split(",");
        //console.log(lines[0],headers);
        for(var i=1;i<lines.length;i++){
            //var obj = Object.create(null);
            var currentline = lines[i].split(",");
            //var csvObj = new csvLine(headers,currentline);
            //console.log(csvObj);
            var csvObj = {};
            for(h in headers){
                //console.log(headers.length,currentline.length);
                csvObj[headers[h].replace(/^\s+|\s+$/g,"")] = currentline[h];//encodeURIComponent(currentline[h]);
                //csvObj[headers[h]] = currentline[h];
            }
            //console.log(csvObj);
            result.push(csvObj);
        }
        //console.log(result);
        return result;
    }

    //TODO: Check to see if filtering is deleting items and fix!
     datagobbler.decodeDataCSV = function(layer){
        //console.log("CSV Data Info: ", datagobbler.data_layers[layer].api_info);
        //datagobbler.data_layers[p].api_info.data = $.extend(true,{},datagobbler.data_layers[_targLayer].api_info.data);
        var _data       = datagobbler.data_layers[layer].api_info.data;//$.extend(true,[],datagobbler.data_layers[layer].api_info.data);
         //console.log("Line 528: datagobbler.decodeDataCSV:",_data); //TODO: create an alternate version to decode nonspatial data
         //console.log("datagobbler.data_layers[layer].api_info.has_geospatial_data",datagobbler.data_layers[layer].api_info.has_geospatial_data);
        //var _fileType   = datagobbler.data_layers[layer].api_info.file_type;
         var _arr = [];
         /*

         TODO: 23Nov2016 - need to determine when it's a geospatial CSV vs. non-geospatial CSV.
         If it's not geospatial, then don't build-out object records as geojson
         If it's geospatial, build-out objects as geojson

         Need some kind of "single" data object to put in "objects" array that contains all data
         it would mimic topojson/shpzip with multiple sublayers, but in this case there is just one
         sublayer that is not geospatial

         Each object has an array of objects that contains all the data objects for that sub-layer (or default layer)

         */
         //if geospatial, then... has_geospatial_data
         if(Boolean(datagobbler.data_layers[layer].api_info.has_geospatial_data) == true){
             //console.log("=> IS geospatial data.");
             //console.log(datagobbler.data_layers[layer].api_info);
            var _geomType   = datagobbler.data_layers[layer].api_info.if_not_geospatial_file_type.geometry_type;
            var _latStr     = datagobbler.data_layers[layer].api_info.if_not_geospatial_file_type.field_to_use_for_latitude;
            var _lonStr     = datagobbler.data_layers[layer].api_info.if_not_geospatial_file_type.field_to_use_for_longitude;
            var _features = [];
            var _geojsonObj = {"type":"FeatureCollection","fileName":datagobbler.data_layers[layer].api_info['fileName']};
            //console.log(_latStr,_lonStr);
            for (i = 0; i < _data.length; i++) {
                var _do = _data[i];
                //console.log(_do);
                var _lat = Number(_do[_latStr]);
                var _lon = Number(_do[_lonStr]);

                var _featureObj = {
                    "geometry":{
                            "type":"Point",
                            "coordinates":[_lon,_lat]
                    },
                    "properties":_do,
                    "type":"Feature"
                };
                _features.push(_featureObj);
            }
            _geojsonObj.features = _features;
            var _type = datagobbler.getDataType(_features[0].geometry.type);
            _geojsonObj[_type.name] = _type.type;
            _geojsonObj.has_geospatial_data = datagobbler.data_layers[layer].api_info.has_geospatial_data;
            _arr.push(_geojsonObj);
            //console.log(_arr);
             //console.log("datagobbler.decodeDataCSV-arr",_arr);
         }else{
             //console.log("=> IS NOT geospatial data.");
             for (i = 0; i < _data.length; i++) {
                _data[i] = {"properties":_data[i]};
                //var _do = _data[i];
                 //_do.properties = _do;
             }

             //maybe create "properties" object for each record to match feature objects later when filtering
             var _recordsObj = {
                 "has_geospatial_data":datagobbler.data_layers[layer].api_info.has_geospatial_data,
                 "features":_data//,
                 //"features":_data
             };
             var _type = datagobbler.getDataType("none");
            _recordsObj[_type.name] = _type.type;
             //_recordsObj.features = _recordsObj.records;
                //_recordsObj.features = _recordsObj.records;
             _arr[0] = _recordsObj;
         }
         //else, just set arr to the normal data (_arr = _data)
         //end if
        datagobbler.data_layers[layer].api_info['objects'] = _arr; //
        //console.log("decodeDataCSV",datagobbler.data_layers[layer].api_info.objects);
        datagobbler.checkGlobalDownloadStatus();
    }

    datagobbler.logSystemErrorForLayer = function(args){
        datagobbler.data.by_layer_name[args.layer].errors['systemError'] = args.errorEvent;
    }

    datagobbler.DownloadSuccess = function(layer){
        //console.log(layer,"datagobbler.DownloadSuccess");
        document.dispatchEvent(datagobbler.loader);
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
        //datagobbler.data.databy_layer_name[layer].errors.push("Error downloading data.");
        //datagobbler.numOfDataFilesToFilter--;
    }

    datagobbler.getDownloadErrorObject = function(){
        var _tempObj = {};
        for(dl in datagobbler.data_layers){
            if(datagobbler.data_layers[dl].loadingStatus.downloadError){
                _tempObj[dl] = datagobbler.data_layers[dl];
            }
        }
        return _tempObj;
    }

    datagobbler.getDownloadSuccessObject = function(){
        var _tempObj = {};
        for(dl in datagobbler.data_layers){
            if(datagobbler.data_layers[dl].loadingStatus.downloadCompleted){
                _tempObj[dl] = datagobbler.data_layers[dl];
            }
        }
        return _tempObj;
    }

    datagobbler.getLoadingStatusObject = function(){
        //datagobbler.data_layers[dl].loadingStatus, for(dl in datagobbler.data_layers){
        var _tempObj = {};
        for(dl in datagobbler.data_layers){
            _tempObj[dl] = datagobbler.data_layers[dl].loadingStatus;
        }
        return _tempObj;
    }

    datagobbler.layerOkToFilter = function(layer){
        datagobbler.numOfDataFilesToFilter++;
       datagobbler.data_layers[layer]['layerOkToFilter'] = true;
    }

    datagobbler.layerNotOkToFilter = function(layer){
       datagobbler.data_layers[layer]['layerOkToFilter'] = false;
    }

    datagobbler.filterSuccess = function(layer){
        //console.log(layer,"datagobbler.DownloadSuccess");
        datagobbler.data_layers[layer].loadingStatus.isFiltered = true;
        document.dispatchEvent(datagobbler.loader);
        //datagobbler.layerOkToFilter(layer);
        //datagobbler.numOfDataFilesToFilter++;
         //console.log("-------------------------------");
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
        for(dl in datagobbler.data_layers){
            if(!datagobbler.data_layers[dl].loadingStatus.downloadError){
                datagobbler.data_layers[dl].loadingStatus.downloadCompleted = true;
            }
        }
        datagobbler.filterAllLayers();
    }

    datagobbler.filterAllLayers = function(){
        //console.log("datagobbler.filterAllLayers",datagobbler.data_layers);
        for(dl in datagobbler.data_layers){
            if(datagobbler.data_layers[dl].layerOkToFilter){
                datagobbler.data_layers[dl].api_info.objects = datagobbler.filterDataLayer(dl);
                console.log(datagobbler.data_layers[dl].api_info.objects);
                //
                //var _time = "04/30/2010 21:53:45";
                //var _form = "MM/DD/YYYY hh:mm:ss";
                //console.log("filter now!",moment(_time,_form));
            }
        }
        //console.log(datagobbler.numOfDataFilesToLoad,datagobbler.data);
        datagobbler.ondataLoaded(datagobbler.data);
        //if()
        //console.log("datagobbler.numOfDataFilesToFilter: "+datagobbler.numOfDataFilesToFilter,"datagobbler.numOfDataFilesFiltered: "+datagobbler.numOfDataFilesFiltered)
    }

    datagobbler.filterDataLayer = function(layer){

        //console.log(moment(1473776315160).utc()); //
        //console.log(datagobbler.getCommonTime(1473776315160));

        var _objects        = datagobbler.data_layers[layer].api_info.objects;
        var _dateField      = datagobbler.data_layers[layer].api_info.date_info.field_name_for_date;
        var _filterOutArr   = datagobbler.data_layers[layer].api_info.filter_out;
        var _dateFormat     = datagobbler.data_layers[layer].api_info.date_info.date_format;
        //console.log("Filtering "+ layer, _objects);
        //console.log(_objects.length + " objects found.")
        for(k in _objects){
            _objects[k]['data_layer'] = layer;
            _objects[k].featuresFiltered = [];
            //console.log("Object #"+k+":",_objects[k]);
            var _features = _objects[k].features;
            var _temp_features = [];
            var _is_temporal;
            if(_features[0].properties[_dateField]){
                _is_temporal = true;
            }else{
                _is_temporal = false;
            }
            datagobbler.data_layers[layer].api_info.objects[k].is_temporal = _is_temporal;

            for(f in _features){
                //console.log(f);
                var _keepFeature = true;
                if(_keepFeature){
                    if(_is_temporal){

                        var _time;
                        // verify whether the time/date field is meant to be
                        // text or a number
                        if(isNaN(Number(_features[f].properties[_dateField]))){
                            _time = _features[f].properties[_dateField]; //treat as text
                        }else{
                            _time = Number(_features[f].properties[_dateField]); //treat as a number (eg. UNIX)
                        }
                        //isNaN(
                        //console.log("_dateField",_dateField);
                        //console.log(_features[f]);
                        _features[f].properties["idate"] = _time;
                        _features[f].properties["itime"] = datagobbler.getCommonTime(_time,_dateFormat);
                        _features[f].properties["prettytime"] = datagobbler.getCommonTime(_time,_dateFormat).prettytime;
                        _features[f].properties["numbertime"] = datagobbler.getCommonTime(_time,_dateFormat).numbertime;

                        if(_features[f].properties["itime"].isInGlobalDateRange){
                            //console.log("false!");
                            if(datagobbler.dateIsInUIRange(_features[f].properties["itime"].date)){
                                datagobbler.data_options.dates.currentUIRange.currentDatesArray[_features[f].properties["numbertime"]] = _features[f].properties["itime"];
                                datagobbler.data_options.dates.currentUIRange.currentDatesObject[_features[f].properties["numbertime"]] = _features[f].properties["itime"];
                            }
                            _keepFeature = true;
                            //_temp_features.push(_features[f]);
                            //datagobbler.addToData(layer,_features[f]);
                        }else{
                            _keepFeature = false;
                        }
                        //console.log("IS_TEMPORAL");
                    }else{
                        datagobbler.data_layers[layer].api_info.is_temporal = false;
                        //console.log("no time");
                        _keepFeature = true;
                        //datagobbler.addToData(layer,_features[f]);
                    }
                }

                if(_keepFeature){
                    if(_filterOutArr.length>0){
                        //console("_filterOutArr exists!");
                        for(fo in _filterOutArr){
                             var _filterOutArgs = {};
                            _filterOutArgs = {
                                'property':_filterOutArr[fo].property,
                                'operator':_filterOutArr[fo].operator,
                                'val1':_features[f].properties[_filterOutArr[fo].property],
                                'val2':_filterOutArr[fo].value
                            };
                            //console.log("_filterOutArgs",_filterOutArgs);
                            if(datagobbler.getFilter(_filterOutArgs)){
                                //delete _features[f];
                                _keepFeature = false;
                                //console.log(_features[f].properties[_filterOutArr[fo].property]);
                                //break;
                            }

                        }
                    }
                }

                if(_keepFeature){
                    //make object with all required data
                    //send to addData
                    _features[f].id = datagobbler.numRecords;
                    var _args = {
                        feature:_features[f],
                        has_geospatial_data:_objects[k].has_geospatial_data,
                        geometry_type:_objects[k].geometry_type,
                        name:_objects[k].name,
                        layer:layer,
                        is_temporal:_is_temporal
                    }
                    //_features[f]['id'] = datagobbler.numRecords;
                    datagobbler.numRecords++;
                    _objects[k].featuresFiltered.push(_features[f]);
                    datagobbler.addToData(_args);
                }


                //if(_time == 1473480604503 || _time == 1473479679760){
                  //  console.log(_keepFeature,_features[f].properties.itime);
                //}
                //console.log(_keepFeature);

            }//end _features

           // _objects[k].featuresFiltered =
            //console.log(_temp_features.length);
            //console.log(_temp_features);
        }//end _objects
        //console.log(datagobbler.data_layers[layer].api_info.objects);//_objects);
        datagobbler.filterSuccess(layer);
        datagobbler.numOfDataFilesFiltered++;
        return _objects;
    }

    datagobbler.getCommonTime = function(time,format) {
        //var _time;
        //var _type = typeof time;
        //if(_type == "number"){
           // var _tempTime = moment().utc();
            //_tempTime.add(time,'d');
            //_time = _tempTime;
        //}else{
        //var _time = time;
        var _time = moment(time,format); //147377631516
        //console.log(time,format,_time);
        //var _time_utc = moment(moment(time).utc().format()).utc();
        // Use MomentJS to create a more feature-rich date object that can read multuiple date/time formats automatically
        // This reduces the amount of custom parsing we need to perform for various dates

        var _yyyy = String(_time.year());
        var _mm = String(_time.get('month')+1);
        var _dd = String(_time.get('date'));
        var _isInGlobalDateRange = true;

        function getDouble(num){ //returns a number like 6 or 7 as "06" or "07"
            num = Number(num);
            return num > 9 ? "" + num: "0" + num;
        }
        if(datagobbler.data_options.default_dates.idate_start && datagobbler.data_options.default_dates.idate_end){
            _isInGlobalDateRange = datagobbler.dateIsInGlobalDateRange(_time);
            //.isBetween(datagobbler.data_options.default_dates.idate_start.date,datagobbler.data_options.default_dates.idate_end.date);
        }
        if(_isInGlobalDateRange){
            /*
            Here we are creating the framework of the "datagobbler.data.by_date" object that we created in datagobbler.data. It is looking to see if an object has been created yet that corresponds to the date of the current UI object (point/polyline/polygon).
            If no object for that year/month/day exists, an empty object/placeholder is created.
            */
            if(!datagobbler.data.by_date[_yyyy]){
                datagobbler.data.by_date[_yyyy] = {};
            }
            if(!datagobbler.data.by_date[_yyyy][_mm]){
                datagobbler.data.by_date[_yyyy][_mm] = {};
            }
            if(!datagobbler.data.by_date[_yyyy][_mm][_dd]){
                //console.log("Making entry for: " + _mm+"/"+_dd+"/"+_yyyy);
                datagobbler.data.by_date[_yyyy][_mm][_dd] = [];
            }
        }
        /*
        Create an object to pass basic year/month/day info to any script calling this function
        */
        var _timeObj = {
            //'time':_time,
            //'time_utc':_time_utc,
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
        var _rsd = datagobbler.data_options.default_dates.idate_start.date;
        var _red = datagobbler.data_options.default_dates.idate_end.date;
        var _isInRange = false;
        //console.log(_rsd <= date && date <=_red);
        if(_rsd <= date && date <=_red){
            _isInRange = true;
            //console.log(datagobbler.getCommonTime(date).prettytime);
        }
        return _isInRange;
    }
    datagobbler.dateIsInUIRange = function(date) {
        var _rsd = datagobbler.data_options.dates.currentUIRange.date_start.date;
        var _red = datagobbler.data_options.dates.currentUIRange.date_end.date;
        var _isInRange = false;
        //console.log(_rsd <= date && date <=_red);
        if(_rsd <= date && date <=_red){
            _isInRange = true;
            //console.log(datagobbler.getCommonTime(date).prettytime);
        }
        return _isInRange;
    }

    datagobbler.getFilter = function(args){
        //Check if we are passing a number as text
        //If so, change it to a number
        if(typeof(Number(args.val1))==='number'){
            args.val1 = Number(args.val1);
            args.val2 = Number(args.val2);
        }
        switch(args.operator) {
            case "!=":
                return args.val1 != args.val2;
            case "=="||"=":
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

    datagobbler.addToData = function(args) {
        var layer = args.layer;
        var feature = args.feature;
        var _hasGroupByObjects = datagobbler.data_layers[layer].api_info.group_by.length;
        if(_hasGroupByObjects>0){ //if we defined or requested byProperty objects in config.json
            //console.log("has property objects!",_hasPropertyObjects);
            for(p in datagobbler.data_layers[layer].api_info.group_by){
                var _prop = datagobbler.data_layers[layer].api_info.group_by[p];


                if(!datagobbler.data.by_layer_name[layer].by_group[_prop]){
                    datagobbler.data.by_layer_name[layer].by_group[_prop] = {};
                }
                if(datagobbler.data.by_layer_name[layer].by_group[_prop]){
                    var _val = feature.properties[_prop];
                    if(!datagobbler.data.by_layer_name[layer].by_group[_prop][_val]){
                        datagobbler.data.by_layer_name[layer].by_group[_prop][_val] = [];
                        //console.log(_val);
                    }
                    if(datagobbler.data.by_layer_name[layer].by_group[_prop][_val]){
                       datagobbler.data.by_layer_name[layer].by_group[_prop][_val].push(feature);
                    }
                }
            }
        }

        if(feature.properties.itime){

            var _yyyy = feature.properties.itime.year;
            var _mm = feature.properties.itime.month;
            var _dd = feature.properties.itime.day;


            if(!datagobbler.data.by_layer_name[layer]['by_date'][_yyyy]){
                datagobbler.data.by_layer_name[layer]['by_date'][_yyyy] = {};
            }
            if(!datagobbler.data.by_layer_name[layer]['by_date'][_yyyy][_mm]){
                datagobbler.data.by_layer_name[layer]['by_date'][_yyyy][_mm] = {};
            }
            if(!datagobbler.data.by_layer_name[layer]['by_date'][_yyyy][_mm][_dd]){

                datagobbler.data.by_layer_name[layer]['by_date'][_yyyy][_mm][_dd] = [];
            }

            datagobbler.data.all_dates[feature.properties.itime.numbertime] = feature.properties.itime;

            // Add the object to the array corresponding to the year->month->day that the UI object represents
            datagobbler.data.by_date[feature.properties.itime.year][feature.properties.itime.month][feature.properties.itime.day].push(feature);
            datagobbler.data.by_layer_name[layer].by_date[feature.properties.itime.year][feature.properties.itime.month][feature.properties.itime.day].push(feature);


        }

        if(args.has_geospatial_data){
            datagobbler.data.all_data.geospatial.push(feature);
            datagobbler.data.by_layer_name[layer].all_data.geospatial.push(feature);
        }else{
            datagobbler.data.all_data.regular.push(feature);
            datagobbler.data.by_layer_name[layer].all_data.regular.push(feature);
        }

        /*
        id:datagobbler.numRecords,
                        feature:_features[f],
                        has_geospatial_data:_objects[k].has_geospatial_data,
                        geometry_type:_objects[k].geometry_type,
                        name:_objects[k].name,
                        data_layer:layer,
                        is_temporal:_is_temporal
                        */
    }

}();
