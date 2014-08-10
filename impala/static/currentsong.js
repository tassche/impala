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
            },
            error: function() {
                $('#time-elapsed').text('');
                $('#time-total').text('');
            },
            complete: function() {
                setTimeout(get_currentsong_time, 500);
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
            },
            error: function() {
                $('#currentsong-artist').text('');
                $('#currentsong-title').text('');
                $('#currentsong-album').text('');
            },
            complete: function() {
                setTimeout(get_currentsong, 500);
            },
        });
    })();
});
