const { ipcRenderer, remote } = require('electron');
const { create, log } = require('electron-log');
const firebase = require('firebase')
const fs = require('fs');
const { type } = require('os');
const readline = require('readline')
const { dialog } = require('electron').remote;

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

let db = firebase.firestore()

var socket, friendClickedOn, groupName;
// socket = io.connect('http://34.93.56.182:3000')
socket = io.connect('http://localhost:3000')

var userExists = false, friendsAdded = false, groupClickedOn = false;

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

let message = {
    sender: "",
    message: "",
    to: "",
    time: "",
    type: ""
}

let userList = [], messages = [], users = [], friendsInGroup = [], groups = [], groupMessages = []
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

    getUsers()

    getUsername()

    setTimeout(() => {
        console.log("Users online are " + users);
        console.log("Friends are " + userList);
    }, 2000)

    newUserName.on("keyup", (e) => {
        if (e.key == 'Enter') {
            console.log("Enter clicked");
                console.log("User Exists");
                let input = $('#addUserInput');
                friendsInGroup.push(newUserName.val())
                let nameWithoutSpace = newUserName.val().split(" ").join("");
                input.append('<span class="input-group-text" style="height: 90%;">' + newUserName.val() +'<i onClick="removeButton(\'' + newUserName.val() + '\')" class="fa fa-times" id="' + nameWithoutSpace + '_crossButton" style="padding-left: 10px; margin-right: -5px;"></i></span>');
                newUserName.val('');
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
        allFriendsDiv.show()
        onlineFriendsDiv.hide()
    })

    onlineFriendsBtn.on("click", () => {
        console.log("Online friends are " + friendsOnline);
        friendInvitesDiv.hide()
        blockedFriendsDiv.hide()
        pendingFriendsDiv.hide()
        allFriendsDiv.hide()
        onlineFriendsDiv.show()
    })

    pendingFriendsBtn.on("click", () => {
        console.log("Pending invites are " + pendingInvites);
        console.log("Friend inites are " + friendInvites);
        friendInvitesDiv.show()
        blockedFriendsDiv.hide()
        pendingFriendsDiv.show()
        allFriendsDiv.hide()
        onlineFriendsDiv.hide()
    })

    blockedFriendsBtn.on("click", () => {
        console.log("Blocked friends are " + friendsBlocked);
        friendInvitesDiv.hide()
        blockedFriendsDiv.show()
        pendingFriendsDiv.hide()
        allFriendsDiv.hide()
        onlineFriendsDiv.hide()
    })

    ipcRenderer.on('imagePathReceived', (e, args) => {
        let imagePath = args['filePaths']
        console.log("Image path is " + imagePath);
        if (groupClickedOn == false) {
            sendImage(imagePath)
        }
        else {
            sendGroupImage(imagePath)
        }
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
        else {
            console.log("User exists");
            addFriend(friend)
        }
    })

    // Create Chat button clicked
    createChatBtn.on('click', () => {
        console.log("FRIENDS IN GROUP IS " + friendsInGroup);
        if (friendsInGroup.length != 0) {
            if (friendsInGroup.length == 1) {
                if (userList.includes(newUserName.val())) {
                    console.log("FRIEND ALREADY EXISTS");
                    dialog.showErrorBox("Error!", "Friend alrady exists!");
                    newUserName.val('')
                }
                if (userExists == false) {
                    console.log("User doesn't exist");
                    dialog.showErrorBox("Error!", "User doesn't exist!");
                    newUserName.val('')
                }
                else {
                    createChat(friendsInGroup[0])
                }
            }
            else {
                var friends = friendsInGroup;
                socket.emit("user_validation", (friends))
            }
            friendsInGroup = [];
        }
        else if (userList.includes(newUserName.val())) {
            console.log("FRIEND ALREADY EXISTS");
            dialog.showErrorBox("Error!", "Friend alrady exists!");
            newUserName.val('')
        }
        else if (userExists == false) {
            console.log("User doesn't exist");
            dialog.showErrorBox("Error!", "User doesn't exist!");
            newUserName.val('')
        }
        else {
            createChat(newUserName.val())
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
        // console.log("New user name value is now " + newUserName.val());
        socket.emit('checkUsers', newUserName.val())
    });

    let imagePath;
    imagePath = fs.readFileSync('profile-pic')
    $('#profile-pic').attr('src', imagePath)

    newUserName.autocomplete({
        source: users
    });
});

