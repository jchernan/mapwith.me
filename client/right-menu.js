CollabBar = {}; 


CollabBar.postMessage = function postMessage(sender, msg) {
    $("#chat_table tr:last").after(
            "<tr>"  
               + "<td> <strong>" + sender + "</strong> </td>" 
               + "<td>" + msg + "</td>"
          + "</tr>");
}

CollabBar.sharingIconClass = "icon-eye-open"; 
CollabBar.editingIconClass = "icon-hand-up"; 

CollabBar.addUser = function addUser(username) {
    var icon_id = "icon_" + username; 
    var user_list_elem_id = "user_list_elem_" + username; 

    $("#user_list li:last").after(
            "<li id='" + user_list_elem_id  + "'>"  
               + "<i id='" + icon_id+ "' class='" + CollabBar.sharingIconClass + "'></i>" + username 
          + "</li>");

    CollabBar.stopEditing(username);

    var num_friends = $("#user_list li").length - 1; 
    var friend_name = num_friends > 1 ? " friends" : " friend" ; 
    $("#user_list_title").text( "Sharing with " 
            + num_friends  
            + friend_name + ": ");
}

CollabBar.startEditing = function startEditing(username) {
    var icon_id = "icon_" + username; 
    var user_list_elem_id = "user_list_elem_" + username; 

    $("#" + icon_id).attr("class", CollabBar.editingIconClass); 

    
}

CollabBar.stopEditing = function stopEditing(username) {
    var icon_id = "icon_" + username; 
    $("#" + icon_id).attr("class", CollabBar.sharingIconClass); 
}

/* Initialize Map. buttonListener sets up a callback for the chat button */
CollabBar.init = function init(buttonListener) {
    $("#chat_button").click(function() { 
            var message_to_send = $("#chat_text").val();
            CollabBar.postMessage("Me", message_to_send);
            if (buttonListener)  {
                buttonListener(message_to_send); 
            } 
            $("#chat_text").val("");
    }); 
    
    CollabBar.addUser("Me");
    
}



/* Begin simulation */

setTimeout(function() { CollabBar.addUser("Jeremy") }, 200);
setTimeout(function() { CollabBar.addUser("Laura") }, 500);

setTimeout(function() { CollabBar.postMessage("Jeremy",    "Hi Laura. Thai tonight?") }, 1000);
setTimeout(function() { CollabBar.postMessage("Laura", "Sure. Where are you?") } , 3000);
setTimeout(function() { CollabBar.postMessage("Jeremy",    "I'm at the Mission. Let me show you where...") } , 7000);
setTimeout(function() { CollabBar.startEditing("Jeremy") }, 8000);
setTimeout(function() { CollabBar.postMessage("Me",            "Is there room for one more?") } , 13000);
setTimeout(function() { CollabBar.stopEditing("Jeremy") }, 15000);
