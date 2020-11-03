'use strict';

import { app, protocol, BrowserWindow, Menu, ipcMain, autoUpdater } from 'electron';
const windowStateKeeper = require('electron-window-state');
import { createProtocol } from 'vue-cli-plugin-electron-builder/lib';
import installExtension, { VUEJS_DEVTOOLS } from 'electron-devtools-installer';
const isDevelopment = process.env.NODE_ENV !== 'production';
const path = require('path');
if (isDevelopment) require('dotenv').config();

let win;

protocol.registerSchemesAsPrivileged([{ scheme: 'app', privileges: { secure: true, standard: true } }]);

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
if (isDevelopment) {
  mainMenuTemplate.push({
    label: 'Developer Tools',
    submenu: [{ role: 'toggledevtools' }, { role: 'reload' }],
  });
}

async function createWindow() {
  const allowResize = true;
  const winState = windowStateKeeper({
    defaultWidth: 800,
    defaultHeight: 600,
  });
  // Create the browser window.

  win = new BrowserWindow({
    x: winState.x,
    y: winState.y,
    width: allowResize ? winState.width : 800,
    height: allowResize ? winState.height : 600,
    minWidth: 600,
    minHeight: 580,
    resizable: allowResize,
    webPreferences: {
      // Use pluginOptions.nodeIntegration, leave this alone
      // See nklayman.github.io/vue-cli-plugin-electron-builder/guide/security.html#node-integration for more info
      nodeIntegration: process.env.ELECTRON_NODE_INTEGRATION,
      preload: path.join(__dirname, 'preload.js'),
    },
    icon: path.join(__dirname, '..', 'public', 'favicon.ico'),
  });

  winState.manage(win);

  const mainMenu = Menu.buildFromTemplate(mainMenuTemplate);
  Menu.setApplicationMenu(mainMenu);

  // Dynamic window type, based on package.json
  win.webContents.on('did-finish-load', () => {
    let name = require('../package.json').productName;
    let version = require('../package.json').version;
    let windowtitle = name + ' app v' + version;
    win.setTitle(windowtitle);
    win.webContents.send('title', { name: name, version: version, title: windowtitle });
  });

  if (process.env.WEBPACK_DEV_SERVER_URL) {
    // Load the url of the dev server if in development mode
    await win.loadURL(process.env.WEBPACK_DEV_SERVER_URL);
    if (!process.env.IS_TEST) win.webContents.openDevTools();
  } else {
    createProtocol('app');
    // Load the index.html when not in development
    win.loadURL('app://./index.html');
  }

  win.on('closed', () => {
    win = null;
  });
}

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (win === null) {
    createWindow();
  }
});

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', async () => {
  if (isDevelopment && !process.env.IS_TEST) {
    // Install Vue Devtools
    try {
      await installExtension(VUEJS_DEVTOOLS);
    } catch (e) {
      console.error('Vue Devtools failed to install:', e.toString());
    }
  }
  createWindow();
});

// Exit cleanly on request from parent process in development mode.
if (isDevelopment) {
  if (process.platform === 'win32') {
    process.on('message', (data) => {
      if (data === 'graceful-exit') {
        app.quit();
      }
    });
  } else {
    process.on('SIGTERM', () => {
      app.quit();
    });
  }
}

/**
 * API serving logic
 */
const express = require('express');
const cors = require('cors');
const api = express();
const port = process.env.PORT || 8178;

api.use(express.json({ limit: '100MB' }));
api.use(cors());
api.use('/compact', require('./lib/api/compact'));

const server = api.listen(port, () => console.log(`Server started on port ${port}`));

/**
 * Data intake logic
 */
const gatherAll = require('./controller');

ipcMain.on('job', async function (event, arg) {
  if (arg === 'init') {
    console.log('Received init, I should start the job i guess');
    // await gatherAll();
  }
});

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
