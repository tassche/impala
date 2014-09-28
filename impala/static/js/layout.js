/**
 * Impala
 * Copyright (C) 2014 Tijl Van Assche <tijlvanassche@gmail.com>
 *
 * This file is part of Impala.
 *
 * Impala is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Impala is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with Impala.  If not, see <http://www.gnu.org/licenses/>.
 */

// layout.js //


var viewport; // viewport class (xs, sm, md or lg)


function resize_components() {
    var height = $(window).height();
    height -= 50; // body padding-top
    height -= $('#alert:visible').outerHeight(true);
    height -= $('#currentsong-mini').outerHeight(true);
    height -= $('#controls').outerHeight(true);
    height -= $('#quicknav').outerHeight(true);

    height -= $('#lib-breadcrumbs').outerHeight(true);

    $('#content').css('height', height);
    $('#content .content').css('height', height);

    if (viewport == 'sm') {
        var margin = 20;
        $('#lib-albums').css('height', (height-margin)/2);
        $('#lib-songs').css('height', (height-margin)/2);
    }
}

function update_viewport_class() {
    viewport = get_viewport_class();
}


$(document).ready(function() {
    update_viewport_class();
    resize_components();
    $(window).resize(function() {
        update_viewport_class();
        resize_components();
    });
});


function get_viewport_class() {
    var w = window.outerWidth;
    if (w < 768) {
        return 'xs';
    } else if (w < 992) {
        return 'sm';
    } else if (w < 1200) {
        return 'md';
    } else {
        return 'lg';
    }
}
