
MapApp.sessionJoinWindow = function () {

  var text = $(MapApp.content.joinSession);
  
  var init = function () {

    // display the modal
    $('body').append(text);

    $('#modal-form').submit(MapApp.collab.joinSession);
    $('#join-modal').click(MapApp.collab.joinSession);

    // Ensure modal is always centered
    text.modal({
        backdrop: true
    }).css({
        width: 'auto',
        'margin-left': function () {
            return -($(this).width() / 2);
        }
    });

    text.modal('show');
  };

  MapApp.collab.on('init_ack', function (data) {
    text.modal('hide');
  });

  // If user has specified a session_id, 
  // then initialize the session join window
  if (urlParam('session_id')) {
    init();
  }

}();
