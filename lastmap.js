/*

lastmap.js

"lastmap" is the last map you'll need. At least for teh next few months!

Requires jQuery, Leaflet, and D3 to work!

lastmap leverages the great work made open-source by Vladmir Algofonkin and MapBox
that allows the creation of Mapbox Vector Tiles (MVT) from GEOJSON data in the browser.

This code is meant to simplify the development and creation of automated, interactive maps.

*/

!function() {

	lastmap = {
    	version: "0.0.1",

		setMapOptions: function(args){
			this.mapOptions = args;
			this.populateHeaderFooter();
			this.buildBaseMap();
		},

		icons: {
			cities:{
				cityCountryCapital : '<circle fill="#FFFFFF" cx="7.384" cy="7.5" r="6.209"/><path d="M7.384,1.291c-3.43,0-6.209,2.78-6.209,6.209s2.78,6.209,6.209,6.209c3.429,0,6.209-2.78,6.209-6.209 S10.813,1.291,7.384,1.291z M12.971,5.626H8.757L7.453,1.611c1.547,0.018,3,0.628,4.096,1.725 C12.204,3.99,12.686,4.772,12.971,5.626z M3.219,3.335c1.096-1.097,2.549-1.707,4.096-1.725L6.011,5.626H1.797 C2.083,4.772,2.564,3.99,3.219,3.335z M1.494,7.5c0-0.598,0.089-1.182,0.26-1.738l3.408,2.477l-1.295,3.987 c-0.227-0.17-0.443-0.357-0.647-0.561C2.107,10.553,1.494,9.074,1.494,7.5z M3.992,12.317l3.392-2.465l3.392,2.465 c-0.985,0.696-2.16,1.072-3.392,1.072S4.978,13.014,3.992,12.317z M11.549,11.665c-0.203,0.203-0.42,0.391-0.647,0.561L9.605,8.238 l3.409-2.477c0.171,0.556,0.26,1.14,0.26,1.738C13.274,9.074,12.661,10.553,11.549,11.665z"/>',
				cityStateCapital : '<g><circle fill="#FFFFFF" cx="7.5" cy="7.5" r="5.942"/><path d="M7.397,2.153c1.428-0.027,2.782,0.503,3.811,1.493c1.028,0.991,1.611,2.323,1.638,3.751 c0.027,1.428-0.503,2.781-1.493,3.81c-0.99,1.03-2.322,1.611-3.751,1.639c-1.428,0.027-2.781-0.502-3.811-1.493 c-1.028-0.99-1.611-2.322-1.638-3.75C2.125,6.174,2.657,4.821,3.646,3.792C4.637,2.763,5.969,2.181,7.397,2.153 M7.386,1.56 C4.104,1.622,1.497,4.333,1.559,7.614c0.063,3.28,2.773,5.889,6.054,5.827c3.281-0.063,5.89-2.773,5.827-6.054 C13.377,4.105,10.666,1.497,7.386,1.56L7.386,1.56z"/><circle cx="7.499" cy="7.5" r="4.159"/></g>',
				city : '<circle cx="7.384" cy="7.5" r="4.159"/>'
			},
			buttons:{
				resetmap : '<rect opacity="0.5" fill="#FFFFFF" width="40" height="40"/><circle fill="#FFFFFF" stroke="#000000" stroke-width="2" stroke-miterlimit="10" cx="19.876" cy="20.125" r="17.625"/>'
			}
		},

		resizeMap: function(){
			lastmap.citylabels = {};
			lastmap.citymarkers = {};
			lastmap.countrymarkers = {};
			lastmap.docbody = document.body;
			_map.height(window.innerHeight - this.mapOptions.footerHeight);
		},

		populateHeaderFooter: function(){
			//
			document.title = this.mapOptions.title.country + ": "+this.mapOptions.title.text;
			$('#headerTitleCountry').text(this.mapOptions.title.country + ": ");
			$('#headerTitleText').text(this.mapOptions.title.text);

			for(c=0;c<$('.classification').length;c++){
				$('.classification')[c].innerHTML = this.mapOptions.classification.classification;
			}
			$('#classifiedBy')[0].innerHTML = this.mapOptions.classification.classifiedBy + " &nbsp; &bull; &nbsp; " + this.mapOptions.classification.derivedFrom + " &nbsp; &bull; &nbsp; "+ this.mapOptions.classification.declassifyOn;
			$('#disclaimer')[0].innerHTML = this.mapOptions.classification.disclaimer;
			$('#attachmentText')[0].innerHTML = this.mapOptions.attachmentText;
			$('#publishDate')[0].innerHTML = this.mapOptions.publishDate;
			$('#productNumber')[0].innerHTML = this.mapOptions.productNumber;
		},

		buildBaseMap: function(a,b){
			$('#map')[0].style.backgroundColor = this.mapOptions.mapStyles.water.fillStyle;
			var projection = d3.geo.mercator()
			var path = d3.geo.path().projection(projection);

			_map = $("#"+this.mapOptions.mapDivId);
			this.resizeMap();

			var data,
				pad,
				ratio,
				tileLayer;
			var southWest = L.latLng(this.mapOptions.mapBounds.southWest[0],this.mapOptions.mapBounds.southWest[1]),
				northEast = L.latLng(this.mapOptions.mapBounds.northEast[0],this.mapOptions.mapBounds.northEast[1]),
				mapBounds = L.latLngBounds(southWest, northEast);
			//console.log(this.mapOptions);
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

			//position:"bottomleft",updateWhenIdle:false,minUnitWidth:30,maxUnitsWidth:240,fill:false,showSubunits:false,doubleLine:false,labelPlacement:"auto"
			L.control.graphicScale({
				position:'bottomright',
				doubleLine:true,
				fill:'hollow',
				showSubunits:true
			}).addTo(this.leafletMap);


			var _reseticonhtml= '<div class="mapButtonsReset" style="border:1px solid #999">';
			_reseticonhtml+= '<svg x="0px" y="0px" width="30px" height="30px" viewBox="0 0 30 30" enable-background="new 0 0 30 30">'+lastmap.icons.buttons.resetmap+'</svg>';
			_reseticonhtml+= '</div><div>Reset Map</div>';
			_reseticonhtml+= '</div>';

			var _content = document.getElementById("content");

			//d3.select("body").append
			//$('#content').append(_reseticonhtml).
			console.log(d3.select("#content")[0][0]);


			this.tileOptions = {
				maxZoom:20,  // max zoom to preserve detail on
				tolerance:10, // simplification tolerance (higher means simpler)
				extent: 4096, // tile extent (both width and height)
				buffer: 64,   // tile buffer on each side
				debug: 0,      // logging level (0 to disable, 1 or 2)
				indexMaxZoom:10,        // max zoom in the initial tile index
				indexMaxPoints:1000, // max number of points per tile in the index
			};

			this.importBasemapData();
			if(lastmap.mapOptions.insetMapOptions.displayInsetMap) this.buildInsetMap();

		},

		buildInsetMap: function(){
			var width = lastmap.mapOptions.insetMapOptions.insetMapWidth, height = lastmap.mapOptions.insetMapOptions.insetMapHeight;
			//console.log(lastmap);
			lastmap.insetmap = {};

			var projection = d3.geo.equirectangular()
				.translate([width / 2, height / 2])
				.scale(width / 2)
				//.clipAngle(90)
				.precision(1);
			lastmap.insetmap.projection = projection;

			var canvas = d3.select("body").append("canvas")
				.attr("id","insetmap")
    			.attr("width", width)
   				.attr("height", height);
			var c = canvas.node().getContext("2d");

			$('#insetmap')[0].style.backgroundColor = this.mapOptions.mapStyles.water.fillStyle;

			lastmap.insetmap.canvas = c;
			lastmap.insetmap.width = width;
			lastmap.insetmap.height = height;

			var path = d3.geo.path()
				.projection(projection)
				.context(c);
			queue()
				.defer(d3.json, "./resources/data/world-110m.json")
				//.defer(d3.tsv, "./resources/data/world-country-names.txt")
				.await(insetDataReady);

			function insetDataReady(error, world, names) {
 				if (error) throw error;

				var land = topojson.feature(world, world.objects.land),
				countries = topojson.feature(world, world.objects.countries).features,
				borders = topojson.mesh(world, world.objects.countries, function(a, b) { return a !== b; }),
				i = -1,
				n = countries.length;


				lastmap.insetmap.land = land;
				lastmap.insetmap.countries = countries;
				lastmap.insetmap.borders = borders;
				lastmap.insetmap.init = false;

				lastmap.insetmap.recenter = function(){

					onMouseMove = function(map){
						var _latlng = [map.latlng.lng,map.latlng.lat];
						lastmap.insetmap.projection.center(_latlng);
					}

					lastmap.leafletMap.on('mousemove', onMouseMove, this);

					if(!lastmap.insetmap.init){
						lastmap.insetmap.init = true;
						var _latlng = [lastmap.mapOptions.centerLon,lastmap.mapOptions.centerLat];
						lastmap.insetmap.projection.center(_latlng);
					}
					lastmap.insetmap.projection.scale(lastmap.leafletMap.getZoom()*75);

					var c = lastmap.insetmap.canvas;
					c.clearRect(0, 0, lastmap.insetmap.width, lastmap.insetmap.height);
					c.fillStyle = "#ccc", c.beginPath(), path(land), c.fill();
					//c.fillStyle = "#f00", c.beginPath(), path(countries[22]), c.fill();
					c.strokeStyle = "#fff", c.lineWidth = .5, c.beginPath(), path(borders), c.stroke();
					c.strokeStyle = "#000", c.lineWidth = 2, c.beginPath(), path(), c.stroke();

					c.beginPath();
					var _w = 8;
					//c.arc(lastmap.insetmap.width/2, lastmap.insetmap.height/2, 10, 0, 2 * Math.PI, false);
					c.rect(lastmap.insetmap.width/2-(_w/2),lastmap.insetmap.height/2-(_w/2),_w,_w);
					c.fillStyle = 'rgba(255,0,0,1)';
					c.fill();

				}

				lastmap.insetmap.recenter();
			}

		},

		importBasemapData: function(a,b){

			lastmap.features = {};
			lastmap.countrylabels = {};
			lastmap.countriestorank = {};

			d3.json(this.mapOptions.topojsonFile, function(error, mapdata) {
				if (error) throw error;
				lastmap.allFeaturesArr = [];
				for (var i=0; i<=mapObjectsArray.length; i++) {
					//console.log(i,mapObjectsArray.length);
					if(i==mapObjectsArray.length){
						lastmap.featuresArray = lastmap.allFeaturesArr.concat.apply([],lastmap.allFeaturesArr);
						lastmap.featureCollection = {"type":"FeatureCollection","features":lastmap.featuresArray}; //geojson object MUST BE of type "FeatureCollection"
						lastmap.addLayerToMap(lastmap.featureCollection);
						break;
					}
					//if displayLayer is set to TRUE...
					var _obj = topojson.feature(mapdata, mapdata.objects[mapObjectsArray[i].dataObject]);
					lastmap.features[mapObjectsArray[i].dataObject] = _obj;

					if(mapObjectsArray[i].displayLayer){
						mapdata.objects[mapObjectsArray[i].dataObject]['dataObject'] = mapObjectsArray[i].dataObject;
						//console.log(mapdata.objects[mapObjectsArray[i].dataObject]);
						if( mapdata.objects[mapObjectsArray[i].dataObject] ){
								_obj['dataObject'] = mapObjectsArray[i].dataObject; //set the value "dataObject" to the value we set in the mapObjectsArray (ex. "cities")

							if(_obj.dataObject=="cities"){ //custom way to access array of cities (on cities/capitals have FEATURECLA in caps).
								for(f in _obj.features){
									_obj.features[f].properties['city'] = true;
									_obj.features[f].properties['lon'] = _obj.features[f].geometry.coordinates[1];
									_obj.features[f].properties['lat'] = _obj.features[f].geometry.coordinates[0];
								}
							}
							if(_obj.dataObject=="countries"){ //custom way to access array of cities (on cities/capitals have FEATURECLA in caps).
								//console.log(_obj);
								for(f in _obj.features){
									var _ranknum = _obj.features[f].properties[lastmap.mapOptions.mapStyles.countrylabels.rankField]
									var _minzoom = lastmap.mapOptions.mapStyles.countrylabels.rankToZoom[_ranknum];
									lastmap.countriestorank[_obj.features[f].properties['adm0_a3']] = {};
								}
							}
							if(_obj.dataObject=="countrylabels"){
								for(f in _obj.features){
									_obj.features[f].properties['countrylabel'] = true;
									if(!lastmap.countrylabels[_obj.features[f].properties['sr_adm0_a3']]){
										var _minzoom = 5; //if no rank is available
										var _name = '';
										var _ctnm = _obj.features[f].properties['sr_adm0_a3'];

										lastmap.countrylabels[_obj.features[f].properties['sr_adm0_a3']] = {
											'adm0_a3':_obj.features[f].properties['sr_adm0_a3'],
											'name':_obj.features[f].properties['sr_subunit'],
											'minZoom':_obj.features[f].properties['labelrank'],
											'locs':[]
											};//.geometry.coordinates[1];
									}
									var _tempobj = {'lat':_obj.features[f].geometry.coordinates[1],'lon':_obj.features[f].geometry.coordinates[0]};
									lastmap.countrylabels[_obj.features[f].properties['sr_adm0_a3']].locs.push(_tempobj);
								}
								//console.log("lastmap.countrylabels",lastmap.countrylabels);
								lastmap.addCountryLabels();
								//console.log(lastmap.mapOptions);
							}


							/*
							Check to see if the fields provided to lastmap correspond to those in the objects of
							the TopoJson file. In other words, the field that identifies the type of feature
							should correspond to "lastmap.mapOptions.fieldInDataForType" and the word used to
							identify that a feature is of the type "Country" is
							utilized in the field for lastmap.mapOptions.identifierForTypeCountry
							*/
							//var _currtype = _obj.features[0].properties[lastmap.mapOptions.fieldInDataForType];
							//var _isCountryObj = (_currtype==lastmap.mapOptions.identifierForTypeCountry);
							//if(_isCountryObj && lastmap.mapOptions.displayCountryLabels){
								//lastmap.addCountryLabels(_obj); //pass the current set of features/obj to the addCountryLabels function
							//}
							lastmap.colorizeFeatures({data:_obj,styles:mapObjectsArray[i].style,minZoom:mapObjectsArray[i].minZoom,maxZoom:mapObjectsArray[i].maxZoom}); //data,styles
							//console.log("pushing features");
							lastmap.allFeaturesArr.push(_obj.features);

						}
					}
					//console.log(i);
				}
			});
			if(this.mapOptions.displayMapKey) this.buildMapKey();


			this.createDataLayers();
		},

		createDataLayers: function(){

			/*
			Setup projection for D3 components (nees to match Leaflet map)
			*/
			var projection = d3.geo.mercator()
			var path = d3.geo.path().projection(projection);

			/* Initialize the SVG layer within Leaflet/Mapbox (check it out, it's there!) */
			lastmap.leafletMap._initPathRoot();

			/* We simply pick up the SVG from the map object */
			var svg = d3.select("#"+lastmap.mapOptions.mapDivId).select("svg"),
				mapdatalayer = svg.append("g").attr("id","mapdatalayer"); //data g
				//bg = svg.append("g"); //layer for popup bubble to rest on top
			lastmap.mapdatalayer = mapdatalayer;

			// Use placeholder data from SampleData plugin
		},

		addLayerToMap: function(data, style){
			pad = 0;
			tileIndex1 = geojsonvt(data, this.tileOptions);
			//console.log(data);
			tileLayer = L.canvasTiles()
				.params({ debug: false, padding: 5, tileIndex:tileIndex1 })
				.drawing(this.drawingOnCanvas)
			tileLayer.redraw();
			tileLayer.addTo(this.leafletMap);

		},

		colorizeFeatures: function(args) {
			for (var i = 0; i < args.data.features.length; i++) {
				args.data.features[i].properties.styles = args.styles; //append the styles we set in mapStyles to the features
				if(args.data.features[i].properties.styles.rankToZoom) {
					var _rank = args.data.features[i].properties[args.data.features[i].properties.styles.rankField];
					var _minzoom = args.data.features[i].properties.styles.rankToZoom[_rank];
					args.data.features[i].properties.minZoom = _minzoom;
					args.data.features[i].properties.maxZoom = args.maxZoom;
				}else{
					args.data.features[i].properties.minZoom = args.minZoom;
					args.data.features[i].properties.maxZoom = args.maxZoom;
				}
				if(args.data.features[i].properties.city){
					var _fieldToCheck = args.data.features[i].properties.styles.cityTypeField;
					var _isCountryCapital = (args.data.features[i].properties[_fieldToCheck] == args.data.features[i].properties.styles.countryCapitalKeyword);
					var _isStateCapital = (args.data.features[i].properties[_fieldToCheck] == args.data.features[i].properties.styles.stateCapitalKeyword);
					if(_isCountryCapital){
						//console.log("_isCountryCapital");
						args.data.features[i].properties.icon = lastmap.icons.cities.cityCountryCapital;
					}else if(_isStateCapital){
						//console.log("_isStateCapital");
						args.data.features[i].properties.icon = lastmap.icons.cities.cityStateCapital;
					}else{
						//console.log("_isCity");
						args.data.features[i].properties.icon = lastmap.icons.cities.city;
					}
				}
			}
		},

		redrawCityLabels: function() {
			var _currZoom = lastmap.leafletMap.getZoom();
			for(c in lastmap.citylabels){
				if(lastmap.citylabels[c].minZoom<=_currZoom){
					lastmap.citylabels[c].options.icon.opacity = 1;
					lastmap.citylabels[c]._icon.style.visibility = "visible";
					lastmap.citylabels[c]._icon.attributes.style.visibility = "visible";
				}else{
					lastmap.citylabels[c].options.icon.opacity = 0;
					lastmap.citylabels[c]._icon.style.visibility = "hidden";
					lastmap.citylabels[c]._icon.attributes.style.visibility = "hidden";
				}
			}
		},

		redrawCountryLabels: function() {
			var _currZoom = lastmap.leafletMap.getZoom();
			for(c in lastmap.countrylabels){
				if(lastmap.countrylabels[c].minZoom<=_currZoom){
					for(i in lastmap.countrylabels[c].icons){
						lastmap.countrylabels[c].icons[i].options.icon.opacity = 1;
						lastmap.countrylabels[c].icons[i]._icon.style.visibility = "visible";
						lastmap.countrylabels[c].icons[i]._icon.attributes.style.visibility = "visible";
						lastmap.countrylabels[c].icons[i]._icon.style.fontSize = _currZoom*5;//lastmap.countrylabels[c].minZoom/(lastmap.countrylabels[c].minZoom+1))*32;
					}
				}else{
					for(i in lastmap.countrylabels[c].icons){
						lastmap.countrylabels[c].icons[i].options.icon.opacity = 0;
						lastmap.countrylabels[c].icons[i]._icon.style.visibility = "hidden";
						lastmap.countrylabels[c].icons[i]._icon.attributes.style.visibility = "hidden";
					}
				}
			}
		},

		drawingOnCanvas: function(canvasOverlay, params) {

			var bounds = params.bounds;
			params.tilePoint.z = params.zoom;
			var ctx = params.canvas.getContext('2d');
			ctx.globalCompositeOperation = 'source-over';

			var tile = params.options.tileIndex.getTile(params.tilePoint.z, params.tilePoint.x, params.tilePoint.y);
			if (!tile) {
				return;
			}
			ctx.clearRect(0, 0, params.canvas.width, params.canvas.height);
			var features = tile.features;

			ctx.strokeStyle = 'grey';
			var ratio = 1;

			// Here we are looping through the features in our this.featureCollection
			// to match our layers to the associated styles defined in the ""mapStyles" objbect
			for (var i = 0; i < features.length; i++) {
				var feature = features[i],
				type = feature.type;
				for(p in lastmap.mapOptions.primaryCountries){
					if(feature.tags[lastmap.mapOptions.fieldInDataForCountryName]==lastmap.mapOptions.primaryCountries[p]){
						feature.tags.styles = lastmap.mapOptions.mapStyles.countryPrimary;
					}

				}
				for(c in lastmap.mapOptions.secondaryCountries){
					if(feature.tags[lastmap.mapOptions.fieldInDataForCountryName]==lastmap.mapOptions.secondaryCountries[c]){
						feature.tags.styles = lastmap.mapOptions.mapStyles.countrySecondary;
					}
				}

				//params.tilePoint.z //feature.tags.styles. //TODO: tap into zoom levels to determine when to show/hide specific layers
				ctx.fillStyle = feature.tags.styles.fillStyle ? feature.tags.styles.fillStyle : 'rgba(25,25,25,0.5)';
				ctx.strokeStyle = feature.tags.styles.strokeStyle ? feature.tags.styles.strokeStyle : 'rgba(25,25,25,0.5)';
				ctx.lineWidth = feature.tags.styles.lineWidth ? feature.tags.styles.lineWidth : 1;

				ctx.beginPath();

				if(feature.tags.minZoom<=params.tilePoint.z && feature.tags.maxZoom>=params.tilePoint.z){
					for (var j = 0; j < feature.geometry.length; j++) {
						var geom = feature.geometry[j];
						if(feature.tags.city) {
							var _cityname = feature.tags[feature.tags.styles.nameField] + feature.tags.lon + feature.tags.lat;
							if(!lastmap.citylabels[_cityname]){
								var _cityMarker = L.divIcon({
									className:'city-marker-on city-label',
									html:'<svg x="0px" y="0px" width="15px" height="15px" viewBox="0 0 15 15" enable-background="new 0 0 15 15">'+feature.tags.icon+'</svg><div class="city-text">'+feature.tags[feature.tags.styles.nameField]+'</div>'
									});
								var _city = L.marker([feature.tags.lon,feature.tags.lat], {icon:_cityMarker}).addTo(lastmap.leafletMap);
									_city['name'] = feature.tags[feature.tags.styles.nameField];
									_city['id'] = _cityname;
									_city['minZoom'] = feature.tags.minZoom;
								lastmap.citylabels[_cityname] = _city; //list to check for duplicate cities among all vector tiles
								continue;
							}
							lastmap.redrawCityLabels();
						}
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
				}
			}

			function objOff(obj)
			{
				var currleft = currtop = 0;
				if( obj.offsetParent )
				{ do { currleft += obj.offsetLeft; currtop += obj.offsetTop; }
				  while( obj = obj.offsetParent ); }
				else { currleft += obj.offsetLeft; currtop += obj.offsetTop; }
				return [currleft,currtop];
			}

			function FontMetric(fontName,fontSize)
			{
				var text = document.createElement("span");
				text.style.fontFamily = fontName;
				text.style.fontSize = fontSize + "px";
				text.innerHTML = "ABCjgq|";
				// if you will use some weird fonts, like handwriting or symbols, then you need to edit this test string for chars that will have most extreme accend/descend values

				var block = document.createElement("div");
				block.style.display = "inline-block";
				block.style.width = "1px";
				block.style.height = "0px";

				var div = document.createElement("div");
				div.appendChild(text);
				div.appendChild(block);

				// this test div must be visible otherwise offsetLeft/offsetTop will return 0
				// but still let's try to avoid any potential glitches in various browsers
				// by making it's height 0px, and overflow hidden
				div.style.height = "0px";
				div.style.overflow = "hidden";

				// I tried without adding it to body - won't work. So we gotta do this one.
				document.body.appendChild(div);

				block.style.verticalAlign = "baseline";
				var bp = objOff(block);
				var tp = objOff(text);
				var taccent = bp[1] - tp[1];
				block.style.verticalAlign = "bottom";
				bp = objOff(block);
				tp = objOff(text);
				var theight = bp[1] - tp[1];
				var tdescent = theight - taccent;

				// now take it off :-)
				document.body.removeChild(div);

				// return text accent, descent and total height
				return [taccent,theight,tdescent];
			}
            console.log("LAST MAP LOADED");

		},

		buildMapKey: function(a,b){
			var _mapKey = d3.select("body").append("div").attr("id","mapKey");
			d3.select("#mapKey").append("h1").text("MAP KEY");
			d3.select("#mapKey").append("div").attr("id","mapKeyHeader");
			var key = d3.select("#mapKey").append("div").attr("id","mapKeyList");
			var keyArr = []; //create array to store info for key
			for(var style in mapStyles){
				var _tempObj = mapStyles[style]; //set _tempObj to current object in styles
				_tempObj.id = style; // use the style name (no spaces) as the id to be used later to hook into it for any custom styling purposes
				if(_tempObj.displayInKey) keyArr.push(_tempObj); //add each object from mapstyles object into an array to be used by D3 to populate legend/key
			}

			var keys = key.append("div").attr("class","mapKeyGroup").attr("id","mapKeyContent");
			var _keyBackground = _mapKey.append("div").attr("id","mapKeyContentBackground");

			function getCircle(){
				return ".";
			}
			// Build the legend key elements from the "keyArr" created earlier
			keys.selectAll(".mapKeyItem")
				.data(keyArr)
				.enter()
					.append("div")
					.attr("class","mapKeyItem")
					.html(function(d){
						var _html = "";
						if(d.displayAs=="solid"){
							_html = "<div class='mapKeyItemStyleSolid' style='background:"+d.fillStyle+"; border:1px solid #fff'></div><div class='mapKeyItemName'>"+d.keyname+"</div>";
						}
						if(d.displayAs=="line"){
							_html = "<div class='mapKeyItemStyleLine' style='padding-right:2px; background:"+d.strokeStyle+"; height:"+d.lineWidth+"; border-top:"+d.lineWidth+"px solid #fff;'></div><div class='mapKeyItemName'>"+d.keyname+"</div>";
						}
						if(d.displayAs=="city"){
							_html = "<div>";

							_html+= "<div class='mapKeyItemStylePoint' style=''>";
							_html+= "<svg x='0px' y='0px' width='15px' height='15px' viewBox='0 0 15 15' enable-background='new 0 0 15 15'>"+lastmap.icons.cities.cityCountryCapital+"</svg>";
							_html+= "</div><div class='mapKeyItemName mapKeyCityText'>Country Capital</div>";

							_html+= "<div class='mapKeyItemStylePoint' style=''>";
							_html+= '<svg x="0px" y="0px" width="15px" height="15px" viewBox="0 0 15 15" enable-background="new 0 0 15 15">'+lastmap.icons.cities.cityStateCapital+'</svg>';
							_html+= "</div><div class='mapKeyItemName mapKeyCityText'>State Capital</div>";

							_html+= "<div class='mapKeyItemStylePoint' style=''>";
							_html+= '<svg x="0px" y="0px" width="15px" height="15px" viewBox="0 0 15 15" enable-background="new 0 0 15 15">'+lastmap.icons.cities.city+'</svg>';
							_html+= "</div><div class='mapKeyItemName mapKeyCityText'>City</div>";

							_html+= "</div>";


						}
						//console.log($("mapKeyContentBackground"));
						return _html
					});

			//Set the map key background height automatically
			_keyBackgroundHeight = ($("#mapKeyContent").height()+$("#mapKey").height());
			_keyBackground[0][0].style.height = _keyBackgroundHeight + 10;
			//console.log("_keyBackgroundHeight",_keyBackgroundHeight,_mapKey);
			_mapKey[0][0].style.bottom = _keyBackgroundHeight + 120;

		},

		addCountryLabels: function() {
			for(c in lastmap.countrylabels) {
				lastmap.countrylabels[c].icons = [];
				var _currZoom = lastmap.leafletMap.getZoom();
				var _countryLabel = L.divIcon({
					className:'country-label-on country-label',
					iconAnchor:[75,0],
					iconSize:[150,150],
					html:"<div id='country_"+c+"'>"+lastmap.countrylabels[c][lastmap.mapOptions.mapStyles.countrylabels.nameField]+"</div>"
				});
				lastmap.countrylabels[c].locs.forEach(function(d,i) {
					var _country = L.marker([d.lat,d.lon], {icon:_countryLabel}).addTo(lastmap.leafletMap);
					lastmap.countrylabels[c].icons.push(_country);

				});
			}
			lastmap.redrawCountryLabels();

		}

 };

$(window).on("resize", function(){
	this.lastmap.resizeMap();
});

}();
