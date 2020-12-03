define(["esri/dijit/Bookmarks"],
    function (esriBookmarks) {

        let extBookmark = function (global) {
            let self = this;
            let map = global.extensions.extMap.map;
            self.bookmarks = null;
            self.sources = [];

            self.init = function () {
                self.bookmarks = new esriBookmarks({
                    map: map,
                    bookmarks: self.sources,
                    editable: true
                }, "bookmarkDiv");
            };

            self.handleClick = function () {
                global.extensions.extToolbar.toggleOptions("#bookmark");

                if (!$("#bookmark").hasClass("selected")) {
                    $("#infoPanel_wrapper").css("display", "none");
                } else {
                    $("#infoPanel_wrapper").css("display", "block");
                }

                let container = dijit.byId("infoPanel_container");
                container.selectChild("bookmarkPane", true);
            };
        };

        return extBookmark;
    });