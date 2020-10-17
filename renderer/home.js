const { ipcRenderer } = require('electron')

let email;

ipcRenderer.on('email', (event, arg) => {
    email = arg;
    console.log("Email is " + arg);
})