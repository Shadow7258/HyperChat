const { ipcRenderer, remote } = require('electron');
const { create, log } = require('electron-log');
const firebase = require('firebase')
const fs = require('fs');
const readline = require('readline')
const { dialog } = require('electron').remote;
const { MessageLogic } = require('./messaging/messageLogic')

const firebaseConfig = {
    apiKey: "AIzaSyBplQzncuIsYut1Pp7p8rox8f6O5mG8tow",
    authDomain: "rapidcode-98812.firebaseapp.com",
    databaseURL: "https://rapidcode-98812.firebaseio.com",
    projectId: "rapidcode-98812",
    storageBucket: "rapidcode-98812.appspot.com",
    messagingSenderId: "90307948553",
    appId: "1:90307948553:web:c1b4d68a7d1f2e54d588d8",
    measurementId: "G-76WSK7X1DX"
};

firebase.initializeApp(firebaseConfig);

let messageLogic = new MessageLogic();

var socket, friendClickedOn, groupName;
// socket = io.connect('http://34.93.56.182:3000')
socket = io.connect('http://localhost:3000')

var userExists = false, friendsAdded = false, groupClickedOn = false, friendTabClickedOn = false;

let messageField = $('#message-field')
let sendImageButton = $('#send-image-button')
let createChatBtn = $('#createChatBtn')
let chatList = $('#chat-list')
let newUserName = $('#newUserName')
let pageContainer = $('#page-container')
let chatroom, feedback, grpChatroom, grpFeedback
let chatheading = $('#chat-heading')
let saveChangesBtn = $('#saveChangesBtn')
let username, email
let friendsChatroom = $('#friendsChatroom');
let addFriendBtn = $('#addFriendBtn')
let newFriend = $('#newFriend')
let onlineFriendsBtn = $('#onlineFriendsBtn')
let allFriendsBtn = $('#allFriendsBtn')
let pendingFriendsBtn = $('#pendingFriendsBtn')
let blockedFriendsBtn = $('#blockedFriendsBtn')
let friendInvitesDiv = $('#friendInvites')
let onlineFriendsDiv = $('#onlineFriends')
let allFriendsDiv = $('#allFriends')
let pendingFriendsDiv = $('#pendingFriends')
let blockedFriendsDiv = $('#blockedFriends')
let addUserButton = $('#addUserButton')
let friendsListGroup = $('#friendsListGroup')
let callButton = $('#callButton')
let videoButton = $('#videoButton')

let message = {
    sender: "",
    message: "",
    to: "",
    time: "",
    type: ""
}

let dmList = [], messages = [], users = [], friendsInGroup = [], groups = [], groupMessages = [], chatListObj = [];
let friends = [], pendingInvites = [], friendInvites = [], friendsBlocked = [], friendsOnline = [];

remote.getCurrentWindow().on('close', () => {
    socket.emit('logout', {username: username})
});

ipcRenderer.on('email', (e, arg) => {
    console.log("Email received: " + arg);
    email = arg;
})

ipcRenderer.on('status_idle', () => {
    console.log("Setting status to idle");
    let statusElement = $('#status-message')
    statusElement.text('Idle')
    socket.emit('change_status', {username: username, status: 'idle'})
})

ipcRenderer.on('status_online', () => {
    console.log("Setting status to online");
    let statusElement = $('#status-message')
    statusElement.text('Online')
    socket.emit('change_status', {username: username, status: 'online'})
})

$(document).ready(function() {
    messageField = $('#message-field')
    sendImageButton = $('#send-image-button')
    createChatBtn = $('#createChatBtn')
    chatList = $('#chat-list')
    newUserName = $('#newUserName')
    pageContainer = $('#page-container')
    chatheading = $('#chat-heading')
    saveChangesBtn = $('#saveChangesBtn')
    friendsChatroom = $('#friendsChatroom');
    addFriendBtn = $('#addFriendBtn')
    newFriend = $('#newFriend')
    onlineFriendsBtn = $('#onlineFriendsBtn')
    allFriendsBtn = $('#allFriendsBtn')
    pendingFriendsBtn = $('#pendingFriendsBtn')
    blockedFriendsBtn = $('#blockedFriendsBtn')
    onlineFriendsDiv = $('#onlineFriends')
    allFriendsDiv = $('#allFriends')
    pendingFriendsDiv = $('#pendingFriends')
    blockedFriendsDiv = $('#blockedFriends')
    friendInvitesDiv = $('#friendInvites')
    addUserButton = $('#addUserButton')
    friendsListGroup = $('#friendsListGroup')
    videoButton = $('#videoButton')
    callButton = $('#callButton')

    getUsers()

    getUsername()

    if (fs.existsSync('friends')) {
        let friendsDict = fs.readFileSync('friends')
        friendsDict = JSON.parse(friendsDict)
        console.log(JSON.stringify(friendsDict['friends']));
        friends = friendsDict['friends']
        friendInvites = friendsDict['friendInvites']
        pendingFriends = friendsDict['pendingFriends']
        friendsBlocked = friendsDict['friendsBlocked']
    }

    setTimeout(() => {
        console.log("Users are " + users);
        console.log("Friends are " + friends);
    }, 2000)

    newUserName.on("keyup", (e) => {
        if (e.key == 'Enter') {
            if (userExists == false) {
                console.log("User doesn't exist");
                dialog.showErrorBox("Error!", "This user is not in your friends list.");
                newUserName.val('')
            }
            else {
                console.log("User Exists");
                let input = $('#addUserInput');
                friendsInGroup.push(newUserName.val())
                let nameWithoutSpace = newUserName.val().split(" ").join("");
                input.append('<span class="input-group-text" style="height: 90%;">' + newUserName.val() +'<i onClick="removeButton(\'' + newUserName.val() + '\')" class="fa fa-times" id="' + nameWithoutSpace + '_crossButton" style="padding-left: 10px; margin-right: -5px;"></i></span>');
                newUserName.val('');
            }
        }
    });

    messageField.on("keyup", (e) => {
        if (e.key == 'Enter') {
            console.log("Enter clicked");
            if (groupClickedOn == false) {
                sendMessage()
            }
            else {
                sendGroupMessage()
            }
        }
    });

    friendInvitesDiv.hide()
    blockedFriendsDiv.hide()
    pendingFriendsDiv.hide()
    allFriendsDiv.hide()
    onlineFriendsDiv.hide()
    friendsChatroom.hide()

    addUserButton.on('click', () => {
        console.log("Showing friend list"); 
        friendsListGroup.empty()
        friendsInGroup = []
        $('#addUserInput').empty()
        friends.forEach((friend) => {
            friendsListGroup.append('<label style="margin: 0px" id="' + friend + '_item" class="list-group-item">' + 
            '<div class="row">' + 
                '<div class="col-11">' + friend + '</div>' +
                '<div class="col-1">' +   
                    '<input class="form-check-input" style="float: right" id="checkbox" type="checkbox" onClick="friendListClicked(\'' + friend + '\');" value="">' + 
                '</div>' + 
            '</div>' + 
        '</label>')
        })
    })

    const button = document.querySelector('#emoji-button');

    const picker = new EmojiButton();
    picker.on('emoji', emoji => {
        document.querySelector('#message-field').value += emoji;
    });

    button.addEventListener('click', () => {
      picker.togglePicker(button);
    });

    sendImageButton.on("click", () => {
        console.log("Sending Image");
        ipcRenderer.send('sendImage')
    })

    allFriendsBtn.on("click", () => {
        console.log("All friends are " + friends);
        friendInvitesDiv.hide()
        blockedFriendsDiv.hide()
        pendingFriendsDiv.hide()
        onlineFriendsDiv.hide()
        allFriendsDiv.empty()

        friends.forEach(friend => {
            console.log("Friend: " + friend);
            socket.emit('get_friend_status', (friend))
        })

        onlineFriendsBtn.removeClass('active')
        blockedFriendsBtn.removeClass('active')
        pendingFriendsBtn.removeClass('active')
        $('#addFriendButton').removeClass('active')
        allFriendsBtn.addClass('active')

        allFriendsDiv.show()
    })

    onlineFriendsBtn.on("click", () => {
        console.log("Online friends are " + friendsOnline);
        friendInvitesDiv.hide()
        blockedFriendsDiv.hide()
        pendingFriendsDiv.hide()
        allFriendsDiv.hide()
        onlineFriendsDiv.empty()

        // Get online friends
        friends.forEach(friend => {
            console.log("Friend: " + friend);
            socket.emit('get_friends_online', (friend))
        })

        // Display online friends
        allFriendsBtn.removeClass('active')
        blockedFriendsBtn.removeClass('active')
        pendingFriendsBtn.removeClass('active')
        $('#addFriendButton').removeClass('active')
        onlineFriendsBtn.addClass('active')
        
        onlineFriendsDiv.show()
    })

    pendingFriendsBtn.on("click", () => {
        console.log("Pending invites are " + pendingInvites);
        console.log("Friend inites are " + friendInvites);
        blockedFriendsDiv.hide()
        pendingFriendsDiv.show()
        allFriendsDiv.hide()
        onlineFriendsDiv.hide()
        friendInvitesDiv.show()

        onlineFriendsBtn.removeClass('active')
        blockedFriendsBtn.removeClass('active')
        allFriendsBtn.removeClass('active')
        $('#addFriendButton').removeClass('active')
        pendingFriendsBtn.addClass('active')
    })

    blockedFriendsBtn.on("click", () => {
        console.log("Blocked friends are " + friendsBlocked);
        friendInvitesDiv.hide()
        blockedFriendsDiv.show()
        pendingFriendsDiv.hide()
        allFriendsDiv.hide()
        onlineFriendsDiv.hide()

        onlineFriendsBtn.removeClass('active')
        pendingFriendsBtn.removeClass('active')
        allFriendsBtn.removeClass('active')
        $('#addFriendButton').removeClass('active')
        blockedFriendsBtn.addClass('active')
    })

    ipcRenderer.on('imagePathReceived', (e, args) => {
        let canceled = args["canceled"]
        let imagePath = args['filePaths']
        console.log("Image path is " + imagePath);
        if (canceled == false) {
            if (groupClickedOn == false) {
                sendImage(imagePath)
            }
            else {
                sendGroupImage(imagePath)
            }
        }
    })

    $('#addFriendButton').on('click', () => {
        onlineFriendsBtn.removeClass('active')
        pendingFriendsBtn.removeClass('active')
        allFriendsBtn.removeClass('active')
        blockedFriendsBtn.removeClass('active')
        $('#addFriendButton').addClass('active')
    })

    // Save changes button clicked
    saveChangesBtn.on('click', () => {
        let optionClicked = $('#inputGroupSelect01')
        let statusElement = $('#status-message')
        statusElement.text(optionClicked.val())
        let status = optionClicked.val().toLowerCase()
        console.log("Option clicked is " + status);
        socket.emit('change_status', {username: username, status: status})
    })

    addFriendBtn.on('click', () => {
        let friend = newFriend.val()
        console.log("Addding friend " + friend);
        console.log("Users array is " + users);
        if (friend == username) {
            console.log("You cannot create friends with yourself.");
            dialog.showErrorBox("Error!", "You cannot create friends with yourself.");
        }
        else if (friend == '' || friend === undefined || friend === null) {
            console.log("Please type a valid username.");
            dialog.showErrorBox("Error!", "Please type a valid username.")
        }
        else if (!users.includes(friend)) {
            console.log("User doesn't exist");
            dialog.showErrorBox("Error!", "User (" + friend + ") doesn't exist!")
        }
        else if (friends.includes(friend)) {
            console.log("Friend already exists!");
            dialog.showErrorBox("Error!", "Friend already exists!");
        }
        else {
            console.log("User exists");
            addFriend(friend)
        }
    })

    // Create Chat button clicked
    createChatBtn.on('click', () => {
        let user = newUserName.val()
        if (user != "") {
            if (friends.includes(user)) {
                console.log("Another user to account for: " + user);
                friendsInGroup.push(user);
                console.log("FRIENDS IN GROUP IS " + friendsInGroup);
                if (friendsInGroup.length == 1) {
                    if (dmList.includes(user)) {
                        dialog.showErrorBox("Error!", "Friend already exists!");
                        newUserName.val('')
                    }
                    else {
                        createChat(friendsInGroup[0])
                        socket.emit('create_dm', {sender: username, friend: friendsInGroup[0]})
                    }
                }
                else {
                    friendsInGroup.push(username)
                    createGroup(friendsInGroup)
                }
                friendsInGroup = [];
            }
            else {
                dialog.showErrorBox("Error!", "User: " + user + " doesn't exist!");
            }
        }
        else {
            console.log("FRIENDS IN GROUP IS " + friendsInGroup);
            if (friendsInGroup.length == 1) {
                if (dmList.includes(user)) {
                    dialog.showErrorBox("Error!", "Friend already exists!");
                    newUserName.val('')
                }
                else {
                    createChat(friendsInGroup[0])
                    socket.emit('create_dm', {sender: username, friend: friendsInGroup[0]})
                }
            }
            else {
                friendsInGroup.push(username)
                createGroup(friendsInGroup)
            }
            friendsInGroup = [];
        }
    })

    //Emit typing
    var typingTimer;

    messageField.on('keyup', function () {
        clearTimeout(typingTimer);
        typingTimer = setTimeout(() => {
            if (groupClickedOn == false) {
                console.log("Stopped typing");
                socket.emit('stopped_typing', {username: username, to: friendClickedOn})
            }
            else {
                console.log("Stopped typing in group: " + groupName);
                socket.emit('stopped_typing_group', {username: username, grpId: groupName})
            }
        }, 3000)
    });

    videoButton.on('click', () => {
        console.log("Pressed video button");
        ipcRenderer.send('openVideoCallWindow', friendClickedOn, username);
    })

    callButton.on('click', () => {
        console.log("Call button clicked");
        ipcRenderer.send('openVoiceCallWindow', friendClickedOn, username);
    })

    //on keydown, clear the countdown
    messageField.on('keydown', function () {
        if (groupClickedOn == false) {
            console.log("I: " + username + " am typing to " + friendClickedOn);
            socket.emit('typing', {username: username, to: friendClickedOn})
        }
        else {
            console.log("I: " + username + " am typing in group: " + groupName);
            socket.emit('typing_group', {username: username, grpId: groupName})
        }
        clearTimeout(typingTimer);
    });

    $('#chat-list').on('contextmenu', 'button', (e) => {
        console.log("ID: " + e.currentTarget.id);
    });

    newUserName.on('keyup', function() {
        let user = newUserName.val();
        if (friends.includes(user)) {
            newUserName.css('border', '2px solid green')
            newUserName.removeClass('text-danger')
            newUserName.addClass('text-success')
            userExists = true;
        }
        else if (user == '') {
            newUserName.css('border', '2px solid green')
            newUserName.removeClass('text-danger')
            newUserName.addClass('text-success')
            userExists = false;
        }
        else {
            console.log("User doesn't exist");
            newUserName.css('border', '2px solid red')
            newUserName.addClass('text-danger')
            newUserName.removeClass('text-success')
            userExists = false;
        }
    });

    let imagePath;
    imagePath = fs.readFileSync('profile-pic')
    $('#profile-pic').attr('src', imagePath)

    newUserName.autocomplete({
        source: friends
    });
});

