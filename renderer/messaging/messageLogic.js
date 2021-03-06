const { MessageDisplay } = require('./messageDisplay')

let messageDisplay = new MessageDisplay();

class MessageLogic {
    constructor() {}

    addGroupMessages(messageArr, username) {
        messageArr.forEach((messageData) => {
            let message = messageData.message
            let sender = messageData.sender
            let messageType = messageData.type
            let chatroom = $('#' + messageData.grpId + 'GroupChatroom')
            let filename = './profile-pics/' + sender.split(' ').join('')
            var base46Img = fs.readFileSync(filename)
            let i = messageArr.indexOf(messageData)
            let oldMessage = messageArr[i-1]  

            if (messageType == 'text') {
                // This is a normal text message.
                if (oldMessage === undefined) {
                    // This is the first message. 
                    messageDisplay.displayNewMessage(chatroom, sender, message, base46Img);
                }
                else {
                    if (oldMessage['sender'] != username) {
                        // Someone else sent the previous message.
                        messageDisplay.displayNewMessage(chatroom, sender, message, base46Img);
                    }
                    else {
                        // I sent the previous message.
                        messageDisplay.displayMessage(chatroom, message);
                    }
                }
            }
            if (messageType == 'image') {
                // Message is of image type.
                var image = 'data:image/jpeg;base64,' + message
                if (oldMessage === undefined) {
                    // This is the first message. 
                    messageDisplay.displayNewImage(chatroom, sender, image, base46Img);
                }
                else {
                    if (oldMessage['sender'] != username) {
                        // Someone else sent the previous message.
                        messageDisplay.displayNewImage(chatroom, sender, image, base46Img);
                    }
                    else {
                        // I sent the previous message.
                        if (oldMessage["type"] == "image") {
                            messageDisplay.displayImage(chatroom, image, true);
                        }
                        else {
                            messageDisplay.displayImage(chatroom, image, false);
                        }                    }
                }
            }
            if (messageType == 'info') {
                // Message is of info type.
                messageDisplay.displayInfo(chatroom, message);
            }
        })       
    }

    addMessages(messageArr, username) {
        messageArr.forEach((messageData) => {
            let message = messageData.message
            let sender = messageData.sender
            let recepient = messageData.to
            let messageType = messageData.type
            let nameWithoutSpace = sender.split(" ").join("")
            let filename = './profile-pics/' + sender.split(' ').join('')
            var base46Img = fs.readFileSync(filename)
            let i = messageArr.indexOf(messageData)
            let oldMessage = messageArr[i-1]  
            if (sender == username) {
                chatroom = $('#' + recepient.split(" ").join("") + 'Chatroom')
            }
            else {
                chatroom = $('#' + nameWithoutSpace + 'Chatroom')
            }

            if (messageType == 'text') {
                // This is a normal text message.
                if (oldMessage === undefined) {
                    // This is the first message. 
                    messageDisplay.displayNewMessage(chatroom, sender, message, base46Img);
                }
                else {
                    if (oldMessage["sender"] != sender) {
                        // The sender of the previous message is not the same as the sender of this message.
                        messageDisplay.displayNewMessage(chatroom, sender, message, base46Img);
                    }
                    else {
                        // The sender of the previous message is the same as the current sender
                        messageDisplay.displayMessage(chatroom, message);
                    }
                }
            }
            if (messageType == 'image') {
                // Message is of image type.
                var image = 'data:image/jpeg;base64,' + message
                if (oldMessage === undefined) {
                    // This is the first message. 
                    messageDisplay.displayNewImage(chatroom, sender, image, base46Img);
                }
                else {
                    if (oldMessage["sender"] != sender) {
                        // The sender of the previous message is not the same as the sender of this message.
                        messageDisplay.displayNewImage(chatroom, sender, image, base46Img);
                    }
                    else {
                        // The sender of the previous message is the same as the current sender
                        if (oldMessage["type"] == "image") {
                            messageDisplay.displayImage(chatroom, image, true);
                        }
                        else {
                            messageDisplay.displayImage(chatroom, image, false);
                        }
                    }
                }
            }
            if (messageType == 'info') {
                // Message is of info type.
                messageDisplay.displayInfo(chatroom, message);
            }
        })      
    }

