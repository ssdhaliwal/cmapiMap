define(["esri/dijit/Bookmarks"],
    function (esriBookmarks) {

        let extBookmark = function (global) {
            let self = this;
            let map = global.plugins.extMap.instance;
            self.instance = null;
            self.sources = [];

            self.init = function () {
                self.instance = new esriBookmarks({
                    map: map,
                    bookmarks: self.sources,
                    editable: true
                }, "bookmarkDiv");

                self.registerEvents();
            };

            self.handleClick = function () {
                global.plugins.extToolbar.toggleOptions("#bookmark");

                if ($("#bookmark").hasClass("selected")) {
                    $("#infoPanel_wrapper").css("display", "block");
                }

                let container = dijit.byId("infoPanel_container");
                container.selectChild("bookmarkPane", true);
            };

            self.registerEvents = function() {
                $("#bookmark").on("click", self.handleClick);
            };

            self.init();
        };

        return extBookmark;
    });