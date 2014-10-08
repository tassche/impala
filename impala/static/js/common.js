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

// common.js //


function style_active_navbar_element(element) {
    element.attr('class', element.attr('class') + ' active');
}

function style_active_quicknav_element(element) {
    element.attr('class', element.attr('class') + ' btn-info');
}

function update_navigation() {
    if (typeof active_navbar_element !== 'undefined') {
        style_active_navbar_element(active_navbar_element);
    }
    if (typeof active_quicknav_element !== 'undefined') {
        style_active_quicknav_element(active_quicknav_element);
    }
}


$(document).ready(function() {
    update_navigation();
});

