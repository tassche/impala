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


/// ALERTS ///

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


/// LAYOUT ///

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


/// NAVIGATION ///

function bind_nav_playlist_commands() {
    $('#nav-pl-clear').click(function(event) {
        $.ajax({
            url: $SCRIPT_ROOT + '/mpd/clear',
            dataType: 'text',
            success: alert_playlist_cleared
        });
    });
}

function bind_nav_database_commands() {
    $('#nav-lib-update').click(function(event) {
        $.get($SCRIPT_ROOT + '/mpd/update');
    });
    $('#nav-lib-rescan').click(function(event) {
        $.get($SCRIPT_ROOT + '/mpd/rescan');
    });
}


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


/// CONTROLS ///

var playback_options = {consume: 0, random: 0, repeat: 0, single: 0};
var volume;
var volume_off = 0; // allows to toggle mute


function bind_playback_controls() {
    var elements = [
        ['#play', 'play'],
        ['#pause', 'pause?1'],
        ['#stop', 'stop'],
        ['#previous', 'previous'],
        ['#next', 'next']
    ];
    $.each(elements, function(i, element) {
        $(element[0]).click(function(event) {
            $.get($SCRIPT_ROOT + '/mpd/' + element[1]);
        });
    });
}

function bind_playback_options() {
    var options = ['consume', 'random', 'repeat', 'single'];
    $.each(options, function(i, option) {
        $('#' + option).click(function(event) {
            var state = (playback_options[option] > 0) ? 0 : 1;
            $.get($SCRIPT_ROOT + '/mpd/' + option + '?' + state);
        });
    });
}

function bind_volume_controls() {
    $('#volume-down').click(function(event) {
        var new_volume = (volume < 5) ? 0 : volume-5;
        $.get($SCRIPT_ROOT + '/mpd/setvol?' + new_volume);
    });
    $('#volume-up').click(function(event) {
        var new_volume = (volume > 95) ? 100 : volume+5;
        $.get($SCRIPT_ROOT + '/mpd/setvol?' + new_volume);
    });
    $('#volume-off').click(function(event) {
        new_volume = (volume_off > 0) ? volume_off : 0;
        volume_off = (volume_off > 0) ? 0 : volume;
        $.get($SCRIPT_ROOT + '/mpd/setvol?' + new_volume);
    });
}


function update_controls(mpd_status) {
    volume = parseInt(mpd_status.volume);
    $('#status-volume').text(volume);
    update_playback_options(mpd_status);
}

function update_playback_options(mpd_status) {
    var options = ['consume', 'random', 'repeat', 'single'];
    $.each(options, function(i, option) {
        playback_options[option] = parseInt(mpd_status[option]);
        var attr = $('#' + option).attr('class');
        if (playback_options[option] > 0) {
            $('#' + option).attr('class', attr + ' btn-info');
        } else {
            var index = attr.indexOf(' btn-info');
            if (index > -1) {
                $('#' + option).attr('class', attr.substring(0, index));
            }
        }
    });
}


/// POLLING ///

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
    bind_nav_playlist_commands();
    bind_nav_database_commands();
    update_navigation();

    update_viewport_class();
    resize_components();
    $(window).resize(function() {
        update_viewport_class();
        resize_components();
    });

    bind_playback_controls();
    bind_playback_options();
    bind_volume_controls();
});



/// HELPERS ///

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

