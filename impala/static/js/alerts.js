// alerts.js //
// requires layout.js


var alert_div = $('#alert');
var alert_class = {
    info:    'alert alert-info',
    success: 'alert alert-success'
};
var alert_text = {
    db_update_in_progress: 'Database update in progress...',
    db_update_finished:    'Database update finished.',
    added_to_playlist:     ' added to playlist.',
    playlist_cleared:      'Playlist cleared.'
};


function alert_db_update_in_progress() {
    alert_alert(alert_class.info, alert_text.db_update_in_progress);
}

function alert_db_update_finished() {
    alert_alert(alert_class.success, alert_text.db_update_finished);
}

function alert_added_to_playlist(what) {
    alert_alert(alert_class.success, what + alert_text.added_to_playlist);
    hide_alert();
}

function alert_playlist_cleared() {
    alert_alert(alert_class.success, alert_text.playlist_cleared);
    hide_alert();
}


function alert_alert(css_class, text) {
    alert_div.attr('class', css_class);
    alert_div.text(text);
    alert_div.show();
    resize_components();
}

function hide_alert() {
    setTimeout(function() {
        alert_div.hide();
        resize_components();
    }, 3000);
}
