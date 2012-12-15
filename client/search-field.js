
MapApp.searchField = function () {

  var cssId = '#address-input';
  var loaderIconImg = 'images/loader.gif';

  var getInput = function () {
    return $(cssId).val();
  };

  var showLoader = function () {
    $(cssId).css(
      'background-image',
      'url("' + loaderIconImg + '")'
    );
  };

  var hideLoader = function () {
    $(cssId).css('background-image', '');
  };

  return {
    showLoader: showLoader,
    hideLoader: hideLoader,
    getInput: getInput
  };

}();