function friendListClicked(friend) {
    if (document.getElementById("checkbox").checked == true) {
        console.log(friend + " had been checked");
        let input = $('#addUserInput');
        friendsInGroup.push(friend)
        let nameWithoutSpace = friend.split(" ").join("");
        input.append('<span class="input-group-text" style="height: 90%;">' + friend +'<i onClick="removeButton(\'' + friend + '\')" class="fa fa-times" id="' + nameWithoutSpace + '_crossButton" style="padding-left: 10px; margin-right: -5px;"></i></span>');
        newUserName.val('');    
    }
    else {
        console.log(friend + " has been unchecked!");
        removeButton(friend)
    }

}

function friendsClicked() {
    chatheading.html('Friends')
    console.log("Showing friends tab");

    dmList.forEach(user => {
        let nameWithoutSpaceInLoop = user.split(" ").join("")
        chatroom = $('#' + nameWithoutSpaceInLoop + 'Chatroom')
        feedback = $('#' + nameWithoutSpaceInLoop + 'Feedback')
        chatroom.hide()
    });

    groups.forEach(group => {
        let grpId = group['grpId']
        grpChatroom = $('#' + grpId + 'GroupChatroom')
        grpFeedback = $('#' + grpId + 'GroupFeedback')
        grpChatroom.hide()
    })

    friendsChatroom.show()
    friendInvitesDiv.hide()
    blockedFriendsDiv.hide()
    pendingFriendsDiv.hide()
    allFriendsDiv.hide()
    onlineFriendsDiv.empty()
    onlineFriendsBtn.addClass('active')

    friendTabClickedOn = true;

    // Get online friends
    friends.forEach(friend => {
        console.log("Friend: " + friend);
        socket.emit('get_friends_online', (friend))
    })
}

function addFriend(friend) {
    pendingInvites.push(friend)
    socket.emit('add_friend', {friend: friend, sender: username});
    dialog.showMessageBox({
        title: 'Friend Invite',
        message: 'A friend invite has been sent to ' + friend + '. You will be notified on his response.',
        buttons: ['OK']
    })
}

function createGroup(friends) {
    console.log("Creating group with friends: " + friends);

    var grpId = friends[0];

    for (let i = 1; i < friends.length; i++) {
        grpId += friends[i]
    }

    grpId = grpId.split(" ").join("");
    console.log("GROUP ID: " + grpId);

    addGroupToHtml(friends, grpId)
    let grpDropdown = $("#groupDropdown")
    grpDropdown.prepend('<a class="dropdown-item" id="delete' + grpId + 'Option" onClick="deleteGroup(\'' + grpId + '\')" href="#">Delete Group</a>');


    groupClickedOn = true;
    groupName = grpId;

    let group = {
        friends: friends,
        owner: username,
        grpId: grpId,
        icon: 'grp icon'
    }

    socket.emit('create_group', {friends: friends, grpName: grpId, sender: username})

    groups.push(group)

    let groupjson = JSON.stringify(groups)
    fs.writeFile("group-list", groupjson, (err) => {
        console.log("Group file created");
    })

    pageContainer.prepend('<section class="chatroom" id="' + grpId + 'GroupChatroom"><section id="' + grpId + 'GroupFeedback"></section></section>')

    dmList.forEach(user => {
        let nameWithoutSpaceInLoop = user.split(" ").join("")
        chatroom = $('#' + nameWithoutSpaceInLoop + 'Chatroom')
        feedback = $('#' + nameWithoutSpaceInLoop + 'Feedback')
        chatroom.hide()
    });

    groups.forEach(group => {
        let grpId = group['grpId']
        grpChatroom = $('#' + grpId + 'GroupChatroom')
        grpFeedback = $('#' + grpId + 'GroupFeedback')
        grpChatroom.hide()
    })

    friendsChatroom.hide()

    grpChatroom = $('#' + grpId + 'GroupChatroom')
    grpFeedback = $('#' + grpId + 'GroupFeedback')
    grpChatroom.show()

    grpChatroom.scrollTop(grpChatroom.height()); 
}

