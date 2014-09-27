var playback_options = {consume: 0, random: 0, repeat: 0, single: 0};
var volume;
var volume_off = 0; // allows to toggle mute
var playlist; // playlist version
var updating_db = false;


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

function bind_nav_playlist_commands() {
    $('#nav-pl-clear').click(function(event) {
        $.get($SCRIPT_ROOT + '/mpd/clear');
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

    update_playback_options(mpd_status);

    volume = parseInt(mpd_status.volume);
    $('#status-volume').text(volume);

    if (mpd_status.playlist != playlist && page == '/playlist') {
        update_playlist(mpd_status.playlist);
    }

    if (mpd_status.updating_db) {
        $('#nav-lib-updating').show();
        updating_db = true;
    } else {
        $('#nav-lib-updating').hide();
        if (updating_db) {
            if (page == '/library') update_library_artists();
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


$(document).ready(function() {
    bind_playback_controls();
    bind_playback_options();
    bind_volume_controls();
    bind_nav_playlist_commands();
    bind_nav_database_commands();
    if (page != '/about') {
        poll();
    } else {
        // update navbar
        var attr = $('#nav-about').attr('class');
        $('#nav-about').attr('class', attr + ' active');
    }
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

