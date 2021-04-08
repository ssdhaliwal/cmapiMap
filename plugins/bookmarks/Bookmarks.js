define(["esri/dijit/Bookmarks"],
    function (esriBookmarks) {

        let extBookmark = function (globals) {
            let self = this;
            let map = globals.plugins.extMap.instance;
            self.instance = null;
            self.sources = [];

            self.init = function () {
                console.log("extBookmark - init");
                self.instance = new esriBookmarks({
                    map: map,
                    bookmarks: self.sources,
                    editable: true
                }, "bookmarkDiv");

                self.registerEvents();
            };

            self.handleClick = function () {
                console.log("extBookmark - handleClick");
                globals.plugins.extToolbar.toggleOptions("#bookmark");

                if ($("#bookmark").hasClass("selected")) {
                    $("#infoPanel_wrapper").css("display", "block");
                }

                let container = dijit.byId("infoPanel_container");
                container.selectChild("bookmarkPane", true);
            };

            self.hide = function() {
                console.log("extBookmark - hide");

                $("#bookmark").css("display", "none");
            };
            
            self.show = function() {
                console.log("extBookmark - show");

                $("#bookmark").css("display", "block");
            };

            self.registerEvents = function() {
                console.log("extBookmark - registerEvents");
                $("#bookmark").on("click", function($event) {
                    console.log("extBookmark - registerEvents/click");
                    self.handleClick();
                });
            };

            self.init();
        };

        return extBookmark;
    });