function createChat(name) {
    console.log("Create chat button clicked.")

    var chatId = "" + username.split(' ').join('') + name.split(' ').join('')
    chatId = chatId.split('').sort().join('');
    console.log("Chat id generated is " + chatId);

    addChatListToHtml(name)

    dmList.push(name);

    socket.emit('get_status', {username: name})

    ipcRenderer.send('getImage', name)

    var chatData = {
        friend: name, 
        chatId: chatId,        
    }

    chatListObj.push(chatData);

    fs.writeFileSync('chat-list', chatListObj);

    fs.appendFile("dm-list", name + '\n', (err) => {
        if (err) {
            console.log("An error ocurred creating the file "+ err.message)
        }
        console.log("User file has succesfully been created.");
    })

    friendClickedOn = name;
    groupClickedOn = false;
    buttonClicked(name)

    let nameWithoutSpace = name.split(" ").join("")
    pageContainer.prepend('<section class="chatroom" id="' + nameWithoutSpace + 'Chatroom"><section id="' + nameWithoutSpace + 'Feedback"></section></section>')

    dmList.forEach(user => {
        let nameWithoutSpaceInLoop = user.split(" ").join("")
        chatroom = $('#' + nameWithoutSpaceInLoop + 'Chatroom')
        feedback = $('#' + nameWithoutSpaceInLoop + 'Feedback')
        chatroom.hide()
    });

    groups.forEach(group => {
        let grpId = group['grpId']
        grpChatroom = $('#' + grpId + 'GroupChatroom')
        grpFeedback = $('#' + grpId + 'GroupFeedback')
        grpChatroom.hide()
    })

    friendsChatroom.hide()

    chatroom = $('#' + nameWithoutSpace + 'Chatroom')
    feedback = $('#' + nameWithoutSpace + 'Feedback')
    chatroom.show()
    chatheading.html(name)
    chatroom.scrollTop(chatroom.height()); 

    fs.readFile('messages', (err, data) => {
        if (data) {
            let dataObj = JSON.parse(data)
            messageArr = dataObj;
            messageArr.forEach(message => {
                let nameWithoutSpace = message.sender.split(" ").join("")
                console.log("Recepient is " + message.to + " and sender is " + message.sender + " and chatroom id is " + '#' + message.to.split(" ").join("") + 'Chatroom');
                if (message.to == name && message.sender == username) {
                    chatroom = $('#' + message.to.split(" ").join("") + 'Chatroom')
                    console.log( message.sender + ": " + message.message);
                    chatroom.append("<p class='message'>" + message.sender + ": " + message.message + "</p>")
                }
                else if (message.sender == name && message.to == username) {
                    chatroom = $('#' + nameWithoutSpace + 'Chatroom')
                    console.log( message.sender + ": " + message.message);
                    chatroom.append("<p class='message'>" + message.sender + ": " + message.message + "</p>")
                }
            });
        }
    })
}

function removeButton(name) {
    console.log("Removing user: " + name);
    let nameWithoutSpace = name.split(" ").join("");
    let crossBtn = $('#' + nameWithoutSpace + '_crossButton');
    crossBtn.parent().remove()
    
    let i = friendsInGroup.indexOf(name);
    friendsInGroup.splice(i, 1);
}

function sendImage(imagePath) {
    feedback.html('');
    let imagePathString = "" + imagePath;

    var currentdate = new Date();
    var time = currentdate.getDate() + "/"
                + currentdate.getHours() + ":"
                + currentdate.getMinutes() + ":"
                + currentdate.getSeconds();

    fs.readFile(imagePathString, 'base64', (err, data) => {
        console.log("Image to be sent is " + data);

        let messageData = {
            sender: username,
            message: data,
            to: friendClickedOn,
            time: time,
            type: 'image'
        }

        socket.emit('send_image', messageData)
            
        messages.push(messageData)
        // console.log("messages array is " + JSON.stringify(messages));

        messageLogic.sendImage(messages, messageData, username, friendClickedOn, imagePath)

        if (messages) {
            let messagejson = JSON.stringify(messages)

            console.log("Messages2 is " + messagejson);

            fs.writeFile("messages", messagejson, (err) => {
                if(err) {
                    console.log("An error ocurred creating the file "+ err.message)
                }
                console.log("User file has succesfully been created.");
            })
        }
    })

    chatroom.scrollTop(chatroom.prop("scrollHeight")); 
}

function sendGroupImage(imagePath) {
    let imagePathString = "" + imagePath;

    console.log("Group name is " + groupName);
    grpFeedback = $('#' + groupName + 'GroupFeedback')
    grpFeedback.html('')

    var currentdate = new Date();
    var time = currentdate.getDate() + "/"
                + currentdate.getHours() + ":"
                + currentdate.getMinutes() + ":"
                + currentdate.getSeconds();

    let groupFile = fs.readFileSync('group-list');
    groupFile = JSON.parse(groupFile)

    var friends = [];
    var grpId;

    groupFile.forEach(group => {
        if (group['grpId'] = groupName) {
            console.log("Group is " + JSON.stringify(group));
            friends = group['friends']
            grpId = group['grpId']
        }
    })

    fs.readFile(imagePathString, 'base64', (err, data) => {
        console.log("Image to be sent is " + data);

        let messageData = {
            sender: username,
            grpId: grpId,
            message: data,
            friends: friends,
            time: time,
            type: 'image'
        }

        socket.emit('send_group_image', messageData)

        groupMessages.push(messageData)

        messageLogic.sendGroupImage(groupMessages, messageData, username, grpId, data)

        if (groupMessages) {
            let messagejson = JSON.stringify(groupMessages)
    
            console.log("Messages is " + JSON.stringify(messageData));
    
            fs.writeFile("group-messages", messagejson, (err) => {
                if(err) {
                    console.log("An error ocurred creating the file "+ err.message)
                }
                console.log("User file has succesfully been created.");
            })
        }
    
        messageField.val('');
        grpChatroom.scrollTop(grpChatroom.prop("scrollHeight")); 
    })
}

function sendGroupMessage() {
    console.log("Sending message in group");

    grpFeedback = $('#' + groupName + 'GroupFeedback')
    grpFeedback.html('')
    grpChatroom = $('#' + groupName + 'GroupChatroom')
    // grpChatroom.append("<p class='message'>" + username + ": " + messageField.val() + "</p>")
    
    let groupFile = fs.readFileSync('group-list');
    groupFile = JSON.parse(groupFile)
    var friends = [];
    var grpId;
    groupFile.forEach(group => {
        if (group['grpId'] = groupName) {
            console.log("Group is " + JSON.stringify(group));
            friends = group['friends']
            grpId = group['grpId']
        }
    })
    console.log("Group members: " + friends);

    var currentdate = new Date();
    var time = currentdate.getDate() + "/"
                + currentdate.getHours() + ":"
                + currentdate.getMinutes() + ":"
                + currentdate.getSeconds();

    let messageData = {
        sender: username,
        grpId: grpId,
        message: messageField.val(),
        to: friends,
        time: time,
        type: 'text'
    }

    socket.emit('send_group_message', messageData);

    groupMessages.push(messageData)

    messageLogic.sendGroupMessage(groupMessages, messageData, username, grpId, messageField.val())

    if (groupMessages) {
        let messagejson = JSON.stringify(groupMessages)

        console.log("Messages is " + JSON.stringify(messageData));

        fs.writeFile("group-messages", messagejson, (err) => {
            if(err) {
                console.log("An error ocurred creating the file "+ err.message)
            }
            console.log("User file has succesfully been created.");
        })
    }

    messageField.val('');
    grpChatroom.scrollTop(grpChatroom.prop("scrollHeight")); 
}

function sendMessage() {
    console.log("Send button clicked.");
    feedback.html('');

    var currentdate = new Date();
    var time = currentdate.getDate() + "/"
                + currentdate.getHours() + ":"
                + currentdate.getMinutes() + ":"
                + currentdate.getSeconds();

    let messageData = {
        sender: username,
        message: messageField.val(),
        to: friendClickedOn,
        time: time,
        type: 'text'
    }    

    socket.emit('send_message', messageData);

    messages.push(messageData)

    messageLogic.sendMessage(messages, messageData, username, friendClickedOn, messageField.val());

    if (messages) {
        let messagejson = JSON.stringify(messages)

        fs.writeFile("messages", messagejson, (err) => {
            if(err) {
                console.log("An error ocurred creating the file "+ err.message)
            }
            console.log("User file has succesfully been created.");
        })
    }

    messageField.val('');
    chatroom.scrollTop(chatroom.parent().prop("scrollHeight")); 
}

function groupClicked(grpId) {
    groupName = grpId;
    groupClickedOn = true;
    friendTabClickedOn = false;
    console.log("Clicked on group: " + grpId);

    var friends = [];

    dmList.forEach(user => {
        let nameWithoutSpaceInLoop = user.split(" ").join("")
        chatroom = $('#' + nameWithoutSpaceInLoop + 'Chatroom')
        feedback = $('#' + nameWithoutSpaceInLoop + 'Feedback')
        chatroom.hide()
    });

    groups.forEach(group => {
        let grpId = group['grpId']
        friends = group['friends']
        grpChatroom = $('#' + grpId + 'GroupChatroom')
        grpFeedback = $('#' + grpId + 'GroupFeedback')
        grpChatroom.hide()
    })

    friendsChatroom.hide()

    grpChatroom = $('#' + grpId + 'GroupChatroom')
    grpFeedback = $('#' + grpId + 'GroupFeedback')
    grpChatroom.show()
    grpChatroom.scrollTop(grpChatroom.height());
    grpChatroom.scrollTop(grpChatroom.prop("scrollHeight")); 

    var friendsStr = friends[0];
    for (let i = 1; i < friends.length; i++) {
        friendsStr += ", " + friends[i];  
    }
    chatheading.html(friendsStr)
}

