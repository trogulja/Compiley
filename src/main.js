'use strict';

const { app, BrowserWindow, Menu, ipcMain, autoUpdater } = require('electron');
const windowStateKeeper = require('electron-window-state');
let environment = 'production';
// let environment = 'development';

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) app.quit();

// Set autoupdate functionality
require('update-electron-app')();

// Auto SET ENV - when deployed, paths change somewhat
if (process.execPath.search('electron.exe') !== -1) environment = 'development';
if (environment === 'development') require('dotenv').config();

const mainMenuTemplate = [
  {
    label: 'File',
    submenu: [
      {
        label: 'Exit',
        accelerator: process.platform == 'darwin' ? 'Command+Q' : 'Ctrl+Q',
        click() {
          app.quit();
        },
      },
    ],
  },
];
if (process.platform === 'darwin') mainMenuTemplate.unshift({});
if (environment === 'development') {
  mainMenuTemplate.push({
    label: 'Developer Tools',
    submenu: [{ role: 'toggledevtools' }, { role: 'reload' }],
  });
}

let mainWindow;
const createWindow = () => {
  const mainWindowState = windowStateKeeper({
    defaultWidth: 600,
    defaultHeight: 580,
  });

  // const allowResize = environment === 'development' ? true : false;
  const allowResize = true;

  // Create the browser window.
  mainWindow = new BrowserWindow({
    x: mainWindowState.x,
    y: mainWindowState.y,
    width: allowResize ? mainWindowState.width : 600,
    height: allowResize ? mainWindowState.height : 580,
    minWidth: 600,
    minHeight: 580,
    resizable: allowResize,
    webPreferences: {
      nodeIntegration: true,
      preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY,
    },
    icon: __dirname + '/img/lamp.ico',
  });

  mainWindowState.manage(mainWindow);

  // and load the index.html of the app.
  mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);

  const mainMenu = Menu.buildFromTemplate(mainMenuTemplate);
  Menu.setApplicationMenu(mainMenu);

  // Open the DevTools.
  // mainWindow.webContents.openDevTools();

  // Dynamic window type, based on package.json
  mainWindow.webContents.on('did-finish-load', () => {
    let name = require('../package.json').productName;
    let version = require('../package.json').version;
    let windowtitle = name + ' app v' + version;
    mainWindow.setTitle(windowtitle);
  });

  // Testing autoupdater
  autoUpdater.on('checking-for-update', () => {
    mainWindow.webContents.send('log', `[${new Date().toTimeString().split(' ')[0]}] Checking for update...`);
  });

  autoUpdater.on('before-quit-for-update', () => {
    mainWindow.webContents.send('log', `[${new Date().toTimeString().split(' ')[0]}] Updating...`);
    // controller.destroy();
    autoUpdater.quitAndInstall();
  });
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    // controller.destroy();
    app.quit();
  }
});

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
console.log('got this far in')
const express = require('express');
const cors = require('cors');
const api = express();
const port = process.env.PORT || 8178;

api.use(express.json({ limit: '100MB' }));
api.use(cors());
api.use('/compact', require('./lib/api/compact'));

const server = api.listen(port, () => console.log(`Server started on port ${port}`));

const gatherAll = require('./controller');
// gatherAll();

/**
 * File watcher logic
 */

// const controller = require('./controller');

// controller.events.on('log', function (msg) {
//   mainWindow.webContents.send('log', msg);
// });

// controller.events.on('info', function (msg) {
//   mainWindow.webContents.send('info', msg);
// });

// controller.events.on('meta', function (msg) {
//   mainWindow.webContents.send('meta', msg);
// });

/**
 * InterProcess Communication
 */

// ipcMain.on('init-job', function (event, arg) {
//   controller.init();
//   controller.start();
//   mlin.init();
// });

// ipcMain.on('start-job', function (event, arg) {
//   controller.start();
// });

// ipcMain.on('stop-job', function (event, arg) {
//   controller.stop();
// });

// ipcMain.on('force-start', function (event, arg) {
//   controller.forceStart(arg);
// });
