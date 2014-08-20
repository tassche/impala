var playlist; // playlist version

function populate_playlist(playlistinfo) {
    $.each(playlistinfo, function(i, song) {
        $('<tr>').append(
            $('<td>').text(song.track),
            $('<td>').text(song.title),
            $('<td>').text(song.artist),
            $('<td>').text(song.album),
            $('<td>').text(song.date),
            $('<td>').text(song.time)
        ).appendTo('#playlist');
    });
}

function resize_playlist() {
    var height = (
        $(window).height() - ($('div.jumbotron.currentsong').outerHeight(true)
                              + $('div.controls').outerHeight(true))
    );
    $('div.playlist').css('height', height);
}

$(document).ready(function() {
    $('#play').click(function(event) {
        $.get($SCRIPT_ROOT + '/mpd/play');
    });
    $('#pause').click(function(event) {
        $.get($SCRIPT_ROOT + '/mpd/pause?1');
    });
    $('#stop').click(function(event) {
        $.get($SCRIPT_ROOT + '/mpd/stop');
    });
    $('#previous').click(function(event) {
        $.get($SCRIPT_ROOT + '/mpd/previous');
    });
    $('#next').click(function(event) {
        $.get($SCRIPT_ROOT + '/mpd/next');
    });
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
            },
        });
    })();
    (function get_currentsong() {
        $.ajax({
            url: $SCRIPT_ROOT + '/poller/currentsong',
            dataType: 'json',
            success: function(currentsong) {
                $('#currentsong-artist').text(currentsong.artist);
                $('#currentsong-title').text(currentsong.title);
                $('#currentsong-album').text(currentsong.album);
                $('#currentsong-date').text(currentsong.date);
                setTimeout(get_currentsong, 500);
            },
            error: function() {
                $('#currentsong-artist').text('');
                $('#currentsong-title').text('');
                $('#currentsong-album').text('');
                setTimeout(get_currentsong, 5000);
            },
            complete: resize_playlist
        });
    })();
    (function get_status() {
        $.ajax({
            url: $SCRIPT_ROOT + '/poller/status',
            dataType: 'json',
            success: function(status) {
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
                setTimeout(get_status, 500);
            },
            error: function() {
                $('#status-bitrate').text('');
                setTimeout(get_status, 5000);
            },
        });
    })();
    $(window).resize(function() {
        resize_playlist();
    });
});
