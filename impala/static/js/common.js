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

ICONS = {
    add: '<span class="glyphicon glyphicon-plus"></span>',
    play: '<span class="glyphicon glyphicon-play"></span>'
}

ALERTS = {
    element: $('#alert'),
    classes: {
        info    : 'alert alert-info',
        success : 'alert alert-success'
    },
    messages: {
        db_updating : 'Database update in progress...',
        db_updated  : 'Database update finished.',
        pl_added_x  : '{x} added to playlist.',
        pl_cleared  : 'Playlist cleared.'
    },

    show: function(css_class, message) {
        ALERTS.element.attr('class', css_class);
        ALERTS.element.text(message);
        ALERTS.element.show();
        LAYOUT.resize_components();
    },

    hide: function() {
        setTimeout(function() {
            ALERTS.element.hide();
            LAYOUT.resize_components();
        }, 3000);
    },

    alert_db_update_in_progress: function() {
        ALERTS.show(ALERTS.classes.info, ALERTS.messages.db_updating);
    },

    alert_db_update_finished: function() {
        ALERTS.show(ALERTS.classes.success, ALERTS.messages.db_updated);
        ALERTS.hide();
    },

    alert_added_to_playlist: function(description) {
        ALERTS.show(ALERTS.classes.success,
            ALERTS.messages.pl_added_x.replace('{x}', description));
        ALERTS.hide();
    },

    alert_playlist_cleared: function() {
        ALERTS.show(ALERTS.classes.success, ALERTS.messages.pl_cleared);
        ALERTS.hide();
    }
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
                success: ALERTS.alert_playlist_cleared
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

STATUS = {
    update: function(mpd_status) {
        if (typeof mpd_status !== 'undefined') {
            STATUS.update_bitrate(mpd_status.bitrate);
            STATUS.update_time(mpd_status.time);
        } else {
            STATUS.update_bitrate();
            STATUS.update_time();
        }
    },

    update_bitrate: function(bitrate) {
        $('#status-bitrate').text(bitrate || '0');
    },

    update_time: function(time) {
        if (typeof time === 'undefined') time = '0:0';

        time = time.split(':');
        $('#time-elapsed').text(seconds_to_str(time[0]));
        $('#time-total').text(seconds_to_str(time[1]));

        var progress = time[0] / time[1] * 100;
        $('#time-progress').css('width', progress+'%')
            .attr('aria-valuenow', time[0])
            .attr('aria-valuemax', time[1]);
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

    on_poll_success: function(mpd_status) {
        if (mpd_status.state != 'stop') {
            CURRENTSONG.fetch();
            STATUS.update(mpd_status);
            PLAYLIST.currentsong(mpd_status.song)
        } else {
            CURRENTSONG.update();
            STATUS.update();
            PLAYLIST.currentsong()
        }

        CONTROLS.update(mpd_status);

        if (POLLER.page == '/playlist' && mpd_status.playlist != PLAYLIST.version) {
            PLAYLIST.fetch(mpd_status.playlist);
        }

        if (mpd_status.updating_db) {
            POLLER.updating_db = true;
            ALERTS.alert_db_update_in_progress();
        } else {
            if (POLLER.updating_db) {
                if (POLLER.page == '/library') LIBRARY.artists.fetch();
                POLLER.updating_db = false;
                ALERTS.alert_db_update_finished();
            }
        }
    },

    on_poll_error: function() {
        CURRENTSONG.update();
        STATUS.update();
        PLAYLIST.currentsong()
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

PLAYLIST = {
    version: undefined,

    init: function() {
        PLAYLIST.bind_clear_command();
    },

    bind_clear_command: function() {
        $('#playlist thead tr th.pl-rm').click(function(event) {
            event.stopPropagation();
            $.get($SCRIPT_ROOT + '/mpd/clear');
        });
    },

    fetch: function(version) {
        $.ajax({
            url: $SCRIPT_ROOT + '/mpd/playlistinfo',
            dataType: 'json',
            success: function(playlistinfo) {
                PLAYLIST.populate(playlistinfo);
                PLAYLIST.version = version;
            }
        });
    },

    populate: function(playlistinfo) {
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
        $('#playlist tbody tr').click(PLAYLIST.on_song_clicked);
        $('#playlist tbody tr td.pl-rm').click(PLAYLIST.on_song_delete_clicked);
    },

    currentsong: function(pos) {
        $('#playlist tbody tr').removeAttr('style');

        if (typeof pos !== 'undefined') {
            $('#playlist tbody tr td.pl-pos').filter(function() {
                return $(this).text() === pos;
            }).closest('tr').css('font-weight', 'bold');
        }
    },

    on_song_clicked: function(event) {
        var pos = $(this).find('td.pl-pos').text();
        $.get($SCRIPT_ROOT + '/mpd/play?' + pos);
    },

    on_song_delete_clicked: function(event) {
        event.stopPropagation();
        var pos = $(this).closest('tr').find('td.pl-pos').text();
        $.get($SCRIPT_ROOT + '/mpd/delete?' + pos);
    }
}

LIBRARY = {
    breadcrumbs: {
        elements: {
            home: $('<a id="lib-breadcrumb-home" href="#">'),
            artist: $('<a id="lib-breadcrumb-artist" href="#">'),
            album: $('<a id="lib-breadcrumb-album" href="#">')
        },

        init: function() {
            $('#lib-breadcrumb').append($('<li>').append(
                LIBRARY.breadcrumbs.elements.home.text('Library')
            ));
            LIBRARY.breadcrumbs.elements.home.click(function(event) {
                $('li.dynamic').detach();
                LIBRARY.viewport.show_artists();
            });
            LIBRARY.breadcrumbs.elements.artist.click(function(event) {
                $('#lib-breadcrumb-album').closest('li.dynamic').detach();
                LIBRARY.viewport.show_albums();
            });
            LIBRARY.breadcrumbs.elements.album.click(function(event) {
                LIBRARY.viewport.show_songs();
            });
        },

        set_artist: function(artist) {
            $('li.dynamic').detach();
            $('#lib-breadcrumb').append(
                $('<li class="dynamic">').append(
                    LIBRARY.breadcrumbs.elements.artist.text(artist)
                )
            );
        },

        set_album: function(album) {
            $('#lib-breadcrumb-album').closest('li.dynamic').detach();
            $('#lib-breadcrumb').append(
                $('<li class="dynamic">').append(
                    LIBRARY.breadcrumbs.elements.album.text(album)
                )
            );
        }
    },

    viewport: {
        show_artists: function() {
            if (LAYOUT.viewport == 'xs') {
                $('#lib-artists').show();
                $('#lib-albums').hide();
                $('#lib-songs').hide();
            } else {
                LIBRARY.viewport.show_all();
            }
            LAYOUT.resize_components();
        },

        show_albums: function() {
            if (LAYOUT.viewport == 'xs') {
                $('#lib-artists').hide();
                $('#lib-albums').show();
                $('#lib-songs').hide();
            } else {
                LIBRARY.viewport.show_all();
            }
            LAYOUT.resize_components();
        },

        show_songs: function() {
            if (LAYOUT.viewport == 'xs') {
                $('#lib-artists').hide();
                $('#lib-albums').hide();
                $('#lib-songs').show();
            } else {
                LIBRARY.viewport.show_all();
            }
            LAYOUT.resize_components();
        },

        show_all: function() {
            $('#lib-artists').show();
            $('#lib-albums').show();
            $('#lib-songs').show();
        }
    },

    init: function() {
        LIBRARY.artists.fetch();
        LIBRARY.breadcrumbs.init();
        LIBRARY.viewport.show_artists();
        $(window).resize(LIBRARY.viewport.show_artists);
    },

    artists: {
        fetch: function() {
            $.ajax({
                url: $SCRIPT_ROOT + '/mpd/list?' + artist_tag,
                dataType: 'json',
                success: LIBRARY.artists.populate
            });
        },

        populate: function(artists) {
            var td_artist = '<td class="lib-artist-name">',
                td_add = '<td class="lib-artist-add no-stretch">',
                td_play = '<td class="lib-artist-play no-stretch">';

            $('#artists tbody tr').remove();
            $.each(artists, function(i, artist) {
                if (artist != '') {
                    $('<tr>').append(
                        $(td_artist).text(artist),
                        $(td_add).html(ICONS.add),
                        $(td_play).html(ICONS.play)
                    ).appendTo('#artists');
                }
            });

            LIBRARY.albums.fetch(first_not_empty_string(artists));

            // bind handlers
            $('#artists tbody tr').click(LIBRARY.artists.on_row_clicked);
            $('#artists tbody tr td.lib-artist-add')
                .click(LIBRARY.artists.on_add_clicked);
            $('#artists tbody tr td.lib-artist-play')
                .click(LIBRARY.artists.on_play_clicked);
        },

        on_row_clicked: function(event) {
            var artist = $(this).find('td.lib-artist-name').text();
            LIBRARY.albums.fetch(artist);
            LIBRARY.breadcrumbs.set_artist(artist);
            LIBRARY.viewport.show_albums();
        },

        on_add_clicked: function(event) {
            var artist = $(this).closest('tr')
                .find('td.lib-artist-name').text();
            $.ajax({
                url: $SCRIPT_ROOT + '/mpd/findadd?'
                    + artist_tag + '=' + encodeURIComponent(artist),
                dataType: 'text',
                success: function() {
                    ALERTS.alert_added_to_playlist(artist);
                }
            });
        },

        on_play_clicked: function(event) {
            var artist = $(this).closest('tr')
                .find('td.lib-artist-name').text();
            LIBRARY.find_add_and_play(
                artist_tag + '=' + encodeURIComponent(artist), artist);
        }
    },

    albums: {
        fetch: function(artist) {
            $.ajax({
                url: $SCRIPT_ROOT + '/mpd/find?'
                    + artist_tag + '=' + encodeURIComponent(artist),
                dataType: 'json',
                success: function(songs) {
                    var albums = [], last_album; // js has no set object
                    for (var i = 0; i < songs.length; i++) {
                        var album = new Album(
                            songs[i][artist_tag], songs[i].date, songs[i].album
                        );
                        if (!album.equals(last_album)) {
                            albums.push(album);
                            last_album = album;
                        }
                    }
                    LIBRARY.albums.populate(albums);
                }
            });
        },

        populate: function(albums) {
            var td_artist = '<td class="lib-album-artist">',
                td_date = '<td class="lib-album-date no-stretch">',
                td_title = '<td class="lib-album-title">',
                td_add = '<td class="lib-album-add no-stretch">',
                td_play = '<td class="lib-album-play no-stretch">';

            $('#albums tbody tr').remove();
            $.each(albums, function(i, album) {
                if (album.title != '') {
                    $('<tr>').append(
                        $(td_artist).text(album.artist),
                        $(td_date).text(album.date),
                        $(td_title).text(album.title),
                        $(td_add).html(ICONS.add),
                        $(td_play).html(ICONS.play)
                    ).appendTo('#albums');
                }
            });
            $('#albums tbody tr td.lib-album-artist').hide();

            LIBRARY.songs.fetch(first_not_empty_album(albums));

            // bind handlers
            $('#albums tbody tr').click(LIBRARY.albums.on_row_clicked);
            $('#albums tbody tr td.lib-album-add')
                .click(LIBRARY.albums.on_add_clicked);
            $('#albums tbody tr td.lib-album-play')
                .click(LIBRARY.albums.on_play_clicked);
        },

        on_row_clicked: function(event) {
            var album = new Album(
                $(this).closest('tr').find('td.lib-album-artist').text(),
                $(this).closest('tr').find('td.lib-album-date').text(),
                $(this).closest('tr').find('td.lib-album-title').text()
            );
            LIBRARY.songs.fetch(album);
            LIBRARY.breadcrumbs.set_album(album.title);
            LIBRARY.viewport.show_songs();
        },

        on_add_clicked: function(event) {
            var album = new Album(
                $(this).closest('tr').find('td.lib-album-artist').text(),
                $(this).closest('tr').find('td.lib-album-date').text(),
                $(this).closest('tr').find('td.lib-album-title').text()
            );
            $.ajax({
                url: $SCRIPT_ROOT + '/mpd/findadd?'
                    + artist_tag + '=' + encodeURIComponent(album.artist)
                    + '&album=' + encodeURIComponent(album.title)
                    + '&date=' + encodeURIComponent(album.date),
                dataType: 'text',
                success: function() {
                    ALERTS.alert_added_to_playlist(
                        album.title + ' by ' + album.artist);
                }
            });
        },

        on_play_clicked: function(event) {
            var album = new Album(
                $(this).closest('tr').find('td.lib-album-artist').text(),
                $(this).closest('tr').find('td.lib-album-date').text(),
                $(this).closest('tr').find('td.lib-album-title').text()
            );
            LIBRARY.find_add_and_play(
                artist_tag + '=' + encodeURIComponent(album.artist) +
                '&album=' + encodeURIComponent(album.title) +
                '&date=' + encodeURIComponent(album.date),
                album.title + ' by ' + album.artist
            );
        }
    },

    songs: {
        fetch: function(album) {
            $.ajax({
                url: $SCRIPT_ROOT + '/mpd/find?'
                    + artist_tag + '=' + encodeURIComponent(album.artist)
                    + '&album=' + encodeURIComponent(album.title)
                    + '&date=' + encodeURIComponent(album.date),
                dataType: 'json',
                success: LIBRARY.songs.populate
            });
        },

        populate: function(songs) {
            var td_track = '<td class="lib-song-track no-stretch">',
                td_title = '<td class="lib-song-title">',
                td_add = '<td class="lib-song-add no-stretch">',
                td_play = '<td class="lib-song-play no-stretch">',
                td_artist = '<td class="lib-song-artist">',
                td_file = '<td class="lib-song-file">';

            $('#songs tbody tr').remove();
            $.each(songs, function(i, song) {
                $('<tr>').append(
                    $(td_track).text(song.track),
                    $(td_title).text(song.title),
                    $(td_add).html(ICONS.add),
                    $(td_play).html(ICONS.play),
                    $(td_artist).text(song.artist),
                    $(td_file).text(song.file)
                ).appendTo('#songs');
            });
            $('#songs tbody tr td.lib-song-artist').hide();
            $('#songs tbody tr td.lib-song-file').hide();
 
            // bind handlers
            $('#songs tbody tr').click(LIBRARY.songs.on_row_clicked);
            $('#songs tbody tr td.lib-song-add')
                .click(LIBRARY.songs.on_add_clicked);
        },

        on_row_clicked: function(event) {
            var tr = $(this).closest('tr');
            var file = tr.find('td.lib-song-file').text(),
                artist = tr.find('td.lib-song-artist').text(),
                title = tr.find('td.lib-song-title').text();
            LIBRARY.add_and_play(file, title + ' by ' + artist);
        },

        on_add_clicked: function(event) {
            event.stopPropagation();
            var tr = $(this).closest('tr');
            var file = tr.find('td.lib-song-file').text(),
                artist = tr.find('td.lib-song-artist').text(),
                title = tr.find('td.lib-song-title').text();
            $.ajax({
                url: $SCRIPT_ROOT + '/mpd/add?' + encodeURIComponent(file),
                dataType: 'text',
                success: function() {
                    ALERTS.alert_added_to_playlist(title + ' by ' + artist);
                }
            });
        }
    },

    add_and_play: function(file, description) {
        $.ajax({
            url: $SCRIPT_ROOT + '/mpd/addid?' + encodeURIComponent(file),
            dataType: 'text',
            success: function(songid) {
                var songid = encodeURIComponent(songid);
                $.get($SCRIPT_ROOT + '/mpd/playid?' + songid);
                if (typeof description !== 'undefined') {
                    ALERTS.alert_added_to_playlist(description);
                }
            }
        });
    },

    find_add_and_play: function(query, description) {
        $.ajax({
            url: $SCRIPT_ROOT + '/mpd/find?' + query,
            dataType: 'json',
            success: function(songs) {
                for (var i = 0; i < songs.length; i++) {
                    if (i == 0) {
                        LIBRARY.add_and_play(songs[i].file);
                    } else {
                        var file = encodeURIComponent(songs[i].file);
                        $.get($SCRIPT_ROOT + '/mpd/add?'+ file);
                    }
                }
                if (typeof description !== 'undefined') {
                    ALERTS.alert_added_to_playlist(description);
                }
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

function first_not_empty_string(array) {
    var i = 0, result = '';
    while(result == '' && i < array.length) {
        result = array[i]; i++;
    }
    return result;
}

function first_not_empty_album(albums) {
    var i = 0, album = null;
    while(album === null && i < albums.length) {
        if (albums[i].title != '') album = albums[i]; i++;
    }
    return album;
}

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

