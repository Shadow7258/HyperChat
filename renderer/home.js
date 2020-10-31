const { ipcRenderer } = require('electron')
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

var email, socket, friendClickedOn;
socket = io.connect('http://localhost:3000')


let messageField = $('#message-field')
let sendButton = $('#send-button')
let createChatBtn = $('#createChatBtn')
let chatList = $('#chat-list')
let newUserName = $('#newUserName')
let pageContainer = $('#page-container')
let chatroom, feedback
let chatheading = $('#chat-heading')
let username

let message = {
    sender: "",
    message: "",
    to: "",
    time: ""
}

let userList = [], messages = {};

ipcRenderer.on('email', (e, arg) => {
    console.log("Email received: " + arg);
    email = arg;
})

$(document).ready(function() {
    console.log("User connected " + socket.username)
    messageField = $('#message-field')
    sendButton = $('#send-button')
    createChatBtn = $('#createChatBtn')
    chatList = $('#chat-list')
    newUserName = $('#newUserName')
    pageContainer = $('#page-container')
    chatheading = $('#chat-heading')

    getUsername()

    addFriends()
    
    sendButton.on('click', () => {
        console.log("Send button clicked.");
        socket.emit('new_message', {message : messageField.val()})
    })

    // Create Chat button clicked
    createChatBtn.on('click', () => {
        console.log("Create chat button clicked.")
        userList.push(newUserName.val())
        chatList.append('<button type="button" id="' + newUserName.val() + '_id" data-username="' + newUserName.val() + '" class="list-group-item list-group-item-action" onclick="buttonClicked(\'' + newUserName.val() + '\')">' + newUserName.val() + '</button>')
        
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
    messageField.val('');

    fs.readFile('messages', 'utf-8', (err, data) => {
        dataObj = JSON.parse(data);
        // while (username === undefined) {
        //     setTimeout(() => {}, 20)
        // }
        console.log("Username from addMessages function is " + username);
        messageArr = dataObj["Pranav"];
        messageArr.forEach(message => {
            let nameWithoutSpace = message.to.split(" ").join("")
            console.log("Name without space is " + nameWithoutSpace);
            let chatroom = $('#' + nameWithoutSpace + 'Chatroom')
            chatroom.append("<p class='message'>" + message.sender + ": " + message.message + "</p>")
        });
    })
}

function addFriends() {
    const file = readline.createInterface({ 
        input: fs.createReadStream('user-list'), 
        output: process.stdout, 
        terminal: false
    }); 

    file.on('line', (line) => { 
        socket.emit('is_online', {username: line})
        console.log(line); 
        userList.push(line)
        let nameWithoutSpaceInLoop = line.split(" ").join("") 
        pageContainer.prepend('<section style="height: 85%; overflow: auto;" id="' + nameWithoutSpaceInLoop + 'Chatroom"><section id="' + nameWithoutSpaceInLoop + 'Feedback"></section></section>')    
        chatList.append('<button style="padding-right: 5px" type="button" onclick="buttonClicked(\'' + line + '\')" id="' + line + '_id" data-username="'
         + line + '" class="list-group-item list-group-item-action">' + line + '<span style="float: right; height: 21px;" class="badge badge-success">' + status + '</span></button>')
        chatroom = $('#' + nameWithoutSpaceInLoop + 'Chatroom')
        feedback = $('#' + nameWithoutSpaceInLoop + 'Feedback') 
        chatroom.hide()   
        console.log('First element is ' + userList[0])
        let nameWithoutSpace = userList[0].split(" ").join("")
        let firstChatroom = $('#' + nameWithoutSpace + 'Chatroom')
        firstChatroom.show()
        chatheading.html(userList[0])
        friendClickedOn = userList[0];
    }); 
}

//Listen on user status
socket.on('is_online', (data) => {
    let status = "offline"
    console.log(data.username + "'s status is " + data.status);
    let usernameidbtn = $('#' + data.username + '_id')
    let statusSpan = usernameidbtn.find('span')
    if (data.status == true) {
        status = "online"
        statusSpan.removeClass("badge-danger")
        statusSpan.addClass("badge-success")
    }
    else {
        statusSpan.removeClass("badge-success")
        statusSpan.addClass("badge-danger")
    }
    statusSpan.text(status)
})

//Listen on new_message
socket.on("new_message", (data) => {
    feedback.html('');
    messageField.val('');
    let nameWithoutSpace = friendClickedOn.split(" ").join("")
    let chatroom = $('#' + nameWithoutSpace + 'Chatroom')
    console.log("Friend which user is messagin is " + friendClickedOn);
    chatroom.append("<p class='message'>" + data.username + ": " + data.message + "</p>")
    var currentdate = new Date(); 
    var time = currentdate.getDate() + "/" 
                + currentdate.getHours() + ":"  
                + currentdate.getMinutes() + ":" 
                + currentdate.getSeconds();
    message = {
        sender: data.username,
        message: data.message,
        to: friendClickedOn,
        time: time
    }

    let messageHistory = messages[data.username]

    if (messageHistory === undefined) {
        messageHistory = []
    }

    messageHistory.push(message)

    messages[data.username] = messageHistory

    let messagejson = JSON.stringify(messages)

    console.log("Messages is " + messagejson); 

    console.log("Writing file from messages dictionary");
    
    fs.writeFile("messages", messagejson, (err) => {
        if(err) {
            console.log("An error ocurred creating the file "+ err.message)
        }
        console.log("User file has succesfully been created.");
      })
})

//Emit typing
messageField.bind("keypress", () => {
    socket.emit('typing')
})

//Listen on typing
socket.on('typing', (data) => {
    feedback.html("<p><i>" + data.username + " is typing a message..." + "</i></p>")
})

function logout() {
    console.log("Logging out");
    ipcRenderer.send('logout');
}

function getUsername() {
    fs.readFile('logged-in', 'utf-8', (err, data) => {
        console.log("Email is " + data);
        db.collection('users').doc(data).get().then(function(doc) {
            if (doc.exists) {
                console.log("Document data:", doc.data());
                let userData = doc.data()
                username = userData['username']
                console.log("Username is " + username);
                let nameElement = $('#name')
                nameElement.text(username)
                socket.emit('change_username', {username : username}) 
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