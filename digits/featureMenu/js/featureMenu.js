define(["dojo/_base/declare", "dojo/on", "dojo/topic", "dijit/Menu", "dijit/MenuItem", "dijit/PopupMenuItem", "dojo/_base/lang", "dojo/_base/array",
        "esri/layers/FeatureTemplate", "esri/geometry/ScreenPoint", "esri/graphic"], 
		function(declare, on, topic, Menu, MenuItem, PopupMenuItem, lang, array,
				FeatureTemplate, ScreenPoint, Graphic){
	var featureMenu=declare([Menu],{
		_currentPoint:new ScreenPoint(),
		initialize:function(){
			topic.subscribe("map/layer/FeatureLayer/Added", lang.hitch(this, this._handleFeatureLayerAdded));
			this.on("open", function(e){
				this._currentPoint.update(e.x, e.y);
			});
			return this;
		},
		_handleFeatureLayerAdded:function(layer){
			if(layer.templates.length){
				var featureMenu=new Menu();
				array.forEach(layer.templates, lang.hitch(this, function(ft){
					if(ft.drawingTool==FeatureTemplate.TOOL_POINT){
						var feature=new MenuItem({
							label:ft.name,
							onClick:lang.hitch(this, _addFeatureToMap, ft)
						})
						featureMenu.addChild(feature);
					}				
				}));
				var layerMenu=new PopupMenuItem({
					label:layer.name,
					popup:featureMenu
				});
				this.addChild(layerMenu);			
				function _addFeatureToMap(template){
					var ourGraphic=new Graphic(template.prototype.toJson());
					ourGraphic.setGeometry(this.map.toMap(this._currentPoint));
					layer.applyEdits([ourGraphic], null, null, function(item){
					}, function(e){
						console.log("Error adding feature to map", e.message);
					});
				}
				var removeMe=topic.subscribe("map/layer/remove", function(remLayer){
					if(remLayer===layer){
						layerMenu.destroy();
						removeMe.remove();
					}
				});
			}
		}
	});
	return featureMenu;
});