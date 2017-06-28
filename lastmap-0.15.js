!function() {
    lastmap = {
        name:"LastMap",
        version:"0.1",
        map:{
            style:{},
            type:"",
            projection:"",
            width:"100%",
            height:"100%",
            x:0,
            y:0
        },
        mapData:{}
    };
    lastmap.version = '0.1';

    lastmap.createMap = function(mapOptions){
        lastmap.mapOptions = mapOptions;
        d3.json(lastmap.mapOptions.styleUrl, function(error,styleData) {
            if(error){
                console.log("error loading.")
            }else{
                lastmap.styleData = styleData;
                lastmap.createDataGobblerObject();
            }
        });
    }


    lastmap.dataGobblerLoadingCallbackFunction = function(data){
        lastmap.mapOptions.loadingCallbackFunction(data);
    }
    lastmap.dataGobblerLoadedCallbackFunction = function(data){
        //console.log("lastmap.dataGobblerLoadedCallbackFunction called.");
        //console.log(data);
        lastmap.mapData.raw = data;
        lastmap.mapData.geojson = {"type":"FeatureCollection","features":[]};
        lastmap.mapData.geojsonObjects = {"type":"GeojsonList","objects":{}};
        lastmap.arrangeDataToMatchMapStyleLayers();
        lastmap.mapOptions.loadedCallbackFunction({
            data:data,
            map:lastmap.leafletMap
        });
    }

    lastmap.arrangeDataToMatchMapStyleLayers = function(){
        //console.log(lastmap.styleData.layers,lastmap.mapData);
        //console.log("lastmap.arrangeDataToMatchMapStyleLayers called.");
        lastmap.styleData.stylesByLayerName = {};
        for(l in lastmap.styleData.layers){

            var _style              = lastmap.styleData.layers[l];
            var _styleSource        = _style.source;
            var _styleLayerName     = _style["source-layer"];
            var _styleLayerId       = _style.id;

            lastmap.styleData.stylesByLayerName[_styleLayerId] = _style;

            var _sourceDataObjects = lastmap.mapData.raw.by_layer_name[_styleLayerId].all_data.geospatial;

            //var _geojson = {"type":"FeatureCollection"};
            //_geojson.features = _sourceDataObjects;
            //lastmap.mapData.geojsonObjects.objects[_styleLayerId] = _geojson;

            //lastmap.mapData.geojsonArray = [];
            for(v in _sourceDataObjects){
                //_sourceDataObjects[v].styleId = _styleLayerId;
                //lastmap.mydata = datagobbler.data_layers[_styleLayerId].api_info.data;
                _sourceDataObjects[v].properties.styleId = _styleLayerId;
            }

            lastmap.mapData.geojson.features.push.apply(lastmap.mapData.geojson.features, _sourceDataObjects);

            //var _tempArr = _sourceDataObjects.filter(arrayFilter);
            //console.log(_styleLayerId,_sourceDataObjects);
        }

        //console.log(lastmap.mapData.geojsonObjects);

        //lastmap.mapData.topojson = topojson.topology(lastmap.mapData.geojsonObjects);
        console.log(lastmap.mapData);//lastmap.mapData.topojson);

        lastmap.mapData.tileOptions = {
				maxZoom:20,  // max zoom to preserve detail on
				tolerance:10, // simplification tolerance (higher means simpler)
				extent: 4096, // tile extent (both width and height)
				buffer: 64,   // tile buffer on each side
				debug: 0,      // logging level (0 to disable, 1 or 2)
				indexMaxZoom:10,        // max zoom in the initial tile index
				indexMaxPoints:1000, // max number of points per tile in the index
        };

        console.log("L.Proj",L.Proj);

        var crs4326 = new L.Proj.CRS('EPSG:4326',
	"+proj=longlat +ellps=WGS84 +datum=WGS84 +no_defs",
	[-180.00, -90, 180.0, 90], /*minx,miny,maxx,maxy*/
                {resolutions: [
                0.7031250000000000000000000,
                0.3515625000000000000000000,
                0.1757812500000000000000000,
                0.0878906250000000000000000,
                0.0439453125000000000000000,
                0.0219726562500000000000000,
                0.0109863281250000000000000,
                0.0054931640625000000000000,
                0.0027465820312500000000000,
                0.0013732910156250000000000,
                0.0006866455078125000000000,
                0.0003433227539062500000000,
                0.0001716613769531250000000,
                0.0000858306884765625000000,
                0.0000429153442382812500000
                       ],
                 noWrap:true
                });

        /*

			//console.log(this.mapOptions);
			this.leafletMap = new L.Map(this.mapOptions.mapDivId, {
				minZoom:this.mapOptions.minZoom,
				maxZoom:this.mapOptions.maxZoom,
                //crs: L.CRS.EPSG4326,
                crs: crs4326,//L.CRS.EPSG4326,
                continuousWorld: false,
				//maxBounds: mapBounds,
				zoomControl: true

                var map = new L.Map('map', {
            crs: crs,
            continuousWorld: true,
            worldCopyJump: false
        });

        var tileUrl = 'Tiles/{z}/{x}/{y}.png',
            tilelayer = new L.Proj.TileLayer.TMS(tileUrl, crs, {
                maxZoom: 8
                , minZoom: 0
                , continuousWorld: true
            });

        */
        //var _layer = L.vectorGrid.slicer(lastmap.mapData.geojson, lastmap.mapData.tileOptions);

        lastmap.leafletMap = new L.Map("map", {
                crs:L.CRS.EPSG3857,
                continuousWorld: false,
                noWrap: true,
                worldCopyJump: false,
				minZoom:0,
				maxZoom:14,
				zoomControl: true
			}).setView([38,-78],5);

        //console.log(geojsonvt);

        lastmap.mapData.vectorTiles = geojsonvt(lastmap.mapData.geojson, lastmap.mapData.tileOptions);
        //console.log(lastmap.mapData.vectorTiles);


        L.GridLayer.LastmapTiles = L.GridLayer.extend({
            createTile: function (coords) {
                var tile = document.createElement('canvas');
                var data = lastmap.mapData.vectorTiles.getTile(coords.z, coords.x, coords.y);

                if(data){

                    //console.log(data);
                    var tileSize = this.getTileSize();
                    var ratio = 1;

                    //console.log(tileSize);
                    tile.setAttribute('width', tileSize.x);
                    tile.setAttribute('height', tileSize.y);

                    var ctx = tile.getContext('2d');

                    /*

                    */


                    ctx.globalCompositeOperation = 'source-over';

                    //ctx.arc(tileSize.x/2, tileSize.x/2, 4 + coords.z*4, 0, 2*Math.PI, false);
                    //ctx.fill();
                     ctx.clearRect(0, 0, tileSize.x, tileSize.y);

			         ctx.strokeStyle = 'grey';
			         var ratio = 1;

                    for (var i = 0; i < data.features.length; i++) {

				        var feature = data.features[i];
                        var layerId   = feature.tags.styleId;
                        var layerStyle = lastmap.styleData.stylesByLayerName[layerId];
                        var shape = layerStyle.type;
                        var ctxStyles = {};
                        var type = feature.type;


                        switch(shape) {
                            case "fill":
                                for(s in layerStyle.paint){
                                    //console.log(s);
                                    var key, val;
                                    var str = layerStyle.paint[s];
                                    if(str.indexOf('@')>=0){
                                        val = lastmap.styleData.constants[str];
                                    }else{
                                        val = str;
                                    }

                                    switch(s) {
                                        case "fill-antialias":
                                            //sometings...
                                            break;
                                        case "visibility":
                                            //something
                                            break;
                                        case "fill-opacity":
                                            //
                                            break;
                                        case "fill-color":
                                            ctx.fillStyle = val;
                                            break;
                                    }
                                }
                                //return args.val1 != args.val2;
                            case "line":
                                for(s in layerStyle.paint){
                                    //console.log(s);
                                }
                                //return args.val1 == args.val2;
                        }
                        //console.log(ctx);

                        //ctx.fillStyle = 'rgba(25,25,25,0.5)';
				        //ctx.strokeStyle = 'rgba(25,25,25,0.5)';
				        //ctx.lineWidth = 1;

				        ctx.beginPath();

                        if(layerStyle.minzoom<=coords.z && layerStyle.maxzoom>=coords.z){
                            //console.log("SHOW");
                            for (var j = 0; j < feature.geometry.length; j++) {
                                var pad = 0;
                                var geom = feature.geometry[j];

                                for (var k = 0; k < geom.length; k++) {
                                    var p = geom[k];
                                    var extent = 4096;
                                    var x = p[0] / extent * 256;
                                    var y = p[1] / extent * 256;
                                    if (k) ctx.lineTo(x  + pad, y   + pad);
                                    else ctx.moveTo(x  + pad, y  + pad);
                                }

                            }
                            if (type === 3 || type === 1) ctx.fill('evenodd');
					       ctx.stroke();
                            //ctx.fill();
                            //ctx.beginPath();
                        }
                    }
                    //var tile = document.createElement('div');
                    //tile.innerHTML = [coords.x, coords.y, coords.z].join(', ');
                    //var tile = params.options.tileIndex1.getTile(params.tilePoint.z, params.tilePoint.x, params.tilePoint.y);
                    //var _tile = lastmap.mapData.vectorTiles.getTile(coords.z, coords.x, coords.y);
                    //lastmap.mapData.vectorTiles
                    //console.log(_tile);
                    //tile.style.outline = '1px solid red';
                    //tile.style.color = "green";

                }
                return tile;
            }
        });

        var opts = {noWrap:true};

        L.gridLayer.LastmapTiles = function(opts) {
            var gLayer = new L.GridLayer.LastmapTiles(opts);
            console.log("gLayer",gLayer,"opts",opts);
            //gLayer._wrapX[1] = 2;
            return gLayer;
        };

        lastmap.leafletMap.addLayer( L.gridLayer.LastmapTiles(opts) );

        /*
        var _vt = L.vectorGrid.slicer(lastmap.mapData.geojsonObjects, {
            rendererFactory: L.canvas.tile,
            attribution: 'Something',
            vectorTileLayerName:"veclayer",
            vectorTileLayerStyles: {
               "layer-states": {
                    weight: 0,
                    fillColor: 'rgba(255,0,0,0.5)',
                    fillOpacity: 1,
                    fill: true
                },
                "layer-countries": {
                    weight: 0,
                    fillColor: 'rgba(0,255,0,0.5)',
                    fillOpacity: 1,
                    fill: true
                }
            }
        }).addTo(lastmap.leafletMap);
        */
        //console.log(topojson);//lastmap.mydata,_vt);
        //console.log(lastmap);
    }

    lastmap.callDataGobbler = function(){
        datagobbler.ondataLoaded = lastmap.dataGobblerLoadedCallbackFunction;
        datagobbler.ondataLoading = lastmap.dataGobblerLoadingCallbackFunction;
        datagobbler.data_layers = lastmap.dataGobblerObject.data_layers;
        datagobbler.data_options = lastmap.dataGobblerObject.data_options;
        datagobbler.data_options.dates = datagobbler.setDefaultDates(lastmap.dataGobblerObject.data_options.default_dates);
        datagobbler.setDataOptions();
    }

    lastmap.createDataGobblerObject = function(){

        var _dataLayers = {};
        for(l in lastmap.styleData.layers){

            //console.log("style",lastmap.styleData.sources[s]);
            var _id             = lastmap.styleData.layers[l].id;
            var _source         = lastmap.styleData.layers[l].source;
            var _sourceLayer    = lastmap.styleData.layers[l]['source-layer'];
            var _url            = lastmap.styleData.sources[_source].url;
            var _type           = lastmap.styleData.sources[_source].type;
            var _filterOut      = lastmap.styleData.layers[l].metadata['filter-out'];
            var _groupBy        = lastmap.styleData.layers[l].metadata['group-by'];

            //console.log(l,_id,_source,_sourceLayer,_url,_type,_filterOut,_groupBy);
            ///*
            _dataLayers[_id] = {
                "title":_sourceLayer,
                "api_info": {
                    "url":_url,
                    "url_date_format":null,
                    "file_type":_type,
                    "filter_out":_filterOut,
                    "group_by":_groupBy,
                    //"single_layer_only" is used only between lastmap and datagobbler to
                    // deal with mapbox style layers
                    "single_layer_only":true,
                    "proxy_url":null,
                    "date_info": {
                        "date_field":null,
                        "date_format":null,
                        "offset_type":"days",
                        "date_start_offset":0,
                        "date_end_offset":0
                    },
                    "if_not_geospatial_file_type":{
                        "field_to_use_for_latitude":null,
                        "field_to_use_for_longitude":null
                    }
                }
            }
           // */
        }

       // /*
        lastmap.dataGobblerObject = {
            "data_layers":_dataLayers,
            "data_options": {
                "default_proxy_url":null,
                "default_dates": {
                    "date_format":"MM/DD/YYYY",
                    "date_start":"01/01/1000",
                    "date_end":"01/01/3000"
                },
                "dataBounds": {
                    "north":90,
                    "south":-90,
                    "east":180,
                    "west":-180
                }
            }
        }

        lastmap.callDataGobbler();
        //*/
    }
    /*

    {
      "type": "FeatureCollection",
      "features": [
        {
          "type": "Feature",
          "geometry": {
            "type": "Point",
            "coordinates": [0, 0]
          },
          "properties": {
            "name": "null island"
          }
        }
      ]
    }


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

    var map = L.map('map', {
        crs: L.CRS.EPSG4326
        });

    this.leafletMap = new L.Map(this.mapOptions.mapDivId, {
				minZoom:this.mapOptions.minZoom,
				maxZoom:this.mapOptions.maxZoom,
				maxBounds: mapBounds,
				zoomControl: true
			}).setView([this.mapOptions.centerLat,this.mapOptions.centerLon],this.mapOptions.defaultZoom);

			this.leafletMap.on('moveend', function() {
				lastmap.insetmap.recenter();
				lastmap.redrawCityLabels();
				lastmap.redrawCountryLabels();
			});
    */

}();
