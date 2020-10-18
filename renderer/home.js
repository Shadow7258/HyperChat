const { ipcRenderer } = require('electron')

let email;

ipcRenderer.on('email', (e, arg) => {
    console.log("Email received: " + arg);
})