$(document).ready(function () {

    // add listeners
    centerX = 0;
    centerY = 0;
    zoom = 4;
    grid = 1;

    // load canvas, otherwise error
    pixelino.init(centerX, centerY, zoom, grid, function () {

    });
});