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
    LAYOUT.resize_components();
}

function hide_alert() {
    setTimeout(function() {
        alert_div.hide();
        LAYOUT.resize_components();
    }, 3000);
}


LAYOUT = {
    viewport: undefined, // viewport class (xs, sm, md or lg)

    init: function() {
        LAYOUT.viewport = get_viewport_class();
        LAYOUT.resize_components();

        $(window).resize(function() {
            LAYOUT.viewport = get_viewport_class();
            LAYOUT.resize_components();
        });
    },

    resize_components: function() {
        var height = $(window).height();

        height -= 50; // body padding-top
        height -= $('#alert:visible').outerHeight(true);
        height -= $('#currentsong-mini').outerHeight(true);
        height -= $('#controls').outerHeight(true);
        height -= $('#quicknav').outerHeight(true);

        height -= $('#lib-breadcrumbs').outerHeight(true);

        $('#content').css('height', height);
        $('#content .content').css('height', height);

        if (LAYOUT.viewport == 'sm') {
            var margin = 20;
            $('#lib-albums').css('height', (height-margin)/2);
            $('#lib-songs').css('height', (height-margin)/2);
        }
    }
}

NAVBAR = {
    active_element: undefined,

    init: function() {
        NAVBAR.bind_playlist_commands();
        NAVBAR.bind_database_commands();
    },

    bind_playlist_commands: function() {
        $('#nav-pl-clear').click(function(event) {
            $.ajax({
                url: $SCRIPT_ROOT + '/mpd/clear',
                dataType: 'text',
                success: alert_playlist_cleared
            });
        });
    },

    bind_database_commands: function() {
        $('#nav-lib-update').click(function(event) {
            $.get($SCRIPT_ROOT + '/mpd/update');
        });
        $('#nav-lib-rescan').click(function(event) {
            $.get($SCRIPT_ROOT + '/mpd/rescan');
        });
    },

    update: function() {
        if (typeof NAVBAR.active_element !== 'undefined') {
            append_css_class(NAVBAR.active_element, 'active');
        }
    }
}

QUICKNAV = {
    active_element: undefined,

    update: function() {
        if (typeof QUICKNAV.active_element !== 'undefined') {
            append_css_class(QUICKNAV.active_element, 'btn-info');
        }
    }
}

CURRENTSONG = {
    fetch: function() {
        $.ajax({
            url: $SCRIPT_ROOT + '/poller/currentsong',
            dataType: 'json',
            success: CURRENTSONG.update,
            error: function() {
                CURRENTSONG.update();
            },
            complete: LAYOUT.resize_components
        });
    },

    update: function(currentsong) {
        if (typeof currentsong !== 'undefined') {
            $('#currentsong-artist').text(currentsong.artist);
            $('#currentsong-title').text(currentsong.title);
            $('#currentsong-album').text(currentsong.album);
            $('#currentsong-date').text(currentsong.date);
        } else {
            $('#currentsong-artist').text('');
            $('#currentsong-title').text('');
            $('#currentsong-album').text('');
            $('#currentsong-date').text('');
        }
    }
}

CONTROLS = {
    playback_options: {consume: 0, random: 0, repeat: 0, single: 0},
    volume: -1,
    volume_off: 0, // allows to toggle mute

    init: function() {
        CONTROLS.bind_playback_controls();
        CONTROLS.bind_playback_options();
        CONTROLS.bind_volume_controls();
    },

    bind_playback_controls: function() {
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
    },

    bind_playback_options: function() {
        var options = ['consume', 'random', 'repeat', 'single'];
        $.each(options, function(i, option) {
            $('#' + option).click(function(event) {
                var state = (CONTROLS.playback_options[option] > 0) ? 0 : 1;
                $.get($SCRIPT_ROOT + '/mpd/' + option + '?' + state);
            });
        });
    },

    bind_volume_controls: function() {
        $('#volume-down').click(function(event) {
            var new_volume = (CONTROLS.volume < 5) ? 0 : CONTROLS.volume-5;
            $.get($SCRIPT_ROOT + '/mpd/setvol?' + new_volume);
        });
        $('#volume-up').click(function(event) {
            var new_volume = (CONTROLS.volume > 95) ? 100 : CONTROLS.volume+5;
            $.get($SCRIPT_ROOT + '/mpd/setvol?' + new_volume);
        });
        $('#volume-off').click(function(event) {
            new_volume = (CONTROLS.volume_off > 0) ? CONTROLS.volume_off : 0;
            CONTROLS.volume_off = (CONTROLS.volume_off > 0) ? 0 : CONTROLS.volume;
            $.get($SCRIPT_ROOT + '/mpd/setvol?' + new_volume);
        });
    },

    update: function(mpd_status) {
        CONTROLS.volume = parseInt(mpd_status.volume);
        CONTROLS.update_playback_options(mpd_status);
        CONTROLS.update_volume_label(CONTROLS.volume);
    },

    update_playback_options: function(mpd_status) {
        var options = ['consume', 'random', 'repeat', 'single'];
        $.each(options, function(i, option) {
            CONTROLS.playback_options[option] = parseInt(mpd_status[option]);
            var attr = $('#' + option).attr('class');
            if (CONTROLS.playback_options[option] > 0) {
                $('#' + option).attr('class', attr + ' btn-info');
            } else {
                var index = attr.indexOf(' btn-info');
                if (index > -1) {
                    $('#' + option).attr('class', attr.substring(0, index));
                }
            }
        });
    },

    update_volume_label: function(volume) {
        $('#status-volume').text(volume);
    }
}

POLLER = {
    page: window.location.pathname,
    updating_db: false,

    on_state_play: function(mpd_status) {
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
    },

    on_state_stop: function() {
        CURRENTSONG.update();

        $('#status-bitrate').text('0');

        $('#time-elapsed').text('00:00');
        $('#time-total').text('00:00');

        $('#time-progress').css('width', 0)
            .attr('aria-valuenow', 0)
            .attr('aria-valuemax', 0);

        $('#playlist tbody tr').removeAttr('style');
    },

    on_poll_success: function(mpd_status) {
        if (mpd_status.state != 'stop') {
            CURRENTSONG.fetch();
            POLLER.on_state_play(mpd_status);
        } else {
            POLLER.on_state_stop();
        }

        CONTROLS.update(mpd_status);

        if (POLLER.page == '/playlist' && mpd_status.playlist != playlist) {
            update_playlist(mpd_status.playlist);
        }

        if (mpd_status.updating_db) {
            alert_db_update_in_progress();
            POLLER.updating_db = true;
        } else {
            if (POLLER.updating_db) {
                alert_db_update_finished();
                if (POLLER.page == '/library') update_artists();
                hide_alert();
                POLLER.updating_db = false;
            }
        }
    },

    on_poll_error: function() {
        POLLER.on_state_stop();
    },

    poll: function() {
        var timeout;
        $.ajax({
            url: $SCRIPT_ROOT + '/poller/status',
            dataType: 'json',
            success: function(mpd_status) {
                POLLER.on_poll_success(mpd_status);
                timeout = 500;
            },
            error: function() {
                POLLER.on_poll_error();
                timeout = 5000;
            },
            complete: function() {
                setTimeout(POLLER.poll, timeout);
            }
        });
    }
}



$(document).ready(function() {
    NAVBAR.init();
    NAVBAR.update();

    QUICKNAV.update();

    LAYOUT.init();

    CONTROLS.init();
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

function append_css_class(element, css_class) {
    element.attr('class', element.attr('class') + ' ' + css_class);
}

