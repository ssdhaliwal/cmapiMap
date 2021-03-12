define(["dojo/html", "dojo/dom", "dojo/on"],
    function (html, dom, on) {

        let extConfig = function (global) {
            let self = this;
            self.fontColor = global.data.fontColor || null;
            self.fontColorName = global.data.fontColorName || "YellowGreen;#9ACD32";

            self.init = function () {
                console.log("extConfig - init");
                html.set(dom.byId("configDiv"),
                    "<span id='configFontStyle'>Select font style: \
                    <select id='configFontSelect'> \
                        <option style='color: black;background-color:#F0F8FF;' value='AliceBlue;#F0F8FF'>AliceBlue</option> \
                        <option style='color: black;background-color:#FAEBD7;' value='AntiqueWhite;#FAEBD7'>AntiqueWhite</option> \
                        <option style='color: black;background-color:#00FFFF;' value='Aqua;#00FFFF'>Aqua</option> \
                        <option style='color: black;background-color:#7FFFD4;' value='Aquamarine;#7FFFD4'>Aquamarine</option> \
                        <option style='color: black;background-color:#F0FFFF;' value='Azure;#F0FFFF'>Azure</option> \
                        <option style='color: black;background-color:#F5F5DC;' value='Beige;#F5F5DC'>Beige</option> \
                        <option style='color: black;background-color:#FFE4C4;' value='Bisque;#FFE4C4'>Bisque</option> \
                        <option style='color: black;background-color:#000000;' value='Black;#000000'>Black</option> \
                        <option style='color: black;background-color:#FFEBCD;' value='BlanchedAlmond;#FFEBCD'>BlanchedAlmond</option> \
                        <option style='color: black;background-color:#0000FF;' value='Blue;#0000FF'>Blue</option> \
                        <option style='color: black;background-color:#8A2BE2;' value='BlueViolet;#8A2BE2'>BlueViolet</option> \
                        <option style='color: black;background-color:#A52A2A;' value='Brown;#A52A2A'>Brown</option> \
                        <option style='color: black;background-color:#DEB887;' value='BurlyWood;#DEB887'>BurlyWood</option> \
                        <option style='color: black;background-color:#5F9EA0;' value='CadetBlue;#5F9EA0'>CadetBlue</option> \
                        <option style='color: black;background-color:#7FFF00;' value='Chartreuse;#7FFF00'>Chartreuse</option> \
                        <option style='color: black;background-color:#D2691E;' value='Chocolate;#D2691E'>Chocolate</option> \
                        <option style='color: black;background-color:#FF7F50;' value='Coral;#FF7F50'>Coral</option> \
                        <option style='color: black;background-color:#6495ED;' value='CornflowerBlue;#6495ED'>CornflowerBlue</option> \
                        <option style='color: black;background-color:#FFF8DC;' value='Cornsilk;#FFF8DC'>Cornsilk</option> \
                        <option style='color: black;background-color:#DC143C;' value='Crimson;#DC143C'>Crimson</option> \
                        <option style='color: black;background-color:#00FFFF;' value='Cyan;#00FFFF'>Cyan</option> \
                        <option style='color: black;background-color:#00008B;' value='DarkBlue;#00008B'>DarkBlue</option> \
                        <option style='color: black;background-color:#008B8B;' value='DarkCyan;#008B8B'>DarkCyan</option> \
                        <option style='color: black;background-color:#B8860B;' value='DarkGoldenRod;#B8860B'>DarkGoldenRod</option> \
                        <option style='color: black;background-color:#A9A9A9;' value='DarkGray;#A9A9A9'>DarkGray</option> \
                        <option style='color: black;background-color:#A9A9A9;' value='DarkGrey;#A9A9A9'>DarkGrey</option> \
                        <option style='color: black;background-color:#006400;' value='DarkGreen;#006400'>DarkGreen</option> \
                        <option style='color: black;background-color:#BDB76B;' value='DarkKhaki;#BDB76B'>DarkKhaki</option> \
                        <option style='color: black;background-color:#8B008B;' value='DarkMagenta;#8B008B'>DarkMagenta</option> \
                        <option style='color: black;background-color:#556B2F;' value='DarkOliveGreen;#556B2F'>DarkOliveGreen</option> \
                        <option style='color: black;background-color:#FF8C00;' value='DarkOrange;#FF8C00'>DarkOrange</option> \
                        <option style='color: black;background-color:#9932CC;' value='DarkOrchid;#9932CC'>DarkOrchid</option> \
                        <option style='color: black;background-color:#8B0000;' value='DarkRed;#8B0000'>DarkRed</option> \
                        <option style='color: black;background-color:#E9967A;' value='DarkSalmon;#E9967A'>DarkSalmon</option> \
                        <option style='color: black;background-color:#8FBC8F;' value='DarkSeaGreen;#8FBC8F'>DarkSeaGreen</option> \
                        <option style='color: black;background-color:#483D8B;' value='DarkSlateBlue;#483D8B'>DarkSlateBlue</option> \
                        <option style='color: black;background-color:#2F4F4F;' value='DarkSlateGray;#2F4F4F'>DarkSlateGray</option> \
                        <option style='color: black;background-color:#2F4F4F;' value='DarkSlateGrey;#2F4F4F'>DarkSlateGrey</option> \
                        <option style='color: black;background-color:#00CED1;' value='DarkTurquoise;#00CED1'>DarkTurquoise</option> \
                        <option style='color: black;background-color:#9400D3;' value='DarkViolet;#9400D3'>DarkViolet</option> \
                        <option style='color: black;background-color:#FF1493;' value='DeepPink;#FF1493'>DeepPink</option> \
                        <option style='color: black;background-color:#00BFFF;' value='DeepSkyBlue;#00BFFF'>DeepSkyBlue</option> \
                        <option style='color: black;background-color:#696969;' value='DimGray;#696969'>DimGray</option> \
                        <option style='color: black;background-color:#696969;' value='DimGrey;#696969'>DimGrey</option> \
                        <option style='color: black;background-color:#1E90FF;' value='DodgerBlue;#1E90FF'>DodgerBlue</option> \
                        <option style='color: black;background-color:#B22222;' value='FireBrick;#B22222'>FireBrick</option> \
                        <option style='color: black;background-color:#FFFAF0;' value='FloralWhite;#FFFAF0'>FloralWhite</option> \
                        <option style='color: black;background-color:#228B22;' value='ForestGreen;#228B22'>ForestGreen</option> \
                        <option style='color: black;background-color:#FF00FF;' value='Fuchsia;#FF00FF'>Fuchsia</option> \
                        <option style='color: black;background-color:#DCDCDC;' value='Gainsboro;#DCDCDC'>Gainsboro</option> \
                        <option style='color: black;background-color:#F8F8FF;' value='GhostWhite;#F8F8FF'>GhostWhite</option> \
                        <option style='color: black;background-color:#FFD700;' value='Gold;#FFD700'>Gold</option> \
                        <option style='color: black;background-color:#DAA520;' value='GoldenRod;#DAA520'>GoldenRod</option> \
                        <option style='color: black;background-color:#808080;' value='Gray;#808080'>Gray</option> \
                        <option style='color: black;background-color:#808080;' value='Grey;#808080'>Grey</option> \
                        <option style='color: black;background-color:#008000;' value='Green;#008000'>Green</option> \
                        <option style='color: black;background-color:#ADFF2F;' value='GreenYellow;#ADFF2F'>GreenYellow</option> \
                        <option style='color: black;background-color:#F0FFF0;' value='HoneyDew;#F0FFF0'>HoneyDew</option> \
                        <option style='color: black;background-color:#FF69B4;' value='HotPink;#FF69B4'>HotPink</option> \
                        <option style='color: black;background-color:#CD5C5C;' value='IndianRed;#CD5C5C'>IndianRed</option> \
                        <option style='color: black;background-color:#4B0082;' value='Indigo;#4B0082'>Indigo</option> \
                        <option style='color: black;background-color:#FFFFF0;' value='Ivory;#FFFFF0'>Ivory</option> \
                        <option style='color: black;background-color:#F0E68C;' value='Khaki;#F0E68C'>Khaki</option> \
                        <option style='color: black;background-color:#E6E6FA;' value='Lavender;#E6E6FA'>Lavender</option> \
                        <option style='color: black;background-color:#FFF0F5;' value='LavenderBlush;#FFF0F5'>LavenderBlush</option> \
                        <option style='color: black;background-color:#7CFC00;' value='LawnGreen;#7CFC00'>LawnGreen</option> \
                        <option style='color: black;background-color:#FFFACD;' value='LemonChiffon;#FFFACD'>LemonChiffon</option> \
                        <option style='color: black;background-color:#ADD8E6;' value='LightBlue;#ADD8E6'>LightBlue</option> \
                        <option style='color: black;background-color:#F08080;' value='LightCoral;#F08080'>LightCoral</option> \
                        <option style='color: black;background-color:#E0FFFF;' value='LightCyan;#E0FFFF'>LightCyan</option> \
                        <option style='color: black;background-color:#FAFAD2;' value='LightGoldenRodYellow;#FAFAD2'>LightGoldenRodYellow</option> \
                        <option style='color: black;background-color:#D3D3D3;' value='LightGray;#D3D3D3'>LightGray</option> \
                        <option style='color: black;background-color:#D3D3D3;' value='LightGrey;#D3D3D3'>LightGrey</option> \
                        <option style='color: black;background-color:#90EE90;' value='LightGreen;#90EE90'>LightGreen</option> \
                        <option style='color: black;background-color:#FFB6C1;' value='LightPink;#FFB6C1'>LightPink</option> \
                        <option style='color: black;background-color:#FFA07A;' value='LightSalmon;#FFA07A'>LightSalmon</option> \
                        <option style='color: black;background-color:#20B2AA;' value='LightSeaGreen;#20B2AA'>LightSeaGreen</option> \
                        <option style='color: black;background-color:#87CEFA;' value='LightSkyBlue;#87CEFA'>LightSkyBlue</option> \
                        <option style='color: black;background-color:#778899;' value='LightSlateGray;#778899'>LightSlateGray</option> \
                        <option style='color: black;background-color:#778899;' value='LightSlateGrey;#778899'>LightSlateGrey</option> \
                        <option style='color: black;background-color:#B0C4DE;' value='LightSteelBlue;#B0C4DE'>LightSteelBlue</option> \
                        <option style='color: black;background-color:#FFFFE0;' value='LightYellow;#FFFFE0'>LightYellow</option> \
                        <option style='color: black;background-color:#00FF00;' value='Lime;#00FF00'>Lime</option> \
                        <option style='color: black;background-color:#32CD32;' value='LimeGreen;#32CD32'>LimeGreen</option> \
                        <option style='color: black;background-color:#FAF0E6;' value='Linen;#FAF0E6'>Linen</option> \
                        <option style='color: black;background-color:#FF00FF;' value='Magenta;#FF00FF'>Magenta</option> \
                        <option style='color: black;background-color:#800000;' value='Maroon;#800000'>Maroon</option> \
                        <option style='color: black;background-color:#66CDAA;' value='MediumAquaMarine;#66CDAA'>MediumAquaMarine</option> \
                        <option style='color: black;background-color:#0000CD;' value='MediumBlue;#0000CD'>MediumBlue</option> \
                        <option style='color: black;background-color:#BA55D3;' value='MediumOrchid;#BA55D3'>MediumOrchid</option> \
                        <option style='color: black;background-color:#9370DB;' value='MediumPurple;#9370DB'>MediumPurple</option> \
                        <option style='color: black;background-color:#3CB371;' value='MediumSeaGreen;#3CB371'>MediumSeaGreen</option> \
                        <option style='color: black;background-color:#7B68EE;' value='MediumSlateBlue;#7B68EE'>MediumSlateBlue</option> \
                        <option style='color: black;background-color:#00FA9A;' value='MediumSpringGreen;#00FA9A'>MediumSpringGreen</option> \
                        <option style='color: black;background-color:#48D1CC;' value='MediumTurquoise;#48D1CC'>MediumTurquoise</option> \
                        <option style='color: black;background-color:#C71585;' value='MediumVioletRed;#C71585'>MediumVioletRed</option> \
                        <option style='color: black;background-color:#191970;' value='MidnightBlue;#191970'>MidnightBlue</option> \
                        <option style='color: black;background-color:#F5FFFA;' value='MintCream;#F5FFFA'>MintCream</option> \
                        <option style='color: black;background-color:#FFE4E1;' value='MistyRose;#FFE4E1'>MistyRose</option> \
                        <option style='color: black;background-color:#FFE4B5;' value='Moccasin;#FFE4B5'>Moccasin</option> \
                        <option style='color: black;background-color:#FFDEAD;' value='NavajoWhite;#FFDEAD'>NavajoWhite</option> \
                        <option style='color: black;background-color:#000080;' value='Navy;#000080'>Navy</option> \
                        <option style='color: black;background-color:#FDF5E6;' value='OldLace;#FDF5E6'>OldLace</option> \
                        <option style='color: black;background-color:#808000;' value='Olive;#808000'>Olive</option> \
                        <option style='color: black;background-color:#6B8E23;' value='OliveDrab;#6B8E23'>OliveDrab</option> \
                        <option style='color: black;background-color:#FFA500;' value='Orange;#FFA500'>Orange</option> \
                        <option style='color: black;background-color:#FF4500;' value='OrangeRed;#FF4500'>OrangeRed</option> \
                        <option style='color: black;background-color:#DA70D6;' value='Orchid;#DA70D6'>Orchid</option> \
                        <option style='color: black;background-color:#EEE8AA;' value='PaleGoldenRod;#EEE8AA'>PaleGoldenRod</option> \
                        <option style='color: black;background-color:#98FB98;' value='PaleGreen;#98FB98'>PaleGreen</option> \
                        <option style='color: black;background-color:#AFEEEE;' value='PaleTurquoise;#AFEEEE'>PaleTurquoise</option> \
                        <option style='color: black;background-color:#DB7093;' value='PaleVioletRed;#DB7093'>PaleVioletRed</option> \
                        <option style='color: black;background-color:#FFEFD5;' value='PapayaWhip;#FFEFD5'>PapayaWhip</option> \
                        <option style='color: black;background-color:#FFDAB9;' value='PeachPuff;#FFDAB9'>PeachPuff</option> \
                        <option style='color: black;background-color:#CD853F;' value='Peru;#CD853F'>Peru</option> \
                        <option style='color: black;background-color:#FFC0CB;' value='Pink;#FFC0CB'>Pink</option> \
                        <option style='color: black;background-color:#DDA0DD;' value='Plum;#DDA0DD'>Plum</option> \
                        <option style='color: black;background-color:#B0E0E6;' value='PowderBlue;#B0E0E6'>PowderBlue</option> \
                        <option style='color: black;background-color:#800080;' value='Purple;#800080'>Purple</option> \
                        <option style='color: black;background-color:#663399;' value='RebeccaPurple;#663399'>RebeccaPurple</option> \
                        <option style='color: black;background-color:#FF0000;' value='Red;#FF0000'>Red</option> \
                        <option style='color: black;background-color:#BC8F8F;' value='RosyBrown;#BC8F8F'>RosyBrown</option> \
                        <option style='color: black;background-color:#4169E1;' value='RoyalBlue;#4169E1'>RoyalBlue</option> \
                        <option style='color: black;background-color:#8B4513;' value='SaddleBrown;#8B4513'>SaddleBrown</option> \
                        <option style='color: black;background-color:#FA8072;' value='Salmon;#FA8072'>Salmon</option> \
                        <option style='color: black;background-color:#F4A460;' value='SandyBrown;#F4A460'>SandyBrown</option> \
                        <option style='color: black;background-color:#2E8B57;' value='SeaGreen;#2E8B57'>SeaGreen</option> \
                        <option style='color: black;background-color:#FFF5EE;' value='SeaShell;#FFF5EE'>SeaShell</option> \
                        <option style='color: black;background-color:#A0522D;' value='Sienna;#A0522D'>Sienna</option> \
                        <option style='color: black;background-color:#C0C0C0;' value='Silver;#C0C0C0'>Silver</option> \
                        <option style='color: black;background-color:#87CEEB;' value='SkyBlue;#87CEEB'>SkyBlue</option> \
                        <option style='color: black;background-color:#6A5ACD;' value='SlateBlue;#6A5ACD'>SlateBlue</option> \
                        <option style='color: black;background-color:#708090;' value='SlateGray;#708090'>SlateGray</option> \
                        <option style='color: black;background-color:#708090;' value='SlateGrey;#708090'>SlateGrey</option> \
                        <option style='color: black;background-color:#FFFAFA;' value='Snow;#FFFAFA'>Snow</option> \
                        <option style='color: black;background-color:#00FF7F;' value='SpringGreen;#00FF7F'>SpringGreen</option> \
                        <option style='color: black;background-color:#4682B4;' value='SteelBlue;#4682B4'>SteelBlue</option> \
                        <option style='color: black;background-color:#D2B48C;' value='Tan;#D2B48C'>Tan</option> \
                        <option style='color: black;background-color:#008080;' value='Teal;#008080'>Teal</option> \
                        <option style='color: black;background-color:#D8BFD8;' value='Thistle;#D8BFD8'>Thistle</option> \
                        <option style='color: black;background-color:#FF6347;' value='Tomato;#FF6347'>Tomato</option> \
                        <option style='color: black;background-color:#40E0D0;' value='Turquoise;#40E0D0'>Turquoise</option> \
                        <option style='color: black;background-color:#EE82EE;' value='Violet;#EE82EE'>Violet</option> \
                        <option style='color: black;background-color:#F5DEB3;' value='Wheat;#F5DEB3'>Wheat</option> \
                        <option style='color: black;background-color:#FFFFFF;' value='White;#FFFFFF'>White</option> \
                        <option style='color: black;background-color:#F5F5F5;' value='WhiteSmoke;#F5F5F5'>WhiteSmoke</option> \
                        <option style='color: black;background-color:#FFFF00;' value='Yellow;#FFFF00'>Yellow</option> \
                        <option style='color: black;background-color:#9ACD32;' value='YellowGreen;#9ACD32'>YellowGreen</option> \
                    </select> \
                </span>", {
                    parseContent: true
                });

                self.registerEvents();
            };

            self.handleClick = function () {
                console.log("extConfig - handleClick");
                global.plugins.extToolbar.toggleOptions("#config");

                if ($("#config").hasClass("selected")) {
                    $("#infoPanel_wrapper").css("display", "block");
                }

                let container = dijit.byId("infoPanel_container");
                container.selectChild("configPane", true);
            };

            self.registerEvents = function () {
                console.log("extConfig - registerEvents");
                $("#config").on("click", function($event) {
                    console.log("extConfig - registerEvents/click");
                    self.handleClick()
                });

                $("#configFontSelect option[value='" + self.fontColorName + "']").attr("selected", "selected");
                $("#configFontSelect").on("change", function () {
                    let color = $('#configFontSelect').find(":selected").val();

                    self.fontColorName = color.split(";")[0];
                    self.fontColor = color.split(";")[1];
                });
            };

            self.init();
        };

        return extConfig;
    });