function buttonClicked(name) {
    friendClickedOn = name;
    groupClickedOn = false;
    friendTabClickedOn = false;
    console.log("Clicked on " + name);

    dmList.forEach(user => {
        let nameWithoutSpaceInLoop = user.split(" ").join("")
        chatroom = $('#' + nameWithoutSpaceInLoop + 'Chatroom')
        feedback = $('#' + nameWithoutSpaceInLoop + 'Feedback')
        chatroom.hide()
    });

    groups.forEach(group => {
        let grpId = group['grpId']
        grpChatroom = $('#' + grpId + 'GroupChatroom')
        grpFeedback = $('#' + grpId + 'GroupFeedback')
        grpChatroom.hide()
    })

    friendsChatroom.hide()

    let nameWithoutSpace = name.split(" ").join("")
    chatroom = $('#' + nameWithoutSpace + 'Chatroom')
    feedback = $('#' + nameWithoutSpace + 'Feedback')
    chatroom.show()
    chatheading.html(name)

    chatroom.scrollTop(chatroom.prop("scrollHeight")); 
}

function addGroupMessages() {
    if (fs.existsSync('group-messages')) {
        let data = fs.readFileSync('group-messages')
        if (data != '') {
            dataObj = JSON.parse(data);
            groupMessages = dataObj;
            messageArr = dataObj;
            messageLogic.addGroupMessages(messageArr, username)
        }
    }
}

function addChatObjList() {
    if (fs.existsSync('chat-list')) {
        let data = fs.readFileSync('chat-list')
        if (data != '') {
            dataObj = JSON.parse(data);
            chatListObj = dataObj;
        }
    }
}

function addMessages() {
    if (fs.existsSync('messages')) {
        let data = fs.readFileSync('messages')
        if (data != '') {
            dataObj = JSON.parse(data);
            messages = dataObj;
            console.log("Data is " + JSON.stringify(dataObj));
            messageArr = dataObj;
            messageLogic.addMessages(messageArr, username)
        }
    }
    socket.emit('user_online', {username : username})
}

function addGroups() {
    if (fs.existsSync('group-list')) {
        let groupFile = fs.readFileSync('group-list')
        if (groupFile != '') {
            let groupsArr = JSON.parse(groupFile)
            groupsjson = JSON.stringify(groupsArr)
            console.log("Groups are " + groupsjson);
            groupsArr.forEach(group => {
                let friends = group['friends']
                let grpId = group['grpId']
                let groupItem = {
                    friends: friends,
                    grpId: grpId,
                    icon: 'grp icon'
                }

                groupClicked(grpId)
            
                groups.push(groupItem)
        
                console.log("Groups array is " + JSON.stringify(groups));
        
                console.log("Group id is " + grpId);
                grpChatroom = $('#' + grpId + 'GroupChatroom')
                pageContainer.prepend('<section class="chatroom" id="' + grpId + 'GroupChatroom"><section id="' + grpId + 'GroupFeedback"></section></section>')
                addGroupToHtml(friends, grpId)
                let owner = group['owner']
                if (owner == username) {
                    let grpDropdown = $("#groupDropdown")
                    grpDropdown.prepend('<a class="dropdown-item" id="delete' + grpId + 'Option" onClick="deleteGroup(\'' + grpId + '\')" href="#">Delete Group</a>');
                }
            })
        }
    }
}

function addFriends() {
    friendsAdded = false
    if (fs.existsSync('dm-list')) {
        const file = readline.createInterface({
            input: fs.createReadStream('dm-list'),
            output: process.stdout,
            terminal: false
        });
    
        file.on('line', (line) => {
            if (line != "") {
                socket.emit('get_status', {username: line})
                dmList.push(line)
                ipcRenderer.send('getImage', line)
                let nameWithoutSpaceInLoop = line.split(" ").join("")
                console.log("Adding chat list to username: " + nameWithoutSpaceInLoop);
                pageContainer.prepend('<section class="chatroom" id="' + nameWithoutSpaceInLoop + 'Chatroom"><section id="' + nameWithoutSpaceInLoop + 'Feedback"></section></section>')
                // chatList.append('<button style="padding-right: 5px; outline: none" type="button" onclick="buttonClicked(\'' + line + '\')" id="' + nameWithoutSpaceInLoop + '_id" data-username="'
                //  + line + '" class="list-group-item list-group-item-action">' + line + '<span style="float: right; height: 21px;" id="' + nameWithoutSpaceInLoop + '_spanid" class="badge badge-success"></span></button>')
                addChatListToHtml(line)

                groupClickedOn = false;

                chatroom = $('#' + nameWithoutSpaceInLoop + 'Chatroom')
                feedback = $('#' + nameWithoutSpaceInLoop + 'Feedback')
                chatroom.hide()
            
                groups.forEach(group => {
                    let grpId = group['grpId']
                    grpChatroom = $('#' + grpId + 'GroupChatroom')
                    grpFeedback = $('#' + grpId + 'GroupFeedback')
                    grpChatroom.hide()
                })

                let nameWithoutSpace = dmList[0].split(" ").join("")
                let firstChatroom = $('#' + nameWithoutSpace + 'Chatroom')
                firstChatroom.show()
                chatheading.html(dmList[0])
                friendClickedOn = dmList[0];
                firstChatroom.scrollTop(firstChatroom.height()); 
            }
        });
        friendsAdded = true;
    }
    else {
        friendsAdded = true;
    }
}

function addChatListToHtml(name) {
    let nameWithoutSpace = name.split(" ").join("")
    chatList.append(
    '<div style="background-color: #353641; padding-right: 5px; outline: none;" type="button" class="list-group-item list-group-item-action chat-item' + nameWithoutSpace + '_nameclass" onclick="buttonClicked(\'' + name + '\')" id="' + nameWithoutSpace + '_id" data-username="' + name + '">' +
        '<div class="row ' + nameWithoutSpace + '_nameclass">' +
            '<div class="col-4 ' + nameWithoutSpace + '_nameclass">' +
                '<img class="' + nameWithoutSpace + '_nameclass" id="' + nameWithoutSpace + '_pic" style="border-radius: 50%; width: 40px; height: 40px;" src="../assets/images/avatar.jpg" alt="Avatar">' +
            '</div>' +
            '<div class="col-6 ' + nameWithoutSpace + '_nameclass" style="padding-left: 5px;">' +
                '<div style="color: white;" class="row ' + nameWithoutSpace + '_nameclass">' + name + '</div>' +
                '<div class="row ' + nameWithoutSpace + '_nameclass">' +
                    '<small style="height: 21px; margin-top: -3px;" id="' + nameWithoutSpace + '_statusid" class="text-success ' + nameWithoutSpace + '_nameclass"></small>' +
                '</div>' +
            '</div>' +
            '<div class="col-2 dropdown" style="padding-left: 0px">' +
                '<a href="#" id="' + nameWithoutSpace + '_optionsid" style="border: none; padding: 0px; color: white; background-color: transparent;" data-toggle="dropdown"><i class="fa fa-ellipsis-h" style="margin-top: 12px"></i></a>' +
                '<div class="dropdown-menu" id="userDropdown">' +
                '<a class="dropDownItem dropdown-item" href="#" onClick="closeDM(\'' + name + '\')">Close DM</a>' +
                '<a class="dropDownItem dropdown-item" href="#" onClick="blockUser(\'' + name + '\')">Block User</a>' +
                '<a class="dropDownItem dropdown-item" id="remove' + nameWithoutSpace + 'Option" onClick="removeFriend(\'' + name + '\')" href="#">Remove Friend</a>' +
            '</div>' +
            '</div>' +
        '</div>' +
    '</div>')
}

function addGroupToHtml(friends, grpId) {
    chatList.append(
    '<div style="background-color: #353641; padding-right: 5px; outline: none;" type="button" class="list-group-item list-group-item-action ' + grpId + '_nameclass" id="' + grpId + '_id" onClick="groupClicked(\'' + grpId + '\')">' +
        '<div class="row ' + grpId + '_nameclass">' +
            '<div class="col-4 ' + grpId + '_nameclass">' +
                '<img class="' + grpId + '_nameclass" id="' + grpId + '_pic" style="border-radius: 50%; width: 40px; height: 40px;" src="../assets/images/avatar.jpg" alt="Avatar">' +
            '</div>' +
            '<div class="col-6 ' + grpId + '_nameclass" style="padding-left: 5px;">' +
                '<div style="padding-top: 6px; padding-bottom: 10px; color: white;" id="' + grpId + 'friends" class="row ' + grpId + '_nameclass"></div>' +
            '</div>' +
            '<div class="col-2 dropdown" style="padding-left: 0px">' +
                '<a href="#" id="' + grpId + '_optionsid" style="border: none; padding: 0px; color: white; background-color: transparent;" data-toggle="dropdown"><i class="fa fa-ellipsis-h" style="margin-top: 12px"></i></a>' +
                '<div class="dropdown-menu" id="userDropdown">' +
                    '<a class="dropDownItem dropdown-item" href="#" onClick="leaveGroup(\'' + grpId + '\')">Leave Group</a>' +
                    '<a class="dropDownItem dropdown-item" href="#">Something else here</a>' +
                '</div>' +
            '</div>' +
        '</div>' +
    '</div>')

    let friendsGrp = $('#' + grpId + 'friends')
    var friendsStr = friends[0];
    for (let i = 1; i < friends.length; i++) {
        friendsStr += ", " + friends[i];  
    }
    console.log("Friends str is " + friendsStr);
    friendsGrp.html(friendsStr)
    chatheading.html(friendsStr)
}

