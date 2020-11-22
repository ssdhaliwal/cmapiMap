/**
     * This software is the property of the U.S. Government.
     * Developed by ESRI for the United States Coast Guard 
     * under contract number 40024142.     
     *
     * @version 1.1.x
     *
     * @module cmwapi-adapter/Overlay
     */
define([], function() {
    
    /**
     * @constructor
     * @param adapter {module:cmwapi-adapter/cmwapi-adapter}
     * @param overlayManager {module:cmwapi-adapter/EsriOverlayManager}
     * @alias module:cmwapi-adapter/Overlay
     */
    var Overlay = function(adapater, overlayManager) {
        var me = this;

        /**
         * Handler for an incoming map overlay create request.
         * @method handleCreate
         * @param sender {String} the widget making the create overlay request
         * @param data {Object|Object[]}
         * @param data.name {String} The non-unique readable name to be given to the created overlay.
         * @param data.overlayId {String} The unique id to be given to the created overlay.
         * @param [data.parentId] {String} the id of the overlay to be set as the parent of the created overlay.
         * @memberof module:cmwapi-adapter/Overlay#
         */
        me.handleCreate = function(sender, data) {
            if(data.length > 1) {
                for(var i = 0; i < data.length; i++) {
                    overlayManager.overlay.createOverlay(sender, data[i].overlayId, data[i].name, data[i].parentId);
                }
            } else {
                overlayManager.overlay.createOverlay(sender, data.overlayId, data.name, data.parentId);
            }
            //overlayManager.archiveState();
        };
        /*
        CommonMapApi.overlay.create.addHandler(me.handleCreate);
        */

        /**
         * Handler for an indcoming request to remove a layer.
         * @method handleRemove
         * @param sender {String} the widget making the remove overlay request
         * @param data {Object|Object[]}
         * @param data.overlayId {String} the id of the overlay to be removed; if not provided
         *      the id of the sender will be assumed.
         * @memberof module:cmwapi-adapter/Overlay#
         */
        me.handleRemove = function(sender, data) {
            if(data.length > 1) {
                for(var i = 0; i < data.length; i++) {
                    overlayManager.overlay.removeOverlay(sender, data[i].overlayId);
                }
            } else {
                overlayManager.overlay.removeOverlay(sender, data.overlayId);
            }
            //overlayManager.archiveState();

        };
        /*
        CommonMapApi.overlay.remove.addHandler(me.handleRemove);
        */

        me.handleRemoveAll = function(sender){
        	overlayManager.overlay.removeAllOverlays();
        }
        /*
        CommonMapApi.overlay.remove.all.addHandler(me.handleRemoveAll);
        */

        /**
         * Handler for an indcoming request to hide a layer.
         * @method handleHide
         * @param sender {String} the widget making the hide overlay request
         * @param data {Object|Object[]}
         * @param data.overlayId {String} the id of the overlay to be removed; if not provided
         *      the id of the sender will be assumed.
         * @memberof module:cmwapi-adapter/Overlay#
         */
        me.handleHide = function(sender, data) {
            if(data.length > 1) {
                for(var i = 0; i < data.length; i++) {
                    overlayManager.overlay.hideOverlay(sender, data[i].overlayId);
                }
            } else {
                overlayManager.overlay.hideOverlay(sender, data.overlayId);
            }
            //overlayManager.archiveState();
        };
        /*
        CommonMapApi.overlay.hide.addHandler(me.handleHide);
        */

        /**
         * Handler for an incoming overlay show request
         * @method handleShow
         * @param sender {String} The widget making the show overlay request
         * @param data {Object|Object[]}
         * @param data.overlayId {String} the id of the overlay to be shown; if not
         *      specified, the id of the sender will be assumed.
         * @memberof module:cmwapi-adapter/Overlay#
         */
        me.handleShow = function(sender, data) {
            if(data.length > 1) {
                for(var i = 0; i < data.length; i++) {
                    overlayManager.overlay.showOverlay(sender, data[i].overlayId);
                }
            } else {
                overlayManager.overlay.showOverlay(sender, data.overlayId);
            }
            //overlayManager.archiveState();
        };
        /*
        CommonMapApi.overlay.show.addHandler(me.handleShow);
        */

        /**
         * Handler for an incoming overlay update request
         * @method handleUpdate
         * @param sender {String} The widget making the update overlay request
         * @param data {Object|Object[]}
         * @param [data.name] {String} the name to be set for the overlay specified. If
         *      not specified, the name will not be changed
         * @param data.overlayId {String} the Id of the overlay to be updated. If not
         *      specified, the id of the sender will be assumed.
         * @param [data.parentId] {String} The id of the overlay to be set as the parent
         *      of the overlay specified. If not specified, the parent will not be updated.
         * @memberof module:cmwapi-adapter/Overlay#
         */
        me.handleUpdate = function(sender, data) {
            if(data.length > 1) {
                for(var i = 0; i < data.length; i++) {
                    overlayManager.overlay.updateOverlay(sender, data[i].overlayId, data[i].name, data[i].parentId);
                }
            } else {
                overlayManager.overlay.updateOverlay(sender, data.overlayId, data.name, data.parentId);
            }
            //overlayManager.archiveState();
        };
        /*
        CommonMapApi.overlay.update.addHandler(me.handleUpdate);
        */
        
        me.handleQuery = function(sender, data) {
            //overlayManager.overlay.query(sender, data);            
            
            var response = {};
            response.overlays = [];
            for(var overlay in overlayManager.overlays){            	            	
            	var newOverlay = {};
            	newOverlay.overlayId = overlayManager.overlays[overlay].id;
            	newOverlay.children = overlayManager.overlays[overlay].children;
            	newOverlay.name = overlayManager.overlays[overlay].name;
            	newOverlay.isHidden = overlayManager.overlays[overlay].isHidden;
            	if(data.includeFeatures){
            		var newFeatures = [];            		
            		var features = overlayManager.overlays[overlay].features;
            		for(feature in features){
            		  var newFeature = {};
            		  newFeature.url = features[feature].feature;
            		  newFeature.featureId = features[feature].featureId;
            		  newFeature.format= features[feature].format;
            		  newFeature.name = features[feature].name;
            		  newFeature.isHidden = features[feature].isHidden;
            		  newFeature.overlayId = features[feature].overlayId;
            		  newFeature.params = features[feature].params;
            		  newFeature.zoom = features[feature].zoom;
            		  newFeatures.push(newFeature);
            		}
            		newOverlay.features = newFeatures;            		            		
            	}
            	response.overlays.push(newOverlay);
            };
            
            /*
            CommonMapApi.overlay.query.send(response);           
            */
        };
        /*
        CommonMapApi.overlay.query.addHandler(me.handleQuery);
        */
    };

    return Overlay;
});