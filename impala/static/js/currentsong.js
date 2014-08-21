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


function on_poll_status_success(status) {
    $('#status-bitrate').text(status.bitrate);
    var time = status.time.split(':');
    var progress = time[0] / time[1] * 100;
    $('.progress-bar').css('width', progress+'%')
        .attr('aria-valuenow', time[0])
        .attr('aria-valuemax', time[1]);
    if (status.playlist != playlist) {
        $.ajax({
            url: $SCRIPT_ROOT + '/mpd/playlistinfo',
            dataType: 'json',
            success: function(playlistinfo) {
                populate_playlist(playlistinfo);
                playlist = status.playlist;
            }
        });
    }
}

function on_poll_status_error() {
    $('#status-bitrate').text('');
}

function poll_status() {
    var timeout;
    $.ajax({
        url: $SCRIPT_ROOT + '/poller/status',
        dataType: 'json',
        success: function(status) {
            on_poll_status_success(status);
            timeout = 500;
        },
        error: function() {
            on_poll_status_error();
            timeout = 5000;
        },
        complete: function() {
            setTimeout(poll_status, timeout);
        }
    });
}

function on_poll_currentsong_success(currentsong) {
    $('#currentsong-artist').text(currentsong.artist);
    $('#currentsong-title').text(currentsong.title);
    $('#currentsong-album').text(currentsong.album);
    $('#currentsong-date').text(currentsong.date);
}

function on_poll_currentsong_error() {
    $('#currentsong-artist').text('');
    $('#currentsong-title').text('');
    $('#currentsong-album').text('');
    $('#currentsong-date').text('');
}

function poll_currentsong() {
    var timeout;
    $.ajax({
        url: $SCRIPT_ROOT + '/poller/currentsong',
        dataType: 'json',
        success: function(currentsong) {
            on_poll_currentsong_success(currentsong);
            timeout = 500;
        },
        error: function() {
            on_poll_currentsong_error();
            timeout = 5000;
        },
        complete: function() {
            resize_playlist();
            setTimeout(poll_currentsong, timeout);
        }
    });
}


$(document).ready(function() {
    bind_playback_controls();
    bind_clear_playlist();

    poll_status();
    poll_currentsong();
    (function get_currentsong_time() {
        $.ajax({
            url: $SCRIPT_ROOT + '/poller/pretty_currentsong_time',
            dataType: 'json',
            success: function(time) {
                $('#time-elapsed').text(time.elapsed);
                $('#time-total').text(time.total);
                setTimeout(get_currentsong_time, 500);
            },
            error: function() {
                $('#time-elapsed').text('');
                $('#time-total').text('');
                setTimeout(get_currentsong_time, 5000);
            }
        });
    })();
    $(window).resize(function() {
        resize_playlist();
    });
});
