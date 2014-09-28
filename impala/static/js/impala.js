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

// impala.js //
// requires layout.js
// requires alerts.js
// requires controls.js
// requires playlist.js or library.js


var page = window.location.pathname;
var updating_db = false;


function update_currentsong() {
    $.ajax({
        url: $SCRIPT_ROOT + '/poller/currentsong',
        dataType: 'json',
        success: function(currentsong) {
            $('#currentsong-artist').text(currentsong.artist);
            $('#currentsong-title').text(currentsong.title);
            $('#currentsong-album').text(currentsong.album);
            $('#currentsong-date').text(currentsong.date);
        },
        error: function() {
            $('#currentsong-artist').text('');
            $('#currentsong-title').text('');
            $('#currentsong-album').text('');
            $('#currentsong-date').text('');
        },
        complete: resize_components
    });
}


function on_state_play(mpd_status) {
    $('#status-bitrate').text(mpd_status.bitrate);

    var time = mpd_status.time.split(':');
    $('#time-elapsed').text(seconds_to_str(time[0]));
    $('#time-total').text(seconds_to_str(time[1]));

    var progress = time[0] / time[1] * 100;
    $('#time-progress').css('width', progress+'%')
        .attr('aria-valuenow', time[0])
        .attr('aria-valuemax', time[1]);

    $('#playlist tbody tr').removeAttr('style');
    $('#playlist tbody tr td.pl-pos').filter(function() {
        return $(this).text() == mpd_status.song;
    }).closest('tr').css('font-weight', 'bold');
}

function on_state_stop() {
    $('#currentsong-artist').text('');
    $('#currentsong-title').text('');
    $('#currentsong-album').text('');
    $('#currentsong-date').text('');

    $('#status-bitrate').text('0');

    $('#time-elapsed').text('00:00');
    $('#time-total').text('00:00');

    $('#time-progress').css('width', 0)
        .attr('aria-valuenow', 0)
        .attr('aria-valuemax', 0);

    $('#playlist tbody tr').removeAttr('style');
}


function on_poll_success(mpd_status) {
    if (mpd_status.state != 'stop') {
        update_currentsong();
        on_state_play(mpd_status);
    } else {
        on_state_stop();
    }

    update_controls(mpd_status);

    if (page == '/playlist' && mpd_status.playlist != playlist) {
        update_playlist(mpd_status.playlist);
    }

    if (mpd_status.updating_db) {
        alert_db_update_in_progress();
        updating_db = true;
    } else {
        if (updating_db) {
            alert_db_update_finished();
            if (page == '/library') update_artists();
            hide_alert();
            updating_db = false;
        }
    }
}

function on_poll_error() {
    on_state_stop();
}

function poll() {
    var timeout;
    $.ajax({
        url: $SCRIPT_ROOT + '/poller/status',
        dataType: 'json',
        success: function(mpd_status) {
            on_poll_success(mpd_status);
            timeout = 500;
        },
        error: function() {
            on_poll_error();
            timeout = 5000;
        },
        complete: function() {
            setTimeout(poll, timeout);
        }
    });
}


$(document).ready(function() {
    poll();
});


// helpers
function seconds_to_dhms(seconds) {
    var m = parseInt(seconds/60), s = seconds%60;
    var h = parseInt(m/60); m = m%60;
    var d = parseInt(h/24); h = h%24;
    return [d, h, m, s];
}

function seconds_to_str(seconds) {
    var dhms = seconds_to_dhms(seconds);
    var d = dhms[0], h = dhms[1], m = dhms[2], s = dhms[3];
    var str = ((m > 9) ? m : '0' + m) + ':' + ((s > 9) ? s : '0' + s);
    if (h > 0) {
        str = ((h > 9) ? h : '0' + h) + ':' + str;
    }
    if (d > 0) {
        str = d.toString() + 'd ' + str;
    }
    return str;
}

