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

// library.js //
// requires layout.js
// requires alerts.js


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


function update_artists() {
    $.ajax({
        url: $SCRIPT_ROOT + '/mpd/list?albumartist',
        dataType: 'json',
        success: populate_artists
    });
}

function update_albums(artist) {
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
            populate_albums(albums);
        }
    });
}

function update_songs(album) {
    $.ajax({
        url: $SCRIPT_ROOT + '/mpd/find?'
            + 'albumartist=' + encodeURIComponent(album.artist)
            + '&album=' + encodeURIComponent(album.title)
            + '&date=' + encodeURIComponent(album.date),
        dataType: 'json',
        success: populate_songs
    });
}


function populate_artists(artists) {
    // clear existing artists
    $('#artists tbody tr').remove();
    // populate artist table
    $.each(artists, function(i, artist) {
        if (artist != '') {
            $('<tr>').append(
                $('<td class="lib-artist-name">').text(artist),
                $('<td class="lib-artist-add no-stretch">')
                    .html('<span class="glyphicon glyphicon-plus"></span>'),
                $('<td class="lib-artist-play no-stretch">')
                    .html('<span class="glyphicon glyphicon-play"></span>')
            ).appendTo('#artists');
        }
    });
    // find the first artist with a non empty name and update the albums
    var i = 0, artist = '';
    while(artist == '' && i < artists.length) {
        artist = artists[i]; i++;
    }
    update_albums(artist);
    // bind handlers
    $('#artists tbody tr').click(on_artist_clicked);
    $('#artists tbody tr td.lib-artist-add').click(on_artist_add_clicked);
    $('#artists tbody tr td.lib-artist-play').click(on_artist_play_clicked);
}

function populate_albums(albums) {
    // clear existing albums
    $('#albums tbody tr').remove();
    // populate album table
    $.each(albums, function(i, album) {
        if (album.title != '') {
            $('<tr>').append(
                $('<td class="lib-album-artist">').text(album.artist),
                $('<td class="lib-album-date no-stretch">').text(album.date),
                $('<td class="lib-album-title">').text(album.title),
                $('<td class="lib-album-add no-stretch">')
                    .html('<span class="glyphicon glyphicon-plus"></span>'),
                $('<td class="lib-album-play no-stretch">')
                    .html('<span class="glyphicon glyphicon-play"></span>')
            ).appendTo('#albums');
        }
    });
    // hide the artist column
    $('#albums tbody tr td.lib-album-artist').hide();
    // find the first album with a non empty title and update the songs
    var i = 0, album = null;
    while(album === null && i < albums.length) {
        if (albums[i].title != '') album = albums[i]; i++;
    }
    update_songs(album);
    // bind handlers
    $('#albums tbody tr').click(on_album_clicked);
    $('#albums tbody tr td.lib-album-add').click(on_album_add_clicked);
    $('#albums tbody tr td.lib-album-play').click(on_album_play_clicked);
}

function populate_songs(songs) {
    // clear existing songs
    $('#songs tbody tr').remove();
    // populate song table
    $.each(songs, function(i, song) {
        $('<tr>').append(
            $('<td class="lib-song-track no-stretch">').text(song.track),
            $('<td class="lib-song-title">').text(song.title),
            $('<td class="lib-song-add no-stretch">')
                .html('<span class="glyphicon glyphicon-plus"></span>'),
            $('<td class="lib-song-play no-stretch">')
                .html('<span class="glyphicon glyphicon-play"></span>'),
            $('<td class="lib-song-artist">').text(song.artist),
            $('<td class="lib-song-file">').text(song.file)
        ).appendTo('#songs');
    });
    // hide the artist and file columns
    $('#songs tbody tr td.lib-song-artist').hide();
    $('#songs tbody tr td.lib-song-file').hide();
    // bind handlers
    $('#songs tbody tr').click(on_song_clicked);
    $('#songs tbody tr td.lib-song-add').click(on_song_add_clicked);
    $('#songs tbody tr td.lib-song-play').click(on_song_play_clicked);
}


function on_artist_clicked(event) {
    var artist = $(this).find('td.lib-artist-name').text();
    // update albums
    update_albums(artist);
    // update breadcrumbs
    $('li.dynamic').detach();
    $('#lib-breadcrumb').append(
        $('<li class="dynamic">').append(breadcrumbs.artist.text(artist))
    );
    // update viewport
    if (viewport == 'xs') {
        $('#lib-artists').hide();
        $('#lib-albums').show();
        resize_components();
    }
}

function on_artist_add_clicked(event) {
    var artist = $(this).closest('tr').find('td.lib-artist-name').text();
    $.ajax({
        url: $SCRIPT_ROOT + '/mpd/findadd?'
            + 'albumartist=' + encodeURIComponent(artist),
        dataType: 'text',
        success: function() {
            alert_added_to_playlist(artist);
        }
    });
}

function on_artist_play_clicked(event) {
    var artist = $(this).closest('tr').find('td.lib-artist-name').text();
    find_add_and_play('albumartist=' + encodeURIComponent(artist), artist);
}

