var HtmlContent = {};

/*
    Content that prompts to initialize a sharing session. 
    It is composed of text containing instructions to the user, 
    an input area to type a name, and a button to start the 
    sharing session. 
*/
HtmlContent.shareStart = 
    '<div class="row-fluid">'
    + '<div class="span12">'
    + '<div class="span6">'
    + '<p>Type your name and then click <strong>Start</strong>. '
    + 'This will create a link that you can share with your friends.</p>'
    + '</div>' // end span6
    + '<div class="span6">'
    + '<form id="popover-form">'
    + '<div class="input-append">'
    + '<input id="popover-form-input" class="input-medium" type="text" placeholder="Type your name">'
    + '<button id="popover-form-button" class="btn" type="submit">Start</button>'
    + '</div>' // end input-append
    + '</form>' // end form
    + '</div>' // end span6
    + '</div>' // end span12 
    + '</div>'; // end row-fluid

/*
    Content that shows the sharing session link.
*/
HtmlContent.shareLink =
    '<div>'
    + '<code>LINK</code>'
    + '</div>';

/*
    Content that prompts to join a sharing session. 
    It is composed of text containing instructions to the user, 
    an input area to type a name, and a button to start the 
    sharing session. 
*/
HtmlContent.shareJoin = 
    '<div class="modal fade hide" id="initial-modal" style="width:350px">'
    + '<div class="modal-header">'
    + '<button type="button" class="close" data-dismiss="modal">x</button>'
    + '<h3> Your friend wants to map with you</h3>'
    + '</div>'
    + '<div class="modal-body" >'
    + '<div>'
    + '<p>Type your name and then click <strong>Join</strong> to start sharing.</p> '
    + '</div>' 
    + '<form id="modal-form">'
    + '<center>'
    + '<input id="modal-form-input" class="input-large" type="text" placeholder="Type your name">'
    + '</center>'
    + '</form>' 
    + '</div>' 
    + '<div class="modal-footer">'
    + '<a href="#" class="btn" data-dismiss="modal">Close</a>'
    + '<a href="#" class="btn btn-primary" id="join-modal">Join</a>'
    + '</div>'
    + '</div>';
