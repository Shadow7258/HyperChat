const { ipcRenderer, remote } = require('electron')
const firebase = require('firebase')
const fs = require('fs')
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

var socket, friendClickedOn, friendRightClickedOn;
socket = io.connect('http://localhost:3000')


let messageField = $('#message-field')
let sendButton = $('#send-button')
let createChatBtn = $('#createChatBtn')
let chatList = $('#chat-list')
let newUserName = $('#newUserName')
let pageContainer = $('#page-container')
let chatroom, feedback
let chatheading = $('#chat-heading')
let saveChangesBtn = $('#saveChangesBtn')
let username

let message = {
    sender: "",
    message: "",
    to: "",
    time: ""
}

let userList = [], messages = [], users = [];

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
    sendButton = $('#send-button')
    createChatBtn = $('#createChatBtn')
    chatList = $('#chat-list')
    newUserName = $('#newUserName')
    pageContainer = $('#page-container')
    chatheading = $('#chat-heading')
    saveChangesBtn = $('#saveChangesBtn')

    getUsers()

    getUsername()

    sendButton.on('click', () => {
        console.log("Send button clicked.");
        feedback.html('');
        // socket.emit('new_message', {message : messageField.val()})
        socket.emit('send_message', {username: username, to: friendClickedOn, message: messageField.val()})
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
            time: time
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

        messageField.val('');
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

    // Create Chat button clicked
    createChatBtn.on('click', () => {
        if (userList.includes(newUserName.val())) {
            console.log("FRIEND ALREADY EXISTS");
            dialog.showErrorBox("Error!", "Friend alrady exists!");
        }
        else {
            console.log("Create chat button clicked.")
            userList.push(newUserName.val())
            socket.emit('get_status', {username: newUserName.val()})
            // chatList.append('<button type="button" id="' + newUserName.val() + '_id" data-username="' + newUserName.val() + '" class="list-group-item list-group-item-action" onclick="buttonClicked(\'' + newUserName.val() + '\')">' + newUserName.val() + '</button>')
            addChatListToHtml(newUserName.val())
    
            fs.appendFile("friend-list", newUserName.val() + '\n', (err) => {
                if(err){
                    console.log("An error ocurred creating the file "+ err.message)
                }
                console.log("User file has succesfully been created.");
            })
    
            friendClickedOn = newUserName.val()
    
            let nameWithoutSpace = newUserName.val().split(" ").join("")
            pageContainer.prepend('<section class="chatroom" id="' + nameWithoutSpace + 'Chatroom"><section id="' + nameWithoutSpace + 'Feedback"></section></section>')
    
            userList.forEach(user => {
                let nameWithoutSpaceInLoop = user.split(" ").join("")
                chatroom = $('#' + nameWithoutSpaceInLoop + 'Chatroom')
                feedback = $('#' + nameWithoutSpaceInLoop + 'Feedback')
                chatroom.hide()
            });
    
            chatroom = $('#' + nameWithoutSpace + 'Chatroom')
            feedback = $('#' + nameWithoutSpace + 'Feedback')
            chatroom.show()
            chatheading.html(newUserName.val())
    
            fs.readFile('messages', 'utf-8', (err, data) => {
                if(data) {
                    let dataObj = JSON.parse(data)
                    messageArr = dataObj;
                    messageArr.forEach(message => {
                        let nameWithoutSpace = message.sender.split(" ").join("")
                        console.log("Recepient is " + message.to + " and sender is " + message.sender + " and chatroom id is " + '#' + message.to.split(" ").join("") + 'Chatroom');
                        if (message.to == newUserName.val() && message.sender == username) {
                            chatroom = $('#' + message.to.split(" ").join("") + 'Chatroom')
                            console.log( message.sender + ": " + message.message);
                            chatroom.append("<p class='message'>" + message.sender + ": " + message.message + "</p>")
                        }
                        else if (message.sender == newUserName.val() && message.to == username) {
                            chatroom = $('#' + nameWithoutSpace + 'Chatroom')
                            console.log( message.sender + ": " + message.message);
                            chatroom.append("<p class='message'>" + message.sender + ": " + message.message + "</p>")
                        }
                    });
                }
            })
        }
    })

    //Emit typing
    var typingTimer;

    messageField.on('keyup', function () {
        clearTimeout(typingTimer);
        typingTimer = setTimeout(() => {
            console.log("Stopped typing");
            socket.emit('stopped_typing', {username: username, to: friendClickedOn})
        }, 3000)
    });

    //on keydown, clear the countdown
    messageField.on('keydown', function () {
        console.log("I: " + username + " am typing to " + friendClickedOn);
        socket.emit('typing', {username: username, to: friendClickedOn})
        clearTimeout(typingTimer);
    });

    $('#chat-list').on('contextmenu', 'button', (e) => {
        console.log("ID: " + e.currentTarget.id);
    });
});

function buttonClicked(name) {
    friendClickedOn = name;
    console.log("Clicked on: " + name);
    userList.forEach(user => {
        let nameWithoutSpaceInLoop = user.split(" ").join("")
        chatroom = $('#' + nameWithoutSpaceInLoop + 'Chatroom')
        feedback = $('#' + nameWithoutSpaceInLoop + 'Feedback')
        chatroom.hide()
    });
    let nameWithoutSpace = name.split(" ").join("")
    chatroom = $('#' + nameWithoutSpace + 'Chatroom')
    feedback = $('#' + nameWithoutSpace + 'Feedback')
    chatroom.show()
    chatheading.html(name)
}

