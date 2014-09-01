function bind_playback_controls() {
    var elements = [
        ['#play', '/mpd/play'],
        ['#pause', '/mpd/pause?1'],
        ['#stop', '/mpd/stop'],
        ['#previous', '/mpd/previous'],
        ['#next', '/mpd/next']
    ];
    $.each(elements, function(i, element) {
        $(element[0]).click(function(event) {
            $.get($SCRIPT_ROOT + element[1]);
        });
    });
}


var playlist; // playlist version

function bind_clear_playlist() {
    $('#playlist thead tr th.pl_rm').click(function(event) {
        event.stopPropagation();
        $.get($SCRIPT_ROOT + '/mpd/clear');
    });
}

function populate_playlist(playlistinfo) {
    // clear existing playlist
    $('#playlist tbody tr').remove();
    // populate playlist
    $.each(playlistinfo, function(i, song) {
        $('<tr>').append(
            $('<td class="pl_pos">').text(song.pos),
            $('<td>').text(song.track),
            $('<td>').text(song.title),
            $('<td>').text(song.artist),
            $('<td>').text(song.album),
            $('<td>').text(song.date),
            $('<td>').text(song.time),
            $('<td class="pl_rm">').html(
                '<span class="glyphicon glyphicon-remove"></span>'
            )
        ).appendTo('#playlist');
    });
    // hide the pos column
    $('#playlist tbody tr td.pl_pos').hide();
    // bind play and delete handlers
    $('#playlist tbody tr').click(function(event) {
        var pos = $(this).find('td.pl_pos').text();
        $.get($SCRIPT_ROOT + '/mpd/play?' + pos);
    });
    $('#playlist tbody tr td.pl_rm').click(function(event) {
        event.stopPropagation();
        var pos = $(this).closest('tr').find('td.pl_pos').text();
        $.get($SCRIPT_ROOT + '/mpd/delete?' + pos);
    });
}

function resize_playlist() {
    var height = (
        $(window).height() - ($('div.jumbotron.currentsong').outerHeight(true)
                              + $('div.controls').outerHeight(true))
    );
    $('div.playlist').css('height', height);
}


function on_state_play(mpd_status) {
    $('#status-bitrate').text(mpd_status.bitrate);

    var time = mpd_status.time.split(':');
    $('#time-elapsed').text(seconds_to_str(time[0]));
    $('#time-total').text(seconds_to_str(time[1]));

    var progress = time[0] / time[1] * 100;
    $('.progress-bar').css('width', progress+'%')
        .attr('aria-valuenow', time[0])
        .attr('aria-valuemax', time[1]);
}

function on_state_stop() {
    $('#currentsong-artist').text('');
    $('#currentsong-title').text('Impala');
    $('#currentsong-album').text('');
    $('#currentsong-date').text('');

    $('#status-bitrate').text('0');

    $('#time-elapsed').text('00:00');
    $('#time-total').text('00:00');

    $('.progress-bar').css('width', 0)
        .attr('aria-valuenow', 0)
        .attr('aria-valuemax', 0);
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
        complete: resize_playlist
    });
}

function update_playlist(version) {
    $.ajax({
        url: $SCRIPT_ROOT + '/mpd/playlistinfo',
        dataType: 'json',
        success: function(playlistinfo) {
            populate_playlist(playlistinfo);
            playlist = version;
        }
    });
}


function on_poll_success(mpd_status) {
    if (mpd_status.state != 'stop') {
        update_currentsong();
        on_state_play(mpd_status);
    } else {
        on_state_stop();
    }
    if (mpd_status.playlist != playlist) {
        update_playlist(mpd_status.playlist);
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
    bind_playback_controls();
    bind_clear_playlist();
    poll();
    $(window).resize(resize_playlist);
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
