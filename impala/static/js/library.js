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


function populate_library_artists(artists) {
    // clear existing artists
    $('#lib-artists tbody tr').remove();
    // populate artist table
    $.each(artists, function(i, artist) {
        if (artist != '') {
            $('<tr>').append(
                $('<td class="lib-artist-name">').text(artist),
                $('<td class="lib-artist-add">')
                    .html('<span class="glyphicon glyphicon-plus"></span>'),
                $('<td class="lib-artist-play">')
                    .html('<span class="glyphicon glyphicon-play"></span>')
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
        var artist = $(this).find('td').text();
        update_library_albums(artist);

        $('li.dynamic').detach();
        $('#lib-bc').append(
            $('<li class="dynamic">').append(
                breadcrumbs.artist.text(artist)
            )
        );
        if (viewport == 'xs') {
            $('div.col-library.artists').hide();
            $('div.col-library.albums').show();
            resize_components();
        }
    });
    // bind add handler
    $('#lib-artists tbody tr td.lib-artist-add').click(function(event) {
        var artist = $(this).closest('tr').find('td.lib-artist-name').text();
        $.get($SCRIPT_ROOT + '/mpd/findadd?'
            + 'albumartist=' + encodeURIComponent(artist)
        );
    });
    // bind add and play handler
    $('#lib-artists tbody tr td.lib-artist-play').click(function(event) {
        var artist = $(this).closest('tr').find('td.lib-artist-name').text();
        find_add_and_play('albumartist=' + encodeURIComponent(artist));
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
                $('<td class="lib-album-title">').text(album.title),
                $('<td class="lib-album-add">')
                    .html('<span class="glyphicon glyphicon-plus"></span>'),
                $('<td class="lib-album-play">')
                    .html('<span class="glyphicon glyphicon-play"></span>')
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
        var album = $(this).find('td.lib-album-title').text();
        update_library_songs(new Album(
            $(this).find('td.lib-album-artist').text(),
            $(this).find('td.lib-album-date').text(),
            album
        ));

        $('#lib-bc-album').closest('li.dynamic').detach();
        $('#lib-bc').append(
            $('<li class="dynamic">').append(
                breadcrumbs.album.text(album)
            )
        );
        if (viewport == 'xs') {
            $('div.col-library.albums').hide();
            $('div.col-library.songs').show();
            resize_components();
        }
    });
    // bind add handler
    $('#lib-albums tbody tr td.lib-album-add').click(function(event) {
        var album = new Album(
            $(this).closest('tr').find('td.lib-album-artist').text(),
            $(this).closest('tr').find('td.lib-album-date').text(),
            $(this).closest('tr').find('td.lib-album-title').text()
        );
        $.get($SCRIPT_ROOT + '/mpd/findadd?'
            + 'albumartist=' + encodeURIComponent(album.artist)
            + '&album=' + encodeURIComponent(album.title)
            + '&date=' + encodeURIComponent(album.date)
        );
    });
    // bind add and play handler
    $('#lib-albums tbody tr td.lib-album-play').click(function(event) {
        var album = new Album(
            $(this).closest('tr').find('td.lib-album-artist').text(),
            $(this).closest('tr').find('td.lib-album-date').text(),
            $(this).closest('tr').find('td.lib-album-title').text()
        );
        find_add_and_play(
            'albumartist=' + encodeURIComponent(album.artist) +
            '&album=' + encodeURIComponent(album.title) +
            '&date=' + encodeURIComponent(album.date)
        );
    });
}

function populate_library_songs(songs) {
    // clear existing songs
    $('#lib-songs tbody tr').remove();
    // populate song table
    $.each(songs, function(i, song) {
        $('<tr>').append(
            $('<td class="lib-song-track">').text(song.track),
            $('<td class="lib-song-title">').text(song.title),
            $('<td class="lib-song-add">')
                .html('<span class="glyphicon glyphicon-plus"></span>'),
            $('<td class="lib-song-play">')
                .html('<span class="glyphicon glyphicon-play"></span>'),
            $('<td class="lib-song-file">').text(song.file)
        ).appendTo('#lib-songs');
    });
    // hide the file column
    $('#lib-songs tbody tr td.lib-song-file').hide();
    // bind add handler
    $('#lib-songs tbody tr td.lib-song-add').click(function(event) {
        event.stopPropagation();
        var file = $(this).closest('tr').find('td.lib-song-file').text();
        $.get($SCRIPT_ROOT + '/mpd/add?' + encodeURIComponent(file));
    });
    // bind add and play handler
    $('#lib-songs tbody tr, #lib-songs tbody tr td.lib-song-play')
        .click(function(event) {
        event.stopPropagation();
        var file = $(this).closest('tr').find('td.lib-song-file').text();
        add_and_play(file);
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


function add_and_play(file) {
    $.ajax({
        url: $SCRIPT_ROOT + '/mpd/addid?' + encodeURIComponent(file),
        dataType: 'text',
        success: function(songid) {
            var songid = encodeURIComponent(songid);
            $.get($SCRIPT_ROOT + '/mpd/playid?' + songid);
        }
    });
}

function find_add_and_play(query) {
    $.ajax({
        url: $SCRIPT_ROOT + '/mpd/find?' + query,
        dataType: 'json',
        success: function(songs) {
            for (var i = 0; i < songs.length; i++) {
                if (i == 0) {
                    add_and_play(songs[i].file);
                } else {
                    var file = encodeURIComponent(songs[i].file);
                    $.get($SCRIPT_ROOT + '/mpd/add?'+ file);
                }
            }
        }
    });
}


var breadcrumbs = {
    home: $('<a id="lib-bc-home" href="#">'),
    artist: $('<a id="lib-bc-artist" href="#">'),
    album: $('<a id="lib-bc-album" href="#">')
}

function bind_breadcrumbs() {
    breadcrumbs.home.click(function(event) {
        $('div.col-library.artists').show();
        $('div.col-library.albums').hide();
        $('div.col-library.songs').hide();
        $('li.dynamic').detach();
        resize_components();
    });
    breadcrumbs.artist.click(function(event) {
        $('div.col-library.artists').hide();
        $('div.col-library.albums').show();
        $('div.col-library.songs').hide();
        $('#lib-bc-album').closest('li.dynamic').detach();
        resize_components();
    });
    breadcrumbs.album.click(function(event) {
        $('div.col-library.artists').hide();
        $('div.col-library.albums').hide();
        $('div.col-library.songs').show();
        resize_components();
    });
}


function init_xs_viewport() {
    $('div.col-library.albums').hide();
    $('div.col-library.songs').hide();
}


$(document).ready(function() {
    // update navigation
    var attr = $('#nav-lib').attr('class');
    $('#nav-lib').attr('class', attr + ' active');

    attr = $('#quicknav-library').attr('class');
    $('#quicknav-library').attr('class', attr + ' btn-info');

    bind_breadcrumbs();
    $('#lib-bc').append($('<li>').append(
        breadcrumbs.home.text('Library')
    ));
    if (viewport == 'xs') {
        init_xs_viewport();
    }
    $(window).resize(function(event) {
        if (viewport == 'xs') {
            init_xs_viewport();
        } else {
            $('div.col-library.artists').show();
            $('div.col-library.albums').show();
            $('div.col-library.songs').show();
        }
    });

    update_library_artists();
});

