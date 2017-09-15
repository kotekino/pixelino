/**
 * @pixelino.js
 * Javascript client for pixelino.xyz
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

// pixelino client
var pixelino = function () {

    // *********************************************************************
    // CLASS VARIABLES
    // *********************************************************************

    // debug flag
    var debug = false;

    // platforms
    var isMac = navigator.platform.toUpperCase().indexOf('MAC') !== -1;
    var isWindows = navigator.platform.toUpperCase().indexOf('WIN') !== -1;
    var isLinux = navigator.platform.toUpperCase().indexOf('LINUX') !== -1;
    var isIos = navigator.userAgent.match(/(iPad|iPhone|iPod)/g);

    // urls
    // var API_URL_BASE = "http://pixelino.xyz/api/";
    var API_URL_BASE = "/api/";
    var PIXELINO_URL_BASE = "http://pixelino.xyz/";
    var API_URL_ZONES = API_URL_BASE + "zones/";
    var API_URL_SET_PIXEL = "pixels";
    var API_URL_SET_BATTLE_PIXEL = "pixels/battle"
    var API_URL_AREAS = "areas";
    var API_EXPORT = "pixels/exports";
    var API_URL_USERS = "users";
    var API_URL_USERS_ONLINE = "users/online";
    var API_URL_COMM = "comm";
    var CLIENT_HASH = "d502ad79e10fae61584613fe3a509857";

    // consts
    var canvasName = "canvas_container";

    // flags
    var cache_images = false;
    var default_zoom = 8;
    var zoom = default_zoom;
    var centerX = 0;
    var centerY = 0;
    var grid = 0;
    var printTimeout = 20000;
    var zoneResolution = 100;
    var menuX = 5148;
    var menuY = 5110;
    var menuZoom = 1;

    // backup values
    var oldCenterX = 0;
    var oldCenterY = 0;

    // canvas
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
    var defaultColor = { red: 0, green: 0, blue: 0, opacity: 1 };
    var white = { red: 255, green: 255, blue: 255, opacity: 1 };
    var red = { red: 255, green: 0, blue: 0, opacity: 1 };
    var green = { red: 0, green: 255, blue: 0, opacity: 1 };

    // storage (colors, center)
    if (localStorage.getItem("pixelino-lastColor") === null || localStorage.getItem("pixelino-lastColor") === "null")
        localStorage.setItem("pixelino-lastColor", JSON.stringify(defaultColor));
    if (localStorage.getItem("pixelino-defaultColor1") === null || localStorage.getItem("pixelino-defaultColor1") === "null")
        localStorage.setItem("pixelino-defaultColor1", JSON.stringify(white));
    if (localStorage.getItem("pixelino-defaultColor2") === null || localStorage.getItem("pixelino-defaultColor2") === "null")
        localStorage.setItem("pixelino-defaultColor2", JSON.stringify(red));
    if (localStorage.getItem("pixelino-defaultColor3") === null || localStorage.getItem("pixelino-defaultColor3") === "null")
        localStorage.setItem("pixelino-defaultColor3", JSON.stringify(green));
    if (localStorage.getItem("pixelino-myCenterX") === null || localStorage.getItem("pixelino-myCenterX") === "null")
        localStorage.setItem("pixelino-myCenterX", 0);
    if (localStorage.getItem("pixelino-myCenterY") === null || localStorage.getItem("pixelino-myCenterY") === "null")
        localStorage.setItem("pixelino-myCenterY", 0);

    var currentColor = typeof Storage !== "undefined" ? jQuery.parseJSON(localStorage.getItem("pixelino-lastColor")) : defaultColor;
    var defaultColor1 = typeof Storage !== "undefined" ? jQuery.parseJSON(localStorage.getItem("pixelino-defaultColor1")) : white;
    var defaultColor2 = typeof Storage !== "undefined" ? jQuery.parseJSON(localStorage.getItem("pixelino-defaultColor2")) : red;
    var defaultColor3 = typeof Storage !== "undefined" ? jQuery.parseJSON(localStorage.getItem("pixelino-defaultColor3")) : green;
    var myCenterX = typeof Storage !== "undefined" ? jQuery.parseJSON(localStorage.getItem("pixelino-myCenterX")) : 0;
    var myCenterY = typeof Storage !== "undefined" ? jQuery.parseJSON(localStorage.getItem("pixelino-myCenterY")) : 0;

    // interaction mode (draw)
    var mode = "draw"; // [draw]

    // timer print
    var lastPrint = 0;
    var skipDelayExecution = 0;
    var movingTimeout = 0;
    var onlineUsersTimeout = 60000;
    var commTimeout = 30000;

    // movement
    var moving = false;

    // loadArea Timeout
    var loadAreaTimeout = null;

    // user
    var userID = "anonymous";
    var userToken = "";

    // users
    var onlineUsers = {};

    // areas
    var reservedAreas = {};

    // html elements
    var statusBar = null;
    var commBar = null;
    var toolbarElement = null;
    var canvasElementSelection = null;
    var canvasElementGrid = null;
    var canvasElement = null;
    var mainOverlayElement = null;

    // new flags
    var zones_padlock = false;

    // *********************************************************************
    // LOAD METHODS
    // *********************************************************************

    // load a zone from the API in memory; cache the zone in local storage
    var new_loadZone = function (zone, success, error) {

        var currentTimestamp = new Date().getTime();
        var url = API_URL_ZONES + zone.zone + "/" + currentTimestamp;
        var image = new Image();

        try {
            zoneLoaded[zone.zone] = 0;
            image.src = url;

            // print onload
            image.onload = function () {

                // assign to array
                imageArray[zone.zone] = image;

                // mark zone load time
                zoneLoaded[zone.zone] = currentTimestamp;

                success();
            };
        }
        catch (err) {

            // the load failed, but the attempt is marked
            zoneLoaded[zone.zone] = currentTimestamp;

            error(err);
        }
    };

    // load all local zones
    var new_loadZones = function (success) {


        // foreach zone, load zone
        if (zones.length > 0) {
            zones.forEach(function (item, index) {
                var zone = zones[index];

                new_loadZone(zone,
                    function () {

                        // zone loaded
                        new_zonesLoaded(success);
                    },
                    function () {
                        // hide error
                    }
                )
            })
        }
    };

    // check for all loaded
    var new_zonesLoaded = function (callback) {


        var result = true;
        if (zones.length > 0) {
            zones.forEach(function (item, index) {
                if (zoneLoaded[zones[index].zone] === 0) {
                    result = false;
                    return false;
                }
            });
        }

        // callback if true
        if (result) {
            callback();
        }
    }

    // *********************************************************************
    // PRINT METHODS
    // *********************************************************************

    // print current zones
    var renderZones = function (isMoving) {


        // cycle over current zones
        if (zones.length > 0) {
            zones.forEach(function (item, index) {
                renderZone(item, false, isMoving);
            });
        }
    }

    // print single zone
    var renderZone = function (zone, forceLoad, isMoving) {


        if (typeof imageArray[zone.zone] !== "undefined" && !forceLoad) {
            var x = getCanvasX(zone.x);
            var y = getCanvasY(zone.y - 1 + zoneResolution);
            printZone(x, y, imageArray[zone.zone]);
        }
        else {
            if (!isMoving) {
                showOverlay("loading");
                new_loadZone(zone, function () {

                    var x = getCanvasX(zone.x);
                    var y = getCanvasY(zone.y - 1 + zoneResolution);

                    // load and print: hide
                    printZone(x, y, imageArray[zone.zone]);
                    hideOverlay();
                }, function () {
                    // error loading zone: hide
                });
            }
        }
    }

    // *********************************************************************
    // REFRESH METHODS
    // *********************************************************************

    // refresh actual zones
    var new_refreshZones = function () {
        

        if (!zones_padlock) {

            // lock zones
            zones_padlock = true;

            // get current zones
            zones = getZones();

            // release
            zones_padlock = false;
        }
    }

    // refresh canvas
    var new_refreshCanvas = function (fullLoad, isMoving) {


        // clear eventual area timeout and force print?

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

        // get actual zones
        new_refreshZones();

        // get actual zones
        if (!isMoving) {

            // render special areas
            refreshAreas();

            // render grid
            if (grid && zoom > 10) printGrid();
        }

        // print canvas
        if (fullLoad && !isMoving) {

            // overlay while full loading
            showOverlay("loading");

            // if fullLoad and !moving, load and print
            new_loadZones(function () {
                renderZones(isMoving);
                hideOverlay();
            })
        }
        else {
            // else print
            renderZones(isMoving);
        }

    };


    // *********************************************************************
    // RENDER / CANVAS METHODS
    // *********************************************************************

    // get base64 image
    var getBase64Image = function (img) {
        var tempcanvas = document.createElement("canvas");
        tempcanvas.width = img.width;
        tempcanvas.height = img.height;

        var tempctx = tempcanvas.getContext("2d");
        tempctx.drawImage(img, 0, 0);

        var dataURL = tempcanvas.toDataURL("image/png");

        return dataURL.replace(/^data:image\/(png|jpg);base64,/, "");
    }

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
        ctx.clearRect(x, y, zoneResolution * zoom, zoneResolution * zoom);
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
        var deltaX = canvasCenterX + (x - centerX) * zoom - zoom / 2;
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

        var tempZones = [];
        for (var iCounterX = left; iCounterX <= right; iCounterX = iCounterX + zoneResolution) {
            for (var iCounterY = bottom; iCounterY <= top; iCounterY = iCounterY + zoneResolution) {
                var newX = iCounterX;
                var newY = iCounterY;
                var zoneLabel = newX + "_" + newY;
                var zone = { x: newX, y: newY, zone: zoneLabel };

                tempZones.push(zone);
            }
        }
        return tempZones;
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
        showInfo("printing pixel");

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

            // reload image
            clearTimeout(loadAreaTimeout);
            loadAreaTimeout = setTimeout(function () {
                renderZone({x: zoneX, y: zoneY, zone: zoneX + "_" + zoneY}, true, false)
                loadAreaTimeout = null;
            }, 500);

            // ajax submit
            $.support.cors = true;

            // build request data
            var requestData = {
                x: mouseX,
                y: mouseY,
                red: currentColor.red,
                green: currentColor.green,
                blue: currentColor.blue,
                opacity: currentColor.opacity,
                zoneX: zoneX,
                zoneY: zoneY,
                hash: CLIENT_HASH,
                userID: userID,
                userToken: userToken
            };

            $.ajax({
                url: API_URL_BASE + API_URL_SET_PIXEL,
                method: "POST",
                data: JSON.stringify(requestData),
                contentType: "application/json",
                success: function (responseData) {
                    hideInfo();
                },
                error: function (errorData) {
                    hideInfo();
                }
            });
        }
    };

    // draw a pixel in battle mode
    var setPixelBattle = function (ev) {

        // overlay
        showInfo("printing pixel");

        // update position
        mouseClickOrTap(ev);

        var mouseX = mouseAbsoluteX;
        var mouseY = mouseAbsoluteY;
        var zoneX = mouseZoneX;
        var zoneY = mouseZoneY;

        // submit pixel (mouseAbsoluteX, mouseAbsoluteY, mouseZoneX, mouseZoneY, currentColor)
        if (mode === "draw") {

            // ajax submit
            $.support.cors = true;

            // build request data
            var requestData = {
                x: mouseX,
                y: mouseY,
                red: currentColor.red,
                green: currentColor.green,
                blue: currentColor.blue,
                opacity: currentColor.opacity,
                zoneX: zoneX,
                zoneY: zoneY,
                hash: CLIENT_HASH,
                userID: userID,
                userToken: userToken
            };

            $.ajax({
                url: API_URL_BASE + API_URL_SET_BATTLE_PIXEL,
                method: "POST",
                data: JSON.stringify(requestData),
                contentType: "application/json",
                success: function (responseData) {

                    var opacity = responseData;

                    // if positive answer, then print pixel
                    printPixel(getCanvasX(mouseX), getCanvasY(mouseY), currentColor.red, currentColor.green, currentColor.blue, opacity);

                    // reload image
                    clearTimeout(loadAreaTimeout);
                    loadAreaTimeout = setTimeout(function () {
                        renderZone({x: zoneX, y: zoneY, zone: zoneX + "_" + zoneY}, true, false)
                        loadAreaTimeout = null;
                    }, 500);

                    hideInfo();
                },
                error: function (errorData) {
                    hideInfo();
                }
            });
        }
    };

    // print status
    var printStatus = function () {
        $("#status").html("<p id=\"coord\">" + mouseAbsoluteX + ", " + mouseAbsoluteY + "</p><p id=\"zoom\">" + getZoomPercentage(zoom) + "</p>");
    };

    // show info
    var showInfo = function (text) {
        $("#info").html('<p>' + text + '</p>');
    };

    // hide info
    var hideInfo = function (text) {
        $("#info").html('');
    };

    // show overlay alert
    var showOverlay = function (text) {
        $("#info").html('<p>' + text + '</p>');
        // $("#main_overlay").show();
    };

    // hide overlay alert
    var hideOverlay = function () {
        $("#info").html('');
        // $("#main_overlay").hide();
    };

    // show overlay alert
    var linkOverlay = function (text, inputText) {
        swal({
            title: text,
            type: 'info',
            html: "<a href=\"" + inputText + "\">" + inputText + "</a>",
            confirmButtonText: 'Ok'
        });
    };

    // update url
    var updateUrl = function () {
        if (history.pushState) {
            var newurl = window.location.protocol + "//" + window.location.host + window.location.pathname + '?x=' + Math.round(centerX) + '&y=' + Math.round(centerY) + '&z=' + Math.round(zoom);
            window.history.pushState({ path: newurl }, '', newurl);
        }
    };

    // refresh comm
    var printMessages = function () {
        $.ajax({
            url: API_URL_BASE + API_URL_COMM + "?userID=" + userID,
            method: "GET",
            contentType: "application/json",
            success: function (messages) {
                var commTextArea = $('#comm_messages');
                $.each(messages, function (key, value) {
                    addMessageToComm(value.message, value.from);
                });
            },
            error: function (errorData) {

            }
        });
    };

    // post message
    var postMessage = function (text) {

        var requestData = {
            message: text,
            userID: userID
        };

        $.ajax({
            url: API_URL_BASE + API_URL_COMM,
            method: "POST",
            data: JSON.stringify(requestData),
            contentType: "application/json"
        });
    };

    // ********************************************************
    // INTERFACE METHODS
    // ********************************************************

    // hex to color
    var rgbToColor = function (rgb) {
        var result = rgb.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);

        return result ? {
            red: result[1],
            green: result[2],
            blue: result[3],
            opacity: 1
        } : defaultColor;
    };

    // print color palette
    var printColorsElement = function () {

        $("#colors").html('<div id="colorPicker"></div><div id="defaultColor1" class="default_colors"></div><div id="defaultColor2" class="default_colors"></div><div id="defaultColor3" class="default_colors"></div>');
        $("#colorPicker").css("background-color", "rgba(" + currentColor.red + ", " + currentColor.green + ", " + currentColor.blue + ", " + currentColor.opacity + ")");
        $("#colorPicker").on('keyup', function () { $("#colorPicker").val(''); });

        $("#defaultColor1").css("background-color", "rgba(" + defaultColor1.red + ", " + defaultColor1.green + ", " + defaultColor1.blue + ", " + defaultColor1.opacity + ")");
        $("#defaultColor2").css("background-color", "rgba(" + defaultColor2.red + ", " + defaultColor2.green + ", " + defaultColor2.blue + ", " + defaultColor2.opacity + ")");
        $("#defaultColor3").css("background-color", "rgba(" + defaultColor3.red + ", " + defaultColor3.green + ", " + defaultColor3.blue + ", " + defaultColor3.opacity + ")");

        // click on default colors
        $(".default_colors").on("click touchstart", function (event) {
            if (event.handled === false) return
            event.stopPropagation();
            event.preventDefault();
            event.handled = true;

            var index = $(this).attr("id").replace("defaultColor", "");
            var oldCurrent = currentColor;
            if (index === "1") {
                currentColor = defaultColor1;
                defaultColor1 = oldCurrent;
                $("#defaultColor1").css("background-color", "rgba(" + defaultColor1.red + ", " + defaultColor1.green + ", " + defaultColor1.blue + ", " + defaultColor1.opacity + ")");
            }
            if (index === "2") {
                currentColor = defaultColor2;
                defaultColor2 = oldCurrent;
                $("#defaultColor2").css("background-color", "rgba(" + defaultColor2.red + ", " + defaultColor2.green + ", " + defaultColor2.blue + ", " + defaultColor2.opacity + ")");
            }
            if (index === "3") {
                currentColor = defaultColor3;
                defaultColor3 = oldCurrent;
                $("#defaultColor3").css("background-color", "rgba(" + defaultColor3.red + ", " + defaultColor3.green + ", " + defaultColor3.blue + ", " + defaultColor3.opacity + ")");
            }

            localStorage.setItem("pixelino-lastColor", JSON.stringify(currentColor));
            $("#colorPicker").css("background-color", "rgba(" + currentColor.red + ", " + currentColor.green + ", " + currentColor.blue + ", " + currentColor.opacity + ")");

        });

        jQuery("#colorPicker").kotepicker({
            maxAngles: 12,
            maxSaturations: 12,
            picker: $(canvasElement),
            selectCallback: function (rgb) {

                // backup default colors
                defaultColor3 = defaultColor2;
                defaultColor2 = defaultColor1;
                defaultColor1 = currentColor;

                $("#defaultColor1").css("background-color", "rgba(" + defaultColor1.red + ", " + defaultColor1.green + ", " + defaultColor1.blue + ", " + defaultColor1.opacity + ")");
                $("#defaultColor2").css("background-color", "rgba(" + defaultColor2.red + ", " + defaultColor2.green + ", " + defaultColor2.blue + ", " + defaultColor2.opacity + ")");
                $("#defaultColor3").css("background-color", "rgba(" + defaultColor3.red + ", " + defaultColor3.green + ", " + defaultColor3.blue + ", " + defaultColor3.opacity + ")");

                localStorage.setItem("pixelino-defaultColor1", JSON.stringify(defaultColor1));
                localStorage.setItem("pixelino-defaultColor2", JSON.stringify(defaultColor2));
                localStorage.setItem("pixelino-defaultColor3", JSON.stringify(defaultColor3));

                currentColor = rgbToColor(rgb);
                jQuery("#colorPicker").css("background-color", "rgba(" + currentColor.red + ", " + currentColor.green + ", " + currentColor.blue + ", " + defaultColor1.opacity + ")");
                localStorage.setItem("pixelino-lastColor", JSON.stringify(currentColor));

            }
        });
    };

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

    // add message to comm
    var addMessageToComm = function (message, userId) {
        var commTextArea = $('#comm_messages');
        var count = $("#comm_messages p").length;

        if (count > 8) {
            $("#comm_messages").find('p:first').remove();
        }

        logElement = document.createElement("p");
        commTextArea.append(logElement);
        $(logElement).addClass("comm_item");
        $(logElement).text(userId + '> ' + message);

        // update last message
        $("#last_message").text(userId + "> " + message);
    };

    // init and print comm stack
    var printCommElement = function () {
        var commElement = document.createElement("div");
        statusBar.appendChild(commElement);
        commElement.id = "comm_container";
        $(commElement).html("<div id=\"toggle_com\">COMM</div><div id=\"last_message\"></div><div id=\"users_online\"></div><div id=\"comm_messages\"></div><input type=\"text\" value=\"type your message here\" id=\"comm_input\" />");
        document.getElementById("comm_messages").readOnly = true;

        $("#toggle_com, #last_message").on("click touchstart", function (event) {
            if(event.handled === false) return
            event.stopPropagation();
            event.preventDefault();
            event.handled = true;

            if($("#comm_container").css("height") === "20px") {
                $("#status_bar").css("height", "180px");
                $("#comm_container").css("height", "160px");
                $("#comm_input").css("width", canvasWidth - 17 + "px").show();
                $("#comm_input").show();
                $("#last_message").hide();
                $("#comm_messages").show();
            } else {
                $("#status_bar").css("height", "40px");
                $("#comm_container").css("height", "20px");
                $("#comm_input").css("width", "0px").show();
                $("#comm_input").hide();
                $("#comm_messages").hide();
                $("#last_message").show();
            }
        });

        // refresh comm
        printMessages();
        setInterval(function () { printMessages(); }, commTimeout);

        // submit message
        $("#comm_input").focus(function () {
            $("#comm_input").css("color", "white");
            $("#comm_input").val('');
        })
        $("#comm_input").blur(function () {
            $("#comm_input").css("color", "darkgrey");
            $("#comm_input").val('type your message here');
        })
        $("#comm_input").keyup(function (e) {
            if ($("#comm_input") && e.keyCode === 13) {

                // post message
                postMessage($("#comm_input").val());
                addMessageToComm($("#comm_input").val(), userID);

                // clear input
                $("#comm_input").val('type your message here');
                $("#comm_input").blur();

            }
        });

    };

    // init and print status bar
    var printStatusBarElement = function () {

        // create status bar element
        statusBar = document.createElement("div");
        document.body.appendChild(statusBar);
        statusBar.id = "status_bar";

        // create status element (general status of the app: user connected, users connected, coord, zoom level)
        var statusElement = document.createElement("div");
        statusBar.appendChild(statusElement);
        statusElement.id = "status";

        // create info element (centered text)
        infoElement = document.createElement("div");
        statusBar.appendChild(infoElement);
        infoElement.id = "info";

        // prevent some actions
        var mc = new Hammer.Manager(statusBar);
        var pinch = new Hammer.Pinch();
        var pan = new Hammer.Pan();
        var tap = new Hammer.Tap();
        mc.add([pinch, pan, tap]);

        // pan events
        mc.on("panleft panright panup pandown", function (ev) {

            if (isMac || isIos) {
                ev.preventDefault();
            }
        });
    };

    // print canvas
    var printCanvasElement = function () {
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

        // star
        var starElement = document.createElement("div");
        document.body.appendChild(starElement);
        starElement.id = "star";
        $(starElement).on("click touchstart", function (event) {
            if (event.handled === false) return
            event.stopPropagation();
            event.preventDefault();
            event.handled = true;

            localStorage.setItem("pixelino-myCenterX", Math.round(centerX));
            localStorage.setItem("pixelino-myCenterY", Math.round(centerY));
            myCenterX = Math.round(centerX);
            myCenterY = Math.round(centerY);
            swal({
                type: 'info',
                text: "New home set at: " + myCenterX + ", " + myCenterY,
                confirmButtonText: 'Ok'
            });
        });


        // create element and append to the body
        mainOverlayElement = document.createElement("div");
        document.body.appendChild(mainOverlayElement);
        mainOverlayElement.id = "main_overlay";

        // prevent pan in the overlay
        var mc = new Hammer.Manager(mainOverlayElement);
        var pinch = new Hammer.Pinch();
        var pan = new Hammer.Pan();
        var tap = new Hammer.Tap();
        mc.add([pinch, pan, tap]);

        // pan events
        mc.on("panleft panright panup pandown", function (ev) {
            if (isMac || isIos) {
                ev.preventDefault();
            }
        });
    };

    // init toolbar
    var printToolBarElement = function () {

        // create toolbar element
        toolbarElement = document.createElement("div");
        document.body.appendChild(toolbarElement);
        toolbarElement.id = "toolbar_container";
        $(toolbarElement).html("<div id=\"toolbar\"><div id=\"colors\"></div></div>");

        // create link botton
        var menuElement = document.createElement("div");
        toolbarElement.appendChild(menuElement);
        menuElement.id = "main_menu";
        $(menuElement).addClass("rightButtons");

        // click event for menu
        $(menuElement).on("click touchstart", function (event) {
            if (event.handled === false) return
            event.stopPropagation();
            event.preventDefault();
            event.handled = true;

            pixelino.jumpTo(menuX, menuY, menuZoom);
        });

        // create exit button
        var exitElement = document.createElement("div");
        toolbarElement.appendChild(exitElement);
        exitElement.id = "exit";
        $(exitElement).addClass("rightButtons");

        // click event for home
        $(exitElement).on("click touchstart", function (event) {
            if(event.handled === false) return
            event.stopPropagation();
            event.preventDefault();
            event.handled = true;

            logout();
        });

        // create home button
        var homeElement = document.createElement("div");
        toolbarElement.appendChild(homeElement);
        homeElement.id = "home";
        $(homeElement).addClass("rightButtons");

        // click event for home
        $(homeElement).on("click touchstart", function (event) {
            if (event.handled === false) return
            event.stopPropagation();
            event.preventDefault();
            event.handled = true;

            zoom = 4;
            pixelino.jumpTo(myCenterX, myCenterY, default_zoom);
        });

        // create export botton
        var exportElement = document.createElement("div");
        toolbarElement.appendChild(exportElement);
        exportElement.id = "export";
        $(exportElement).addClass("rightButtons");

        // click event for export
        $(exportElement).on("click touchstart", function (event) {
            if (event.handled === false) return
            event.stopPropagation();
            event.preventDefault();
            event.handled = true;

            visibleWidth = Math.round(canvasWidth / zoom);
            visibleHeight = Math.round(canvasHeight / zoom);

            var left = centerX - Math.floor(visibleWidth / 2);
            var top = centerY + Math.floor(visibleHeight / 2);
            var right = left + visibleWidth;
            var bottom = top - visibleHeight;
            var exportUrl = API_URL_BASE + API_EXPORT + "?left=" + Math.round(left) + "&top=" + Math.round(top) + "&right=" + Math.round(right) + "&bottom=" + Math.round(bottom) + "&zoom=" + Math.round(zoom);

            // open export url to another window
            window.open(exportUrl);
        });

        // prevent some actions
        var mc = new Hammer.Manager(toolbarElement);
        var pinch = new Hammer.Pinch();
        var pan = new Hammer.Pan();
        var tap = new Hammer.Tap();
        mc.add([pinch, pan, tap]);

        // pan events
        mc.on("panleft panright panup pandown", function (ev) {
            if (isMac || isIos) {
                ev.preventDefault();
            }
        });
    };

    // init interface
    var initInterface = function () {

        // print toolbar
        printToolBarElement();

        // create status element
        printStatusBarElement();

        // print comm
        printCommElement();

        // print canvas
        printCanvasElement();

        // print colors
        printColorsElement();

    };

    // splashscreen
    var splashScreen = function (callback) {

        // create css entry
        $('head').append('<link rel="stylesheet" href="css/pixelino.css" type="text/css" />');

        if (debug) {
            $("body").show();
            callback();
        } else {
            // show body
            setTimeout(function () {

                // create toolbar element
                splashScreenElement = document.createElement("div");
                document.body.appendChild(splashScreenElement);
                splashScreenElement.id = "splash_screen";
                $(splashScreenElement).html("<div id=\"splashscreen\"><div id=\"splashscreen_content\"><p><a href=\"http://pixelino.xyz\">p i x e l i n o</a><br />by <b>kotekino</b></p></div></div>");
                $("body").show();

                // destroy 
                setTimeout(function () {
                    callback();

                    // destroy splash
                    $(splashScreenElement).hide();

                }, 4000);
            }, 400);
        }
    };

    // ********************************************************
    // USER METHODS
    // ********************************************************
    var upsertUser = function (username, callback) {

        // ajax submit
        $.support.cors = true;

        // build request data
        var requestData = {
            username: username,
            usergroup: "general"
        };

        $.ajax({
            url: API_URL_BASE + API_URL_USERS,
            method: "POST",
            data: JSON.stringify(requestData),
            contentType: "application/json",
            success: function (responseData) {

                if (responseData !== "unable to register user") {

                    userID = username;
                    userToken = responseData;

                    // callback
                    callback(userID, userToken);
                }
                else {
                    swal(
                      'Oops...',
                      'Something goes wrong, try again ...',
                      'error'
                    );
                }
            },
            error: function (errorData) {
                hideOverlay();
            }
        });
    };

    // register new user or load with the stored one: set the token
    var initUser = function (callback) {

        // print mask (todo)
        if (localStorage.getItem("pixelino-userID") === null) {
            callback("new");
        }
        else {
            userID = localStorage.getItem("pixelino-userID");
            userToken = localStorage.getItem("pixelino-userToken");

            // upsert user
            upsertUser(userID, function (userIdAssigned, tokenAssigned) {
                localStorage.setItem("pixelino-userID", userIdAssigned);
                localStorage.setItem("pixelino-userToken", tokenAssigned);
                callback("loaded");
            });
        }
    };

    // refresh users
    var refreshUsers = function () {
        // update users on the map
        var users = $(".users");
        users.each(function () {
            document.body.removeChild(this);
        });

        $("#users_online").text(onlineUsers.length + " users online");
        $.each(onlineUsers, function (key, value) {

            if (value.username !== userID) {
                var userElement = document.createElement("p");
                userElement.id = "user_" + value.username;
                $(userElement).addClass("users");
                $(userElement).text(value.username);

                var x = getCanvasX(value.x);
                var y = getCanvasY(value.y);

                if (x < canvasWidth - 100 && y < canvasHeight - 100) {
                    document.body.appendChild(userElement);
                    $(userElement).css("top", y + "px");
                    $(userElement).css("left", x + "px");
                }
            }
        });

    };

    // get users online
    var getOnlineUsers = function () {

        $.ajax({
            url: API_URL_BASE + API_URL_USERS_ONLINE,
            method: "GET",
            contentType: "application/json",
            success: function (responseData) {
                onlineUsers = responseData;
                refreshUsers(onlineUsers);
            },
            error: function (errorData) {

            }
        });
    };

    // logout
    var logout = function () {
        localStorage.removeItem("pixelino-userID");
        localStorage.removeItem("pixelino-userToken");
        login();
    };

    // login mask
    var login = function (callback) {
        swal({
            title: "Type your nickname",
            input: 'text',
            showCancelButton: false,
            allowEscapeKey: false,
            allowOutsideClick: false,
            showCloseButton: false,
            inputValidator: function (value) {
                return new Promise(function (resolve, reject) {
                    if (value) {

                        // ajax submit
                        $.support.cors = true;

                        $.ajax({
                            url: API_URL_BASE + API_URL_USERS,
                            method: "GET",
                            contentType: "application/json",
                            data: "username=" + value,
                            success: function (responseData) {
                                /*if (responseData !== null) {
                                    reject('This nickname is not available');
                                } else {
                                    resolve();
                                }*/
                                resolve();
                            },
                            error: function (errorData) {
                                reject('This nickname is not available');
                            }
                        });

                    } else {
                        reject('This nickname is not available');
                    }
                });
            }
        }).then(function (result) {
            // upsert user
            upsertUser(result, function (userIdAssigned, tokenAssigned) {
                localStorage.setItem("pixelino-userID", userIdAssigned);
                localStorage.setItem("pixelino-userToken", tokenAssigned);
                swal({
                    type: 'success',
                    html: 'Welcome ' + result + '!'
                });
                postMessage(" is a new pixelino user");
            });
        });
    };

    // ********************************************************
    // AREAS METHODS
    // ********************************************************

    // refresh
    var refreshAreas = function () {

        var backgroundElement;

        // remove areas
        $(".reserved_areas").each(function () {
            document.body.removeChild(this);
        });

        $.each(reservedAreas, function (key, value) {
            
            virtualX = getCanvasX(value.left);
            virtualY = getCanvasY(value.top);
            x = Math.min(Math.max(virtualX, 0), window.innerWidth);
            y = Math.min(Math.max(virtualY, 0), window.innerHeight);
            virtualCutX = x - virtualX;
            virtualCutY = y - virtualY;

            deltaX = (value.right - value.left) * zoom;
            deltaY = (value.top - value.bottom) * zoom;
            width = Math.min(Math.max(deltaX, 0) - virtualCutX, window.innerWidth);
            height = Math.min(Math.max(deltaY, 0) - virtualCutY, window.innerHeight);


            if (value.type === "battle") {
                // create background
                backgroundElement = document.createElement("div");
                document.body.appendChild(backgroundElement);
                backgroundElement.id = "area_" + value.RowKey;

                $(backgroundElement).addClass("reserved_areas");
                $(backgroundElement).css("position", "absolute");
                $(backgroundElement).css("top", y);
                $(backgroundElement).css("left", x);
                $(backgroundElement).css("width", width);
                $(backgroundElement).css("height", height);
                $(backgroundElement).css("background-color", "#ff0000");
                $(backgroundElement).css("opacity", "0.1");
                $(backgroundElement).css("border", "1px solid black");
            }

        });
    };

    // get all predefined zones
    var getAreas = function (callback) {

        // todo

        $.support.cors = true;
        $.ajax({
            url: API_URL_BASE + API_URL_AREAS,
            method: "GET",
            contentType: "application/json",
            data: "username=" + userID,
            success: function (responseData) {
                callback(responseData);
            },
            error: function (errorData) {
                // fail                
            }
        });
    };

    // foreach area get if a point is included or not
    var getCurrentArea = function (mouseEvent) {
        mouseCanvasX = mouseEvent.center.x;
        mouseCanvasY = mouseEvent.center.y;

        x = getAbsoluteX(mouseCanvasX);
        y = getAbsoluteY(mouseCanvasY);

        for(var i in reservedAreas){
            var value = reservedAreas[i];
            if (x >= value.left && x <= value.right && y <= value.top && y >= value.bottom) {
                return value;
            }
        }
        return { type: "free" };
    };

    // ********************************************************
    // PUBLIC METHODS
    // ********************************************************
    return {

        // init: create element in body
        init: function (init_centerX, init_centerY, init_zoom, init_grid, callback) {

            // on window resize
            $(window).resize(function () {
                pixelino.refresh();
            });

            splashScreen(function () {

                // init interface
                initInterface();

                // override init x, y
                if (urlParams["x"] !== undefined && urlParams["y"] !== undefined && urlParams["z"] !== undefined) {
                    init_centerX = parseInt(urlParams["x"]);
                    init_centerY = parseInt(urlParams["y"]);
                    init_zoom = parseInt(urlParams["z"]);
                }
                else {
                    init_centerX = myCenterX;
                    init_centerY = myCenterY;
                }

                // assign initial parameters
                centerX = init_centerX;
                centerY = init_centerY;
                zoom = init_zoom;
                grid = init_grid;

                // init user
                initUser(function (action) {

                    // get special reserved areas
                    getAreas(function (data) {
                        reservedAreas = data;

                        if (action === "new") {
                            login();
                        }
                        else {
                            // welcome
                            postMessage("logged in at " + Math.round(centerX) + ', ' + Math.round(centerY));
                        }

                        // first load canvas
                        new_refreshCanvas(true, false);

                        // schdule load canvas next executions
                        setInterval(function () {
                            if (!moving && zoom > 1) {
                                console.log("scheduled load");
                                new_refreshZones();
                                new_loadZones(function () {
                                    renderZones(false);
                                })
                            };
                        }, printTimeout);

                        // schedule online users
                        getOnlineUsers();
                        setInterval(function () { getOnlineUsers(); }, onlineUsersTimeout);

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

                            if (isMac || isIos) {
                                ev.preventDefault();
                            }

                            // move center
                            pixelino.setCenter(-ev.deltaX, ev.deltaY, true);

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
                            pixelino.setCenter(-ev.deltaX, ev.deltaY, false);
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
                            else {
                                if (typeof e.detail !== "undefined") delta = e.detail / 3;
                            }

                            // change zoom
                            pixelino.modifyZoom(delta, true);

                            // stop moving
                            if (movingTimeout === 0) movingTimeout = setTimeout(function () { 
                                movingTimeout = 0; 
                                pixelino.modifyZoom(delta, false); 
                                updateUrl(); moving = false; 
                            }, 1000);
                        });

                        // tap or click
                        mc.on("tap", function (ev) {

                            // manage area interaction
                            var currentArea = getCurrentArea(ev);

                            // check type of action
                            if (currentArea.type === "free") {

                                // free
                                setPixel(ev);

                            } else if (currentArea.type === "internal") {
                                
                                // internal links
                                pixelino.jumpTo(currentArea.targetX, currentArea.targetY, currentArea.targetZoom);

                            } else if (currentArea.type === "link") {

                                // external links
                                window.open(currentArea.url);

                            } else if (currentArea.type === "battle") {

                                // battle
                                setPixelBattle(ev);

                            } else if (currentArea.type === "reserved") {
                                swal(
                                  'Oops...',
                                  'Reserved area, try somewhere else...',
                                  'error'
                                );
                                setTimeout(function () { hideOverlay(); }, 1000);
                            }

                        });

                        // pinch event
                        mc.on("pinch", function (ev) {

                            if (isMac || isIos) {
                                ev.preventDefault();
                            }

                            // set general scale
                            scale = ev.scale;

                            // move center
                            pixelino.setCenter(-ev.deltaX, ev.deltaY, true);

                            // set zoom
                           pixelino.setZoom(scale, true);
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

                            pixelino.setCenter(-ev.deltaX, ev.deltaY, false);
                            pixelino.setZoom(scale, false);
                            pixelino.storeSettings();
                            updateUrl();
                            moving = false;
                        });

                        // callback
                        callback(canvasElement);
                    });
                });
            });
        },

        // resize canvas proportions
        refresh: function (forced) {
            new_refreshCanvas(false, false);
            $("#comm_input").css("width", canvasWidth - 17 + "px");
        },

        // store previous settings
        storeSettings: function () {
            oldCenterX = centerX;
            oldCenterY = centerY;
        },

        // jump to
        jumpTo: function (x, y, inputZoom) {

            // last movement stored
            lastMovement = new Date().getTime();

            // move center
            centerX = x;
            centerY = y;
            zoom = inputZoom;

            // refresh canvas
            new_refreshCanvas(false, false);
            refreshUsers();
            updateUrl();
        },

        // set center
        setCenter: function (deltaX, deltaY, moving) {
            // last movement stored
            lastMovement = new Date().getTime();

            // move center
            centerX = oldCenterX + deltaX / zoom;
            centerY = oldCenterY + deltaY / zoom;

            // refresh canvas
            new_refreshCanvas(false, moving);
            refreshUsers();
        },

        // set zoom
        setZoom: function (deltaZoom, moving) {

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
            if (zoom > 250) zoom = 250;

            // refresh canvas
            new_refreshCanvas(false, moving);
            refreshUsers();
        },

        // increase / decrease zoom
        modifyZoom: function (deltaWheel, moving) {
            // zoom
            zoom = zoom + deltaWheel * zoom / 20;

            // prevent negative zoom
            if (zoom < 1) zoom = 1;
            if (zoom > 300) zoom = 300;

            // store zoom
            pixelino.storeSettings();

            // refresh canvas
            new_refreshCanvas(false, moving);
            refreshUsers();
        }
    };

}();