// Modules
const {app, BrowserWindow, globalShortcut, Menu, Tray, screen, ipcMain} = require('electron');
const windowStateKeeper = require('electron-window-state');
const { truncateSync } = require('fs');
const Mousetrap = require('mousetrap');
const fs = require('fs');

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow, tray

let trayMenu = Menu.buildFromTemplate([
  { 
  label: "Item 1",
    submenu: [
      {role: "quit"},
      {label: "Reload", click() { mainWindow.reload() }}
    ]}
])

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
  let homeWindowState = windowStateKeeper({
    defaultWidth: 986,
    defaultHeight: 693
  });

  mainWindow.setSize(986, 720)
  mainWindow.setMinimumSize(986, 710)
  mainWindow.setPosition(homeWindowState.x, homeWindowState.y)

  mainWindow.resizable = true;

  mainWindow.loadFile('renderer/home.html');

  homeWindowState.manage(mainWindow);
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
    webPreferences: { nodeIntegration: true , enableRemoteModule: true}
  })

  mainWindow.resizable = true;

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
  mainWindow.setSize(800, 650);

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
})

// When app icon is clicked and app is running, (macOS) recreate the BrowserWindow
app.on('activate', () => {
  if (mainWindow === null) onReady()
})
