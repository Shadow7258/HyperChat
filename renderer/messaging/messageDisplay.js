class MessageDisplay {
    constructor() {}

    displayNewMessage(chatroom, username, message, profilePic) {
        chatroom.append('<div id="message-color" style="margin-top: 15px; margin-right: 15px;" class="row"><div class="col" style="flex-grow: 0">' + 
        '<img style="width: 40px; height: 40px; border-radius: 50%;" src="' + profilePic + '"></div><div style="float: left" class="col-md-auto">' + 
        '<div class="row"><b>' + username + '</b></div><div class="row">' + message + '</div></div></div>');    
    }

    displayMessage(chatroom, message) {
        chatroom.append("<p  id='message-color' style='margin-left: 55px;' class='message'>" + message + "</p>")
    }

    displayNewImage(chatroom, username, image, profilePic) {
        chatroom.append('<div  id="message-color" style="margin-top: 15px; margin-right: 15px;" class="row"><div class="col" style="flex-grow: 0">' + 
        '<img style="width: 40px; height: 40px; border-radius: 50%;" src="' + profilePic + '"></div><div style="float: left" class="col-md-auto">' + 
        '<div class="row"><b>' + username + '</b></div><div class="row"><img src="' + image + '"></div></div></div>');
    }

    displayImage(chatroom, image, previousImage) {
        if (previousImage == true) {
            chatroom.append("<p  id='message-color' style='margin-left: 55px; margin-top: 7px;' class='message'><img src='" + image + "'></p>")
        }
        else {
            chatroom.append("<p  id='message-color' style='margin-left: 55px;' class='message'><img src='" + image + "'></p>")
        }
    }

    displayInfo(chatroom, message) {
        chatroom.append("<p class='message' style='font-style: italic;'>" + message + "</p>")
    }
}

exports.MessageDisplay = MessageDisplay;
