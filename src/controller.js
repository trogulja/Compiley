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
const getMeta = require('./lib/db/getMeta');
const getFiles = require('./lib/file/getFiles');
const parseDTI = require('./lib/file/parseDTI');
const path = require('path');

async function gatherAll() {
  const meta = getMeta('dti');
  // console.log(meta);
  const files = await getFiles(path.join(__dirname, '..', 'data'), meta.metaSource.validGroup);

  let currentFile = 0;
  let percentageDone = 0;
  
  for (const file of files) {
    if (file.group === 'dti') await parseDTI(file, meta);
    // if (file.group === 'easyjob') await
    // if (file.group === 'worktime')
    // if (file.group === 'parte')
    // if (file.group === '')

    currentFile += 1;
    percentageDone = Math.round((currentFile / files.length) * 100);
    console.log(`File ${currentFile} of ${files.length} done. ${percentageDone}% complete.`)
  }
}

gatherAll();