function on_album_clicked(event) {
    var album = new Album(
        $(this).closest('tr').find('td.lib-album-artist').text(),
        $(this).closest('tr').find('td.lib-album-date').text(),
        $(this).closest('tr').find('td.lib-album-title').text()
    );
    // update songs
    update_songs(album);
    // update breadcrumbs
    $('#lib-breadcrumb-album').closest('li.dynamic').detach();
    $('#lib-breadcrumb').append(
        $('<li class="dynamic">').append(breadcrumbs.album.text(album.title))
    );
    // update viewport
    if (viewport == 'xs') {
        $('#lib-albums').hide();
        $('#lib-songs').show();
        resize_components();
    }
}

function on_album_add_clicked(event) {
    var album = new Album(
        $(this).closest('tr').find('td.lib-album-artist').text(),
        $(this).closest('tr').find('td.lib-album-date').text(),
        $(this).closest('tr').find('td.lib-album-title').text()
    );
    $.ajax({
        url: $SCRIPT_ROOT + '/mpd/findadd?'
            + 'albumartist=' + encodeURIComponent(album.artist)
            + '&album=' + encodeURIComponent(album.title)
            + '&date=' + encodeURIComponent(album.date),
        dataType: 'text',
        success: function() {
            alert_added_to_playlist(album.title + ' by ' + album.artist);
        }
    });
}

function on_album_play_clicked(event) {
    var album = new Album(
        $(this).closest('tr').find('td.lib-album-artist').text(),
        $(this).closest('tr').find('td.lib-album-date').text(),
        $(this).closest('tr').find('td.lib-album-title').text()
    );
    find_add_and_play(
        'albumartist=' + encodeURIComponent(album.artist) +
        '&album=' + encodeURIComponent(album.title) +
        '&date=' + encodeURIComponent(album.date),
        album.title + ' by ' + album.artist
    );
}

function on_song_clicked(event) {
    event.stopPropagation();
    var artist = $(this).closest('tr').find('td.lib-song-artist').text();
    var title = $(this).closest('tr').find('td.lib-song-title').text();
    var file = $(this).closest('tr').find('td.lib-song-file').text();
    add_and_play(file, title + ' by ' + artist);
}

function on_song_add_clicked(event) {
    event.stopPropagation();
    var artist = $(this).closest('tr').find('td.lib-song-artist').text();
    var title = $(this).closest('tr').find('td.lib-song-title').text();
    var file = $(this).closest('tr').find('td.lib-song-file').text();
    $.ajax({
        url: $SCRIPT_ROOT + '/mpd/add?' + encodeURIComponent(file),
        dataType: 'text',
        success: function() {
            alert_added_to_playlist(title + ' by ' + artist);
        }
    });
}

function on_song_play_clicked(event) {
    on_song_clicked(event);
}


function add_and_play(file, alert_what) {
    $.ajax({
        url: $SCRIPT_ROOT + '/mpd/addid?' + encodeURIComponent(file),
        dataType: 'text',
        success: function(songid) {
            var songid = encodeURIComponent(songid);
            $.get($SCRIPT_ROOT + '/mpd/playid?' + songid);
            if (alert_what) {
                alert_added_to_playlist(alert_what);
            }
        }
    });
}

function find_add_and_play(query, alert_what) {
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
            if (alert_what) {
                alert_added_to_playlist(alert_what);
            }
        }
    });
}


var breadcrumbs = {
    home: $('<a id="lib-breadcrumb-home" href="#">'),
    artist: $('<a id="lib-breadcrumb-artist" href="#">'),
    album: $('<a id="lib-breadcrumb-album" href="#">')
}

function init_breadcrumbs() {
    $('#lib-breadcrumb').append($('<li>').append(
        breadcrumbs.home.text('Library')
    ));
    breadcrumbs.home.click(function(event) {
        $('#lib-artists').show();
        $('#lib-albums').hide();
        $('#lib-songs').hide();
        $('li.dynamic').detach();
        resize_components();
    });
    breadcrumbs.artist.click(function(event) {
        $('#lib-artists').hide();
        $('#lib-albums').show();
        $('#lib-songs').hide();
        $('#lib-breadcrumb-album').closest('li.dynamic').detach();
        resize_components();
    });
    breadcrumbs.album.click(function(event) {
        $('#lib-artists').hide();
        $('#lib-albums').hide();
        $('#lib-songs').show();
        resize_components();
    });
}


function update_navigation() {
    var attr;
    // navbar
    attr = $('#nav-library').attr('class');
    $('#nav-library').attr('class', attr + ' active');
    // quicknav
    attr = $('#quicknav-library').attr('class');
    $('#quicknav-library').attr('class', attr + ' btn-info');
}

function init_viewport() {
    if (viewport == 'xs') {
        $('#lib-artists').show();
        $('#lib-albums').hide();
        $('#lib-songs').hide();
    } else {
        $('#lib-artists').show();
        $('#lib-albums').show();
        $('#lib-songs').show();
    }
}


$(document).ready(function() {
    update_navigation();
    update_artists();
    init_breadcrumbs();
    init_viewport();
    $(window).resize(init_viewport);
});

