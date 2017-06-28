lastmap.UI = function(){

    this.isOpen = false;


    this.createMenu = function(obj){


        this.menu = document.getElementById("lastmap-ui-menu");
        var _html = '<ul class="accordion"><li><a class="toggle" href="javascript:void(0);">LEGEND</a><ul class="inner">';

        for(c in obj){

            if(obj[c].layerName){ //if there are no sub-categories
                var _name = c;
                var _layerName = obj[c].layerName;
                _html+='<li id="'+_layerName+'"><a href="javascript:lastmap.toggleDataLayerByName(\''+_layerName+'\');">'+_name+'</a></li>';
            }else{

                _html+='<li><a class="toggle" href="javascript:void(0);">'+c+'</a><ul class="inner">';
                for(v in obj[c]){
                    var _name = v;
                    var _layerName = obj[c][v].layerName;
                    _html+='<li id="'+_layerName+'"><a  href="javascript:lastmap.toggleDataLayerByName(\''+_layerName+'\');">'+_name+'</a></li>'
                }
                _html+='</ul></li>';
            }
        }

        _html+= '</ul></li></ul>';

        //var _html = '<ul class="accordion">';//<li><a class="toggle" href="javascript:void(0);">+</a><ul class="inner">';
        //$(this.menu).append(_html);

        this.menu.innerHTML = _html;

        this.addBehaviorsToMenu();
       // console.log(this.menu.style);



    };


    this.addBehaviorsToMenu = function(){
        $('.toggle').click(function(e) {
            e.preventDefault();

            var $this = $(this);

           // if ($this.next().hasClass('show')) {
             //   $this.next().removeClass('show');
               // $this.next().slideUp(350);
           // } else {
               // $this.parent().parent().find('li .inner').removeClass('show');
               // $this.parent().parent().find('li .inner').slideUp(350);
                $this.next().toggleClass('show');
                $this.next().slideToggle(350);
           // }
        });
    }



    this.toggleLegend = function(){
		if(this.isOpen){
			this.closeLegend();
		}else{
            this.openLegend();
        }
	};

    this.openLegend = function(){
        console.log("openLegend");
    }
    this.closeLegend = function(){
        console.log("closeLegend");
    }

    this.buildLegend = function(){
        lastmap.legendCategoriesObject = this.setLegendCategoriesObject();
       // console.log(lastmap.legendCategoriesObject);
        this.createMenu(lastmap.legendCategoriesObject);
    }

    this.setLegendCategoriesObject = function(){
		var args = lastmap.dataLayers;
        var _legendCategories = {};
        for(c in args){ //loop through the data
            //console.log(c);
            if(args[c].legend.legendCategory){ //if a layer has a category
                if(!_legendCategories[args[c].legend.legendCategory]){ //category does not exist
                    _legendCategories[args[c].legend.legendCategory] = {}; //create category
                }
                _legendCategories[args[c].legend.legendCategory][args[c].legend.legendTitle] = {}; //add legend item under category
                _legendCategories[args[c].legend.legendCategory][args[c].legend.legendTitle]["layerName"] = c;
            }else{
               _legendCategories[args[c].legend.legendTitle] = {}; //if no category, just add it at first level
                _legendCategories[args[c].legend.legendTitle]["layerName"] = c;
            }
        }
        return _legendCategories;
    }

}