function blockUser(friend) {
    console.log("Blocking user " + friend);
    friendsBlocked.push(friend);
    let name = friend.split(' ').join('')
        onlineFriendsDiv.append(
            '<li id="' + name + '_inviteList" class="list-group-item friendListItem" aria-current="true">' + 
                '<div class="btn-group" role="group" style="float: left">' + 
                    '<img style="border-radius: 50%; width: 45px; margin-right: 13px" src="../assets/images/avatar.jpg" alt="Avatar">' + 
                    '<div class="col">' + 
                        '<div style="margin-top: 2px; color: white;" class="row">' + friend + '</div>' + 
                        '<div class="row"> ' + 
                            '<small style="height: 21px; color: rgb(24,158,73); margin-top: -3px;">online</small>' + 
                        '</div>' + 
                    '</div>' + 
                '</div>' + 
            '</li>');
}

function closeDM(friend) {
  let i = dmList.indexOf(friend)
  dmList.splice(i, 1);

  fs.writeFileSync("dm-list", "")

  dmList.forEach(user => {
    fs.appendFile("dm-list", user + '\n', (err) => {
        if(err){
            console.log("An error ocurred creating the file "+ err.message)
        }
        console.log("User file has succesfully been created.");
    })
  })

  let nameWithoutSpace = friend.split(' ').join('')
  $("#" + nameWithoutSpace + "_id").remove()

  chatroom = $('#' + nameWithoutSpace + 'Chatroom')
  chatroom.remove()
}

function leaveGroup(grpId) {
    dialog.showMessageBox({
        title: "Leave Group",
        message: "Are you sure you want to leave this group. You will no longer be able to rejoin unless you are re-invited.",
        buttons: ['Cancel', 'Leave Group']
    }).then((res) => {
        let buttonIndex = res.response;
        if (buttonIndex === 1) {
            var friends;
            var owner;
            var tempGroups = [];
        
            console.log(username + " has left group: " + grpId);

            if (fs.existsSync('group-list')) {
                let groupFile = fs.readFileSync('group-list')
                let groupsArr = JSON.parse(groupFile)
                groupsjson = JSON.stringify(groupsArr)
                console.log("Groups are " + groupsjson);
                groupsArr.forEach(group => {
                    if (group['grpId'] == grpId) {
                        friends = group['friends']
                        owner = group['owner']
                    }
                    else {
                        tempGroups.push(group)
                    }
                })
            }

            console.log("Deleting group with id: " + grpId + ", friends: " + friends + ", owner: " + owner);

            console.log("Temps array is " + JSON.stringify(tempGroups));
        
            let group = $('#' + grpId + '_id')
            group.remove();
        
            grpChatroom = $('#' + grpId + 'GroupChatroom')
            grpChatroom.remove();
        
            groups = tempGroups;
        
            console.log("Groups array is " + JSON.stringify(groups));
        
            fs.writeFileSync('group-list', (tempGroups))
        
            socket.emit('leave_group', {grpId: grpId, username: username, owner: owner, friends: friends})
        }
        else {
            console.log(username + " has NOT left group: " + grpId);
        }
    })
}

function removeFriend(name) {
    console.log("Removing friend " + name);
    let nameWithoutSpace = name.split(" ").join("")
    let user = $('#' + nameWithoutSpace + '_id')
    user.remove()
    var i = dmList.indexOf(name);
    dmList.splice(i, 1);
    var nextFriend

    var dmListTmp = fs.readFileSync('dm-list').toString().split("\n");
    console.log("Array Before is " + dmListTmp)
    var usernameIndex = dmListTmp.indexOf(name);
    console.log("Next friend is " + dmListTmp[usernameIndex + 1]);
    nextFriend = dmListTmp[usernameIndex + 1]
    dmListTmp.splice(usernameIndex, 1);
    console.log("Array After is " + dmListTmp)
  
    fs.writeFileSync("dm-list", "")
  
    dmList.forEach(user => {
      fs.appendFile("dm-list", user + '\n', (err) => {
          if(err){
              console.log("An error ocurred creating the file "+ err.message)
          }
          console.log("User file has succesfully been created.");
      })
    })

    chatroom = $('#' + nameWithoutSpace + 'Chatroom')
    chatroom.remove()

    // remove from friends array
    if (friends.includes(name)) {
        let index = friends.indexOf(name)
        friends.splice(index, 1)
    }

    // remove from friends file
    let dataObj = {
        friends: friends,
        friendsOnline: friendsOnline,
        friendInvites: friendInvites,
        pendingInvites: pendingInvites,
        friendsBlocked: friendsBlocked
    }

    dataObj = JSON.stringify(dataObj)

    fs.writeFile("friends", (dataObj), (err) => {
        if(err) {
            console.log("An error ocurred removing the file "+ err.message)
        }
        console.log("User file has succesfully been removed.");
    })

    socket.emit('remove_friend', {sender: username, friend: name})

    setTimeout(() => {
        buttonClicked(nextFriend)
    }, 100)
}

socket.on('remove_friend', (name) => {
    console.log("Removing friend " + name);
    let nameWithoutSpace = name.split(" ").join("")
    let user = $('#' + nameWithoutSpace + '_id')
    user.remove()
    var i = dmList.indexOf(name);
    dmList.splice(i, 1);
    var nextFriend

    var dmListTmp = fs.readFileSync('dm-list').toString().split("\n");
    console.log("Array Before is " + dmListTmp)
    var usernameIndex = dmListTmp.indexOf(name);
    console.log("Next friend is " + dmListTmp[usernameIndex + 1]);
    nextFriend = dmListTmp[usernameIndex + 1]
    dmListTmp.splice(usernameIndex, 1);
    console.log("Array After is " + dmListTmp)
  
    fs.writeFileSync("dm-list", "")
  
    dmList.forEach(user => {
      fs.appendFile("dm-list", user + '\n', (err) => {
          if(err){
              console.log("An error ocurred creating the file "+ err.message)
          }
          console.log("User file has succesfully been created.");
      })
    })

    chatroom = $('#' + nameWithoutSpace + 'Chatroom')
    chatroom.remove()

    // remove from friends array
    if (friends.includes(name)) {
        let index = friends.indexOf(name)
        friends.splice(index, 1)
    }

    // remove from friends file
    let dataObj = {
        friends: friends,
        friendsOnline: friendsOnline,
        friendInvites: friendInvites,
        pendingInvites: pendingInvites,
        friendsBlocked: friendsBlocked
    }

    dataObj = JSON.stringify(dataObj)

    fs.writeFile("friends", (dataObj), (err) => {
        if(err) {
            console.log("An error ocurred removing the file "+ err.message)
        }
        console.log("User file has succesfully been removed.");
    })

    socket.emit('remove_friend', {sender: username, friend: name})

    setTimeout(() => {
        buttonClicked(nextFriend)
    }, 100)
})

function deleteGroup(grpId) {
    var friends;
    var owner;
    var tempGroups = [];
    var tempGroupMessages = [];

    if (fs.existsSync('group-list')) {
        let groupFile = fs.readFileSync('group-list')
        let groupsArr = JSON.parse(groupFile)
        groupsjson = JSON.stringify(groupsArr)
        console.log("Groups are " + groupsjson);
        groupsArr.forEach(group => {
            if (group['grpId'] == grpId) {
                friends = group['friends']
                owner = group['owner']
            }
            else {
                tempGroups.push(group)
            }
        })
    }

    if (fs.existsSync('group-messages')) {
      let groupFile = fs.readFileSync('group-messages')
      let groupsArr = JSON.parse(groupFile)
      groupsjson = JSON.stringify(groupsArr)
      groupsArr.forEach(message => {
          if (message['grpId'] != grpId) {
              tempGroupMessages.push(group)
          }
      })
    }

    console.log("Deleting group with id: " + grpId + ", friends: " + friends + ", owner: " + owner);

    console.log("Temps array is " + JSON.stringify(tempGroups));

    let group = $('#' + grpId + '_id')
    group.remove();

    grpChatroom = $('#' + grpId + 'GroupChatroom')
    grpChatroom.remove();

    groups = tempGroups;

    console.log("Groups array is " + JSON.stringify(groups));

    if (tempGroups.length === 0) {
      fs.unlinkSync('group-list')
    }
    else {
      fs.writeFileSync('group-list', (tempGroups))
    }

    if (tempGroupMessages.length === 0) {
      fs.unlinkSync('group-messages')
    }
    else {
      fs.writeFileSync('group-messages', (tempGroupMessages))
    }

    socket.emit('delete_group', {grpId: grpId, owner: owner, friends: friends})
}

socket.on('friend_invite', (data) => {
    let friend = data.sender;
    const myNotification = new Notification('Friend Invite', {
        body: friend + " has invited you to be friends!"
    })
    console.log(friend + " has invite " + username + " to be friends!");
    friendInvites.push(friend);
    friendInvites.forEach((friend) => {
        let name = friend.split(' ').join('');
        pendingFriendsDiv.append(
            '<li id="' + name + '_inviteList" class="list-group-item friendListItem" aria-current="true">' + 
                '<div class="btn-group" role="group" style="float: left">' + 
                    '<img style="border-radius: 50%; width: 45px; margin-right: 13px" src="../assets/images/avatar.jpg" alt="Avatar">' + 
                    '<div class="col" style="padding: 0px">' + 
                        '<div style="margin-top: 10px; color: white;">' + friend + '</div>' + 
                    '</div>' + 
                '</div>' + 
                '<div class="btn-group" role="group" style="float: right">' + 
                    '<button onClick="acceptInvite(\'' + friend + '\')" id="' + name + '_accept" style="width: max-content;" class="btn btn-outline-success">Accept <i class="fa fa-check"></i></button>' + 
                    '<button onClick="declineInvite(\'' + friend + '\')" id="' + name + '_decline" style="width: max-content;" class="btn btn-outline-danger">Decline <i class="fa fa-times"></i></button>' + 
                '</div>' +
            '</li>');
    })
})

