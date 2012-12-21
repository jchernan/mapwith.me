
MapApp.shareButton = function () {

  var cssId = '#share';

  var getButton = function () {
    return $(cssId);
  };

  var setSharingMode = function () {
    // change the color and text of the button
    getButton().removeClass('btn-inverse');
    getButton().addClass('btn-success');
    getButton().html('Sharing');
  };

  MapApp.collab.on('init_ack', setSharingMode);

  return {
    getButton: getButton
  };

}();
