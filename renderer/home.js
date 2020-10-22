const { ipcRenderer } = require('electron')
const firebase = require('firebase')
const fs = require('fs')

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

var email, socket;
socket = io.connect('http://localhost:3000')


let message = $('#message-field')
let sendButton = $('#send-button')
let chatroom = $("#chatroom")
let feedback = $('#feedback')

ipcRenderer.on('email', (e, arg) => {
    console.log("Email received: " + arg);
    email = arg;
})

$(document).ready(function() {
    console.log("User connected " + socket.username);
    message = $('#message-field')
    sendButton = $('#send-button')
    chatroom = $("#chatroom")
    feedback = $('#feedback')
    
    getUsername()
    
    sendButton.click(function() {
        console.log("Send button clicked.");
        socket.emit('new_message', {message : message.val()})
    })

});
   
//Listen on new_message
socket.on("new_message", (data) => {
    feedback.html('');
    message.val('');
    chatroom.append("<p class='message'>" + data.username + ": " + data.message + "</p>")
})

//Emit typing
message.bind("keypress", () => {
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
                let username = userData['username']
                console.log("Username is " + username);
                let nameElement = $('#name')
                nameElement.text(username)
                socket.emit('change_username', {username : username}) 
            } else {
                console.log("No such document!");
            }
        }).catch(function(error) {
            console.log("Error getting document:", error);
        });
    })
}