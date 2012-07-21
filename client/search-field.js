
MapApp.showLoader = function () {
    $('#address-input').css(
        'background-image', 
        'url("images/loader.gif")'
    );
};

MapApp.hideLoader = function () {
    $('#address-input').css('background-image', '');
};

