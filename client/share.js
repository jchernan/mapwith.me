
!function ($) {

  "use strict"; // jshint ;_;


 /* SHAREPOPOVER PUBLIC CLASS DEFINITION
  * =============================== */

  var SharePopover = function ( element, options ) {
    this.init('sharepopover', element, options)
  }

  /* NOTE: SHAREPOPOVER EXTENDS BOOTSTRAP-POPOVER.js
     ========================================== */

  SharePopover.prototype = $.extend({}, $.fn.popover.Constructor.prototype, {

    constructor: SharePopover
 
    , show: function () {
      var $tip
        , inside
        , pos
        , actualWidth
        , actualHeight
        , placement
        , tp

      if (this.hasContent() && this.enabled) {
        $tip = this.tip()
        this.setContent()

        if (this.options.animation) {
          $tip.addClass('fade')
        }

        placement = 'bottom';

        inside = /in/.test(placement)

        $tip
          .remove()
          .css({ top: 0, left: 0, display: 'block' })
          .appendTo(inside ? this.$element : document.body)

        pos = this.getPosition(inside)

        actualWidth = $tip[0].offsetWidth
        actualHeight = $tip[0].offsetHeight

        tp = {top: pos.top + pos.height + 3, left: pos.left + pos.width - actualWidth}

        $tip
          .css(tp)
          .addClass(placement)
          .addClass('in')
      }
    }

  })


 /* SHAREPOPOVER PLUGIN DEFINITION
  * ======================= */

  $.fn.sharepopover = function (option) {
    return this.each(function () {
      var $this = $(this)
        , data = $this.data('sharepopover')
        , options = typeof option == 'object' && option
      if (!data) $this.data('sharepopover', (data = new SharePopover(this, options)))
      if (typeof option == 'string') data[option]()
    })
  }

  $.fn.sharepopover.Constructor = SharePopover

  $.fn.sharepopover.defaults = $.extend({} , $.fn.popover.defaults, {
    template: '<div class="popover"><div class="arrow" style="left:94.5%"></div><div class="popover-inner" style="width:500px;"><h3 class="popover-title"></h3><div class="popover-content"><p></p></div></div></div>'
  })

}(window.jQuery);

$(function () {
    $('#share').sharepopover({
        trigger: 'manual',
        title: 'Share what you are viewing!',
        html: true,
        content: Share.getWindowContent(null)
    });
});

(function ($) {
// VERTICALLY ALIGN FUNCTION
$.fn.vAlign = function() {
	return this.each(function(i){
	var ah = $(this).height();
	var ph = $(this).parent().height();
	var mh = Math.ceil((ph-ah) / 2);
	$(this).css('margin-top', mh);
	});
};
})(window.jQuery);

var Share = {};

Share.getWindowContent = function(link) {
    if (link === null) {
        return '<div class="row-fluid">'
            + '<div class="span12">'
            + '<div class="span6">'
            + '<p>Type your name and then click <strong>Start</strong>. '
            + 'This will create a link that you can share with your friends.</p>'
            + '</div>' // end text span6
            + '<div class="span6">'
            + '<form id="share-name-input-form">'
            + '<div class="input-append">'
            + '<input id="share-name-input" class="input-medium" type="text" placeholder="Type your name">'
            + '<button class="btn" type="submit" onclick="return Share.startSharing()">Start</button>'
            + '</div>' // end input-append
            + '</form>' // end form
            + '</div>' // end span6
            + '</div>' // end span12 
            + '</div>'; // end row 
    } else {
        return '<div>'
            + '<code>'
            + link
            + '</code>'
            + '</div>';
    }
}

Share.showWindow = function() {
    $('#share').sharepopover('toggle');
    $('#share-name-input-form').vAlign();
}

Share.hideWindow = function() {
    $('#share').sharepopover('hide');
}

Share.startSharing = function() {
    
    console.log('User is starting share session');
    
/*    var popover = $('#share').data('sharepopover');
    popover.options.animation = false;
    var link = 'http://www.aeternitatis.org?session_id=1';
    popover.options.content = Share.getWindowContent(link);
    $('#share').sharepopover('show');
    popover.options.animation = true;
    $('#share').removeClass('btn-inverse');
    $('#share').addClass('btn-success');
*/


    /* Send a message to server indicating our desire to join a session */
    var data = { 
       center: {
            latitude:  MapApp.map.getCenter().lat,
            longitude: MapApp.map.getCenter().lng,
         },
        username:  $('#share-name-input').val(),
        zoom: MapApp.map.getZoom()
    } 



    console.log('[init] Emitting init: ' + JSON.stringify(data)); 

    var display_session_id_handler = function(data) {

        var popover = $('#share').data('sharepopover');
        popover.options.animation = false;
        var link = Hosts.baseURL + '?session_id=' + data.session_id;
        popover.options.content = Share.getWindowContent(link);
        $('#share').sharepopover('show');
        popover.options.animation = true;


        $('#share').removeClass('btn-inverse');
        $('#share').addClass('btn-success');

        /* Initialize right bar */
        CollabBar.init(function(message) {
                socket.emit('send_message', { "message": message }); 
        });
 
        socket.off(display_session_id_handler); 
    }

    socket.on('init_ack', display_session_id_handler); 
    
    socket.emit('init', data);
    

    /* TODO(jmunizn) Add loading animation */

    return false;
}

window.onresize = Share.hideWindow;

