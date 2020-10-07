const fs = require('fs').promises;
const path = require('path');
const fileGroup = {
  dti: /Slike.+_\d{4}(?:-\d{2}){5}\.xlsx?/,
  claro: /Neki regex za claro/,
  easyjob: /EasyJob_\d{4}.xlsx?/,
  worktime: /Dnevni izvještaj m4 \d{2} \d{4}.xlsx?/,
  admin: /Neki regex za admin/,
};

function trimFile(file) {
  return {
    path: file.path,
    name: file.name,
    size: file.size,
    t_created: file.t_created,
    t_modified: file.t_modified,
    t_parsed: file.t_parsed,
  };
}

function addOutput(output, type, group, object) {
  if (!output[type][group]) output[type][group] = [];
  output[type][group].push(object);
}

async function getFiles(dir, validGroup, originDir = dir) {
  if (!validGroup) return false;
  let files;
  try {
    files = await fs.readdir(dir);
  } catch (error) {
    console.log('Error in getFiles()');
    console.log(error.message);
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
          if (!fileGroup[el]) throw new Error(`We need ${el} key defined in fileGroup constant.`);
          if (fileGroup[el].test(path.basename(filePath))) isValid = el;
        });

        if (isValid) {
          const uniqueName = filePath.replace(originDir, '.');
          return {
            path: filePath,
            group: isValid,
            name: uniqueName,
            size: stats.size,
            t_created: stats.birthtimeMs,
            t_modified: stats.birthtimeMs,
            t_parsed: new Date().getTime(),
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
  console.log(`Reading dirs done in ${new Date().getTime() - time}ms`);
  const time2 = new Date().getTime();
  const output = { all: {}, new: {} };

  for (const r of results) {
    const id = meta.source.rev[r.name];
    if (!id) {
      // TODO - report this is a new file
      addOutput(output, 'new', r.group, trimFile(r))
    } else {
      if (
        meta.source.all[id].size >= r.size &&
        meta.source.all[id].t_created >= r.t_created &&
        meta.source.all[id].t_modified >= r.t_modified
      ) {
        // TODO - report we have seen this file, but older version
        addOutput(output, 'all', r.group, trimFile(r))
      } else {
        // TODO - report this is a new file version
        addOutput(output, 'new', r.group, trimFile(r))
      }
    }
  }

  console.log(`Sorting results done in ${new Date().getTime() - time2}ms`);
  return output;
}

module.exports = main;
