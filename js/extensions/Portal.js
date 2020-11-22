define(["esri/basemaps", "dijit/layout/ContentPane", "dijit/registry", "dojo/dom-construct", "esri/arcgis/Portal", "esri/IdentityManager", "esri/arcgis/OAuthInfo","dojo/on", 
        "dojo/_base/array",  "esri/arcgis/utils", "esri/request", "dojo/_base/lang", "dijit/Dialog", "dijit/form/Button", "dojo/Deferred"], 
		function(basemaps, ContentPane, registry, domConstruct, arcgisPortal, esriId, OAuthInfo, on,
				array, arcgisUtils, esriRequest, lang, Dialog, Button, Deferred){
	var portal = function(payload){
		var me=this;
        var portalObj;
        
        //OAuth sign in that will ensure the Map Widget is logged in
        me.handlePortalSignIn=function(sender, data){
        	var oAuthInfo = esriId.findOAuthInfo(data.portalInfo.portalUrl);
    		if(!oAuthInfo){
    			var oauthReturnUrl = window.location.protocol + "//" + window.location.host +"/esri/oauth-callback.html";
    			oAuthInfo = new OAuthInfo({
    				appId: data.portalInfo.appId,
    				expiration: 14 * 24 * 60,
    				portalUrl: data.portalInfo.portalUrl,
    				authNamespace: '/',
    				popup: true,
    				popupCallbackUrl: oauthReturnUrl,
    				popupWindowFeatures: "height=312,width=355,location"
    			});
    			esriId.registerOAuthInfos([oAuthInfo]);
    		}
    		esriId.getCredential(data.portalInfo.portalUrl).then(function(login){
    			new arcgisPortal.Portal(data.portalInfo.portalUrl).signIn().then(function(portalData){
    				portalObj=portalData;
    				arcgisUtils.arcgisUrl=portalData.portal.portalUrl+"content/items";
    			});
    		});      	
        }
        /*        
		cmwapi.portal.signIn.addHandler(me.handlePortalSignIn);
		*/
        
        //These connects try to handle when a user uses both the Built in Basemap Gallery and the Portal Basemap Tool
        //TODO: modify the methodology to account for users adding basemaps as possible overlays
        //FIXME: Setting the same basemap using the alternate method will remove all layers from the map because they are pointing at the same source
        var portalBM=[], galleryBM=null;
        function _mapRemoveLayers(arr){
			if (!payload.map.getScale()) {
				var mapLayers=payload.map.getLayersVisibleAtScale(payload.map.getScale());
				if(arr && arr.length>0){
					array.forEach(mapLayers, function(mLyr){
						array.forEach(arr, function(lyr){
							if(mLyr.url===lyr.url){
								payload.map.removeLayer(mLyr);
							}            		
						});
					}); 
				}
			}
        }
        
        on(payload.basemapGallery,"selection-change", function(curr){
        	_mapRemoveLayers(portalBM);
        	portalBM=[];
        	galleryBM=gallery.getSelected().layers;
        });
        on(payload.map, "basemap-change", function(data){
        	_mapRemoveLayers(galleryBM);
        	galleryBM=[];
        	portalBM=data.current.layers;
        });
        
        //Adds a basemap to the esri/basemaps object for use with the Map via map.setBasemap
        me.handleBasemapAdd=function(sender, data){
        	basemaps[data.id]=data.data;
        }
		/*        
		cmwapi.portal.basemaps.add.addHandler(me.handleBasemapAdd);
		*/
        
        //Handles an id(string) by setting the map's basemap which has been defined in the esri/basemaps object
        me.handleBasemapSet=function(sender, data){
        	if(!basemaps[data.id] && data.data){
        		me.handleBasemapAdd(null, {id:data.id, data:data.data});
        	}
        	payload.map.setBasemap(data.id);
        }
		/*        
		cmwapi.portal.basemaps.set.addHandler(me.handleBasemapSet);
		*/
        
        var _getType=function(result){
            var type="arcgis-dynamicmapservice";
            if(result.url.search("rest/services")!==-1){//ESRI REST service types
                if ((result.type && result.type.search("Feature Layer")!==-1) || result.url.search("FeatureServer")!==-1)
                    type="arcgis-feature";
                else if((result.serviceDataType && result.serviceDataType.search("Image")!==-1) || result.url.search("ImageServer")!==-1)
                    type="arcgis-image";
                else if(result.singleFusedMapCache)
                    type="arcgis-tiledmapservice";
            }
            else if(result.url.search("?request=GetCapabilities&service=WMS")!==-1){//WMS Service Types pulls from SOAP via AGS
                type="wms";
            }
            else if(result.url.search("kml")!==-1){
            	type="kml";
            }
            return type;
        }
        
        function _handleMapService(id, url, title){
        	esriRequest({url:url, content:{f:"json"}}, {useProxy:true}).then(function(data){
        		lang.mixin(data, {url:url});
        		var featureParams={overlayId:id, featureId:title, name:title, url:url, format:_getType(data)};/*,zoom:""*/
	            /*        
				cmwapi.feature.plot.url.send(featureParams);
				*/
        	});
        }
        
        function _handleWebMap(obj){
        	(function(){
        		var confirm=new Deferred();
        		var confirmation=new Dialog({
	            	title:"WARNING!",
	            	content:"This action will remove all current layers from the map. Continue?"
	            });
        		confirmation.addChild(new Button({label:"Confirm",onClick:function(){
			            /*        
						cmwapi.overlay.remove.all.send();
						*/
	        			confirm.resolve(confirmation);
	        		}
	        	}));
	        	confirmation.addChild(new Button({label:"Cancel", onClick:function(){
	        		confirm.cancel(confirmation);
	        	}}));
	        	confirmation.startup();
	        	confirmation.show();
	        	return confirm.promise;
        	})().then(function(succ){
        		//User Pressed Accept Button
        		succ.destroy();

	            /*        
				cmwapi.overlay.create.send({overlayId:obj.item.id, name:obj.item.title});
				cmwapi.portal.basemaps.set.send({id:obj.item.id, data:obj.itemData.baseMap});
				*/
        		array.forEach(obj.itemData.operationalLayers, function(layer){
        			_handleMapService(obj.item.id, layer.url, layer.title);
        		});
        	},function(err){
        		//User Pressed Cancel Button
        		err.destroy();
        	});     	
        }
        
        me.handlePortalItemAdd=function(sender, data){
        	//Add an overlay to the map, first determine the type of item being pushed
        	arcgisUtils.getItem(data.id).then(function(it){
        		if(data.type==="Map Service"|| data.type==="Feature Service"){
        			var item=it.item;
        			_handleMapService(item.id, item.url, item.title);
        		}
        		else if(data.type==="Web Map"){
        			_handleWebMap(it);
        		}
			});
        }
		/*        
		cmwapi.portal.item.add.addHandler(me.handlePortalItemAdd);
		*/
	};
	
	return portal;
});