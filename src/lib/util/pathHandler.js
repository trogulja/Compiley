/**
 * Folder structure:
 * - root folder (where we run the app from)
 * - db folder (where we keep our databse)
 * - logs folder (where we keep our logs)
 *
 * -= development =-
 * - process.execPath (electron or node)
 * E:\code\Apps\FolderWatcher\node_modules\electron\dist\electron.exe
 * C:\Program Files\nodejs\node.exe - testing (node script.js)
 * - paths
 *  root: 'E:\code\Apps\FolderWatcher'
 *    db: 'E:\code\Apps\FolderWatcher\db'
 *
 * -= production =-
 * - process.execPath
 * E:\code\Apps\FolderWatcher\release-builds\dashboard-win32-x64\dashboard.exe
 * - paths
 *  root: 'E:\code\Apps\FolderWatcher\release-builds\dashboard-win32-x64\resources',
 *    db: 'E:\code\Apps\FolderWatcher\release-builds\dashboard-win32-x64\resources\db',
 */

const path = require('path');
const fs = require('fs');
const paths = { root: '', db: '' };

let app = 'prod';
if (process.execPath.search('electron.exe') >= 0) app = 'dev';
if (process.execPath.search('node.exe') >= 0) app = 'test';
if (process.execPath.search('AppData') >= 0) app = 'installed';

if (app === 'prod') {
  paths.root = path.join(path.dirname(process.execPath), 'resources');
} else if (app === 'dev' || app == 'test') {
  let frag = __dirname.split(path.sep);
  frag.length = frag.indexOf('src');
  paths.root = path.join(...frag);
} else if (app === 'installed') {
  paths.root = path.join(path.dirname(process.execPath), '..');
}

paths.db = path.join(paths.root, 'db');

const db_file = path.join(paths.root, 'db', 'compiley.db');
// Throw an error if we don't have a db!
fs.accessSync(db_file, fs.constants.F_OK | fs.constants.W_OK);
// if there is no db, we can init with default data

paths.database = db_file;

// console.log(paths)

module.exports = paths;
