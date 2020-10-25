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

let db, auth;

$(document).ready(function() {
  db = firebase.firestore();
  auth = firebase.auth();
})


function registerUser(username, email, password, password2)
{
  console.log("Register button clicked!");
  if (validateUser(username, email, password, password2) == null)
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
    dialog.showErrorBox("Error!", validateUser(username, email, password, password2));
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
  const userData = {
    username: username,
    email: email
  }

  console.log("Saving user data.." + JSON.stringify(userData));
  let userId = email.split('.').join("");
  console.log("User ID is " + userId);

  db.collection('users').doc(email).set(userData).then( () => {
    console.log("Finsihed saving data.");
    ipcRenderer.send('homePageFromRegister', email);
  }).catch( (err) => {
    dialog.showErrorBox("Error!", err.message);
  });
}




