// navbar.js //
// requires alerts.js


function bind_nav_playlist_commands() {
    $('#nav-pl-clear').click(function(event) {
        $.ajax({
            url: $SCRIPT_ROOT + '/mpd/clear',
            dataType: 'text',
            success: alert_playlist_cleared
        });
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

