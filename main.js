// Modules
const {app, BrowserWindow, globalShortcut, Menu, Tray, screen, ipcMain, dialog} = require('electron');
const windowStateKeeper = require('electron-window-state');
const { truncateSync } = require('fs');
const Mousetrap = require('mousetrap');
const fs = require('fs');
const { defaultApp } = require('process');

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow, tray

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

ipcMain.on('getUsernameAgain', (e, data) => {
  client.connect((err, db) => {
    if (err) throw err;
    const collection = client.db("HyperChat").collection("Users");
    var query = { email: data };
    collection.find(query).toArray(function(err, result) {
      if (err) throw err;
      let obj = result[0];
      let username = obj['username'];
      console.log(username);
      e.reply('usernameReceivedAgain', username)
      // db.close();
    });
    // client.close();
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
      console.log("RESULT is " + JSON.stringify(result));
      console.log("Username is " + username);
      if (image !== undefined) {
        e.reply('imageReceived', {image: image, username: username})
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


function createTray()
{
  tray = new Tray('images/trayTemplate@2x.png')
  tray.setToolTip('Tray details')
  tray.on('click', e => {
    if (mainWindow.isVisible())
    {
      mainWindow.hide()
    }
    else
    {
      mainWindow.show()
    }
  })

  tray.setContextMenu(trayMenu)
}

// Create a new BrowserWindow when `app` is ready
function onReady()
{
  createTray()

  globalShortcut.register('Alt+C', () => {
    console.log(screen.getCursorScreenPoint())
  })

  mainWindow = new BrowserWindow({
    width: 800,
    height: 650,
    x: screen.getPrimaryDisplay.width / 2, y: screen.getPrimaryDisplay.height / 2,
    // frame: false, titleBarStyle: 'hidden',
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

  mainWindow.loadFile('renderer/login_register/login.html')

  // Open DevTools - Remove for PRODUCTION!
  mainWindow.webContents.openDevTools();

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
