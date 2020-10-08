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
const path = require('path');

async function gatherAll() {
  const db = database();
  const meta = getMeta(db);

  // console.log(meta);
  // db.close();
  // return true;

  const dataFolder = path.join(__dirname, '..', 'data');
  const files = await getFiles(dataFolder, meta);

  // console.log(files.new);
  // return false;

  let currentFile = 0;
  let percentageDone = 0;
  let totalFiles = 0;
  for (const group in files.all) {
    totalFiles += files.all[group].length;
  }

  for (const group in files.all) {
    for (const file of files.all[group]) {
      console.log(`Parsing file ${file.name} of group ${group}`);

      if (group === 'dti') await parseDTI(file, meta, db);
      // if (file.group === 'easyjob') await
      // if (file.group === 'worktime')
      // if (file.group === 'parte')
      // if (file.group === '')

      currentFile += 1;
      percentageDone = Math.floor((currentFile / totalFiles) * 100);
      console.log(`File ${currentFile} of ${totalFiles} done. ${percentageDone}% complete.`);
    }
  }

  db.close();
}

gatherAll();