    sendGroupMessage(groupMessages, messageData, username, grpId, message) {
        var chatroom = $('#' + grpId + 'GroupChatroom');

        let filename = './profile-pics/' + username.split(' ').join('')
        var base46Img = fs.readFileSync(filename)

        let i = groupMessages.indexOf(messageData)
        let oldMessage = groupMessages[i-1]

        if (oldMessage === undefined) {
            // This is the first message
            messageDisplay.displayNewMessage(chatroom, username, message, base46Img);
        }
        else {
            if (oldMessage["sender"] != username) {
                // Someone sent the previous message to the group. 
                messageDisplay.displayNewMessage(chatroom, username, message, base46Img);
            }
            else {
                messageDisplay.displayMessage(chatroom, message);
                // I sent the previous message.
            }
        }
    }

    sendGroupImage(groupMessages, messageData, username, grpId, image) {
        var chatroom = $('#' + grpId + 'GroupChatroom');

        let filename = './profile-pics/' + username.split(' ').join('')
        var base46Img = fs.readFileSync(filename)

        let i = groupMessages.indexOf(messageData)
        let oldMessage = groupMessages[i-1]

        if (oldMessage === undefined) {
            // This is the first message
            messageDisplay.displayNewImage(chatroom, username, image, base46Img);
        }
        else {
            if (oldMessage["sender"] != username) {
                // Someone sent the previous message to the group. 
                messageDisplay.displayNewImage(chatroom, username, image, base46Img);
            }
            else {
                // I sent the previous message.
                if (oldMessage["type"] == "image") {
                    messageDisplay.displayImage(chatroom, image, true);
                }
                else {
                    messageDisplay.displayImage(chatroom, image, false);
                }
            }
        }
    }

    sendMessage(messages, messageData, username, friendClickedOn, message) {
        var chatroom;
        var oldMessage;

        var i = messages.indexOf(messageData);
        oldMessage = messages[i-1];

        console.log("Old message is " + JSON.stringify(oldMessage) + "\nNew message is " + JSON.stringify(messageData));
                
        let nameWithoutSpace = friendClickedOn.split(" ").join("")
        chatroom = $('#' + nameWithoutSpace + 'Chatroom')
        
        let filename = './profile-pics/' + username.split(' ').join('')
        var base46Img = fs.readFileSync(filename)
        
        if (oldMessage === undefined) { // This is the first message
            // display new message
            console.log("Previous message was undefined. This is the first message. Display new message.");
            messageDisplay.displayNewMessage(chatroom, username, message, base46Img);
        }
        else if (oldMessage['to'] == username) { // I was the recepient. He sent a message to me.
            // display new message
            console.log(oldMessage['sender'] + " sent the previous message. Display new message.");
            messageDisplay.displayNewMessage(chatroom, username, message, base46Img);
        }
        else { // He was the recepient. I sent a message to him.
            // display normal message
            console.log("User sent the previous message. Display normal message.");
            messageDisplay.displayMessage(chatroom, message);
        }
    }

    sendImage(messages, messageData, username, friendClickedOn, image) {
        var chatroom;
        var oldMessage;

        let i = messages.indexOf(messageData)
        oldMessage = messages[i-1]
        
        let nameWithoutSpace = friendClickedOn.split(" ").join("")
        chatroom = $('#' + nameWithoutSpace + 'Chatroom')
        
        let filename = './profile-pics/' + username.split(' ').join('')
        var base46Img = fs.readFileSync(filename)
        
        if (oldMessage === undefined) { // This is the first message
            // display new message
            console.log("Previous message was undefined. This is the first message. Display new message.");
            messageDisplay.displayNewImage(chatroom, username, image, base46Img);
        }
        else {
            if (oldMessage["sender"] != username) { // I was the recepient. He sent a message to me.
                // display new message
                console.log(oldMessage['sender'] + " sent the previous message. Display new message.");
                messageDisplay.displayNewImage(chatroom, username, image, base46Img);
            }
            else { // He was the recepient. I sent a message to him.
                // display normal message
                console.log("User sent the previous message. Display normal message.");
                if (oldMessage["type"] == "image") {
                    messageDisplay.displayImage(chatroom, image, true);
                }
                else {
                    messageDisplay.displayImage(chatroom, image, false);
                }
            }
        }
    }

