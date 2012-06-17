MapApp.CollabBar = {}; 


MapApp.CollabBar.postMessage = function postMessage(sender, msg) {
    $("#chat_table tr:last").after(
            "<tr>"  
               + "<td> <strong>" + sender + "</strong> </td>" 
               + "<td>" + msg + "</td>"
          + "</tr>");
}

MapApp.CollabBar.sharingIconClass = "icon-eye-open"; 
MapApp.CollabBar.editingIconClass = "icon-hand-up"; 

MapApp.CollabBar.addUser = function addUser(username) {
    var icon_id = "icon_" + username; 
    var user_list_elem_id = "user_list_elem_" + username; 

    $("#user_list li:last").after(
            "<li id='" + user_list_elem_id  + "'>"  
               + "<i id='" + icon_id+ "' class='" + MapApp.CollabBar.sharingIconClass + "'></i>" + username 
          + "</li>");

    MapApp.CollabBar.stopEditing(username);

    var num_friends = $("#user_list li").length - 1; 
    var friend_name = num_friends > 1 ? " friends" : " friend" ; 
    $("#user_list_title").text( "Sharing with " 
            + num_friends  
            + friend_name + ": ");
}

MapApp.CollabBar.startEditing = function startEditing(username) {
    var icon_id = "icon_" + username; 
    var user_list_elem_id = "user_list_elem_" + username; 

    $("#" + icon_id).attr("class", MapApp.CollabBar.editingIconClass); 

    
}

MapApp.CollabBar.stopEditing = function stopEditing(username) {
    var icon_id = "icon_" + username; 
    $("#" + icon_id).attr("class", MapApp.CollabBar.sharingIconClass); 
}

/* Set up listeners */

$("#chat_button").click(function() { 
    MapApp.CollabBar.postMessage("Me", $("#chat_text").val());
    $("#chat_text").val("");
}); 

/* Begin simulation */
MapApp.CollabBar.addUser("Me");

setTimeout(function() { MapApp.CollabBar.addUser("Jeremy") }, 200);
setTimeout(function() { MapApp.CollabBar.addUser("Laura") }, 500);

setTimeout(function() { MapApp.CollabBar.postMessage("Jeremy",    "Hi Laura. Thai tonight?") }, 1000);
setTimeout(function() { MapApp.CollabBar.postMessage("Laura", "Sure. Where are you?") } , 3000);
setTimeout(function() { MapApp.CollabBar.postMessage("Jeremy",    "I'm at the Mission. Let me show you where...") } , 7000);
setTimeout(function() { MapApp.CollabBar.startEditing("Jeremy") }, 8000);
setTimeout(function() { MapApp.CollabBar.postMessage("Me",            "Is there room for one more?") } , 13000);
setTimeout(function() { MapApp.CollabBar.stopEditing("Jeremy") }, 15000);
