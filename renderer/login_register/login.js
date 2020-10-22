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

function loginUser(email, password)
{
    if (user) {
        console.log(user.email + " is logged in");
    } else {
      console.log("No user is signed in.");
    }
    auth.signInWithEmailAndPassword(email, password).then(() => {
        console.log("User logged in!");
        ipcRenderer.send('homePageFromLogin', email);
    }).catch(function(error) {
        console.log("Error while logging in user: " + error.message);
        dialog.showErrorBox("Error!", error.message);
    });
}


