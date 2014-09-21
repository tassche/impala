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
            $('<td>').text(song.track),
            $('<td>').text(song.title),
            $('<td>').text(song.artist),
            $('<td>').text(song.album),
            $('<td class="text-right">').text(song.date),
            $('<td class="text-right">').text(seconds_to_str(song.time)),
            $('<td class="pl-rm">').html(
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


function update_navigation() {
    var attr;
    // navbar
    attr = $('#nav-playlist').attr('class');
    $('#nav-playlist').attr('class', attr + ' active');
    // quicknav
    attr = $('#quicknav-playlist').attr('class');
    $('#quicknav-playlist').attr('class', attr + ' btn-info');
}


$(document).ready(function() {
    update_navigation();
    bind_clear_command();
});

