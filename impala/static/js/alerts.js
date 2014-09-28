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

// alerts.js //
// requires layout.js


var alert_div = $('#alert');
var alert_class = {
    info:    'alert alert-info',
    success: 'alert alert-success'
};
var alert_text = {
    db_update_in_progress: 'Database update in progress...',
    db_update_finished:    'Database update finished.',
    added_to_playlist:     ' added to playlist.',
    playlist_cleared:      'Playlist cleared.'
};


function alert_db_update_in_progress() {
    alert_alert(alert_class.info, alert_text.db_update_in_progress);
}

function alert_db_update_finished() {
    alert_alert(alert_class.success, alert_text.db_update_finished);
}

function alert_added_to_playlist(what) {
    alert_alert(alert_class.success, what + alert_text.added_to_playlist);
    hide_alert();
}

function alert_playlist_cleared() {
    alert_alert(alert_class.success, alert_text.playlist_cleared);
    hide_alert();
}


function alert_alert(css_class, text) {
    alert_div.attr('class', css_class);
    alert_div.text(text);
    alert_div.show();
    resize_components();
}

function hide_alert() {
    setTimeout(function() {
        alert_div.hide();
        resize_components();
    }, 3000);
}
