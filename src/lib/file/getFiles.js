const fs = require('fs').promises;
const { createReadStream } = require('fs');
const crypto = require('crypto');
const path = require('path');
const fileGroup = {
  dti: /Slike.+_\d{4}(?:-\d{2}){5}\.xlsx?/,
  parte: /(?:(?:Slike|parte)[ _](?:parte|slike)[ _]|Parte[_ ](?:Report )?)\d{1,2}[\. ]?(?:\d{4}|mjesec|mj).*\.xlsx?/i,
  claro: /Neki regex za claro/,
  easyjob: /EasyJob_(?:\d{4}|\d+mj).xlsx?/,
  worktime: /(?:Dnevni |m4 )*izvje[sš]taj (?:m4 )?\d{1,2} \d{4}(?:_time)?.xlsx?/i,
  admin: /Neki regex za admin/,
  storyeditor: /Slike_Storyeditor.+\.xlsx?/i,
};
const tmpFile = /~\$.+\.xls/i;
const notifier = require('../util/notifier');

function trimFile(file) {
  return {
    path: file.path,
    name: file.name,
    size: file.size,
    hash: file.hash,
  };
}

function addOutput(output, type, group, object) {
  if (!output[type][group]) output[type][group] = [];
  output[type][group].push(object);
}

const createHashFromFile = (filePath) =>
  new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha1');
    createReadStream(filePath)
      .on('data', (data) => hash.update(data))
      .on('end', () => resolve(hash.digest('hex')));
  });

async function getFiles(dir, validGroup, originDir = dir) {
  if (!validGroup) return false;
  let files;
  try {
    files = await fs.readdir(dir);
  } catch (error) {
    notifier.emit('error', `getFiles() failed: ${error.message}`);
    return false;
  }

  files = await Promise.all(
    files.map(async (file) => {
      const filePath = path.join(dir, file);
      const stats = await fs.stat(filePath);

      if (stats.isDirectory()) {
        return getFiles(filePath, validGroup, originDir);
      } else if (stats.isFile()) {
        // valid = ['dti', 'claro', 'easyjob', 'worktime', 'admin'] - populated from getMeta, passed via controller
        let isValid = false;
        validGroup.forEach((el) => {
          if (!fileGroup[el]) {
            notifier.emit('error', `We need ${el} key defined in fileGroup constant.`);
            return false;
          }
          if (fileGroup[el].test(path.basename(filePath))) isValid = el;
        });

        if (tmpFile.test(file)) isValid = false;

        if (isValid) {
          const uniqueName = filePath.replace(originDir, '.');
          const hash = await createHashFromFile(filePath);

          return {
            path: filePath,
            group: isValid,
            name: uniqueName,
            size: stats.size,
            hash,
          };
        } else {
          return false;
        }
      }
    })
  );
  return files.reduce((all, folderContents) => all.concat(folderContents), []).filter((el) => el);
}

async function main(dir, meta) {
  const time = new Date().getTime();
  // dir = path.join(__dirname, '..', '..', '..', '..', 'Compiley-old'); // for manual test

  const results = await getFiles(dir, meta.validGroup);
  notifier.emit('info', `getFiles() - Reading dirs done in ${new Date().getTime() - time}ms`);
  const time2 = new Date().getTime();
  const output = { all: {}, new: {} };

  for (const r of results) {
    const id = meta.source.rev[r.name];
    if (!id) {
      // TODO - report this is a new file
      addOutput(output, 'new', r.group, trimFile(r));
    } else {
      if (meta.source.all[id].hash === r.hash) {
        // Already processed file! - ignore!
        addOutput(output, 'all', r.group, trimFile(r));
      } else {
        // We have seen this file, but it has changed!
        addOutput(output, 'new', r.group, trimFile(r));
      }
    }
  }

  notifier.emit('info', `getFiles() - Sorting results done in ${new Date().getTime() - time2}ms`);
  return output;
}

module.exports = main;
