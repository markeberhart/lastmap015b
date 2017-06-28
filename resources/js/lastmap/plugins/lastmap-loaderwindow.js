// JavaScript Document

lastmap.LoaderWindow = function() {

	this.isOpen = false;
	var _loadingAnim = '<svg width=400 height=400 viewbox="0 0 75 75" xmlns="http://www.w3.org/2000/svg"><defs><style type=text/css><![CDATA[@keyframes spin {0%{transform: rotate(0deg);}100% {transform: rotate(360deg);}} .tOrgin {transform-origin: 0% 100%;}.sky {animation: spin infinite 1.5s;}.water {animation: spin infinite 1.75s;}.land {animation: spin infinite 2.0s;}.loadingWrapper {padding: 2rem;margin: 2rem;} .message { width:200px; height:50px;}.message-text {width=400 height=400 font-family:Arial, Helvetica, sans-serif;font-size:.3em;fill:rgba(255,255,255,1);}]]></style></g></defs><g><path class="land tOrgin" fill=rgba(255,255,255,0.75) d="M25,5c0,2.338,0,4.151,0,6.584l0,0c7.41,0,13.417,6.007,13.417,13.416c2.194,0,4.389,0,6.583,0 C45,13.954,36.045,5,25,5z"></path><path class="sky tOrgin" fill=rgba(255,255,255,0.75) d="M25,5c0,2.338,0,4.151,0,6.584l0,0c7.41,0,13.417,6.007,13.417,13.416c2.194,0,4.389,0,6.583,0 C45,13.954,36.045,5,25,5z"></path><path class="water tOrgin" fill=rgba(255,255,255,0.75) d="M25,5c0,2.338,0,4.151,0,6.584l0,0c7.41,0,13.417,6.007,13.417,13.416c2.194,0,4.389,0,6.583,0 C45,13.954,36.045,5,25,5z"></path></g><g class=message" ><text class=message-text transform="matrix(1 0 0 1 17 24)">loading</text><text class=message-text transform="matrix(1 0 0 1 18 29)">assets</text></g></svg>';

	this.launchLoader = function(){
		//console.log("LoaderWindow.launchLoader called");

		if(!this.isOpen){
			this.openLoader();
		}
	};

	this.openLoader = function() {
		//console.log("LoaderWindow.openLoader called");
		_modalBackground 	= document.createElement("div");
		_modalBackground.setAttribute("id","modal-background");
		document.body.appendChild(_modalBackground);
		_modalBackground.style.visibility = "hidden";
		_modalBackground.style.position = "absolute";
		_modalBackground.style.width = "100%";
		_modalBackground.style.height = "100%";
		_modalBackground.style.backgroundColor = "#000";
		_modalBackground.style.zIndex = 88888;
		_modalBackground.style.top = "0px";
		_modalBackground.style.left = "0px";
		if(_modalBackground.style.filter==""){ _modalBackground.style.filter = "alpha(opacity=60)"};
		if(_modalBackground.style.opacity==""){ _modalBackground.style.opacity = 0.60};
		if(_modalBackground.style.MozOpacity==""){ _modalBackground.style.MozOpacity = 0.60};

		_modalText = document.createElement("div");
		_modalText.setAttribute("id","modal-text");
		document.body.appendChild(_modalText);
		_modalText.style.fontFamily = "Arial";
		_modalText.style.fontWeight = "bold";
		_modalText.style.fontSize = "2em";
		_modalText.style.width = "300px";
		_modalText.style.height = "50px";
		_modalText.style.textAlign = "center";
		this.setLoaderText("Please stand by, loading base map");
		_modalText.style.visibility = "visible";
		_modalText.style.position = "absolute";
		_modalText.style.color = "#fff";
		_modalText.style.zIndex = 88999;
		_modalText.style.top = "0px";
		_modalText.style.left = "0px";

		_loaderContent 	= document.createElement("div");
		_loaderContent.setAttribute("id","loaderContent");
		_loaderContent.setAttribute("class","loadingWrapper");
		document.body.appendChild(_loaderContent);
		_loaderContent.style.visibility = "hidden";
		_loaderContent.style.position = "absolute";
		_loaderContent.style.width = "250px";
		_loaderContent.style.height = "250px";
		//_loaderContent.style.backgroundColor = "#000";
		_loaderContent.style.zIndex = 88899;
		if(_loaderContent.style.filter==""){ _loaderContent.style.filter = "alpha(opacity=80)"};
		if(_loaderContent.style.opacity==""){ _loaderContent.style.opacity = 0.80};
		if(_loaderContent.style.MozOpacity==""){ _loaderContent.style.MozOpacity = 0.80};

		var _svg = $("#loaderContent");
		//setTimeout(function(){ _svg.html(_loadingAnim);}, 500);

		$(window).on("resize", this.onResizeLoader);
		_modalText.style.visibility = "visible";
		_modalBackground.style.visibility = "visible";
		_loaderContent.style.visibility = "visible";
		this.isOpen = true;
		this.onResizeLoader();
	}

	this.setLoaderText = function(text) {
		_modalText.innerHTML = text;
	}

	this.closeLoader = function() {
		//console.log("LoaderWindow.closeLoader called");
		this.isOpen = false;
		_modalBackground.style.visibility = "hidden";
		_loaderContent.style.visibility = "hidden";
		_modalText.style.visibility = "hidden";
		this.onResizeLoader();
	}

	this.onResizeLoader = function() {
		//console.log("resize lodaer");
		var h = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;
		var w = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;

		var lh = $("#loaderContent").height();
		var lw = $("#loaderContent").width();
		var lmarginV = (h - lh) / 2;
		var lmarginH = (w - lw) / 2;
		_loaderContent.style.top = lmarginV-60;
		_loaderContent.style.left = lmarginH;

		var th = $("#modal-text").height();
		var tw = $("#modal-text").width();
		var tmarginV = (h - th) / 2;
		var tmarginH = (w - tw) / 2;
		_modalText.style.top = tmarginV-60;
		_modalText.style.left = tmarginH;

	}
};
