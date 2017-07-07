/**
 * @pixelino.js
 * Javascript client for pixelino.kotekino.com
 *
 *
 *  MIT License
 *
 *  Copyright (c) 2017 kotekino
 *
 *  Permission is hereby granted, free of charge, to any person obtaining a copy
 *  of this software and associated documentation files (the "Software"), to deal
 *  in the Software without restriction, including without limitation the rights
 *  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 *  copies of the Software, and to permit persons to whom the Software is
 *  furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 *  copies or substantial portions of the Software.
 *
 *  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 *  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 *  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 *  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 *  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 *  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 *  SOFTWARE.
 *
 */

// parse url
var urlParams;
(window.onpopstate = function () {
    var match,
        pl = /\+/g,  // Regex for replacing addition symbol with a space
        search = /([^&=]+)=?([^&]*)/g,
        decode = function (s) { return decodeURIComponent(s.replace(pl, " ")); },
        query = window.location.search.substring(1);

    urlParams = {};
    while ((match = search.exec(query)) !== null)
        urlParams[decode(match[1])] = decode(match[2]);
})();

// copy to clipboard
var CopyToClipboard = function (text, fallback) {
    var fb = function () {
        $t.remove();
        if (fallback !== undefined && fallback) {
            var fs = 'Please, copy the following text:';
            if (window.prompt(fs, text) !== null) return true;
        }
        return false;
    };
    var $t = $('<textarea />');
    $t.val(text).css({
        position: 'fixed',
        left: '-10000px'
    }).appendTo('body');
    $t.select();
    try {
        if (document.execCommand('copy')) {
            $t.remove();
            return true;
        }
        fb();
    }
    catch (e) {
        fb();
    }
};

