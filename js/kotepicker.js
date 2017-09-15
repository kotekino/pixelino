/**
 * @kotepicker.js
 * Color picker for pixelino.xyz
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
;(function($){
    $.fn.extend({
        kotepicker: function (options) {
            this.defaultOptions = {
                "pickerWidth": 300, 
                "pickerHeight": 300,
                "marginLeft": 0,
                "marginTop": 65,
                "backgroundColor": "#000",
                "opacity": "1",
                "colorizeTarget": true,
                "maxAngles": 12,
                "maxSaturations": 12,
                "selectCallback": false,
                "picker": false,
                "open": false
            };

            var settings = $.extend({}, this.defaultOptions, options);

            return this.each(function () {

                var $element = $(this);
                $element.on("click", function (event) {
                    if (event.handled === false) return
                    event.stopPropagation();
                    event.preventDefault();
                    event.handled = true;


                    if (!settings.open) {
                        // remove any picker
                        $('.kotepicker-wrapper').remove();

                        // create and inject picker
                        $element.after(formatPicker());

                        // apply css with parameters
                        stylePicker($element);
                    }
                    else
                    {
                        // remove any picker
                        $('.kotepicker-wrapper').remove();
                    }

                    // open close status
                    settings.open = !settings.open;
                });

            });

            function stylePicker($element) {

                // get left
                var left = 0;
                var top = 0;
                var width = settings.pickerWidth + 'px';
                var height = settings.pickerHeight + 'px';
                var marginLeft = settings.marginLeft;
                var marginTop = settings.marginTop;
                var padding = 0;
                var margin_right = 0;
                var margin_bottom = 0;
                var background_color = settings.backgroundColor; 
                var position = "absolute"; 
                var z_index = "7"; 
                var opacity = settings.opacity;
                var border = "1px solid black"
                
                $('.kotepicker-wrapper').css('left', left);
                $('.kotepicker-wrapper').css('top', top);
                $('.kotepicker-wrapper').css('width', width);
                $('.kotepicker-wrapper').css('height', height);
                $('.kotepicker-wrapper').css('margin-right', margin_right);
                $('.kotepicker-wrapper').css('margin-bottom', margin_bottom);
                $('.kotepicker-wrapper').css('padding', padding);
                $('.kotepicker-wrapper').css('background-color', background_color);
                $('.kotepicker-wrapper').css('position', position);
                $('.kotepicker-wrapper').css('opacity', opacity);
                $('.kotepicker-wrapper').css('margin-left', marginLeft);
                $('.kotepicker-wrapper').css('margin-top', marginTop);
                $('.kotepicker-wrapper').css('border', border);

                $('.kotepicker_color').on("click touchstart", function () {
                    if (event.handled === false) return
                    event.stopPropagation();
                    event.preventDefault();
                    event.handled = true;

                    var selectedColor = $(this).css('backgroundColor');
                    $('.kotepicker-wrapper').remove();
                    settings.selectCallback(selectedColor);
                    settings.open = false;
                });

            }

            function hexc(colorval) {
                var parts = colorval.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
                delete (parts[0]);
                for (var i = 1; i <= 3; ++i) {
                    parts[i] = parseInt(parts[i]).toString(16);
                    if (parts[i].length === 1) parts[i] = '0' + parts[i];
                }
                color = '#' + parts.join('');
            }

            function formatPicker() {
                var output = "<div class='kotepicker-wrapper'>";

                var colorWidth = settings.pickerWidth / settings.maxAngles;
                var colorHeight = settings.pickerHeight / (settings.maxSaturations + 1);
                var deltaColor = Math.floor(255 / settings.maxAngles + 2);
                var deltaSaturation = Math.floor(10 / settings.maxSaturations);
                var deltaLight = Math.floor(50 / settings.maxSaturations);
                var deltaLight2 = Math.floor(90 / settings.maxSaturations);
                var deltaAngle = Math.floor(360 / settings.maxAngles);

                // greys
                output += "<div class='kotekick_color_row' style='width: " + settings.pickerWidth + "px; height: " + colorHeight + "px'>";
                for (var color = 0; color < settings.maxAngles; color++) {
                    var value = color * deltaColor;
                    output += "<div class='kotepicker_color' style='cursor: pointer; opacity: 1; float: left; width: " + colorWidth + "px; height: " + colorHeight + "px; background-color: rgb(" + value + "," + value + "," + value + ")'></div>";
                }
                output += "</div>";

                // other colors
                for (var saturation = 0; saturation < settings.maxSaturations; saturation++) {
                    output += "<div class='kotekick_color_row' style='width: " + settings.pickerWidth + "px; height: " + colorHeight + "px'>";
                    var sat = 100 - (saturation * deltaSaturation);
                    var lig = 10 + saturation * deltaLight2;
                    for (var angle = 0; angle < settings.maxAngles; angle++) {
                        var hue = angle * deltaAngle;
                        output += "<div class='kotepicker_color' style='cursor: pointer; opacity: 1; float: left; width: " + colorWidth + "px; height: " + colorHeight + "px; background-color: hsl(" + hue + ", " + sat + "%, " + lig + "%)'></div>";
                    }
                    output += "</div>";
                }

                // close wrapper
                output += "</div>";

                return output;
            }
        }
    });
}(jQuery));