function acceptInvite(friend) {
    console.log(username + " has accepted " + friend + "'s friend invitation");
    socket.emit('create_dm', {sender: username, friend: friend})
    // remove from array 
    let index = friendInvites.indexOf(friend)
    friendInvites.splice(index, 1)

    // remove html from friends div
    let name = friend.split(' ').join('')
    let content = $('#' + name + '_inviteList')
    content.remove()
    
    // add user to dmlist and create chatroom
    createChat(friend)

    // Add friend to array of friends
    friends.push(friend)

    // Add to file
    let dataObj = {
        friends: friends,
        friendsOnline: friendsOnline,
        friendInvites: friendInvites,
        pendingInvites: pendingInvites,
        friendsBlocked: friendsBlocked
    }

    dataObj = JSON.stringify(dataObj)

    fs.writeFileSync('friends', (dataObj))

    friendClickedOn = friend;

    buttonClicked(friend)
}

function declineInvite(friend) {
    console.log(username + " has declined " + friend + "'s friend invitation");
    socket.emit('decline_friend_invite', {sender: username, friend: friend})
    // remove from array and html code
    let index = friendInvites.indexOf(friend)
    friendInvites.splice(index, 1)
    let name = friend.split(' ').join('')
    let content = $('#' + name + '_inviteList')
    content.remove()
}

socket.on('create_dm', (friend) => {
    let index = pendingInvites.indexOf(friend)
    pendingInvites.splice(index, 1)

    createChat(friend)

    friends.push(friend)

    // Add to file
    let dataObj = {
        friends: friends,
        friendsOnline: friendsOnline,
        friendInvites: friendInvites,
        pendingInvites: pendingInvites,
        friendsBlocked: friendsBlocked
    }

    dataObj = JSON.stringify(dataObj)

    fs.writeFileSync('friends', (dataObj))

    friendClickedOn = friend;

    buttonClicked(friend)
})

//Listen on other user status change
socket.on('status_changed', (data) => {
    console.log("Getting status for " + data.username);
    socket.emit('get_status', {username: data.username})
    let i = friendsOnline.indexOf(data.username)
    friendsOnline.splice(i, 1)
    
})

socket.on('invite_accepted', (sender) => {
    console.log("Friend invite to " + sender + " has been accepted");
    // remove from array
    let index = pendingInvites.indexOf(sender)
    pendingInvites.splice(index, 1)

    // Add to array 
    friends.push(sender);

    // Add to file
    let dataObj = {
        friends: friends,
        friendsOnline: friendsOnline,
        friendInvites: friendInvites,
        pendingInvites: pendingInvites,
        friendsBlocked: friendsBlocked
    }

    fs.writeFileSync('friends', (dataObj))
})

socket.on('invite_declined', (sender) => {
    console.log("Friend invite to " + sender + " has been declined");
    // remove from array
    let index = friendInvites.indexOf(sender)
    friendInvites.splice(index, 1)
})

socket.on('friend_online', (friend) => {
    console.log(friend + " is online");
    console.log('ONLINE: ' + JSON.stringify(friendsOnline));

    // Add to array
    if (!friendsOnline.includes(friend)) {
        friendsOnline.push(friend)
    }

    // Append to div
    friendsOnline.forEach(friend => {
        let name = friend.split(' ').join('')
        onlineFriendsDiv.append(
            '<li id="' + name + '_inviteList" class="list-group-item friendListItem" aria-current="true">' + 
                '<div class="btn-group" role="group" style="float: left">' + 
                    '<img style="border-radius: 50%; width: 45px; margin-right: 13px" src="../assets/images/avatar.jpg" alt="Avatar">' + 
                    '<div class="col">' + 
                        '<div style="margin-top: 2px; color: white;" class="row">' + friend + '</div>' + 
                        '<div class="row"> ' + 
                            '<small style="height: 21px; color: rgb(24,158,73); margin-top: -3px;">online</small>' + 
                        '</div>' + 
                    '</div>' + 
                '</div>' + 
            '</li>');
    })

    onlineFriendsDiv.show();

})

socket.on('friend_status', (data) => {
    let friend = data.friend;
    var status, statusCol;

    console.log("Fetching friend: " + friend);

    let name = friend.split(' ').join('')
    if (data.status === undefined) {
        status = "offline"
        statusCol = "text-danger";
    }
    else if(data.status == "invisible" || data.status == "offline") {
        status = "offline"
        statusCol = "text-danger";
    }
    else {
        status = data.status;
        statusCol = "text-success";
    }

    // Append to div
    allFriendsDiv.append(
        '<li id="' + name + '_inviteList" class="list-group-item friendListItem" aria-current="true">' + 
            '<div class="btn-group" role="group" style="float: left;">' + 
                '<img style="border-radius: 50%; width: 45px; margin-right: 13px" src="../assets/images/avatar.jpg" alt="Avatar">' + 
                '<div class="col">' + 
                    '<div style="margin-top: 2px; color: white;" class="row">' + friend + '</div>' + 
                    '<div class="row"> ' + 
                        '<small class="' + statusCol + '" style="height: 21px; color: rgb(24,158,73); margin-top: -3px;">' + status + '</small>' + 
                    '</div>' + 
                '</div>' + 
            '</div>' + 
        '</li>');

    allFriendsDiv.show();
})
//Listen on user status
socket.on('get_status', (data) => {
    if (data) {
        var status, statusCol;
        let nameWithoutSpace = data.username.split(" ").join("")
        console.log("Received status from username: " + data.username);
        if (data.status === undefined) {
            status = "offline"
            statusCol = false;
        }
        else if(data.status == "invisible" || data.status == "offline") {
            status = "offline"
            statusCol = false;
        }
        else {
            status = data.status;
            statusCol = true;
        }
        let statusid = $('#' + nameWithoutSpace + '_statusid')
        if (statusCol == false) {
            statusid.removeClass("text-success")
            statusid.addClass("text-danger")
            let i = friendsOnline.indexOf(data.username)
            friendsOnline.splice(i, 1)
        }
        else {
            statusid.removeClass("text-danger")
            statusid.addClass("text-success")
        }
        console.log("Status is " + status + " and color is " + statusCol);
        statusid.text(status)   
    }
})

socket.on("image_sent", (data) => {
    let message = data.message;
    let sender = data.sender;
    let recepeint = data.to;

    var base46Message = 'data:image/jpeg;base64,' + message
    console.log("Received image from " + sender);
    feedback.html('');

    if (friendClickedOn != sender || groupClickedOn == true || friendTabClickedOn == true) {
        let filename = './profile-pics/' + sender.split(' ').join('')
        var base46Img = fs.readFileSync(filename)
        const messageNotification = new Notification(sender, {
            body: 'Uploaded an image ...',
            icon: base46Img
        })    
    }

    // let nameWithoutSpace = friendClickedOn.split(" ").join("")
    // chatroom = $('#' + nameWithoutSpace + 'Chatroom')
    // chatroom.append("<p class='message'>" + data.sender + ": <img src='" + base46Img + "'> </p>")

    var currentdate = new Date();
    var time = currentdate.getDate() + "/"
                + currentdate.getHours() + ":"
                + currentdate.getMinutes() + ":"
                + currentdate.getSeconds();

    messageData = {
        sender: sender,
        message: message,
        to: recepeint,
        time: time,
        type: 'image'
    }
        
    messages.push(messageData)

    messageLogic.receiveImage(messages, messageData, sender, base46Message);
    
    // let i = messages.indexOf(messageData)
    // let oldMessage = messages[i-1]
    // console.log("MESSAGE WHICH WAS SENT IS " + JSON.stringify(oldMessage));

    // if (oldMessage === undefined) {
    //     let nameWithoutSpace = sender.split(" ").join("")
    //     chatroom = $('#' + nameWithoutSpace + 'Chatroom')
    //     let filename = './profile-pics/' + sender.split(' ').join('')
    //     var base46Img = fs.readFileSync(filename)
    //     chatroom.append('<div  id="message-color" style="margin-top: 15px; margin-right: 15px;" class="row"><div class="col" style="flex-grow: 0">' + 
    //         '<img style="width: 40px; height: 40px; border-radius: 50%;" src="' + base46Img + '"></div><div style="float: left" class="col-md-auto">' + 
    //         '<div class="row"><b>' + sender + '</b></div><div class="row"><img src="' + base46Message + '"></div></div></div>');
    // }
    // else {
    //     if (oldMessage["sender"] != sender) {
    //         let nameWithoutSpace = sender.split(" ").join("")
    //         chatroom = $('#' + nameWithoutSpace + 'Chatroom')
    //         let filename = './profile-pics/' + sender.split(' ').join('')
    //         var base46Img = fs.readFileSync(filename)
    //         chatroom.append('<div  id="message-color" style="margin-top: 15px; margin-right: 15px;" class="row"><div class="col" style="flex-grow: 0">' + 
    //             '<img style="width: 40px; height: 40px; border-radius: 50%;" src="' + base46Img + '"></div><div style="float: left" class="col-md-auto">' + 
    //             '<div class="row"><b>' + sender + '</b></div><div class="row"><img src="' + base46Message + '"></div></div></div>');
    //     }
    //     else {
    //         let nameWithoutSpace = sender.split(" ").join("")
    //         chatroom = $('#' + nameWithoutSpace + 'Chatroom')
    //         if (oldMessage["type"] == "image") {
    //             chatroom.append("<p  id='message-color' style='margin-left: 55px; margin-top: 5px;' class='message'><img src='" + base46Message + "'></p>")
    //         }
    //         else {
    //             chatroom.append("<p  id='message-color' style='margin-left: 55px;' class='message'><img src='" + base46Message + "'></p>")
    //         }
    //     }
    // }

    if (messages) {
        let messagejson = JSON.stringify(messages)

        console.log("Messages2 is " + messagejson);

        fs.writeFile("messages", messagejson, (err) => {
            if(err) {
                console.log("An error ocurred creating the file "+ err.message)
            }
            console.log("User file has succesfully been created.");
        })
    }

    chatroom.scrollTop(chatroom.prop("scrollHeight")); 
})

