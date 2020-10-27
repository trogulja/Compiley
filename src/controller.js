/**
 * Logic
 * 1. get meta from database
 * 2. get contents from folder
 * 3. compare meta and contents
 * 4. parse individual files that need parsing
 * 5. do database housekeeping (calculate sums in days table)
 * 6. vacuum db, to keep it slim!
 * 7. report what was done, report what is missing
 */

// start here
const database = require('./lib/db/init');
const getMeta = require('./lib/db/meta');
const getFiles = require('./lib/file/getFiles');
const parseDTI = require('./lib/file/parseDTI');
const parseEasyjob = require('./lib/file/parseEasyjob');
const parseWorktime = require('./lib/file/parseWorktime');
const parseParte = require('./lib/file/parseParte');
const parseAdmin = require('./lib/db/manualAdminImport');
const parseClaro = require('./lib/db/manualClaroImport');
const path = require('path');

async function gatherFiles(meta, db) {
  const dataFolder = path.join(__dirname, '..', 'data');
  const files = await getFiles(dataFolder, meta);

  let currentFile = 0;
  let percentageDone = 0;
  let totalFiles = 0;
  for (const group in files.new) {
    totalFiles += files.new[group].length;
  }

  for (const group in files.new) {
    for (const file of files.new[group]) {
      // console.log(`Parsing file ${file.name} of group ${group}`);

      if (group === 'dti') await parseDTI(file, meta, db);
      if (group === 'easyjob') await parseEasyjob(file, meta, db);
      if (group === 'worktime') await parseWorktime(file, meta, db);
      if (group === 'parte') await parseParte(file, meta, db);

      currentFile += 1;
      percentageDone = Math.floor((currentFile / totalFiles) * 100);
      // console.log(`File ${currentFile} of ${totalFiles} done. ${percentageDone}% complete.`);
      process.stdout.write(`File ${currentFile} of ${totalFiles} done. ${percentageDone}% complete.${'\033[0G'}`);
    }
  }

  return true;
}

async function gatherAll() {
  const db = database();
  const meta = getMeta(db);

  // await gatherFiles(meta, db);
  // parseClaro(meta, db);
  await parseAdmin(meta, db);

  db.close();
  return true;
}

gatherAll();
