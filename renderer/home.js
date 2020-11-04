const { ipcRenderer, remote } = require('electron')
const firebase = require('firebase')
const fs = require('fs')
const readline = require('readline')

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

var socket, friendClickedOn;
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

let userList = [], messages = [];

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

    getUsername()

    addFriends()
    
    sendButton.on('click', () => {
        console.log("Send button clicked.");
        feedback.html('');
        // socket.emit('new_message', {message : messageField.val()})
        socket.emit('send_message', {username: username, to: friendClickedOn, message: messageField.val()})
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
        console.log("Create chat button clicked.")
        userList.push(newUserName.val())
        socket.emit('get_status', {username: newUserName.val()})
        // chatList.append('<button type="button" id="' + newUserName.val() + '_id" data-username="' + newUserName.val() + '" class="list-group-item list-group-item-action" onclick="buttonClicked(\'' + newUserName.val() + '\')">' + newUserName.val() + '</button>')
        addChatListToHtml(newUserName.val())

        fs.appendFile("user-list", newUserName.val() + '\n', (err) => {
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
    })

    //Emit typing
    var typingTimer;

    message.on('keyup', function () {
    clearTimeout(typingTimer);
    typingTimer = setTimeout(() => {
        console.log("Stopped typing");
        socket.emit('stopped_typing', {username: username, to: friendClickedOn})
    }, 3000)
    });

    //on keydown, clear the countdown 
    message.on('keydown', function () {
    console.log("I am typing");
    socket.emit('typing', {username: username, to: friendClickedOn})
    clearTimeout(typingTimer);
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
            let nameWithoutSpace = friendClickedOn.split(" ").join("")
            let chatroom = $('#' + nameWithoutSpace + 'Chatroom')
            messageArr.forEach(message => {
                console.log( message.sender + ": " + message.message);
                chatroom.append("<p class='message'>" + message.sender + ": " + message.message + "</p>")
            });
        }
    })
}

function addFriends() {
    const file = readline.createInterface({ 
        input: fs.createReadStream('user-list'), 
        output: process.stdout, 
        terminal: false
    }); 

    file.on('line', (line) => { 
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
    }); 
}

function addChatListToHtml(name) {
    let nameWithoutSpace = name.split(" ").join("") 
    chatList.append(
    '<button style="padding-right: 5px; outline: none" type="button" class="list-group-item list-group-item-action" onclick="buttonClicked(\'' + name + '\')" id="' + nameWithoutSpace + '_id" data-username="' + name + '">' + 
        '<div class="row">' + 
            '<div class="col-4">' + 
                '<img style="border-radius: 50%; width: 40px;" src="../images/avatar.jpg" alt="Avatar">' + 
            '</div>' + 
            '<div class="col-8" style="padding-left: 5px;">' + 
                '<div class="row">' + name + '</div>' + 
                '<div class="row">' + 
                    '<small style="height: 21px; margin-top: -3px;" id="' + nameWithoutSpace + '_statusid" class="text-success"></small>' + 
                '</div>' + 
            '</div>' + 
        '</div>' + 
    '</button>')
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
socket.on('typing', (data) => {
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
                addMessages()
            } else {
                console.log("No such document!");
            }
        }).catch(function(error) {
            console.log("Error getting document:", error);
        });
    })
}