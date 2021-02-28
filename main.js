// Modules
const {app, BrowserWindow, globalShortcut, Menu, Tray, screen, ipcMain, dialog} = require('electron');
const windowStateKeeper = require('electron-window-state');
const { truncateSync } = require('fs');
const Mousetrap = require('mousetrap');
const fs = require('fs');
const { defaultApp } = require('process');
const updater = require('./updater');

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow, tray, callWindow

const MongoClient = require('mongodb').MongoClient;
const uri = "mongodb+srv://Pranav:PranavRocks01@cluster0.nvhen.mongodb.net/HyperChat?retryWrites=true&w=majority";
const client = new MongoClient(uri, { useNewUrlParser: true , useUnifiedTopology: true});

let trayMenu = Menu.buildFromTemplate([
  {
  label: "Item 1",
    submenu: [
      {role: "quit"},
      {label: "Reload", click() { mainWindow.reload() }}
    ]}
])

ipcMain.on('saveUserData', (e, data) => {
  let username = data.username;
  let email = data.email;
  console.log("Username is " + username + " and email is " + email);
  client.connect((err, db) => {
    if (err) throw err;
    const collection = client.db("HyperChat").collection("Users");
    var myobj = { username: username, email: email};
    collection.insertOne(myobj, function(err, res) {
      if (err) throw err;
      console.log("1 document inserted");
      e.reply('savedUserData')
      // db.close();
    });
    // client.close();
  });
})

ipcMain.on('getUsername', (e, data) => {
  client.connect((err, db) => {
    if (err) throw err;
    const collection = client.db("HyperChat").collection("Users");
    var query = { email: data };
    collection.find(query).toArray(function(err, result) {
      if (err) throw err;
      let obj = result[0];
      let username = obj['username'];
      console.log(username);
      e.reply('usernameReceived', username)
      // db.close();
    });
    // client.close();
  });
})

ipcMain.on('getAllUsers', (e) => {
  client.connect((err, db) => {
    if (err) throw err;
    const collection = client.db("HyperChat").collection("Users");
    collection.find().toArray(function(err, result) {
      if (err) throw err;
      let users = []
      // console.log("Result is " + JSON.stringify(result));
      result.forEach(doc => {
          let username = doc['username']
          console.log("USERNAME IS " + username);
          users.push(username)
      });
      console.log("Users is " + users);
      e.reply('getAllUsers', users)
    });
  });
})

ipcMain.on('logout', () => {
  console.log("Logging out");
  fs.unlink('./logged-in', (err) => {
    if (err) {
      console.log(err.message)
      return
    }
    console.log("File removed");
    createLoginWindow()
  })
})

ipcMain.on('change_image', (e) => {
  console.log("Choosing profile picture now");
  dialog.showOpenDialog(mainWindow, {
    buttonLabel: "Choose Image",
    defaultPath: app.getPath('pictures'),
    properties: ['openFile'],
    filters: [{ name: "Images", extensions: ["png","jpg","jpeg"] }]
  }).then((result) => {
    // console.log(result);
    e.reply('receive_image_change', result)
  })
})

ipcMain.on('getImage', (e, data) => {
  let username = data;
  client.connect((err, db) => {
    if (err) throw err;
    const collection = client.db("HyperChat").collection("Users");
    var query = { username: username };
    collection.find(query).toArray(function(err, result) {
      if (err) throw err;
      let obj = result[0];
      let image = obj['image'];
      // console.log("Image is " + image);
      // console.log("RESULT is " + JSON.stringify(result));
      console.log("Username is " + username);
      if (image !== undefined) {
        e.reply('imageReceived', {image: image, username: username})
      }
    });
  });
})

