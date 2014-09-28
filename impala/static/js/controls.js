// controls.js //


var playback_options = {consume: 0, random: 0, repeat: 0, single: 0};
var volume;
var volume_off = 0; // allows to toggle mute


function bind_playback_controls() {
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
}

function bind_playback_options() {
    var options = ['consume', 'random', 'repeat', 'single'];
    $.each(options, function(i, option) {
        $('#' + option).click(function(event) {
            var state = (playback_options[option] > 0) ? 0 : 1;
            $.get($SCRIPT_ROOT + '/mpd/' + option + '?' + state);
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


function update_playback_options(mpd_status) {
    var options = ['consume', 'random', 'repeat', 'single'];
    $.each(options, function(i, option) {
        playback_options[option] = parseInt(mpd_status[option]);
        var attr = $('#' + option).attr('class');
        if (playback_options[option] > 0) {
            $('#' + option).attr('class', attr + ' btn-info');
        } else {
            var index = attr.indexOf(' btn-info');
            if (index > -1) {
                $('#' + option).attr('class', attr.substring(0, index));
            }
        }
    });
}


$(document).ready(function() {
    bind_playback_controls();
    bind_playback_options();
    bind_volume_controls();
});

