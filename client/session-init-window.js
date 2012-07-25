
!function ($) {

  "use strict"; // jshint ;_;


 /* SHAREPOPOVER PUBLIC CLASS DEFINITION
  * =============================== */

  var SharePopover = function (element, options) {
    this.init('sharepopover', element, options);
  };

  /* NOTE: SHAREPOPOVER EXTENDS BOOTSTRAP-POPOVER.js
     ========================================== */

  SharePopover.prototype = $.extend({}, $.fn.popover.Constructor.prototype, {

    constructor: SharePopover, 
    show: function () {
      var $tip, inside, pos, actualWidth, actualHeight, placement, tp;

      if (this.hasContent() && this.enabled) {
        $tip = this.tip();
        this.setContent();

        if (this.options.animation) {
          $tip.addClass('fade');
        }

        placement = 'bottom';

        inside = /in/.test(placement);

        $tip
          .remove()
          .css({ top: 0, left: 0, display: 'block' })
          .appendTo(inside ? this.$element : document.body);

        pos = this.getPosition(inside);

        actualWidth = $tip[0].offsetWidth;
        actualHeight = $tip[0].offsetHeight;

        tp = {
          top: pos.top + pos.height + 3, 
          left: pos.left + pos.width - actualWidth
        };

        $tip
          .css(tp)
          .addClass(placement)
          .addClass('in');
      }
    }

  });


 /* SHAREPOPOVER PLUGIN DEFINITION
  * ======================= */

  $.fn.sharepopover = function (option) {
    return this.each(function () {
      var $this = $(this), 
          data = $this.data('sharepopover'), 
          options = typeof option == 'object' && option;
      if (!data) $this.data('sharepopover', (data = new SharePopover(this, options)));
      if (typeof option == 'string') data[option]();
    });
  };

  $.fn.sharepopover.Constructor = SharePopover;

  $.fn.sharepopover.defaults = $.extend({}, $.fn.popover.defaults, {
    template: '<div class="popover"><div class="arrow" style="left:93%"></div><div class="popover-inner" style="width:500px;"><h3 class="popover-title"></h3><div class="popover-content"><p></p></div></div></div>'
  });

}(window.jQuery);


// VERTICALLY ALIGN FUNCTION
(function ($) {
  $.fn.vAlign = function () {
    return this.each(function (i) {
      var ah = $(this).height();
      var ph = $(this).parent().height();
      var mh = Math.ceil((ph - ah) / 2);
      $(this).css('margin-top', mh);
    });
  };
})(window.jQuery);


MapApp.sessionInitWindow = function () {

  var shareButton = MapApp.shareButton.getButton();

  var getWindowContent = function (link) {
    if (link === null) {
      return MapApp.content.startSession;   
    } else {
      var content = MapApp.content.sessionLink.replace('LINK', link);
      return content;
    }
  };

  var getWindowTitle = function (link) {
    if (link === null) {
      return MapApp.content.startSessionTitle;
    } else {
      return MapApp.content.sessionLinkTitle;
    }
  };

  var showWindow = function () {
    shareButton.sharepopover('toggle');
    // check if #popover-form exists
    if ($('#popover-form').length > 0) {
      $('#popover-form').vAlign();
      $('#popover-form').submit(startSharing);
      $('#popover-form-button').click(startSharing);
    }
  };

  var hideWindow = function () {
    shareButton.sharepopover('hide');
  };

  var startSharing = function () {
      
    MapApp.log.info('[startSharing] User is starting share session');
    // Send a message to server indicating our desire to join a session
    var data = { 
      center: MapApp.map.getCenter(),
      zoom: MapApp.map.getZoom(),
      username: $('#popover-form-input').val()
    }; 

    MapApp.collab.on('init_ack', function (data) {
      var link = Hosts.baseURL + '?session_id=' + data.session_id;
      setSharingMode(link, true);
    });

    MapApp.log.info('[startSharing] Emitting init: ' + JSON.stringify(data)); 
    MapApp.collab.init(data);

    /* TODO(jmunizn) Add loading animation */

    return false;
  };

  var setSharingMode = function (link, showPopover) {
    // get popover from share button
    var popover = shareButton.data('sharepopover');
    if (showPopover) {
      // need to turn off animation to make a smooth 
      // transition if popover is already open
      popover.options.animation = false;
    }
    // get the content and title for the popover 
    popover.options.content = getWindowContent(link);
    popover.options.title = getWindowTitle(link);
    
    if (showPopover) {
      // call 'show' to refresh the popover content.
      // then turn animation on again.
      shareButton.sharepopover('show');
      popover.options.animation = true;
    }
    
    // Initialize right bar 
    MapApp.chatWindow.init(function (message) {
      MapApp.collab.sendMessage(message);
    });
  };

  shareButton.sharepopover({
    trigger: 'manual',
    html: true,
    content: getWindowContent(null),
    title: getWindowTitle(null)
  });

  window.onresize = hideWindow;
  shareButton.click(showWindow);

  return {
    setSharingMode: setSharingMode
  };

}();
