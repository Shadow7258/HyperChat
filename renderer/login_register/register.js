
const { UV_FS_O_FILEMAP } = require('constants');
const { ipcRenderer } = require('electron')
const { dialog, remote } = require('electron').remote;
const firebase = require('firebase')
const storage = require('firebase/storage')
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

let db, auth, storageRef;

let registerButton = $('#registerButton')
let confirmpassword = $('#confirmPasswordField')
let password = $('#passwordField')
let email = $('#emailField')
let username = $('#usernameField')

$(document).ready(function() {
  db = firebase.firestore();
  auth = firebase.auth();
  storageRef = firebase.storage().ref();
  ipcRenderer.send('choose_image')
})

ipcRenderer.on('receive_image', (e, args) => {
  console.log("Received profile pic from main process: " + JSON.stringify(args["filePaths"]));
  saveProfilePic(args["filePaths"])
})

function saveProfilePic(path) {
  path = "" + path
  console.log("Path - " + path);
  fs.writeFile('profile-pic', path, (err) => {
    if(err) {
      console.log("An error ocurred in creating the file "+ err.message)
    }
    console.log("User file has succesfully been created.");
  })
}

function registerUser() {
    confirmpassword = $('#confirmPasswordField').val();
    password = $('#passwordField').val();
    email = $('#emailField').val();
    username = $('#usernameField').val();
    console.log("Email is " + email + ", password is " + password + ", conform password is " + confirmpassword);
    console.log("Register button clicked!");
    if (validateUser(username, email, password, confirmpassword) == null)
    {
      console.log("User validated!");
      console.log("Registering user..")
      auth.createUserWithEmailAndPassword(email, password).then(() => {
        console.log("User created!");
        saveUserData(username, email);
      }).catch(function(error) {
        console.log("Error while creating user: " + error.message);
        dialog.showErrorBox("Error!", error.message);
      });
    }
    else
    {
      console.log("Validation failed!");
      dialog.showErrorBox("Error!", validateUser(username, email, password, confirmpassword));
    }
}

function validateUser(username, email, password, password2)
{
  if (username == "" || email == "" || password == "" || password2 == "" )
  {
    return "Please fill in all fields.";
  }
  if (password != password2)
  {
    return "Passwords do not match.";
  }
  return null;
}

function saveUserData(username, email)
{
  console.log("Saving user data");
  ipcRenderer.send('saveUserData', {username: username, email: email});

  ipcRenderer.on('savedUserData', () => {
    console.log("Finished saving data");
    ipcRenderer.send('homePageFromRegister', email);
  })

  // const userData = {
  //   username: username,
  //   email: email
  // }

  // console.log("Saving user data.." + JSON.stringify(userData));
  // let userId = email.split('.').join("");
  // console.log("User ID is " + userId);

  // db.collection('users').doc(email).set(userData).then( () => {
  //   console.log("Finsihed saving data.");
  //   ipcRenderer.send('homePageFromRegister', email);
  // }).catch( (err) => {
  //   dialog.showErrorBox("Error!", err.message);
  // });
}
