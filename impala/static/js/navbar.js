// navbar.js //


function bind_nav_playlist_commands() {
    $('#nav-pl-clear').click(function(event) {
        $.get($SCRIPT_ROOT + '/mpd/clear');
    });
}

function bind_nav_database_commands() {
    $('#nav-lib-update').click(function(event) {
        $.get($SCRIPT_ROOT + '/mpd/update');
    });
    $('#nav-lib-rescan').click(function(event) {
        $.get($SCRIPT_ROOT + '/mpd/rescan');
    });
}


$(document).ready(function() {
    bind_nav_playlist_commands();
    bind_nav_database_commands();
});

