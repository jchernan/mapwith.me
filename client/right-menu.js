CollabBar = {}; 


CollabBar.postMessage = function postMessage(sender, msg) {
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
    });
};

CollabBar.sharingIconClass = "icon-eye-open"; 
CollabBar.editingIconClass = "icon-hand-up"; 

CollabBar.addUser = function addUser(username) {
    var icon_id = "icon_" + username; 
    var user_list_elem_id = "user_list_elem_" + username; 

    $("#user_list li:last").after(
            "<li id='" + user_list_elem_id  + "'>" + 
            "<i id='" + icon_id + "' class='" + CollabBar.sharingIconClass + 
            "'></i>" + username + "</li>");

    CollabBar.stopEditing(username);

    var num_friends = $("#user_list li").length - 1; 
    var friend_name = num_friends > 1 ? " friends" : " friend"; 
    $("#user_list_title").text("Sharing with " + 
        num_friends + friend_name + ": ");
};

CollabBar.startEditing = function startEditing(username) {
    var icon_id = "icon_" + username; 
    var user_list_elem_id = "user_list_elem_" + username; 

    $("#" + icon_id).attr("class", CollabBar.editingIconClass);   
};

CollabBar.stopEditing = function stopEditing(username) {
    var icon_id = "icon_" + username; 
    $("#" + icon_id).attr("class", CollabBar.sharingIconClass); 
};

/*
  Initialize right menu. 

  buttonListener sets up a callback for the chat button 
*/
CollabBar.init = function init(buttonListener) {
    
    var messageAction = function () { 
        var message_to_send = $("#chat_text").val();
        CollabBar.postMessage("Me", message_to_send);
        if (buttonListener)  {
            buttonListener(message_to_send); 
        } 
        $("#chat_text").val("");
        return false;
    };

    $("#chat_button").click(messageAction);
    // By default, hitting 'Enter' on a textarea will create a new line. 
    // We change the behavior to submit the message upon hitting 'Enter'.
    // http://stackoverflow.com/questions/4418819/submit-form-on-enter-when-in-text-field
    $("#chat_text").keyup(function (e) {
        if (e.keyCode === 13) {
            messageAction();
        }
    });
    
    CollabBar.addUser("Me");   
    $("#right_bar").css("display", "");
};



/* Begin simulation 

setTimeout(function() { CollabBar.addUser("Jeremy") }, 200);
setTimeout(function() { CollabBar.addUser("Laura") }, 500);

setTimeout(function() { CollabBar.postMessage("Jeremy",    "Hi Laura. Thai tonight?") }, 1000);
setTimeout(function() { CollabBar.postMessage("Laura", "Sure. Where are you?") } , 3000);
setTimeout(function() { CollabBar.postMessage("Jeremy",    "I'm at the Mission. Let me show you where...") } , 7000);
setTimeout(function() { CollabBar.startEditing("Jeremy") }, 8000);
setTimeout(function() { CollabBar.postMessage("Me",            "Is there room for one more?") } , 13000);
setTimeout(function() { CollabBar.stopEditing("Jeremy") }, 15000);

*/