ipcMain.on('getImageForNotification', (e, data) => {
  let username = data;
  client.connect((err, db) => {
    if (err) throw err;
    const collection = client.db("HyperChat").collection("Users");
    var query = { username: username };
    collection.find(query).toArray(function(err, result) {
      if (err) throw err;
      let obj = result[0];
      let image = obj['image'];
      // console.log("Image is " + image);
      // console.log("RESULT is " + JSON.stringify(result));
      console.log("Username is " + username);
      if (image !== undefined) {
        e.reply('imageForNotification', {image: image, username: username})
      }
    });
  });
})

ipcMain.on('getImageForMessage', (e, data) => {
  let username = data.username;
  let message = data.message;
  
  client.connect((err, db) => {
    if (err) throw err;
    const collection = client.db("HyperChat").collection("Users");
    var query = { username: username };
    collection.find(query).toArray(function(err, result) {
      if (err) throw err;
      let obj = result[0];
      let image = obj['image'];
      // console.log("Image is " + image);
      // console.log("RESULT is " + JSON.stringify(result));
      console.log("Username is " + username);
      if (image !== undefined) {
        e.reply('imageForMessage', {image: image, username: username, message: message});
      }
    });
  });
})

ipcMain.on('uploadImage', (e, data) => {
  console.log("Uploading image");
  console.log("Email is " + data.email + " and image is " + data.image);
  client.connect((err, db) => {
    if (err) throw err;
    const collection = client.db("HyperChat").collection("Users");
    const filter = { email: data.email };
    const field = { $set: {image: data.image} }
    var query = { email: data };
    collection.updateOne(filter, field, (err, res) => {
      if (err) throw err;
      e.reply('imageUpdated')
    })
  });
})

ipcMain.on('choose_image', (e) => {
  console.log("Choosing profile picture now");
  dialog.showOpenDialog(mainWindow, {
    buttonLabel: "Choose Image",
    defaultPath: app.getPath('pictures'),
    properties: ['openFile'],
    filters: [{ name: "Images", extensions: ["png","jpg","jpeg"] }]
  }).then((result) => {
    console.log(result);
    e.reply('receive_image', result)
  })
})

ipcMain.on('sendImage', (e) => {
  console.log("Choosing image to send now");
  dialog.showOpenDialog(mainWindow, {
    buttonLabel: "Choose Image",
    defaultPath: app.getPath('pictures'),
    properties: ['openFile'],
    filters: [{ name: "Images", extensions: ["png","jpg","jpeg"] }]
  }).then((result) => {
    console.log(result);
    e.reply('imagePathReceived', result)
  })
})

ipcMain.on('homePageFromRegister', (event, arg) => {
  console.log("Creating user file");
  createUserFile(arg)
  console.log("Going to home page from Register screen.");
  createHomeWindow()
  setTimeout(() => {
    console.log("Sending email");
    event.reply('email', arg);
  }, 1000);
})

ipcMain.on('homePageFromLogin', (event, arg) => {
  console.log("Creating user file");
  createUserFile(arg)
  console.log("Going to home page from Login screen.");
  createHomeWindow()
  setTimeout(() => {
    console.log("Sending email");
    event.reply('email', arg);
  }, 1000);
})

var friendClickedOn;
var username;
//  = 'User 1';

ipcMain.on('openVideoCallWindow', (event, friend, user) => {
  console.log("Opening video call window");
  friendClickedOn = friend;
  username = user;
  createVideoCallWindow();
})

ipcMain.on('openVoiceCallWindow', (event, friend, user) => {
  console.log("Opening audio call window");
  friendClickedOn = friend;
  username = user;
  createVoiceCallWindow();
})

ipcMain.on('get_chat_data', (event) => {
  console.log("Getting data");
  var chatId;
  if (fs.existsSync('chat-list')) {
    let data = fs.readFileSync('chat-list')
    if (data != '') {
        var dataObj = JSON.parse(data);
        dataObj.forEach(chat => {
          if (chat['friend'] == friendClickedOn) {
            chatId = chat['chatId']
            console.log("Chat Id: " + chatId);
          }
        })
    }
  }
  setTimeout(() => {
    event.reply('chat_data', chatId, friendClickedOn, username);
  }, 500)
})