function friendsClicked() {
    console.log("Clicked on friends button");
    chatheading.html('Friends')

    userList.forEach(user => {
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

    friendsChatroom.show()

    // Display online friends
    onlineFriendsDiv.show();
}

socket.on('user_validation', (data) => {
    let user = data.user;
    let exists = data.exists;
    let friends = data.friends;
    if (exists == true) {
        friends.push(username)
        createGroup(friends)
    }
    else {
        dialog.showErrorBox("Error!", "User: " + user + " doesn't exist!");
    }
})

socket.on('checkUsers', (exists) => {
    if (exists == true && !userList.includes(newUserName.val()) && newUserName.val() != username) {
        console.log("User exits");
        newUserName.css('border', '2px solid green')
        newUserName.removeClass('text-danger')
        newUserName.addClass('text-success')
        userExists = true;
    }
    else {
        console.log("User doesn't exist");
        newUserName.css('border', '2px solid red')
        newUserName.addClass('text-danger')
        newUserName.removeClass('text-success')
        userExists = false;
    }
})

function addFriend(friend) {
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

    pageContainer.prepend('<section class="chatroom" style="height: 83vh; overflow-y: auto;" id="' + grpId + 'GroupChatroom"><section id="' + grpId + 'GroupFeedback"></section></section>')

    userList.forEach(user => {
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

    grpChatroom = $('#' + grpId + 'GroupChatroom')
    grpFeedback = $('#' + grpId + 'GroupFeedback')
    grpChatroom.show()
}

function createChat(name) {
    console.log("Create chat button clicked.")

    userList.push(name);

    addChatListToHtml(name)

    socket.emit('get_status', {username: name})

    ipcRenderer.send('getImage', name)

    fs.appendFile("friend-list", name + '\n', (err) => {
        if (err) {
            console.log("An error ocurred creating the file "+ err.message)
        }
        console.log("User file has succesfully been created.");
    })

    friendClickedOn = name;
    groupClickedOn = false;

    let nameWithoutSpace = name.split(" ").join("")
    pageContainer.prepend('<section class="chatroom" style="height: 83vh; overflow-y: auto;" id="' + nameWithoutSpace + 'Chatroom"><section id="' + nameWithoutSpace + 'Feedback"></section></section>')

    userList.forEach(user => {
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
}

function sendImage(imagePath) {
    feedback.html('');
    let imagePathString = "" + imagePath;

    let nameWithoutSpace = friendClickedOn.split(" ").join("")
    chatroom = $('#' + nameWithoutSpace + 'Chatroom')
    chatroom.append("<p class='message'>" + username + ": <img src='" + imagePath + "'> </p>")

    var currentdate = new Date();
    var time = currentdate.getDate() + "/"
                + currentdate.getHours() + ":"
                + currentdate.getMinutes() + ":"
                + currentdate.getSeconds();

    fs.readFile(imagePathString, 'base64', (err, data) => {
        console.log("Image to be sent is " + data);
        message = {
            sender: username,
            message: data,
            to: friendClickedOn,
            time: time,
            type: 'image'
        }

        socket.emit('send_image', message)
            
        messages.push(message)
        console.log("messages array is " + JSON.stringify(messages));

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
            
        // messages.push(message)
        // console.log("messages array is " + JSON.stringify(messages));

        // if (messages) {
        //     let messagejson = JSON.stringify(messages)

        //     console.log("Messages2 is " + messagejson);

        //     fs.writeFile("messages", messagejson, (err) => {
        //         if(err) {
        //             console.log("An error ocurred creating the file "+ err.message)
        //         }
        //         console.log("User file has succesfully been created.");
        //     })
        // }
    })
}

function sendGroupMessage() {
    console.log("Sending message in group");
    // grpChatroom = $('#' + groupName + 'GroupChatroom')
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

    // groupMessages.push(message)

    // if (groupMessages) {
    //     let messagejson = JSON.stringify(groupMessages)

    //     console.log("Messages2 is " + messagejson);

    //     fs.writeFile("group-messages", messagejson, (err) => {
    //         if(err) {
    //             console.log("An error ocurred creating the file "+ err.message)
    //         }
    //         console.log("User file has succesfully been created.");
    //     })
    // }

    messageField.val('');
}

function sendMessage() {
    console.log("Send button clicked.");
    feedback.html('');
    // socket.emit('new_message', {message : messageField.val()})
    let nameWithoutSpace = friendClickedOn.split(" ").join("")
    chatroom = $('#' + nameWithoutSpace + 'Chatroom')
    chatroom.append("<p class='message'>" + username + ": " + messageField.val() + "</p>")
    var currentdate = new Date();
    var time = currentdate.getDate() + "/"
                + currentdate.getHours() + ":"
                + currentdate.getMinutes() + ":"
                + currentdate.getSeconds();

    message = {
        sender: username,
        message: messageField.val(),
        to: friendClickedOn,
        time: time,
        type: 'text'
    }

    socket.emit('send_message', message);

    messages.push(message)
    console.log("messages array is " + JSON.stringify(messages));

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

    messageField.val('');
}

function groupClicked(grpId) {
    groupName = grpId;
    groupClickedOn = true;
    console.log("Clicked on group: " + grpId);

    var friends = [];

    userList.forEach(user => {
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

    var friendsStr = friends[0];
    for (let i = 1; i < friends.length; i++) {
        friendsStr += ", " + friends[i];  
    }
    chatheading.html(friendsStr)
}

function buttonClicked(name) {
    friendClickedOn = name;
    groupClickedOn = false;
    console.log("Clicked on " + name);

    userList.forEach(user => {
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
}

function addGroupMessages() {
    if (fs.existsSync('group-messages')) {
        let data = fs.readFileSync('group-messages')
        if (data != '') {
            dataObj = JSON.parse(data);
            groupMessages = dataObj;
            messageArr = dataObj;
            messageArr.forEach(message => {
                if (message.type == 'text') {
                    grpChatroom = $('#' + message.grpId + 'GroupChatroom')
                    grpChatroom.append("<p class='message'>" + message.sender + ": " + message.message + "</p>")
                }
                if (message.type == 'image') {
                    var base46Img = 'data:image/jpeg;base64,' + message.message
                    grpChatroom = $('#' + message.grpId + 'GroupChatroom')
                    grpChatroom.append("<p class='message'>" + message.sender + ": <img src='" + base46Img + "'> </p>")
                }
                if (message.type == 'info') {
                    grpChatroom = $('#' + message.grpId + 'GroupChatroom')
                    grpChatroom.append("<p class='message' style='font-style: italic;'>" + message.message + "</p>")
                }
            })
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
            messageArr.forEach(message => {
                let nameWithoutSpace = message.sender.split(" ").join("")
                if (message.type == 'text') {
                    console.log("Recepient is " + message.to + " and sender is " + message.sender + " and chatroom id is " + '#' + message.to.split(" ").join("") + 'Chatroom');
                    if (message.sender == username) {
                        chatroom = $('#' + message.to.split(" ").join("") + 'Chatroom')
                    }
                    else {
                        chatroom = $('#' + nameWithoutSpace + 'Chatroom')
                    }
                    console.log( message.sender + ": " + message.message);
                    chatroom.append("<p class='message'>" + message.sender + ": " + message.message + "</p>")
                }
                else if(message.type == 'image') {
                    if (message.sender == username) {
                        chatroom = $('#' + message.to.split(" ").join("") + 'Chatroom')
                    }
                    else {
                        chatroom = $('#' + nameWithoutSpace + 'Chatroom')
                    }
                    // console.log( message.sender + ": " + message.message);
                    var base46Img = 'data:image/jpeg;base64,' + message.message
                    chatroom.append("<p class='message'>" + message.sender + ": <img src='" + base46Img + "'></p>")
                }
            });
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
                pageContainer.prepend('<section style="height: 83vh; overflow-y: auto;" id="' + grpId + 'GroupChatroom"><section id="' + grpId + 'GroupFeedback"></section></section>')
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
    if (fs.existsSync('friend-list')) {
        const file = readline.createInterface({
            input: fs.createReadStream('friend-list'),
            output: process.stdout,
            terminal: false
        });
    
        file.on('line', (line) => {
            if (line != "") {
                socket.emit('get_status', {username: line})
                userList.push(line)
                ipcRenderer.send('getImage', line)
                let nameWithoutSpaceInLoop = line.split(" ").join("")
                console.log("Adding chat list to username: " + nameWithoutSpaceInLoop);
                pageContainer.prepend('<section style="height: 83vh; overflow-y: auto;" id="' + nameWithoutSpaceInLoop + 'Chatroom"><section id="' + nameWithoutSpaceInLoop + 'Feedback"></section></section>')
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

                let nameWithoutSpace = userList[0].split(" ").join("")
                let firstChatroom = $('#' + nameWithoutSpace + 'Chatroom')
                firstChatroom.show()
                chatheading.html(userList[0])
                friendClickedOn = userList[0];
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
    '<div style="padding-right: 5px; outline: none;" type="button" class="list-group-item list-group-item-action ' + nameWithoutSpace + '_nameclass" onclick="buttonClicked(\'' + name + '\')" id="' + nameWithoutSpace + '_id" data-username="' + name + '">' +
        '<div class="row ' + nameWithoutSpace + '_nameclass">' +
            '<div class="col-4 ' + nameWithoutSpace + '_nameclass">' +
                '<img class="' + nameWithoutSpace + '_nameclass" id="' + nameWithoutSpace + '_pic" style="border-radius: 50%; width: 40px; height: 40px;" src="../images/avatar.jpg" alt="Avatar">' +
            '</div>' +
            '<div class="col-6 ' + nameWithoutSpace + '_nameclass" style="padding-left: 5px;">' +
                '<div class="row ' + nameWithoutSpace + '_nameclass">' + name + '</div>' +
                '<div class="row ' + nameWithoutSpace + '_nameclass">' +
                    '<small style="height: 21px; margin-top: -3px;" id="' + nameWithoutSpace + '_statusid" class="text-success ' + nameWithoutSpace + '_nameclass"></small>' +
                '</div>' +
            '</div>' +
            '<div class="col-2 dropdown" style="padding-left: 0px">' +
                '<a href="#" id="' + nameWithoutSpace + '_optionsid" style="border: none; padding: 0px; color: black" data-toggle="dropdown"><i class="fa fa-ellipsis-h" style="margin-top: 12px"></i></a>' +
                '<div class="dropdown-menu" id="userDropdown">' +
                '<a class="dropdown-item" id="remove' + nameWithoutSpace + 'Option" onClick="removeFriend(\'' + name + '\')" href="#">Remove Friend</a>' +
                '<a class="dropdown-item" href="#">Another action</a>' +
                '<a class="dropdown-item" href="#">Something else here</a>' +
            '</div>' +
            '</div>' +
        '</div>' +
    '</div>')
}

function addGroupToHtml(friends, grpId) {
    chatList.append(
    '<div style="padding-right: 5px; outline: none;" type="button" class="list-group-item list-group-item-action ' + grpId + '_nameclass" id="' + grpId + '_id" onClick="groupClicked(\'' + grpId + '\')">' +
        '<div class="row ' + grpId + '_nameclass">' +
            '<div class="col-4 ' + grpId + '_nameclass">' +
                '<img class="' + grpId + '_nameclass" id="' + grpId + '_pic" style="border-radius: 50%; width: 40px; height: 40px;" src="../images/avatar.jpg" alt="Avatar">' +
            '</div>' +
            '<div class="col-6 ' + grpId + '_nameclass" style="padding-left: 5px;">' +
                '<div style="padding-top: 6px; padding-bottom: 10px;" id="' + grpId + 'friends" class="row ' + grpId + '_nameclass"></div>' +
            '</div>' +
            '<div class="col-2 dropdown" style="padding-left: 0px">' +
                '<a href="#" id="' + grpId + '_optionsid" style="border: none; padding: 0px; color: black" data-toggle="dropdown"><i class="fa fa-ellipsis-h" style="margin-top: 12px"></i></a>' +
                '<div class="dropdown-menu" id="groupDropdown">' +
                    '<a class="dropdown-item" href="#" onClick="leaveGroup(\'' + grpId + '\')">Leave Group</a>' +
                    '<a class="dropdown-item" href="#">Something else here</a>' +
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
    var i = userList.indexOf(name);
    userList.splice(i, 1);
    var nextFriend

    var userListTmp = fs.readFileSync('friend-list').toString().split("\n");

    console.log("Array Before is " + userListTmp)

    var usernameIndex = userListTmp.indexOf(name);
    console.log("Next friend is " + userListTmp[usernameIndex + 1]);
    nextFriend = userListTmp[usernameIndex + 1]
    userListTmp.splice(usernameIndex, 1);
    console.log("Array After is " + userListTmp)

    console.log("Friend to remove is " + name);
    chatroom = $('#' + nameWithoutSpace + 'Chatroom')
    chatroom.remove()

    fs.writeFile("friend-list", "", (err) => {
        if(err) {
            console.log("An error ocurred removing the file "+ err.message)
        }
        console.log("User file has succesfully been removed.");
    })

    userListTmp.forEach(user => {
        fs.appendFile("friend-list", user + '\n', (err) => {
            if(err){
                console.log("An error ocurred creating the file "+ err.message)
            }
            console.log("User file has succesfully been created.");
        })
    })

    setTimeout(() => {
        buttonClicked(nextFriend)
    }, 100)
}

function deleteGroup(grpId) {
    var friends;
    var owner;
    var tempGroups = [];

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

    socket.emit('delete_group', {grpId: grpId, owner: owner, friends: friends})
}

socket.on('friend_invite', (data) => {
    let friend = data.sender;
    console.log(friend + " has invite " + username + " to be friends!");
    friendInvites.push(friend);
    friendInvites.forEach((friend) => {
        let name = friend.split(' ').join('');
        pendingFriendsDiv.append(
            '<li id="' + name + '_inviteList" class="list-group-item" aria-current="true">' + 
                '<div class="btn-group" role="group" style="float: left">' + 
                    '<img id="profile-pic-test" style="border-radius: 50%; width: 45px; margin-right: 13px" src="../images/avatar.jpg" alt="Avatar">' + 
                    '<div class="col">' + 
                        '<div style="margin-top: 2px;" class="row">' + friend + '</div>' + 
                        '<div class="row"> ' + 
                            '<small style="height: 21px; color: rgb(24,158,73); margin-top: -3px;">online</small>' + 
                        '</div>' + 
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

socket.on('create_dm', (sender) => {
    createChat(sender)
})

//Listen on other user status change
socket.on('status_changed', (data) => {
    console.log("Getting status for " + data.username);
    socket.emit('get_status', {username: data.username})
})

socket.on('invite_accepted', (sender) => {
    console.log("Friend invite to " + sender + " has been accepted");
    // remove from array
    let index = pendingInvites.indexOf(sender)
    pendingInvites.splice(index, 1)
})

socket.on('invite_declined', (sender) => {
    console.log("Friend invite to " + sender + " has been declined");
    // remove from array
    let index = friendInvites.indexOf(sender)
    friendInvites.splice(index, 1)
})

//Listen on user status
socket.on('get_status', (data) => {
    var status, statusCol;
    let nameWithoutSpace = data.username.split(" ").join("")
    console.log("Received status from username: " + nameWithoutSpace);
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
    }
    else {
        statusid.removeClass("text-danger")
        statusid.addClass("text-success")
    }
    console.log("Status is " + status + " and color is " + statusCol);
    statusid.text(status)
})

socket.on("image_sent", (data) => {
    var base46Img = 'data:image/jpeg;base64,' + data.message
    console.log("Received image from " + data.sender);
    feedback.html('');

    let nameWithoutSpace = friendClickedOn.split(" ").join("")
    chatroom = $('#' + nameWithoutSpace + 'Chatroom')
    chatroom.append("<p class='message'>" + data.sender + ": <img src='" + base46Img + "'> </p>")

    var currentdate = new Date();
    var time = currentdate.getDate() + "/"
                + currentdate.getHours() + ":"
                + currentdate.getMinutes() + ":"
                + currentdate.getSeconds();

    message = {
        sender: data.sender,
        message: data.message,
        to: data.to,
        time: time,
        type: 'image'
    }
        
    messages.push(message)
    console.log("messages array is " + JSON.stringify(messages));

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
        
            pageContainer.prepend('<section class="chatroom" style="height: 83vh; overflow-y: auto;" id="' + grpName + 'GroupChatroom"><section id="' + grpName + 'GroupFeedback"></section></section>')

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

    grpChatroom = $('#' + grpId + 'GroupChatroom')
    grpChatroom.append("<p class='message'>" + sender + ": " + message + "</p>")

    var currentdate = new Date();
    var time = currentdate.getDate() + "/"
                + currentdate.getHours() + ":"
                + currentdate.getMinutes() + ":"
                + currentdate.getSeconds();

    message = {
        sender: sender,
        grpId: grpId,
        message: message,
        to: to,
        time: time,
        type: 'text'
    }

    groupMessages.push(message)

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

socket.on('group_image_sent', (data) => {
    let message = data.message;
    let sender = data.sender;
    let grpId = data.grpId;
    let friends = data.friends;

    let grpFeedback = $('#' + grpId + 'GroupFeedback')
    grpFeedback.html('');

    var base46Img = 'data:image/jpeg;base64,' + message
    console.log("Received image from " + sender);

    grpChatroom = $('#' + grpId + 'GroupChatroom')
    grpChatroom.append("<p class='message'>" + data.sender + ": <img src='" + base46Img + "'> </p>")

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

    if (groupMessages) {
        let messagejson = JSON.stringify(groupMessages)

        fs.writeFile("group-messages", messagejson, (err) => {
            if(err) {
                console.log("An error ocurred creating the file "+ err.message)
            }
            console.log("User file has succesfully been created.");
        })
    }
})

//Listen on new_message
socket.on("message_sent", (data) => {
    console.log("Received message from " + data.sender);
    feedback.html('');
    let nameWithoutSpace = friendClickedOn.split(" ").join("")
    let chatroom = $('#' + nameWithoutSpace + 'Chatroom')
    chatroom.append("<p class='message'>" + data.sender + ": " + data.message + "</p>")
    var currentdate = new Date();
    var time = currentdate.getDate() + "/"
                + currentdate.getHours() + ":"
                + currentdate.getMinutes() + ":"
                + currentdate.getSeconds();

    message = {
        sender: data.sender,
        message: data.message,
        to: data.to,
        time: time,
        type: 'text'
    }

    messages.push(message)

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

socket.on('delete_group', (data) => {
    let grpId = data.grpId;
    let owner = data.owner;

    var friends;
    var tempGroups = [];

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

    fs.writeFileSync('group-list', (tempGroups))
})

socket.on('leave_group', (data) => {
    let sender = data.username;
    let owner = data.owner;
    let friends = data.friends;
    let grpId = data.grpId;
    let message = sender + " has left the group."

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

    message = {
        grpId: grpId,
        message: message,
        to: friends,
        time: time,
        type: 'info'
    }

    groupMessages.push(message)

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

// Listen on change profiel pic
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
