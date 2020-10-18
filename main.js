// Modules
const {app, BrowserWindow, globalShortcut, Menu, Tray, screen, ipcMain} = require('electron');
const windowStateKeeper = require('electron-window-state');
const { truncateSync } = require('fs');
const Mousetrap = require('mousetrap');

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

ipcMain.on('homePageFromRegister', (event, arg) => {
  console.log("Going to home page from Register screen.");
  customizeHomeWindow()
  console.log("Sending email");
  event.reply('email', arg);
})

ipcMain.on('homePageFromLogin', (event, arg) => {
  console.log("Going to home page from Login screen.");
  customizeHomeWindow()
  setTimeout(() => {
    console.log("Sending email");
    event.reply('email', arg);
  }, 1000);
})

function customizeHomeWindow()
{
  let homeWindowState = windowStateKeeper({
    defaultWidth: 800,
    defaultHeight: 650
  });

  mainWindow.width = homeWindowState.width;
  mainWindow.height = homeWindowState.height;
  mainWindow.x = homeWindowState.x;
  mainWindow.y = homeWindowState.y;

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
function createWindow() {

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

  mainWindow.resizable = false;

  mainWindow.loadFile('renderer/login_register/login.html')

  customizeHomeWindow()

  // Open DevTools - Remove for PRODUCTION!
  // mainWindow.webContents.openDevTools();

  // Listen for window being closed
  mainWindow.on('closed',  () => {
    mainWindow = null
  })
}

// Electron `app` is ready
app.on('ready', createWindow)

// Quit when all windows are closed - (Not macOS - Darwin)
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

// When app icon is clicked and app is running, (macOS) recreate the BrowserWindow
app.on('activate', () => {
  if (mainWindow === null) createWindow()
})