function getChatId() {
  
}

function createUserFile(email)
{
  fs.writeFile("logged-in", email, (err) => {
    if(err){
        console.log("An error ocurred creating the file "+ err.message)
    }
    console.log("User file has succesfully been created.");
  })
}

function createHomeWindow()
{
  mainWindow.setSize(986, 720)
  mainWindow.setMinimumSize(986, 710)

  mainWindow.resizable = true;

  mainWindow.loadFile('renderer/home.html');

  mainWindow.webContents.openDevTools();
}

function createVideoCallWindow() { 
  callWindow = new BrowserWindow({
    width: 1000,
    height: 700,
    x: screen.getPrimaryDisplay.width / 2, y: screen.getPrimaryDisplay.height / 2,
    webPreferences: { 
      nodeIntegration: true,
      enableRemoteModule: true, 
    }
  })

  callWindow.loadFile('renderer/video-call.html')

  callWindow.webContents.openDevTools();

  callWindow.on('closed',  () => {
    callWindow = null
  })
}

function createVoiceCallWindow() { 
  callWindow = new BrowserWindow({
    width: 1000,
    height: 700,
    x: screen.getPrimaryDisplay.width / 2, y: screen.getPrimaryDisplay.height / 2,
    webPreferences: { 
      nodeIntegration: true,
      enableRemoteModule: true, 
    }
  })

  callWindow.loadFile('renderer/voice-call.html')

  callWindow.webContents.openDevTools();

  callWindow.on('closed',  () => {
    callWindow = null
  })
}

// function createTray()
// {
//   tray = new Tray('./images/trayTemplate@2x.png')
//   tray.setToolTip('Tray details')
//   tray.on('click', e => {
//     if (mainWindow.isVisible())
//     {
//       mainWindow.hide()
//     }
//     else
//     {
//       mainWindow.show()
//     }
//   })

//   tray.setContextMenu(trayMenu)
// }

// Create a new BrowserWindow when `app` is ready
function onReady()
{
  // setTimeout(updater, 1500)
  // createTray()

  mainWindow = new BrowserWindow({
    width: 800,
    height: 650,
    x: screen.getPrimaryDisplay.width / 2, y: screen.getPrimaryDisplay.height / 2,
    frame: false, titleBarStyle: 'hidden',
    webPreferences: { nodeIntegration: true , enableRemoteModule: true}
  })

  mainWindow.resizable = true;

  let focused = true;
  let focusedTimeout = null;

  mainWindow.on('blur', () => {
    focused = false;
    focusedTimeout = setTimeout(() => {
      mainWindow.webContents.send('status_idle', {})
    }, 5000)
  })

  mainWindow.on('focus', () => {
    focused = true;
    if (focusedTimeout) {
      clearTimeout(focusedTimeout)
      mainWindow.webContents.send('status_online', {})
    }
    focusedTimeout  = null;
  })
  // createVideoCallWindow();

  fs.readFile('logged-in', 'utf-8', (err, data) => {
    if(err) {
      createLoginWindow()
      return;
    }
    else
    {
      createHomeWindow()
    }
});

}

function createLoginWindow()
{
  // mainWindow.setSize(800, 650)
  mainWindow.setSize(600, 420);
  mainWindow.resizable = false;

  mainWindow.loadFile('renderer/auth/login.html')

  // Open DevTools - Remove for PRODUCTION!
  // mainWindow.webContents.openDevTools();

  // Listen for window being closed
  mainWindow.on('closed',  () => {
    mainWindow = null
  })
}

// Electron `app` is ready
app.on('ready', onReady)

// Quit when all windows are closed - (Not macOS - Darwin)
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
  console.log("All windows are closed");
})

// When app icon is clicked and app is running, (macOS) recreate the BrowserWindow
app.on('activate', () => {
  if (mainWindow === null) onReady()
})
