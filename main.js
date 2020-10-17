// Modules
const {app, BrowserWindow, globalShortcut, Menu, Tray, screen, ipcMain} = require('electron');
const windowStateKeeper = require('electron-window-state');
const Mousetrap = require('mousetrap');

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow, tray

ipcMain.on('registerLink', (event, arg) => {
  console.log(arg) 
  mainWindow.loadFile('renderer/login_register/register.html')
})

let trayMenu = Menu.buildFromTemplate([
  { label: "Item 1",
submenu: [
  {role: "quit"},
  {label: "Reload", click() { mainWindow.reload() }}
]}
])

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
  
  let mainWindowState = windowStateKeeper({
    defaultWidth: 800,
    defaultHeight: 643
  });

  mainWindow = new BrowserWindow({
    width: 800, height: 643,
    x: mainWindowState.x, y: mainWindowState.y,
    minHeight: 300, minWidth: 500,
    webPreferences: { nodeIntegration: true , enableRemoteModule: true}
  })

  mainWindow.loadFile('renderer/login_register/login.html')

  // Open DevTools - Remove for PRODUCTION!
  mainWindow.webContents.openDevTools();

  mainWindowState.manage(mainWindow);

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