    receiveMessage(messages, messageData, message, sender) {
        let i = messages.indexOf(messageData)
        let oldMessage = messages[i-1]

        let nameWithoutSpace = sender.split(" ").join("")
        let chatroom = $('#' + nameWithoutSpace + 'Chatroom')

        let filename = './profile-pics/' + sender.split(' ').join('')
        var base46Img = fs.readFileSync(filename)

        if (oldMessage === undefined) {
            messageDisplay.displayNewMessage(chatroom, sender, message, base46Img);
        }
        else {
            if (oldMessage["sender"] != sender) {
                messageDisplay.displayNewMessage(chatroom, sender, message, base46Img);
            }
            else {
                messageDisplay.displayMessage(chatroom, message);
            }
        }
    }

    receiveGroupMessage(groupMessages, messageData, sender, grpId, message) {
        let i = groupMessages.indexOf(messageData)
        let oldMessage = groupMessages[i-1]

        let filename = './profile-pics/' + sender.split(' ').join('')
        var base46Img = fs.readFileSync(filename)

        grpChatroom = $('#' + grpId + 'GroupChatroom')

        if (oldMessage === undefined) {
            messageDisplay.displayNewMessage(grpChatroom, sender, message, base46Img);
        }
        else {
            if (oldMessage["sender"] != sender) {
                messageDisplay.displayNewMessage(grpChatroom, sender, message, base46Img);
            }
            else {
                messageDisplay.displayMessage(grpChatroom, message);
            }
        }
    }

    receiveGroupImage(groupMessages, messageData, sender, grpId, image) {
        let i = groupMessages.indexOf(messageData)
        let oldMessage = groupMessages[i-1]

        let filename = './profile-pics/' + sender.split(' ').join('')
        var base46Img = fs.readFileSync(filename)

        grpChatroom = $('#' + grpId + 'GroupChatroom')

        if (oldMessage === undefined) {
            messageDisplay.displayNewImage(grpChatroom, sender, image, base46Img);
        }
        else {
            if (oldMessage["sender"] != sender) {
                messageDisplay.displayNewImage(grpChatroom, sender, image, base46Img);
            }
            else {
                if (oldMessage['type' == 'image']) {
                    messageDisplay.displayImage(grpChatroom, image, true);
                }
                else {
                    messageDisplay.displayImage(grpChatroom, image, false);
                }
            }
        }
    }

    receiveImage(messages, messageData, sender, image) {
        let i = messages.indexOf(messageData)
        let oldMessage = messages[i-1]

        let nameWithoutSpace = sender.split(" ").join("")
        let chatroom = $('#' + nameWithoutSpace + 'Chatroom')

        let filename = './profile-pics/' + sender.split(' ').join('')
        var base46Img = fs.readFileSync(filename)
    
        if (oldMessage === undefined) {
            messageDisplay.displayNewImage(chatroom, sender, image, base46Img);
        }
        else {
            if (oldMessage["sender"] != sender) {
                messageDisplay.displayNewImage(chatroom, sender, image, base46Img);
            }
            else {
                if (oldMessage["type"] == "image") {
                    messageDisplay.displayImage(chatroom, image, true);
                }
                else {
                    messageDisplay.displayImage(chatroom, image, false);
                }
            }
        }
    }
}

exports.MessageLogic = MessageLogic;