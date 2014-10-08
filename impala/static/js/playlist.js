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

// playlist.js //
// requires impala.js (helpers)


var playlist; // playlist version


function bind_clear_command() {
    $('#playlist thead tr th.pl-rm').click(function(event) {
        event.stopPropagation();
        $.get($SCRIPT_ROOT + '/mpd/clear');
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


function populate_playlist(playlistinfo) {
    // clear existing playlist
    $('#playlist tbody tr').remove();
    // populate playlist
    $.each(playlistinfo, function(i, song) {
        $('<tr>').append(
            $('<td class="pl-pos">').text(song.pos),
            $('<td class="pl-track hidden-xs no-stretch">').text(song.track),
            $('<td class="pl-title hidden-xs">').text(song.title),
            $('<td class="pl-artist hidden-xs">').text(song.artist),
            $('<td class="pl-album hidden-xs">').text(song.album),
            $('<td class="pl-date hidden-xs no-stretch text-right">').text(
                song.date
            ),
            $('<td class="pl-time hidden-xs no-stretch text-right">').text(
                seconds_to_str(song.time)
            ),
            $('<td class="pl-xs hidden-sm hidden-md hidden-lg">').html(
                '<p>' + song.title + '</p>' +
                '<p class="text-muted"><small>' +
                    song.artist + ' - ' + song.album +
                '</small></p>'
            ),
            $('<td class="pl-rm no-stretch">').html(
                '<span class="glyphicon glyphicon-remove"></span>'
            )
        ).appendTo('#playlist');
    });
    // hide the pos column
    $('#playlist tbody tr td.pl-pos').hide();
    // bind handlers
    $('#playlist tbody tr').click(on_song_clicked);
    $('#playlist tbody tr td.pl-rm').click(on_song_delete_clicked);
}


function on_song_clicked(event) {
    var pos = $(this).find('td.pl-pos').text();
    $.get($SCRIPT_ROOT + '/mpd/play?' + pos);
}

function on_song_delete_clicked(event) {
    event.stopPropagation();
    var pos = $(this).closest('tr').find('td.pl-pos').text();
    $.get($SCRIPT_ROOT + '/mpd/delete?' + pos);
}


$(document).ready(function() {
    bind_clear_command();
});