socket.on('group_invite_accepted', (data) => {
    let grpName = data.grpName;
    let username = data.username;

    console.log(username + " has accepted the group invite");

    dialog.showMessageBoxSync({
        title: "Invitation accepted",
        message: username + " has accepted the group invite",
        buttons: ['OK']
    })
})

socket.on('create_group', (data) => {
    let grpId = data.grpName;
    let sender = data.sender;
    let friendsGrp = data.friends;

    // Get profile pic of all users in group.
    friendsGrp.forEach(friend => {
        if (!friends.includes(friend)) {
            console.log(friend);
            ipcRenderer.send('getImage', friend)
        }
    })

    socket.emit('add_to_grp', {grpId: grpId, username: username})

    addGroupToHtml(friendsGrp, grpId)

    groupClickedOn = true;
    groupName = grpId;

    let group = {
        friends: friendsGrp,
        owner: sender,
        grpId: grpId,
        icon: 'grp icon'
    }

    groups.push(group)

    let groupjson = JSON.stringify(groups)
    fs.writeFile("group-list", groupjson, (err) => {
        console.log("Group file created");
    })

    pageContainer.prepend('<section class="chatroom" id="' + grpId + 'GroupChatroom"><section id="' + grpId + 'GroupFeedback"></section></section>')

    dmList.forEach(user => {
        let nameWithoutSpaceInLoop = user.split(" ").join("")
        chatroom = $('#' + nameWithoutSpaceInLoop + 'Chatroom')
        feedback = $('#' + nameWithoutSpaceInLoop + 'Feedback')
        chatroom.hide()
    });

    groups.forEach(group => {
        let grpId = group['grpId']
        grpChatroom = $('#' + grpId + 'GroupChatroom')
        grpFeedback = $('#' + grpId + 'GroupFeedback')
        grpChatroom.hide()
    })

    friendsChatroom.hide()

    grpChatroom = $('#' + grpId + 'GroupChatroom')
    grpFeedback = $('#' + grpId + 'GroupFeedback')
    grpChatroom.show()
    grpChatroom.scrollTop(grpChatroom.height()); 
})

socket.on('group_invite', (data) => {
    let grpName = data.grpName;
    let sender = data.sender;
    let friends = data.friends;
    console.log("Group: " + grpName + " invite received from " + sender);
    dialog.showMessageBox({
        type: "info",
        title: "Group Invite!", 
        message: sender + " has invited you to his group: " + grpName,
        buttons: ['Accept', 'Cancel']
    }).then(res => {
        let buttonIndex = res.response
        if (buttonIndex === 0) {
            console.log("Accepted group invite");
            addGroupToHtml(friends, grpName)

            groupClicked(grpName)

            let group = {
                friends: friends,
                owner: sender,
                grpId: grpName,
                icon: 'grp icon'
            }
                
            groups.push(group)
        
            let groupjson = JSON.stringify(groups)
            fs.writeFile("group-list", groupjson, (err) => {
                console.log("Group file created");
            })
        
            pageContainer.prepend('<section class="chatroom" id="' + grpName + 'GroupChatroom"><section id="' + grpName + 'GroupFeedback"></section></section>')

            socket.emit('accepted_group_invite', {username: username, grpName: grpName, owner: sender})
        }
        else {
            console.log("Declined group invite");
            socket.emit('declined_group_invite', {username: username, sender: sender, grpName: grpName})
        }
    })
})

socket.on('declined_invitation', (data) => {
    let username = data.username;
    let grpName = data.grpName;
    console.log(username + "has declined you invitation to join the group: " + grpName);
    dialog.showMessageBox({
        title: "Invitation Declined!",
        message: username + " has declined your invitation to join the group: " + grpName
    })
})

socket.on('group_message_sent', (data) => {
    let message = data.message;
    let sender = data.sender;
    let grpId = data.grpId;
    let to = data.to;

    console.log("Received message: " + message + " from " + sender + " in group: " + grpId);

    if (groupName != grpId || groupClickedOn == false || friendTabClickedOn == true) {
        let filename = './profile-pics/' + sender.split(' ').join('')
        var base46Img = fs.readFileSync(filename)
        const messageNotification = new Notification(sender, {
            body: message,
            icon: base46Img
        })    
    }

    grpChatroom = $('#' + grpId + 'GroupChatroom')
    // grpChatroom.append("<p class='message'>" + sender + ": " + message + "</p>")

    var currentdate = new Date();
    var time = currentdate.getDate() + "/"
                + currentdate.getHours() + ":"
                + currentdate.getMinutes() + ":"
                + currentdate.getSeconds();

    messageData = {
        sender: sender,
        grpId: grpId,
        message: message,
        to: to,
        time: time,
        type: 'text'
    }

    groupMessages.push(messageData)

    // let i = groupMessages.indexOf(messageData)
    // let oldMessage = groupMessages[i-1]
    // console.log("MESSAGE WHICH WAS SENT IS " + JSON.stringify(oldMessage));

    // if (oldMessage === undefined) {
    //     let filename = './profile-pics/' + sender.split(' ').join('')
    //     var base46Img = fs.readFileSync(filename)
    //     grpChatroom.append('<div  id="message-color" style="margin-top: 15px; margin-right: 15px;" class="row"><div class="col" style="flex-grow: 0">' + 
    //         '<img style="width: 40px; height: 40px; border-radius: 50%;" src="' + base46Img + '"></div><div style="float: left" class="col-md-auto">' + 
    //         '<div class="row"><b>' + sender + '</b></div><div class="row">' + message + '</div></div></div>');
    // }
    // else {
    //     if (oldMessage["sender"] != sender) {
    //         let filename = './profile-pics/' + sender.split(' ').join('')
    //         var base46Img = fs.readFileSync(filename)
    //         grpChatroom.append('<div  id="message-color" style="margin-top: 15px; margin-right: 15px;" class="row"><div class="col" style="flex-grow: 0">' + 
    //             '<img style="width: 40px; height: 40px; border-radius: 50%;" src="' + base46Img + '"></div><div style="float: left" class="col-md-auto">' + 
    //             '<div class="row"><b>' + sender + '</b></div><div class="row">' + message + '</div></div></div>');
    //     }
    //     else {
    //         grpChatroom.append("<p  id='message-color' style='margin-left: 55px;' class='message'>" + message + "</p>")
    //     }
    // }

    messageLogic.receiveGroupMessage(groupMessages, messageData, sender, grpId, message);

    if (groupMessages) {
        let messagejson = JSON.stringify(groupMessages)

        console.log("Messages2 is " + messagejson);

        fs.writeFile("group-messages", messagejson, (err) => {
            if(err) {
                console.log("An error ocurred creating the file "+ err.message)
            }
            console.log("User file has succesfully been created.");
        })
    }

    grpChatroom.scrollTop(grpChatroom.prop("scrollHeight")); 
})

socket.on('group_image_sent', (data) => {
    let message = data.message;
    let sender = data.sender;
    let grpId = data.grpId;
    let friends = data.friends;

    let grpFeedback = $('#' + grpId + 'GroupFeedback')
    grpFeedback.html('');

    var base46Message = 'data:image/jpeg;base64,' + message
    console.log("Received image from " + sender);

    if (groupName != grpId || groupClickedOn == false || friendTabClickedOn == true) {
        let filename = './profile-pics/' + sender.split(' ').join('')
        var base46Img = fs.readFileSync(filename)
        const messageNotification = new Notification(sender, {
            body: 'Uploaded an image ...',
            icon: base46Img
        })    
    }

    grpChatroom = $('#' + grpId + 'GroupChatroom')
    // grpChatroom.append("<p class='message'>" + data.sender + ": <img src='" + base46Img + "'> </p>")

    var currentdate = new Date();
    var time = currentdate.getDate() + "/"
                + currentdate.getHours() + ":"
                + currentdate.getMinutes() + ":"
                + currentdate.getSeconds();

    let messageData = {
        sender: sender,
        grpId: grpId,
        message: message,
        friends: friends,
        time: time,
        type: 'image'
    }
        
    groupMessages.push(messageData)
    console.log("messages array is " + JSON.stringify(groupMessages));

    messageLogic.receiveGroupImage(groupMessages, messageData, sender, grpId, base46Message);

    if (groupMessages) {
        let messagejson = JSON.stringify(groupMessages)

        fs.writeFile("group-messages", messagejson, (err) => {
            if(err) {
                console.log("An error ocurred creating the file "+ err.message)
            }
            console.log("User file has succesfully been created.");
        })
    }

    grpChatroom.scrollTop(grpChatroom.prop("scrollHeight")); 
})

socket.on("message_sent", (data) => {
    let sender = data.sender;
    let message = data.message;
    let to = data.to;

    if (friendClickedOn != sender || groupClickedOn == true || friendTabClickedOn == true) {
        let filename = './profile-pics/' + sender.split(' ').join('')
        var base46Img = fs.readFileSync(filename)
        const messageNotification = new Notification(sender, {
            body: message,
            icon: base46Img
        })    
    }

    console.log("Received message from " + sender);
    feedback.html('');

    var currentdate = new Date();
    var time = currentdate.getDate() + "/"
                + currentdate.getHours() + ":"
                + currentdate.getMinutes() + ":"
                + currentdate.getSeconds();

    let messageData = {
        sender: sender,
        message: message,
        to: to,
        time: time,
        type: 'text'
    }

    messages.push(messageData)

    messageLogic.receiveMessage(messages, messageData, message, sender);

    if (messages) {
        let messagejson = JSON.stringify(messages)

        console.log("Messages2 is " + messagejson);

        fs.writeFile("messages", messagejson, (err) => {
            if(err) {
                console.log("An error ocurred creating the file "+ err.message)
            }
            console.log("User file has succesfully been created.");
        })
    }

    chatroom.scrollTop(chatroom.prop("scrollHeight")); 
})

