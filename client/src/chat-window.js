MapApp.chatWindow = function () {

  var sharingIconClass = "icon-eye-open";
  var editingIconClass = "icon-hand-up";

  var postMessage = function (sender, msg) {
    $('#chat-panel-rows .message:last').after(
        '<div class="message"><span class="sender">' +
            sender + '</span>'  + msg + '</div>'
    );
    // chat should be scrolled to the bottom
    // to ensure last messages are visible.
    // http://stackoverflow.com/questions/13362/
    $('#chat-panel-rows').each(function () {
        var scrollHeight = Math.max(this.scrollHeight, this.clientHeight);
        this.scrollTop = scrollHeight - this.clientHeight;
      }
    );
  };

  var addUser = function (username) {
    var icon_id = "icon_" + username;
    var user_list_elem_id = "user_list_elem_" + username;

    $("#user_list li:last").after(
            "<li id='" + user_list_elem_id  + "'>" +
            "<i id='" + icon_id + "' class='" + sharingIconClass +
            "'></i>" + username + "</li>");

    stopEditing(username);

    var num_friends = $("#user_list li").length - 2;
    var friend_name = num_friends > 1 ? " friends" : " friend";
    if (num_friends > 0) {
      $("#user_list_title").text("Sharing with " +
          num_friends + friend_name + ": ");
    } else {
      $("#user_list_title").text("No friends have joined");
    }

  };

  var startEditing = function (username) {
    var icon_id = "icon_" + username;
    var user_list_elem_id = "user_list_elem_" + username;

    $("#" + icon_id).attr("class", editingIconClass);
  };

  var stopEditing = function (username) {
    var icon_id = "icon_" + username;
    $("#" + icon_id).attr("class", sharingIconClass);
  };

  /*
      Initialize right menu.

      buttonListener sets up a callback for the chat button
      Parameters:
        buttonListener - The action to be executed when the user types a new
                         message.
        usernames - The usernames other than "me" that are already part of the
                    conversation (Optional).
   */
  var init = function (buttonListener, usernames) {
    var ENTER_KEY = 13;
    var messageAction = function () {
      var message_to_send = $.trim($("#chat_text").val());
      if (message_to_send !== "") {
        postMessage("Me", message_to_send);
        if (buttonListener)  {
          buttonListener(message_to_send);
        }
      }
      $("#chat_text").val("");
      return false;
    };

    $("#chat_button").click(messageAction);
    // By default, hitting 'Enter' on a textarea will create a new line.
    // We change the behavior to submit the message upon hitting 'Enter'.
    // http://stackoverflow.com/questions/4418819/
    $("#chat_text").keydown(function (e) {
      if (e.keyCode === ENTER_KEY) {
        messageAction();
        return false;
      }
    });

    addUser("Me");
    if (typeof(usernames) !== "undefined") {
      for (var i = 0; i < usernames.length; i++) {
        addUser(usernames[i]);
      }
    }

    $("#right-bar").css("display", "");

    // Listener to add message from server to chat area
    MapApp.collab.on("send_message",  function (data) {
      postMessage(data.from, data.message);
    });

    MapApp.collab.on("add_user",  function (data) {
      addUser(data.username);
    });

  };

  MapApp.collab.on('init_ack', function (data) {
    init(
      function (message) {
        MapApp.collab.sendMessage(message);
      },
      data.state.usernames
    );
  });

  // Slide chat window to minimize it
  // http://www.learningjquery.com/2009/02/slide-elements-in-different-directions
  var rightBarInnerElems = ['#chat-header', '#chat-window'];
  $(document).ready(function () {
    $('.right-bar-minimize').click(function () {
      for (var i = 0 ; i < 2 ; i++) {
        var element = $(rightBarInnerElems[i]);
        element.animate({
          marginLeft: parseInt(
            element.css('marginLeft'), 10) === 0 ?
            element.outerWidth() - 20 :
            0
        });
      }
    });
  });

}();
