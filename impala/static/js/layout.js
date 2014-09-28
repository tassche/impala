// layout.js //


var viewport; // viewport class (xs, sm, md or lg)


function resize_components() {
    var height = $(window).height();
    height -= 50; // body padding-top
    height -= $('#alert:visible').outerHeight(true);
    height -= $('#currentsong-mini').outerHeight(true);
    height -= $('#controls').outerHeight(true);
    height -= $('#quicknav').outerHeight(true);

    height -= $('#lib-breadcrumbs').outerHeight(true);

    $('#content').css('height', height);
    $('#content .content').css('height', height);

    if (viewport == 'sm') {
        var margin = 20;
        $('#lib-albums').css('height', (height-margin)/2);
        $('#lib-songs').css('height', (height-margin)/2);
    }
}

function update_viewport_class() {
    viewport = get_viewport_class();
}


$(document).ready(function() {
    $('#alert').hide();
    update_viewport_class();
    resize_components();
    $(window).resize(function() {
        update_viewport_class();
        resize_components();
    });
});


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
