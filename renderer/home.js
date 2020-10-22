const { ipcRenderer } = require('electron')

var email, socket;
socket = io.connect('http://localhost:3000')

ipcRenderer.on('email', (e, arg) => {
    console.log("Email received: " + arg);
    email = arg;
})

$(document).ready(function() {
    console.log("User connected " + socket.username);
    socket.emit('change_username', {username : "Pranav"}) 
});

let message = $('#message-field')
let sendButton = $('#send-button')
let chatroom = $("#chatroom")
let feedback = $('#feedback')

sendButton.click(function() {
    socket.emit('new_message', {message : message.val()})
})
   
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
