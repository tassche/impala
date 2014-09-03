var volume;
var volume_off = 0; // allows to toggle mute
var playlist; // playlist version


function Album(artist, date, title) {
    this.artist = (artist instanceof Array) ? artist[0] : artist;
    this.date = date;
    this.title = title;
}

Album.prototype.equals = function(album) {
    return album !== null && typeof album !== 'undefined'
        && this.artist == album.artist && this.date == album.date
        && this.title == album.title;
};


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
            $('<td class="text-right">').text(song.date),
            $('<td class="text-right">').text(seconds_to_str(song.time)),
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

function populate_library_artists(artists) {
    // clear existing artists
    $('#lib-artists tbody tr').remove();
    // populate artist table
    $.each(artists, function(i, artist) {
        if (artist != '') {
            $('<tr>').append(
                $('<td>').html(artist)
            ).appendTo('#lib-artists');
        }
    });
    // find the first artist with a non empty name and update the albums
    var i = 0, artist = '';
    while(artist == '' && i < artists.length) {
        artist = artists[i];
        i++;
    }
    update_library_albums(artist);
    // bind click handler
    $('#lib-artists tbody tr').click(function(event) {
        update_library_albums($(this).find('td').text());
    });
}

function populate_library_albums(albums) {
    // clear existing albums
    $('#lib-albums tbody tr').remove();
    // populate album table
    $.each(albums, function(i, album) {
        if (album.title != '') {
            $('<tr>').append(
                $('<td class="lib-album-artist">').text(album.artist),
                $('<td class="lib-album-date">').text(album.date),
                $('<td class="lib-album-title">').text(album.title)
            ).appendTo('#lib-albums');
        }
    });
    // hide the artist column
    $('#lib-albums tbody tr td.lib-album-artist').hide();
    // find the first album with a non empty title and update the songs
    var i = 0, album = null;
    while(album === null && i < albums.length) {
        if (albums[i].title != '') album = albums[i];
        i++;
    }
    update_library_songs(album);
    // bind click handler
    $('#lib-albums tbody tr').click(function(event) {
        update_library_songs(new Album(
            $(this).find('td.lib-album-artist').text(),
            $(this).find('td.lib-album-date').text(),
            $(this).find('td.lib-album-title').text()
        ));
    });
}

function populate_library_songs(songs) {
    // clear existing songs
    $('#lib-songs tbody tr').remove();
    // populate song table
    $.each(songs, function(i, song) {
        $('<tr>').append(
            $('<td>').text(song.track),
            $('<td>').text(song.title)
        ).appendTo('#lib-songs');
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
}

function on_state_stop() {
    $('#currentsong-artist').text('');
    $('#currentsong-title').text('Impala');
    $('#currentsong-album').text('');
    $('#currentsong-date').text('');

    $('#status-bitrate').text('0');

    $('#time-elapsed').text('00:00');
    $('#time-total').text('00:00');

    $('#time-progress').css('width', 0)
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
        complete: resize_components
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

function update_library_artists() {
    $.ajax({
        url: $SCRIPT_ROOT + '/mpd/list?albumartist',
        dataType: 'json',
        success: populate_library_artists
    });
}

function update_library_albums(artist) {
    $.ajax({
        url: $SCRIPT_ROOT + '/mpd/find?'
            + 'albumartist=' + encodeURIComponent(artist),
        dataType: 'json',
        success: function(songs) {
            var albums = [], last_album; // js has no set object
            for (var i = 0; i < songs.length; i++) {
                var album = new Album(
                    songs[i].albumartist, songs[i].date, songs[i].album
                );
                if (!album.equals(last_album)) {
                    albums.push(album);
                    last_album = album;
                }
            }
            populate_library_albums(albums);
        }
    });
}

function update_library_songs(album) {
    $.ajax({
        url: $SCRIPT_ROOT + '/mpd/find?'
            + 'albumartist=' + encodeURIComponent(album.artist)
            + '&album=' + encodeURIComponent(album.title)
            + '&date=' + encodeURIComponent(album.date),
        dataType: 'json',
        success: populate_library_songs
    });
}


function on_poll_success(mpd_status) {
    if (mpd_status.state != 'stop') {
        update_currentsong();
        on_state_play(mpd_status);
    } else {
        on_state_stop();
    }
    volume = parseInt(mpd_status.volume);
    $('#status-volume').text(volume);
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


function resize_components() {
    var height = (
        $(window).height() - ($('div.jumbotron.currentsong').outerHeight(true)
                              + $('div.controls').outerHeight(true))
    );
    $('div.playlist').css('height', height);
    $('div.library').css('height', height);
    $('div.library > div.col-md-4').css('height', height);
}


$(document).ready(function() {
    bind_playback_controls();
    bind_volume_controls();
    bind_clear_playlist();
    poll();
    $(window).resize(resize_components);
    update_library_artists();
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