socket.on('delete_group', (data) => {
    let grpId = data.grpId;
    let owner = data.owner;

    var friends;
    var tempGroups = [];
    var tempGroupMessages = [];

    if (fs.existsSync('group-messages')) {
      let groupFile = fs.readFileSync('group-messages')
      let groupsArr = JSON.parse(groupFile)
      groupsjson = JSON.stringify(groupsArr)
      groupsArr.forEach(message => {
          if (message['grpId'] != grpId) {
              tempGroupMessages.push(group)
          }
      })
    }

    if (fs.existsSync('group-list')) {
        let groupFile = fs.readFileSync('group-list')
        let groupsArr = JSON.parse(groupFile)
        groupsjson = JSON.stringify(groupsArr)
        console.log("Groups are " + groupsjson);
        groupsArr.forEach(group => {
            if (group['grpId'] == grpId) {
                friends = group['friends']
            }
            else {
                tempGroups.push(group)
            }
        })
    }

    console.log("Deleting group with id: " + grpId + ", friends: " + friends + ", owner: " + owner);

    console.log("Temps array is " + JSON.stringify(tempGroups));

    let group = $('#' + grpId + '_id')
    group.remove();

    grpChatroom = $('#' + grpId + 'GroupChatroom')
    grpChatroom.remove();

    groups = tempGroups;

    console.log("Groups array is " + JSON.stringify(groups));

    if (tempGroups.length === 0) {
      fs.unlinkSync('group-list')
    }
    else {
      fs.writeFileSync('group-list', (tempGroups))
    }

    if (tempGroupMessages.length === 0) {
      fs.unlinkSync('group-messages')
    }
    else {
      fs.writeFileSync('group-messages', (tempGroupMessages))
    }
})

socket.on('leave_group', (data) => {
    let sender = data.username;
    let owner = data.owner;
    let friends = data.friends;
    let grpId = data.grpId;
    let message = sender + " has left the group."

    if (friends.length === 2) {
        console.log("Deleting group");
        deleteGroup(grpId)
    }

    console.log("grpId: " + grpId + "\nowner: " + owner + "\nmessage: " + message + "\nsender: " + sender + "\nfriends: " + friends);

    grpChatroom = $('#' + grpId + 'GroupChatroom')
    grpChatroom.append("<p class='message' style='font-style: italic;'>" + message + "</p>")


    let friendsGrp = $('#' + grpId + 'friends')
    let friendsArr = friends;
    const index = friendsArr.indexOf(sender);
    if (index > -1) {
        friendsArr.splice(index, 1);
    }
    var friendsStr = friendsArr[0];
    for (let i = 1; i < friendsArr.length; i++) {
        friendsStr += ", " + friendsArr[i];  
    }
    console.log("Friends str is " + friendsStr);
    friendsGrp.html(friendsStr)
    chatheading.html(friendsStr)

    let groupArr = [];
    let groupData;

    if (fs.existsSync('group-list')) {
        let groupList = fs.readFileSync('group-list')
        groupList = JSON.parse(groupList)
        groupList.forEach(group => {
            if (group['grpId'] == grpId) {
                let friendsArr = group['friends']
                let ownerData = group['owner']
                var index = friendsArr.indexOf(sender);
                friendsArr.splice(index, 1);
                if (sender == owner) {
                    ownerData = friendsArr[0];
                }
                groupData = {
                    friends: friendsArr,
                    owner: ownerData, 
                    grpId: grpId, 
                    icon: "grp icon"
                }
                groupArr.push(groupData)
            }
            else { 
                groupArr.push(group)
            }
        })
    }

    let groupjson = JSON.stringify(groupArr)

    console.log("Group array is " + groupjson);

    fs.writeFileSync('group-list', groupjson)

    var currentdate = new Date();
    var time = currentdate.getDate() + "/"
                + currentdate.getHours() + ":"
                + currentdate.getMinutes() + ":"
                + currentdate.getSeconds();

    let messageData = {
        grpId: grpId,
        message: message,
        to: friends,
        time: time,
        type: 'info'
    }

    groupMessages.push(messageData)

    if (groupMessages) {
        let messagejson = JSON.stringify(groupMessages)

        console.log("Messages2 is " + messagejson);

        fs.writeFile("group-messages", messagejson, (err) => {
            if(err) {
                console.log("An error ocurred creating the file "+ err.message)
            }
            console.log("User file has succesfully been created.");
        })
    }
})

//Listen on typing
socket.on('receive_typing', (data) => {
    let nameWithoutSpace = data.username.split(' ').join('');
    console.log("Recieving typing message from " + nameWithoutSpace);
    feedback = $('#' + nameWithoutSpace + 'Feedback')
    feedback.html("<p><i>" + data.username + " is typing a message..." + "</i></p>")
})

socket.on('typing_group_received', (data) => {
    let sender = data.sender;
    let grpName = data.grpName;
    console.log(sender + " is typing a message. Feedback id is " + '#' + grpName + 'GroupFeedback');
    grpFeedback = $('#' + grpName + 'GroupFeedback')
    grpFeedback.html("<p><i>" + sender + " is typing a message..." + "</i></p>")
})

//Listen on stopped typing
socket.on('stopped_typing', () => {
    feedback.html('')
})

socket.on('stopped_typing_group', () => {
    grpFeedback = $('#' + groupName + 'GroupFeedback')
    grpFeedback.html('')
})

socket.on('set_profile_pic', (data) => {
    let username = data;
    ipcRenderer.send('getImage', username)
})

ipcRenderer.on('imageReceived', (e, data) => {
    let image = data.image;
    let username = data.username;
    let nameWithoutSpace = username.split(' ').join('');
    // console.log("Image received " + image);
    let profilePic = $('#' + nameWithoutSpace + '_pic')
    var base46Img = 'data:image/jpeg;base64,' + image
    profilePic.attr('src', base46Img)

    if (!fs.existsSync('./profile-pics')) {
      fs.mkdirSync('./profile-pics')  
    }

    let filename = './profile-pics/' + username.split(' ').join('')
    fs.writeFileSync(filename, base46Img)
})

ipcRenderer.on('imageForNotification', (e, data) => {
    let image = data.image;
    let username = data.username;
    var base46Img = 'data:image/jpeg;base64,' + image
    const messageNotification = new Notification(username, {
        body: message,
        icon: base46Img
    })
})

ipcRenderer.on('imageForMessage', (e, data) => {
    let image = data.image;
    let username = data.username;
    let message = data.message;
    console.log("MESSAGE is " + message);
    var base46Img = 'data:image/jpeg;base64,' + image
    chatroom.append('<div class="row"><div class="col" style="flex-grow: 0">' + 
        '<img style="width: 40px; height: 40px; border-radius: 50%;" src="' + base46Img + '"></div><div style="float: left" class="col-md-auto">' + 
        '<div class="row"><b>' + username + '</b></div><div class="row">' + message + '</div></div></div>');
    messageField.val('');
})

function logout() {
    socket.emit('logout', {username: username})
    console.log("Logging out");
    ipcRenderer.send('logout');
}

function changeProfilePic() {
    console.log("Changing Profile pic");
    ipcRenderer.send('change_image')
    ipcRenderer.on('receive_image_change', (e, args) => {
        console.log("Received profile pic from main process: " + JSON.stringify(args["filePaths"]));
        saveProfilePic(args["filePaths"])
    })
}

function saveProfilePic(path) {
    path = "" + path
    console.log("Path - " + path);
    fs.writeFileSync('profile-pic', path)
    console.log("User file has succesfully been created.");
    addImage()
}

function addImage() {
    let imagePath;
    imagePath = fs.readFileSync('profile-pic')
    console.log("Image path is " + imagePath);
    $('#profile-pic').attr('src', imagePath)
    fs.readFile(imagePath, 'base64', (err, data) => {
        console.log("Image data is " + data);
        ipcRenderer.send('uploadImage', {email: email, image: data})
        ipcRenderer.on('imageUpdated', () => {
            socket.emit('set_profile_pic', username)
        })
        var base46Img = 'data:image/jpeg;base64,' + data

        if (!fs.existsSync('./profile-pics')) {
            fs.mkdirSync('./profile-pics')  
        }

        let filename = './profile-pics/' + username.split(' ').join('')
        fs.writeFileSync(filename, base46Img)
    })
}

function getUsername() {
    console.log("Getting username");
    fs.readFile('logged-in', 'utf-8', (err, data) => {
        email = data;
        ipcRenderer.send('getUsername', data);
        ipcRenderer.on('usernameReceived', (e, data) => {
            username = data;
            let nameElement = $('#name')
            nameElement.text(username)
            let statusElement = $('#status-message')
            statusElement.text('Online')
            socket.emit('change_username', {username : username})
            console.log("Confirming that user is online");
            addFriends()
            addGroups()
            setTimeout(() => {
                console.log("Friends add = " + friendsAdded);
                if (friendsAdded) {
                    addMessages()
                    addGroupMessages()
                    addChatObjList()
                }
            }, 10)
        })
    })
}

function getUsers() {
    fs.readFile('logged-in', 'utf-8', (err, data) => {
        email = data;
        ipcRenderer.send('getAllUsers', email)
    })
    ipcRenderer.on('getAllUsers', (e, userArr) => {
        console.log(JSON.stringify(userArr));
        userArr.forEach(user => {
            users.push(user)
        })
        console.log("Users array is " + users);
    })
}