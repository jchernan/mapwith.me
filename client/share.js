
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
    template: '<div class="popover"><div class="arrow" style="left:91%"></div><div class="popover-inner"><h3 class="popover-title"></h3><div class="popover-content"><p></p></div></div></div>'
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

var Share = {};

Share.getWindowContent = function(link) {
    if (link === null) {
        return '<form>'
            + '<p>Type your name and then click <strong>Start</strong>. '
            + 'This will create a link that you can share with your friends.</p>'
            + '<br>'
            + '<div class="input-append">'
            + '<input type="text" class="span2" placeholder="Type your name">'
            + '<button class="btn" onclick="return Share.startSharing();">'
            + 'Start</button>'
            + '</div>'
            + '</form>';
    } else {
        return '<div class="well">'
            + '<p>' 
            + link 
            + '</p>'
            + '</div>';
    }
}

Share.showWindow = function() {
    $('#share').sharepopover('toggle');
}

Share.hideWindow = function() {
    $('#share').sharepopover('hide');
}

Share.startSharing = function() {
    
    console.log('User is starting share session');
    
    var popover = $('#share').data('sharepopover');
    popover.options.animation = false;
    popover.options.content = Share.getWindowContent('some link');
    $('#share').sharepopover('show');
    popover.options.animation = true;

    $('#share').removeClass('btn-inverse');
    $('#share').addClass('btn-success');
    return false;
}

window.onresize = Share.hideWindow;

