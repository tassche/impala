function update_navigation() {
    var attr = $('#nav-about').attr('class');
    $('#nav-about').attr('class', attr + ' active');
}


$(document).ready(function() {
    update_navigation();
});