// pixelino client
var pixelino = function () {

    // *********************************************************************
    // CLASS VARIABLES
    // *********************************************************************

    // mac
    var isMac = navigator.platform.toUpperCase().indexOf('MAC') !== -1;
    var isWindows = navigator.platform.toUpperCase().indexOf('WIN') !== -1;
    var isLinux = navigator.platform.toUpperCase().indexOf('LINUX') !== -1;

    // urls
    var API_URL_BASE = "http://pixelino.azurewebsites.net/api/";
    var PIXELINO_URL_BASE = "http://pixelino.kotekino.com/";
    // var API_URL_BASE = "http://localhost:58037/api/";
    var API_URL_ZONES = API_URL_BASE + "zones/";
    var API_URL_SET_PIXEL = "pixels";
    var API_EXPORT = "pixels/exports";

    // consts
    var canvasName = "canvas_container";

    // flags
    var zoom = 8;
    var centerX = 0;
    var centerY = 0;
    var grid = 0;
    var printTimeout = 20000;
    var zoneResolution = 100;

    // backup values
    var oldCenterX = 0;
    var oldCenterY = 0;

    // canvas
    var canvasElementSelection = null;
    var canvasElementGrid = null;
    var canvasElement = null;
    var mainOverlayElement = null;
    var zoneLoaded = new Array();
    var zones = new Array();

    // mouse
    var canvasWidth = 0;
    var canvasHeight = 0;
    var mouseAbsoluteX = 0;
    var mouseAbsoluteY = 0;
    var mouseCanvasX = 0;
    var mouseCanvasY = 0;
    var mouseZoneX = 0;
    var mouseZoneY = 0;
    var imageArray = new Array();

    // current color
    var defaultColor = {red: 0, green: 0, blue: 0, opacity: 1};
    if(localStorage.getItem("pixelino-lastColor") == null)
      localStorage.setItem("pixelino-lastColor", JSON.stringify(defaultColor));

    var currentColor = typeof(Storage) !== "undefined" ? jQuery.parseJSON(localStorage.getItem("pixelino-lastColor")) : defaultColor;

    // interaction mode (draw)
    var mode = "draw"; // [draw]

    // timer print
    var lastPrint = 0;
    var skipDelayExecution = 0;
    var movingTimeout = 0;
    var loading = false;

    // movement
    var moving = false;

    // loadArea Timeout
    var loadAreaTimeout = null;

    // *********************************************************************
    // LOAD METHODS
    // *********************************************************************

    // print preloaded images
    function printAll(loadMissingZone) {

        zones = getZones();
        if (zones.length > 0) {
            zones.forEach(function (item, index) {
                var zone = zones[index].zone;
                var x = getCanvasX(zones[index].x);
                var y = getCanvasY(zones[index].y - 1 + zoneResolution);
                var absX = zones[index].x;
                var absY = zones[index].y;

                if (typeof imageArray[zone] !== "undefined") {
                    printZone(x, y, imageArray[zones[index].zone]);
                }
                else {
                    if (loadMissingZone) loadZone(absX, absY, zone);
                }
            });
        }
    }

    // images preloading
    function loadAndPrintAll(callback, failcallback) {

        // main loading flag
        $("#info").html('<p>LOADING</p>');
        $("#main_overlay").show();
        loading = true;

        // get all zones (with current zoom settings)
        zones = getZones();

        if (zones.length > 0) {
            zones.forEach(function (item, index) {

                // get image
                var url = API_URL_ZONES + zones[index].zone + "/" + new Date().getTime();
                var image = new Image();
                var zone = zones[index].zone;

                image.src = url;

                // assign to array
                imageArray[zone] = image;
                zoneLoaded[zone] = true;

                var x = getCanvasX(zones[index].x);
                var y = getCanvasY(zones[index].y - 1 + zoneResolution);

                image.onload = function () {

                    // render zone
                    if (!moving) printZone(x, y, image);

                    // general callback
                    isAllLoaded(callback);
                };
            });
        }
        else
        {
            callback();
        }
    }

    // load single image
    function loadZone(x, y, zone) {
        $("#info").html('<p>LOADING</p>');
        loading = true;

        var url = API_URL_ZONES + zone + "/" + new Date().getTime();
        var image = new Image();

        image.src = url;

        // assign to array
        imageArray[zone] = image;
        zoneLoaded[zone] = true;

        var newX = getCanvasX(x);
        var newY = getCanvasY(y - 1 + zoneResolution);

        // print onload
        image.onload = function () {

            // render zone
            printZone(newX, newY, image);

            // reset loading
            $("#info").html('');
            loading = false;
        };
    }

    // check for all loaded
    function isAllLoaded(callback) {
        var result = true;
        zones.forEach(function (item, index) {
            if (zoneLoaded[zones[index].zone] !== true)
            {
                result = false;
                return false;
            }
        });

        if (result) {
            callback();
        }
    }

    // *********************************************************************
    // RENDER METHODS
    // *********************************************************************

    // load subcanvases and print
    var printCanvas = function (loadAll, loadMissingZone) {

        if (loadAll) {
            // load and print
            loadAndPrintAll(function (data) {
                $("#info").html('');
                $("#main_overlay").hide();
                loading = false;
            });
        } else {
            // print only
            printAll(loadMissingZone);
        }
    };

    // refresh canvas
    var refreshCanvas = function (loadAll, loadMissingZone) {

        // resize canvases element
        canvasElement.width = window.innerWidth;
        canvasElement.height = window.innerHeight;
        canvasElementGrid.width = window.innerWidth;
        canvasElementGrid.height = window.innerHeight;
        canvasElementSelection.width = window.innerWidth;
        canvasElementSelection.height = window.innerHeight;
        $("#main_overlay").css("width", window.innerWidth + "px");
        $("#main_overlay").css("height", window.innerHeight + "px");
        canvasWidth = canvasElement.width;
        canvasHeight = canvasElement.height;

        // render status
        printStatus();

        // render grid
        if (grid && zoom > 10) printGrid();

        // refresh canvas element
        printCanvas(loadAll, loadMissingZone);

    };

    // print grid
    var printGrid = function () {

        // get real center
        var canvasCenterX = Math.round(canvasWidth / 2);
        var canvasCenterY = Math.round(canvasHeight / 2);
        var absoluteCenterX = canvasCenterX - centerX * zoom;
        var absoluteCenterY = canvasCenterY + centerY * zoom;

        // print center coordinates
        printVLine(absoluteCenterX, canvasHeight, true);
        printHLine(absoluteCenterY, canvasWidth, true);

        // print grid
        // vertical positive lines
        for (var iCounter = absoluteCenterX; iCounter <= canvasWidth; iCounter = iCounter + zoom) {
            printVLine(iCounter, canvasHeight, false);
        }
        // vertical negative lines
        for (iCounter = absoluteCenterX; iCounter > 0; iCounter = iCounter - zoom) {
            printVLine(iCounter, canvasHeight, false);
        }
        // horizontal negative lines
        for (iCounter = absoluteCenterY; iCounter <= canvasHeight; iCounter = iCounter + zoom) {
            printHLine(iCounter, canvasWidth, false);
        }
        // horizontal positive lines
        for (iCounter = absoluteCenterY; iCounter > 0; iCounter = iCounter - zoom) {
            printHLine(iCounter, canvasWidth, false);
        }
    };

    // render pixel
    var printZone = function (x, y, image) {
        var ctx = canvasElement.getContext("2d");
        ctx.imageSmoothingEnabled = false;
        ctx.mozImageSmoothingEnabled = false;
        ctx.webkitImageSmoothingEnabled = false;
        ctx.msImageSmoothingEnabled = false;
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(image, x, y, zoneResolution * zoom, zoneResolution * zoom);
    };

    // render pixel
    var printPixel = function (x, y, red, green, blue, opacity) {
        var ctx = canvasElement.getContext("2d");
        ctx.fillStyle = "rgba(" + red + ", " + green + ", " + blue + ", " + opacity + ")";
        ctx.fillRect(x, y, zoom, zoom);
    };

    // render selection
    var printSelectedPixel = function (x, y) {

        var ctx = canvasElementSelection.getContext("2d");

        // rect
        if (mode === "draw") {
            ctx.clearRect(0, 0, canvasWidth, canvasHeight);
            ctx.fillStyle = "rgba(" + currentColor.red + ", " + currentColor.green + ", " + currentColor.blue + ", " + currentColor.opacity + ")";
            ctx.fillRect(x, y, zoom, zoom);
        }
        else {
            ctx.clearRect(0, 0, canvasWidth, canvasHeight);
            ctx.fillStyle = "rgba(0,0,0,0.05)";
            ctx.fillRect(x, y, zoom, zoom);
        }
    };

    // clear selected pixel
    var clearSelectedPixel = function () {
        var ctx = canvasElementSelection.getContext("2d");
        ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    };

    // render V line
    var printVLine = function (x, height, highlight) {
        var ctx = canvasElementGrid.getContext("2d");

        // center pixels
        if (highlight) {
            ctx.fillStyle = "rgba(0, 0, 0, 0.01)";
            ctx.fillRect(x - zoom / 2, 0, zoom, height);
        }

        // left line
        ctx.fillStyle = "rgba(0, 0, 0, 0.05)";
        ctx.fillRect(x - zoom / 2, 0, 1, height);

        // right line
        ctx.fillStyle = "rgba(0, 0, 0, 0.05)";
        ctx.fillRect(x + zoom / 2, 0, 1, height);

    };

    // render h line
    var printHLine = function (y, width, highlight) {
        var ctx = canvasElementGrid.getContext("2d");

        // center pixels
        if (highlight) {
            ctx.fillStyle = "rgba(0, 0, 0, 0.01)";
            ctx.fillRect(0, y - zoom / 2, width, zoom);
        }

        // top line
        ctx.fillStyle = "rgba(0, 0, 0, 0.05)";
        ctx.fillRect(0, y - zoom / 2, width, 1);

        // right line
        ctx.fillStyle = "rgba(0, 0, 0, 0.05)";
        ctx.fillRect(0, y + zoom / 2, width, 1);
    };

    // ********************************************************
    // GENERAL FUNCTIONS
    // ********************************************************

    // get zoom factor
    var getZoomPercentage = function () {
        return Math.round(zoom / 8 * 100) + "%";
    };

    // transform coordinates from canvas to absolute x
    var getAbsoluteX = function (x) {

        // get delta from center
        var canvasCenterX = canvasWidth / 2;
        var deltaX = centerX + (x - canvasCenterX) / zoom;

        return Math.round(deltaX);
    };

    // transform coordinates from canvas to absolute Y
    var getAbsoluteY = function (y) {

        // get delta from center
        var canvasCenterY = canvasHeight / 2;
        var deltaY = centerY - (y - canvasCenterY) / zoom;

        return Math.round(deltaY);
    };

    // transform coordinates from absolute to canvas relative x
    var getCanvasX = function (x) {
        // get delta x
        var canvasCenterX = canvasWidth / 2;
        var deltaX = canvasCenterX + (x - centerX) * zoom - zoom/2;
        return Math.round(deltaX);
    };

    // transform coordinates from absolute to canvas relative Y
    var getCanvasY = function (y) {
        // get delta y
        var canvasCenterY = canvasHeight / 2;
        var deltaY = canvasCenterY - (y - centerY) * zoom - zoom / 2;

        return Math.round(deltaY);
    };

    // get zone X
    var getZoneX = function (absoluteX) {
        var zoneX = Math.floor(absoluteX / zoneResolution) * zoneResolution;
        return zoneX;
    };

    // get zone Y
    var getZoneY = function (absoluteY) {
        var zoneY = Math.floor(absoluteY / zoneResolution) * zoneResolution;
        return zoneY;
    };

    // get zone
    var getZones = function () {
        var left = Math.floor(getAbsoluteX(0) / zoneResolution) * zoneResolution - zoneResolution;
        var right = Math.floor(getAbsoluteX(canvasWidth) / zoneResolution) * zoneResolution + zoneResolution;
        var top = Math.floor(getAbsoluteY(0) / zoneResolution) * zoneResolution + zoneResolution;
        var bottom = Math.floor(getAbsoluteY(canvasHeight) / zoneResolution) * zoneResolution - zoneResolution;

        var zones = [];
        for (var iCounterX = left; iCounterX <= right; iCounterX = iCounterX + zoneResolution) {
            for (var iCounterY = bottom; iCounterY <= top; iCounterY = iCounterY + zoneResolution) {
                var newX = iCounterX;
                var newY = iCounterY;
                var zoneLabel = newX + "_" + newY;
                var zone = { x: newX, y: newY, zone: zoneLabel };

                zones.push(zone);
            }
        }
        return zones;
    };

    // *********************************************************************
    // MOUSE AND INFO METHODS
    // *********************************************************************

    // position of mouse or finger in mobile
    var mousePosition = function (ev) {

        // transform mouse absolute to mouse canvas
        mouseCanvasX = ev.clientX;
        mouseCanvasY = ev.clientY;

        mouseAbsoluteX = getAbsoluteX(mouseCanvasX);
        mouseAbsoluteY = getAbsoluteY(mouseCanvasY);
        mouseZoneX = getZoneX(mouseAbsoluteX);
        mouseZoneY = getZoneY(mouseAbsoluteY);

        printSelectedPixel(getCanvasX(mouseAbsoluteX), getCanvasY(mouseAbsoluteY));
        printStatus(mouseAbsoluteX, mouseAbsoluteY);
    };

    // mouse click or tap
    var mouseClickOrTap = function (ev) {
        // transform mouse absolute to mouse canvas
        mouseCanvasX = ev.center.x;
        mouseCanvasY = ev.center.y;

        mouseAbsoluteX = getAbsoluteX(mouseCanvasX);
        mouseAbsoluteY = getAbsoluteY(mouseCanvasY);
        mouseZoneX = getZoneX(mouseAbsoluteX);
        mouseZoneY = getZoneY(mouseAbsoluteY);

        printSelectedPixel(getCanvasX(mouseAbsoluteX), getCanvasY(mouseAbsoluteY));
        printStatus(mouseAbsoluteX, mouseAbsoluteY);
    };

    // draw a pixel
    var setPixel = function (ev) {

        // overlay
        showOverlay("printing pixel");

        // update position
        mouseClickOrTap(ev);

        var mouseX = mouseAbsoluteX;
        var mouseY = mouseAbsoluteY;
        var zoneX = mouseZoneX;
        var zoneY = mouseZoneY;

        // submit pixel (mouseAbsoluteX, mouseAbsoluteY, mouseZoneX, mouseZoneY, currentColor)
        if (mode === "draw") {

            // if positive answer, then print pixel
            printPixel(getCanvasX(mouseX), getCanvasY(mouseY), currentColor.red, currentColor.green, currentColor.blue, currentColor.opacity);

            // ajax submit
            $.support.cors=true;
            $.ajax({
                url: API_URL_BASE + API_URL_SET_PIXEL + "?x=" + mouseX + "&y=" + mouseY + "&red=" + currentColor.red + "&green=" + currentColor.green + "&blue=" + currentColor.blue + "&opacity=" + currentColor.opacity + "&zoneX=" + zoneX + "&zoneY=" + zoneY,
                method: "POST",
                contentType: "application/json",
                success: function (responseData) {

                    if (responseData !== "reserved area")
                    {
                        // reload image
                        clearTimeout(loadAreaTimeout);
                        loadAreaTimeout = setTimeout(function(){
                          loadZone(zoneX, zoneY, zoneX + "_" +zoneY);
                          loadAreaTimeout=null;
                        }, 5000);

                        hideAlert();
                    } else {
                        showOverlay(responseData);
                        setTimeout(function () { hideAlert(); }, 1000);
                    }

                },
                error: function (errorData) {
                    console.log("error: " + errorData);
                    hideAlert();
                }
            });
        }
    };

    // print status
    var printStatus = function() {
        $("#status").html("<p id=\"coord\">" + mouseAbsoluteX + ", " + mouseAbsoluteY + "</p><p id=\"zoom\">" + getZoomPercentage(zoom) + "</p>");
    };

    // show overlay alert
    var showOverlay = function (text) {
        $("#main_overlay").html("<div id=\"main_overlay_alert\"><p class=\"overlay_alert_title\">" + text + "</p></div>");
        $("#main_overlay").show();
    };

    // show overlay alert
    var linkOverlay = function (text, inputText) {
        $("#main_overlay").html("<div id=\"main_overlay_alert\"><div class=\"main_overlay_close\">x</div><p class=\"overlay_share_title\">" + text + "</p><input class=\"overlay_share_inputbox\" type='text' value='" + inputText + "' /></div>");
        $("#main_overlay").show();

        $(".main_overlay_close").click(function () {
            hideAlert();
        });
    };

    // hide overlay alert
    var hideAlert = function () {
        $("#main_overlay").html('');
        $("#main_overlay").hide();
    };

    // update url
    var updateUrl = function () {
        if (history.pushState) {
            var newurl = window.location.protocol + "//" + window.location.host + window.location.pathname + '?x='+ Math.round(centerX) +'&y='+ Math.round(centerY)+'&z=' + Math.round(zoom);
            window.history.pushState({ path: newurl }, '', newurl);
        }
    };

    // ********************************************************
    // INTERFACE METHODS
    // ********************************************************

    // print color palette
    var printColors = function () {
        $("#colors").html('<input type="text" id="colorPicker" />');
        $("#colorPicker").css("background-color", "rgba(" + currentColor.red + ", " + currentColor.green + ", " + currentColor.blue + ", " + currentColor.opacity + ")");
        $("#colorPicker").on('keyup', function(){$("#colorPicker").val('');});
        jQuery("#colorPicker").hexColorPicker({
          colorizeTarget: true,
          outputFormat: "",
          submitCallback: function(hex){
            currentColor = hexToColor("#" + hex);
            localStorage.setItem("pixelino-lastColor", JSON.stringify(currentColor));
          }
        });
    };

    var hexToColor = function (hex) {
        var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            red: parseInt(result[1], 16),
            green: parseInt(result[2], 16),
            blue: parseInt(result[3], 16),
            opacity: 1
        } : null;
    }

    // save image
    var saveImageAsPng = function (name, address) {
        var link = document.createElement('a');
        link.style = 'position: fixed; left -10000px;'; // making it invisible
        link.href = 'data:application/octet-stream,' + encodeURIComponent(address); // forcing content type
        link.download = name.indexOf('.png') < 0 ? name + '.png' : name;

        // append, click and remove
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // init interface
    var initInterface = function () {

        // create css entry
        $('head').append('<link rel="stylesheet" href="css/pixelino.css" type="text/css" />');
        $('head').append('<link rel="stylesheet" href="css/jquery-hex-colorpicker.css" type="text/css" />');

        // create toolbar element
        toolbarElement = document.createElement("div");
        document.body.appendChild(toolbarElement);
        toolbarElement.id = "toolbar_container";
        $("#toolbar_container").html("<div id=\"toolbar\"><div id=\"colors\"></div></div>");

        // print colors
        printColors();

        // create export botton
        var exportElement = document.createElement("div");
        document.getElementById("toolbar_container").appendChild(exportElement);
        exportElement.id = "export";

        // click event for export
        $(exportElement).click(function () {
            visibleWidth = Math.round(canvasWidth / zoom);
            visibleHeight = Math.round(canvasHeight / zoom);

            var left = centerX - Math.floor(visibleWidth / 2);
            var top = centerY + Math.floor(visibleHeight/ 2);
            var right = left + visibleWidth;
            var bottom = top - visibleHeight;
            var exportUrl = API_URL_BASE + API_EXPORT + "?left=" + Math.round(left) + "&top=" + Math.round(top) + "&right=" + Math.round(right) + "&bottom=" + Math.round(bottom);

            // open export url to another window
            window.open(exportUrl);
        });

        // create link botton
        var linkElement = document.createElement("div");
        document.getElementById("toolbar_container").appendChild(linkElement);
        linkElement.id = "link";

        // click event for link
        $(linkElement).click(function () {
            var newurl = PIXELINO_URL_BASE + 'client/index.html?x=' + Math.round(centerX) + '&y=' + Math.round(centerY) + '&z=' + Math.round(zoom);
            linkOverlay('Share URL: ', newurl);
            $(".overlay_share_inputbox").select();
        });

        // create status element
        statusElement = document.createElement("div");
        document.body.appendChild(statusElement);
        statusElement.id = "status";
        $("#status").html("<p><span>POS: 0,0</span><span>ZOOM: 1</span></p>");

        // create info element
        infoElement = document.createElement("div");
        document.body.appendChild(infoElement);
        infoElement.id = "info";

        // create element and append to the body
        canvasElement = document.createElement("canvas");
        document.body.appendChild(canvasElement);
        canvasElement.id = "canvas_pixels";

        // create element and append to the body
        canvasElementGrid = document.createElement("canvas");
        document.body.appendChild(canvasElementGrid);
        canvasElementGrid.id = "canvas_grid";

        // create element and append to the body
        canvasElementSelection = document.createElement("canvas");
        document.body.appendChild(canvasElementSelection);
        canvasElementSelection.id = "canvas_selection";

        // create element and append to the body
        mainOverlayElement = document.createElement("div");
        document.body.appendChild(mainOverlayElement);
        mainOverlayElement.id = "main_overlay";

        // clear selected pixel
        $("#status").mouseover(function () {
            clearSelectedPixel();
        });
    };

    // ********************************************************
    // PUBLIC METHODS
    // ********************************************************
    return {

        // init: create element in body
        init: function (init_centerX, init_centerY, init_zoom, init_grid, callback) {

            // init interface
            initInterface();

            // override init x, y
            if (urlParams["x"] !== undefined && urlParams["y"] !== undefined && urlParams["z"] !== undefined) {
                init_centerX = parseInt(urlParams["x"]);
                init_centerY = parseInt(urlParams["y"]);
                init_zoom = parseInt(urlParams["z"]);
            }

            // assign initial parameters
            centerX = init_centerX;
            centerY = init_centerY;
            zoom = init_zoom;
            grid = init_grid;

            // refresh canvas
            refreshCanvas(true, false);

            // schdule print canvas next executions
            setInterval(function () { if (!moving && zoom > 1) printCanvas(true, false); }, printTimeout);

            // assign mouse listeners
            canvasElementSelection.addEventListener("mousemove", mousePosition, false);

            // ********************************************************************************
            // mobile and mouse events
            // ********************************************************************************
            var mc = new Hammer.Manager(canvasElementSelection);
            var pinch = new Hammer.Pinch();
            var pan = new Hammer.Pan();
            var tap = new Hammer.Tap();
            mc.add([pinch, pan, tap]);

            // pan events
            mc.on("panleft panright panup pandown", function (ev) {

                // move center
                if (!loading) pixelino.setCenter(-ev.deltaX, ev.deltaY, false);

                // reload Zone
                if (!loading){
                  if(loadAreaTimeout !==null){
                    clearTimeout(loadAreaTimeout);
                    loadAreaTimeout = null;
                    loadZone(mouseZoneX, mouseZoneY, mouseZoneX + "_" +mouseZoneY);
                  }
                }

            });
            mc.on("panstart", function (ev) {
                // mouse cursor
                $('html,body').css('cursor', 'pointer');

                // force store center
                pixelino.storeSettings();
                moving = true;
            });
            mc.on("panend", function (ev) {

                // force store center
                pixelino.setCenter(-ev.deltaX, ev.deltaY, true);
                pixelino.storeSettings();
                updateUrl();
                moving = false;

                // mouse cursor
                $('html,body').css('cursor', 'default');

            });

            // wheel event
            $(canvasElementSelection).on('mousewheel DOMMouseScroll', function (event) {

                e = event.originalEvent;
                moving = true;

                // prevent zoom (non-mac env)
                if (e.ctrlKey) e.preventDefault();

                var delta = 0;
                if (typeof e.wheelDelta !== "undefined") {
                    delta = e.wheelDelta / 120;
                }
                else
                {
                    if (typeof e.detail !== "undefined") delta = e.detail / 3;
                }

                // change zoom
                if (!loading) pixelino.modifyZoom(delta, false);

                // reload Zone
                if (!loading) {
                  if(loadAreaTimeout !==null){
                    clearTimeout(loadAreaTimeout);
                    loadAreaTimeout = null;
                    loadZone(mouseZoneX, mouseZoneY, mouseZoneX + "_" +mouseZoneY);
                  }
                }

                // stop moving
                if (movingTimeout === 0) movingTimeout = setTimeout(function () { movingTimeout = 0; pixelino.modifyZoom(delta, true); updateUrl(); moving = false; }, 1000);
            });

            // tap or click
            mc.on("tap", function (ev) {
                setPixel(ev);
            });

            // pinch event
            mc.on("pinch", function (ev) {
                if (isMac)
                {
                    ev.preventDefault();
                }
                else
                {
                    // set general scale
                    scale = ev.scale;

                    // move center
                    if (!loading) pixelino.setCenter(-ev.deltaX, ev.deltaY, false);

                    // set zoom
                    if (!loading) pixelino.setZoom(scale, false);

                    // reload Zone
                    if (!loading){
                      if(loadAreaTimeout !==null){
                        clearTimeout(loadAreaTimeout);
                        loadAreaTimeout = null;
                        loadZone(mouseZoneX, mouseZoneY, mouseZoneX + "_" +mouseZoneY);
                      }
                    }
                }
            });
            mc.on("pinchstart", function (ev) {
                // mouse cursor
                $('html,body').css('cursor', 'pointer');

                // force store center
                pixelino.storeSettings();
                moving = true;
            });
            mc.on("pinchend", function (ev) {
                // mouse cursor
                $('html,body').css('cursor', 'default');

                pixelino.setCenter(-ev.deltaX, ev.deltaY, true);
                pixelino.setZoom(scale, true);
                pixelino.storeSettings();
                updateUrl();

                moving = false;
            });

            // callback
            callback(canvasElement);
        },

        // resize canvas proportions
        refresh: function (forced) {
            refreshCanvas(forced, true);
        },

        // store previous settings
        storeSettings: function () {
            oldCenterX = centerX;
            oldCenterY = centerY;
        },

        // set center
        setCenter: function (deltaX, deltaY, loadMissingZone) {
            // last movement stored
            lastMovement = new Date().getTime();

            // move center
            centerX = oldCenterX + deltaX / zoom;
            centerY = oldCenterY + deltaY / zoom;

            // refresh canvas
            refreshCanvas(false, loadMissingZone);
        },

        // set zoom
        setZoom: function (deltaZoom, loadMissingZone) {

            if (deltaZoom >= 1) {
                // increase zoom
                scale = 1.03;
            } else {
                // decrease zoom
                scale = 0.97;
            }

            // zoom
            zoom = zoom * scale;

            // prevent negative zoom
            if (zoom < 1) zoom = 1;
            if (zoom > 300) zoom = 300;

            // refresh canvas
            refreshCanvas(false, loadMissingZone);
        },

        // increase / decrease zoom
        modifyZoom: function (deltaWheel, loadMissingZone) {
            // zoom
            zoom = zoom + deltaWheel * zoom / 20;

            // prevent negative zoom
            if (zoom < 1) zoom = 1;
            if (zoom > 300) zoom = 300;

            // store zoom
            pixelino.storeSettings();

            // refresh canvas
            refreshCanvas(false, loadMissingZone);

        }
    };

}();

// on window resize
$(window).resize(function() {
    pixelino.refresh(false);
});