function addMessages() {
    fs.readFile('messages', 'utf-8', (err, data) => {
        if (data) {
            dataObj = JSON.parse(data);
            messages = dataObj;
            console.log("Data is " + JSON.stringify(dataObj));
            messageArr = dataObj;
            messageArr.forEach(message => {
                let nameWithoutSpace = message.sender.split(" ").join("")
                console.log("Recepient is " + message.to + " and sender is " + message.sender + " and chatroom id is " + '#' + message.to.split(" ").join("") + 'Chatroom');
                if (message.sender == username) {
                    chatroom = $('#' + message.to.split(" ").join("") + 'Chatroom')
                }
                else {
                    chatroom = $('#' + nameWithoutSpace + 'Chatroom')
                }
                console.log( message.sender + ": " + message.message);
                chatroom.append("<p class='message'>" + message.sender + ": " + message.message + "</p>")
            });
        }
    })
}

function addFriends() {
    const file = readline.createInterface({
        input: fs.createReadStream('friend-list'),
        output: process.stdout,
        terminal: false
    });

    file.on('line', (line) => {
        if (line != "") {
            socket.emit('get_status', {username: line})
            userList.push(line)
            let nameWithoutSpaceInLoop = line.split(" ").join("")
            console.log("Adding chat list to username: " + nameWithoutSpaceInLoop);
            pageContainer.prepend('<section style="height: 85%; overflow: auto;" id="' + nameWithoutSpaceInLoop + 'Chatroom"><section id="' + nameWithoutSpaceInLoop + 'Feedback"></section></section>')
            // chatList.append('<button style="padding-right: 5px; outline: none" type="button" onclick="buttonClicked(\'' + line + '\')" id="' + nameWithoutSpaceInLoop + '_id" data-username="'
            //  + line + '" class="list-group-item list-group-item-action">' + line + '<span style="float: right; height: 21px;" id="' + nameWithoutSpaceInLoop + '_spanid" class="badge badge-success"></span></button>')
            addChatListToHtml(line)
            chatroom = $('#' + nameWithoutSpaceInLoop + 'Chatroom')
            feedback = $('#' + nameWithoutSpaceInLoop + 'Feedback')
            chatroom.hide()
            let nameWithoutSpace = userList[0].split(" ").join("")
            let firstChatroom = $('#' + nameWithoutSpace + 'Chatroom')
            firstChatroom.show()
            chatheading.html(userList[0])
            friendClickedOn = userList[0];
        }
    });
}

function addChatListToHtml(name) {
    let nameWithoutSpace = name.split(" ").join("")
    chatList.append(
    '<button style="padding-right: 5px; outline: none" type="button" class="list-group-item list-group-item-action ' + nameWithoutSpace + '_nameclass" onclick="buttonClicked(\'' + name + '\')" id="' + nameWithoutSpace + '_id" data-username="' + name + '">' +
        '<div class="row ' + nameWithoutSpace + '_nameclass">' +
            '<div class="col-4 ' + nameWithoutSpace + '_nameclass">' +
                '<img class="' + nameWithoutSpace + '_nameclass" style="border-radius: 50%; width: 40px;" src="../images/avatar.jpg" alt="Avatar">' +
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
    '</button>')
}

function removeFriend(name) {
    console.log("Removing friend " + name);
    let nameWithoutSpace = name.split(" ").join("")
    let user = $('#' + nameWithoutSpace + '_id')
    user.remove()
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

//Listen on other user status change
socket.on('status_changed', (data) => {
    console.log("Getting status for " + data.username);
    socket.emit('get_status', {username: data.username})
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
    let usernameidbtn = $('#' + nameWithoutSpace + '_id')
    let statusid = $('#' + nameWithoutSpace + '_statusid')
    let statusSpan = usernameidbtn.find('span')
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

//Listen on new_message
socket.on("message_sent", (data) => {
    feedback.html('');
    let nameWithoutSpace = friendClickedOn.split(" ").join("")
    let chatroom = $('#' + nameWithoutSpace + 'Chatroom')
    chatroom.append("<p class='message'>" + data.username + ": " + data.message + "</p>")
    var currentdate = new Date();
    var time = currentdate.getDate() + "/"
                + currentdate.getHours() + ":"
                + currentdate.getMinutes() + ":"
                + currentdate.getSeconds();

    message = {
        sender: data.username,
        message: data.message,
        to: data.to,
        time: time
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

//Listen on typing
socket.on('receive_typing', (data) => {
    let nameWithoutSpace = data.username.split(' ').join('');
    console.log("Recieving typing message from " + nameWithoutSpace);
    feedback = $('#' + nameWithoutSpace + 'Feedback')
    feedback.html("<p><i>" + data.username + " is typing a message..." + "</i></p>")
})

//Listen on stopped typing
socket.on('stopped_typing', () => {
    feedback.html('')
})

function logout() {
    socket.emit('logout', {username: username})
    console.log("Logging out");
    ipcRenderer.send('logout');
}

function getUsername() {
    console.log("Getting username");
    fs.readFile('logged-in', 'utf-8', (err, data) => {
        db.collection('users').doc(data).get().then(function(doc) {
            if (doc.exists) {
                let userData = doc.data()
                username = userData['username']
                let nameElement = $('#name')
                nameElement.text(username)
                let statusElement = $('#status-message')
                statusElement.text('Online')
                socket.emit('change_username', {username : username})
                console.log("Confirming that user is online");
                socket.emit('user_online', {username : username})
                addFriends()
                addMessages()
            } else {
                console.log("No such document!");
            }
        }).catch(function(error) {
            console.log("Error getting document:", error);
        });
    })
}

function getUsers() {
    console.log("Getting user list from firestore database");
    db.collection('users').get().then((querySnapshot) => {
        querySnapshot.forEach((doc) => {
            let data = doc.data()
            let username = data['username']
            // console.log(username);
            users.push(username)
        });
        console.log("Users array " + users);
        socket.emit('get_users', users)
    })
}
