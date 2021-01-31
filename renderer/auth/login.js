const firebase = require('firebase')
const { dialog } = require('electron').remote;
const { ipcRenderer } = require('electron')

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

let auth = firebase.auth();

var user = auth.currentUser;

let emailField = $('#emailField')
let passwordField = $('#passwordField')
let showButton = $('#showButton')

$(document).ready(() => {
  emailField = $('#emailField')
  passwordField = $('#passwordField')
  showButton = $('#showButton')
  showButton.on('click', () => {
    console.log("Show password");
    if (document.getElementById('passwordField').type == 'password') {
      document.getElementById('passwordField').type = 'text';
      showButton.text('hide')
    }
    else {
      document.getElementById('passwordField').type = 'password';
      showButton.text('show')
    }
    // $('#passwordField').type = 'text';
  })
})

function loginUser()
{
    if (user) {
        console.log(user.email + " is logged in");
    } else {
      console.log("No user is signed in.");
    }

    console.log("Email is " + emailField.val() + " and Password is " + passwordField.val());

    auth.signInWithEmailAndPassword(emailField.val(), passwordField.val()).then(() => {
        console.log("User logged in!");
        ipcRenderer.send('homePageFromLogin', emailField.val());
    }).catch(function(error) {
        console.log("Error while logging in user: " + error.message);
        dialog.showErrorBox("Error!", error.message);
    });
}


