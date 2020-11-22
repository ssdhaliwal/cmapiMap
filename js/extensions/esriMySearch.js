/**
 * This class extends the default esri search box to override default search formats and provides a suite of 
 *  explicit coordinate formatters.
 * These formatters include the following patterns:
 *  Decimal Degree - (+|N/-|S)DD.D, (+|E/-|W)DDD.D
 *  Degree Minute Minutes - (+|N/-|S)DD MM.M, (+|E/-|W)DDD MM.M
 *  Degree Minute Seconds - (+|N/-|S)DD MM SS.S, (+|E/-|W)DDD MM SS.S
 *  MGRS / USNG
 */
define([
  "esri/dijit/Search",
  "dojo/_base/declare",
], function (Search, declare) {
  var EsriMySearch = function () {
    /** Set a 'self' referring to 'this' in the correct scope */ 
    var self = this;

    /** Implement an initiation function for search */ 
    self.initSearch = function () {

      var MySearch = declare(Search, {

        search: function () {
          
          var searchSelf = this;
          /** Use the .trim() function to clear out the white space before and after the input */
          searchSelf.set('value', searchSelf.get('value').trim());

          /** Regular Expression templates for search sources */
          /** Template for common Decimal Degrees inputs */
          var DEGREE_TEMPLATE = /(\+|-)?\s*(\d{1,2})(\.\d*)?\s*\°?\s*(N|S)?\s*[,|\s+]\s*(\+|-)?\s*(\d{1,3})(\.\d*)?\s*\°?\s*(E|W)?/i;
          /** Template for common Degree Minute Minutes inputs */
          var DEGREE_MM_TEMPLATE = /(\+|-)?\s*(\d{1,2})\s*\°?\s+(\d{1,2})(\.\d*)?\s*\'?\s*(N|S)?\s*[,|\s+]\s*(\+|-)?\s*(\d{1,3})\s*\°?\s+(\d{1,2})(\.\d*)?\s*\'?\s*(E|W)?/i;
          /** Template for common Degree Minute Seconds inputs */ 
          var DEGREE_MS_TEMPLATE = /(\+|-)?\s*(\d{1,2})\s*\°?\s+(\d{1,2})\s*\'?\s+(\d{1,2})(\.\d*)?\s*\"?\s*(N|S)?\s*[,|\s+]\s*(\+|-)?\s*(\d{1,3})\s*\°?\s+(\d{1,2})\s*\'?\s+(\d{1,2})(\.\d*)?\s*\"?\s*(E|W)?/i;
          /** Template for common Military Grid Reference System, or United States National Grid inputs */
          var MGRS_TEMPLATE = /\w{1,3}\w{1,3}\d{0,2}\d{0,2}\d{0,3}\d{0,3}/;

          /** Save the array of the input value against the templates */ 
          var checkDD = searchSelf.get('value').match(DEGREE_TEMPLATE);
          var checkDM = searchSelf.get('value').match(DEGREE_MM_TEMPLATE);
          var checkDMS = searchSelf.get('value').match(DEGREE_MS_TEMPLATE);
          var checkMGRS = searchSelf.get('value').match(MGRS_TEMPLATE);

          /** 
           * Regular Expressions to tokenize the entries within search entries for Decimal Degrees, Degree Minutes,
           *  and Degree Minutes Seconds 
           */ 
          var EVERY_ENTRY_DD = /(\+?\-?\d{0,3}\.?\d*\s*\°?\s*)(N|S)?\s*\,?\s*(\+?\-?\d{0,3}\.?\d*\s*\°?\s*)(E|W)?/i;
          var EVERY_ENTRY_DM = /(\+?\-?\d{0,3}\s*\°?\s*)(\d{0,3}\.?\d*\s*\'?\s*)(N|S)?\s*\,?\s*(\+?\-?\d{0,3}\s*\°?\s*)(\d{0,3}\.?\d*\s*\'?\s*)(E|W)?/i;
          var EVERY_ENTRY_MS = /(\+?\-?\d{0,3}\s*\°?\s*)(\d{0,3}\s*\'?\s*)(\d{0,3}\.?\d*\s*\"?\s*)(N|S)?\s*\,?\s*(\+?\-?\d{0,3}\s*\°?\s*)(d{0,3}\.?\d*\s*\'?\s*)(\d{0,3}\.?\d*\s*\"?\s*)(E|W)?/i;

          /** Save the array containing the RegEx Matches */ 
          var everyEntryDD = searchSelf.get('value').match(EVERY_ENTRY_DD);
          var everyEntryDM = searchSelf.get('value').match(EVERY_ENTRY_DM);
          var everyEntryDS = searchSelf.get('value').match(EVERY_ENTRY_MS);

          /**  
           * Run the value against my template checker.
           *  If the value matches none of my templates then it is an address
           *  Then I will not alter the input value and let it pass through as normal
           */
          if (searchSelf.activeSourceIndex == 0) {
            var retVal = searchSelf.inherited(arguments);
            return retVal;
            /**  
             * If the value matches the decimal degree template
             *  Then I will alter the input value and let it pass through
             */ 
          } else if (searchSelf.activeSourceIndex == 1) {
            if (checkDD != null && searchSelf.get('value') == checkDD[0]) {
              /** Reset the color of the search box to white when a successful search has begun */ 
              self.changeInputBoxColorOnSuccess();

              var latVal = everyEntryDD[1];
              latVal = parseFloat(latVal);
              /** If the lat value is set for South, make sure the value is negative */ 
              if (everyEntryDD[2] != undefined && everyEntryDD[2].toUpperCase() == 'S') {
                latVal = latVal * -1;
              };

              var lonVal = everyEntryDD[3];
              lonVal = parseFloat(lonVal);
              /** If the long value is set for West, make sure the value is negative */ 
              if (everyEntryDD[4] != undefined && everyEntryDD[4].toUpperCase() == 'W') {
                lonVal = lonVal * -1;
              };

              /** Set the input value correctly for esri to use for the coordinates */ 
              searchSelf.set('value', 'Y:' + latVal.toString() + ', ' + 'X:' + lonVal.toString());
              var retVal = this.inherited(arguments);

              /**
               * Add the degree symbol '°' and comma ',' to the input entries
               *  If there is no decimal, exclude that 
               */ 
              if (checkDD[1] == undefined) { checkDD[1] = ''};
              if (checkDD[3] == undefined) { checkDD[3] = ''};
              if (checkDD[4] == undefined) { checkDD[4] = ''};
              if (checkDD[5] == undefined) { checkDD[5] = ''};
              if (checkDD[7] == undefined) { checkDD[7] = ''};
              if (checkDD[8] == undefined) { checkDD[8] = ''};
              var newVal = checkDD[1] + checkDD[2] + checkDD[3] + '°' + checkDD[4] + ', ' 
              + checkDD[5] + checkDD[6] + checkDD[7] + '°' + checkDD[8];

              /** Set the search to the auto-completed version created above */ 
              searchSelf.set('value', newVal);

              return retVal;
            } else {
              /** Change the color of the search bar when the template is not followed */ 
              self.changeInputBoxColorOnError();
              /**  
               * Add an error message to let the user know that they are not following 
               *  the correct Decimal Degree template. 
               */
              self.displayDDError();
            }
            /**
             * If the value matches the degree minute template
             *  Then I will need to convert it to decimal degrees
             *  Continue the Search on the converted value
             */
          } else if (searchSelf.activeSourceIndex == 2) {
            if (checkDM != null && searchSelf.get('value') == checkDM[0]) {
              /** Reset the color of the search box to white when a successful search has begun */ 
              self.changeInputBoxColorOnSuccess();
              /** Take the input value's Minutes and convert them to seconds */ 

              var degVal = everyEntryDM[1];
              degVal = parseFloat(degVal);

              /** Convert the lat minutes to degrees */ 
              var latVal = everyEntryDM[2];
              latVal = parseFloat(latVal);
              latVal = latVal / 60;

              /** If the lat value is set for South, make sure the value is negative */ 
              if (everyEntryDM[3] != undefined && everyEntryDM[3].toUpperCase() == 'S') {
                degVal = degVal * -1;
                latVal = latVal * -1;
              } else if (degVal < 0) {
                latVal = latVal * - 1;
              };

              /** Add up the values for the final Latitude value */ 
              latVal = latVal + degVal;

              degVal = everyEntryDM[4];
              degVal = parseFloat(degVal);

              /** Convert the long minutes to degrees */ 
              var lonVal = everyEntryDM[5];
              lonVal = parseFloat(lonVal);
              lonVal = lonVal / 60;

              /** If the long value is set for West, make sure the value is negative */ 
              if (everyEntryDM[6] != undefined && everyEntryDM[6].toUpperCase() == 'W') {
                degVal = degVal * -1;
                lonVal = lonVal * -1;
              } else if (degVal < 0) {
                lonVal = lonVal * - 1;
              };

              /** Add up the values for the final Longitude value */ 
              lonVal = lonVal + degVal;

              /** Set the input value correctly for esri to use for the coordinates */ 
              searchSelf.set('value', 'Y:' + latVal.toString() + ', ' + 'X:' + lonVal.toString());
              var retVal = searchSelf.inherited(arguments);

              /**
               * Add the degree symbol '°' , comma ',', and minutes "'" to the input entries
               *  If there is no decimal, exclude that
               */ 
              if (checkDM[1] == undefined) { checkDM[1] = '' };
              if (checkDM[4] == undefined) { checkDM[4] = '' };
              if (checkDM[5] == undefined) { checkDM[5] = '' };
              if (checkDM[6] == undefined) { checkDM[6] = '' };
              if (checkDM[9] == undefined) { checkDM[9] = '' };
              if (checkDM[10] == undefined) { checkDM[10] = '' };
              var newVal = checkDM[1] + checkDM[2] + '° ' + checkDM[3] + checkDM[4] + "'" + checkDM[5] + ', ' 
              + checkDM[6] + checkDM[7] + '° ' + checkDM[8] + checkDM[9] + "'" + checkDM[10];

              /** Set the search to the auto-completed version created above */
              searchSelf.set('value', newVal);

              return retVal;
            } else {
              /** Change the color of the search bar when the template is not followed */ 
              self.changeInputBoxColorOnError();
              /** 
               * Add an error message to let the user know that they are not following the correct 
               *  Degree Minute template 
               */ 
              self.displayDMError();
            }
            /**
             * If the value matches the degree minute seconds template
             *  Then I will need to convert it to decimal degrees
             *  Continue the Search on the converted value
             */
          } else if (searchSelf.activeSourceIndex == 3) {
            if (checkDMS != null && searchSelf.get('value') == checkDMS[0]) {
              /** Reset the color of the search box to white when a successful search has begun */ 
              self.changeInputBoxColorOnSuccess();
              /** Take the input value's Minutes convert them to seconds */ 
              /** Convert those combined seconds to degrees */ 
              var degVal = everyEntryDS[1];
              degVal = parseFloat(degVal);

              /** Convert the minutes to degrees */
              var latVal = everyEntryDS[2];
              latVal = parseFloat(latVal);
              latVal = latVal / 60;

              /** Convert the seconds to degrees */
              var secVal = everyEntryDS[3];
              secVal = parseFloat(secVal);
              secVal = secVal / 3600;

              /** If the lat value is set for South, make sure the value is negative */ 
              if (everyEntryDS[4] != undefined && everyEntryDS[4].toUpperCase() == 'S') {
                degVal = degVal * -1;
                latVal = latVal * -1;
                secVal = secVal * -1;
              } else if (degVal < 0) {
                latVal = latVal * - 1;
                secVal = secVal * - 1;
              };

              /** Add all values together for the final Latitude value */ 
              latVal = latVal + degVal + secVal;

              degVal = everyEntryDS[5];
              degVal = parseFloat(degVal);

              /** Convert the minutes to degrees */ 
              var lonVal = everyEntryDS[6];
              lonVal = parseFloat(lonVal);
              lonVal = lonVal / 60;

              /** Convert the seconds to degrees */ 
              secVal = everyEntryDS[7];
              secVal = parseFloat(secVal);
              secVal = secVal / 3600;

              /** If the long value is set for West, make sure the value is negative */ 
              if (everyEntryDS[8] != undefined && everyEntryDS[8].toUpperCase() == 'W') {
                degVal = degVal * -1;
                lonVal = lonVal * -1;
                secVal = secVal * -1;
              } else if (degVal < 0) {
                lonVal = lonVal * - 1;
                secVal = secVal * - 1;
              };

              /** Add all values together for the final Longitude value */ 
              lonVal = lonVal + degVal + secVal;

              /** Set the input value correctly for esri to use for the coordinates */ 
              searchSelf.set('value', 'Y:' + latVal.toString() + ', ' + 'X:' + lonVal.toString());
              var retVal = searchSelf.inherited(arguments);

              /**
               * Add the degree symbol '°', comma ',', minutes "'", and seconds '"' to the input entries
               *  If there is no decimal, exclude that
               */
              if (checkDMS[1] == undefined) { checkDMS[1] = '' };
              if (checkDMS[5] == undefined) { checkDMS[5] = '' };
              if (checkDMS[6] == undefined) { checkDMS[6] = '' };
              if (checkDMS[7] == undefined) { checkDMS[7] = '' };
              if (checkDMS[11] == undefined) { checkDMS[11] = '' };
              if (checkDMS[12] == undefined) { checkDMS[12] = '' };
              var newVal = checkDMS[1] + checkDMS[2] + '° ' + checkDMS[3] + "' " + checkDMS[4] + checkDMS[5] + '"' 
              + checkDMS[6] + ', ' + checkDMS[7] + checkDMS[8] + '° ' + checkDMS[9] + "' " + checkDMS[10] 
              + checkDMS[11] + '"' + checkDMS[12];

              /** Set the search to the auto-completed version created above */ 
              searchSelf.set('value', newVal);

              return retVal;
            } else {
              /** Change the color of the search bar when the template is not followed */ 
              self.changeInputBoxColorOnError();
              /** 
               * Add an error message to let the user know that they are not following the correct 
               *  Degree Minute Second template 
               */ 
              self.displayDMSError();
            }
          } else if (searchSelf.activeSourceIndex == 4) {
            /**
             * If the source is set to MGRS
             *  Check to see if they are following the syntax for MGRS
             */
            if (checkMGRS != null && searchSelf.get('value') == checkMGRS[0]) {
              /** If they are, pass the value through the search */ 
              self.changeInputBoxColorOnSuccess();
              var retVal = searchSelf.inherited(arguments);
              return retVal;
            } else {
              /** Change the color of the search bar when the template is not followed */ 
              self.changeInputBoxColorOnError();
              /** Add an error message to let the user know that they are not following the correct MGRS template */ 
              self.displayMGRSError();
            }
          } else {
            var retVal = searchSelf.inherited(arguments);
            return retVal;
          }
        }
      });
      return MySearch;
    };

    /** ERROR BOX COLOR CHANGES */

    /** Implement a function that changes the color of the search box when a template is not followed */ 
    self.changeInputBoxColorOnError = function() {
      $(document).ready(function () {
        $(".searchInput").css("background-color", "lightpink");
      });
    };

    /** Implement a function to reset the color of the search box when the template is followed */ 
    self.changeInputBoxColorOnSuccess = function() {
      $(document).ready(function () {
        $(".searchInput").css("background-color", "white");
        if ($('.searchMenu.noResultsMenu').css('display') == 'block') {
          $('.searchMenu.noResultsMenu').fadeOut(400);
        };
      });
    };

    /** EDITING THE ERROR BOX HEADER AND TEXT */

    /** Implement a function that overwrites the no results error display for Source 0 */
    self.editError = function() {
      $(document).ready(function () {
        /** Remove the existing text within the no results text box */ 
        $('.noResultsHeader').remove();
        $('.noResultsText').remove();

        /** Enter new div's with my new header and text */ 
        $('.noResultsBody').append("<div class='noResultsHeader'>No Results</div>");
        $('.noResultsBody').append("<div class='noResultsText'>There were no results found with your input.</div>");
      });
    };

    /** Implement a function to edit my Decimal Degree error below the search box */ 
    self.editDDError = function() {
      $(document).ready(function () {
        /** Remove the existing text within the no results text box */ 
        $('.noResultsHeader').remove();
        $('.noResultsText').remove();

        /** Enter new div's with my new header and text */ 
        $('.noResultsBody').append("<div class='noResultsHeader'>Template Error (Clear to Dismiss)</div>");
        $('.noResultsBody').append("<div class='noResultsText'>EXAMPLE: 43.45N, 22.12W</div>");
      });
    };

    /** Implement a function to edit my Degree Minute error below the search box */ 
    self.editDMError = function() {
      $(document).ready(function () {
        /** Remove the existing text within the no results text box */ 
        $('.noResultsHeader').remove();
        $('.noResultsText').remove();

        /** Enter new div's with my new header and text */ 
        $('.noResultsBody').append("<div class='noResultsHeader'>Template Error (Clear to Dismiss)</div>");
        $('.noResultsBody').append("<div class='noResultsText'>EXAMPLE: 22 12.432'S, 156 12.3238'E</div>");
      });
    };

    /** Implement a function to edit my Degree Minute Seconds error below the search box */ 
    self.editDMSError = function() {
      $(document).ready(function () {
        /** Remove the existing text within the no results text box */ 
        $('.noResultsHeader').remove();
        $('.noResultsText').remove();

        /** Enter new div's with my new header and text */ 
        $('.noResultsBody').append("<div class='noResultsHeader'>Template Error (Clear to Dismiss)</div>");
        $('.noResultsBody').append("<div class='noResultsText'>EXAMPLE:13 12' 12.324N, 23 12' 55.324E</div>");
      });
    };

    /** Implement a function to edit my error for MGRS/USNG */ 
    self.editMGRSError = function() {
      $(document).ready(function () {
        /** Remove the existing text within the no results text box */ 
        $('.noResultsHeader').remove();
        $('.noResultsText').remove();

        /** Enter new div's with my new header and text */ 
        $('.noResultsBody').append("<div class='noResultsHeader'>Template Error (Clear to Dismiss)</div>");
        $('.noResultsBody').append("<div class='noResultsText'>NO SPACES. EXAMPLE: 18SUH6789043210</div>");
      });
    };

    /** DISPLAYING THE ERROR BOXES */

    /** Implement a function to display my Source 0 error below the search box */
    self.displayError = function() {
      $(document).ready(function () {
        /** Remove the existing body */ 
        $('.noResultsBody').remove();

        /** Establish the new body */ 
        $('.searchMenu.noResultsMenu').append("<div class='noResultsBody'></div>");
        self.editError();

        /** Show the error */ 
        $('.searchMenu.noResultsMenu').fadeIn(200);
        $('.searchMenu.noResultsMenu').delay(2000).fadeOut(200);
      });
    };

    /** Implement a function to display my Decimal Degree error below the search box */ 
    self.displayDDError = function() {
      $(document).ready(function () {
        /** Remove the existing body */ 
        $('.noResultsBody').remove();

        /** Establish the new body */ 
        $('.searchMenu.noResultsMenu').append("<div class='noResultsBody'></div>");
        self.editDDError();

        /** Show the error */ 
        $('.searchMenu.noResultsMenu').fadeIn(200);
      });
    };

    /** Implement a function to display my Degree Minute error below the search box */ 
    self.displayDMError = function() {
      $(document).ready(function () {
        /** Remove the existing body */ 
        $('.noResultsBody').remove();

        /** Establish the new body */ 
        $('.searchMenu.noResultsMenu').append("<div class='noResultsBody'></div>");
        self.editDMError();

        /** Show the error */ 
        $('.searchMenu.noResultsMenu').fadeIn(200);
      });
    };

    /** Implement a function to display my Degree Minute Seconds error below the search box */ 
    self.displayDMSError = function() {
      $(document).ready(function () {
        /** Remove the existing body */ 
        $('.noResultsBody').remove();

        /** Establish the new body */ 
        $('.searchMenu.noResultsMenu').append("<div class='noResultsBody'></div>");
        self.editDMSError();

        /** Show the error */ 
        $('.searchMenu.noResultsMenu').fadeIn(200);
      });
    };

    /** Implement a function to display my MGRS error below the search box */ 
    self.displayMGRSError = function() {
      $(document).ready(function () {
        /** Remove the existing body */ 
        $('.noResultsBody').remove();

        /** Establish the new body */ 
        $('.searchMenu.noResultsMenu').append("<div class='noResultsBody'></div>");
        self.editMGRSError();

        /** Show the error */ 
        $('.searchMenu.noResultsMenu').fadeIn(200);
      });
    };
  };
  return EsriMySearch;
});