const fs = require('fs').promises;
const path = require('path');
const Database = require('better-sqlite3');
const paths = require('./pathHandler');

async function walk(dir, validFileName) {
  console.log(dir);
  let files;
  try {
    files = await fs.readdir(dir);
  } catch (error) {
    console.log('Error in walk()');
    console.log(error.message);
  }

  files = await Promise.all(
    files.map(async (file) => {
      const filePath = path.join(dir, file);
      const stats = await fs.stat(filePath);
      if (stats.isDirectory()) {
        return walk(filePath, validFileName);
      } else if (stats.isFile()) {
        if (validFileName.test(path.basename(filePath))) {
          return { path: filePath, name: path.basename(filePath), size: stats.size, t_created: stats.birthtimeMs, t_modified: stats.birthtimeMs, t_parsed: new Date().getTime() };
        } else {
          return {};
        }
      }
    })
  );
  return files.reduce((all, folderContents) => all.concat(folderContents), []).filter((el) => el.name);
}

function resolveSource(file) {
  const db = new Database(paths.database);
  const res = db.prepare('SELECT * FROM metaSource WHERE name = @name').all(file);
  db.close();
  return res;
}

async function processFile(file) {
  
}

const fileWeNeed = /Slike.+_\d{4}(?:-\d{2}){5}\.xls/;
const folderWeWalk = path.join(__dirname, '..', '..', 'data');

walk(folderWeWalk, fileWeNeed).then(async (res) => {
  // res[0].name = 'Slike VL_2018-01-01-09-05-12.xls'
  // console.log(resolveSource(res[0]));
  console.log(res);

  for (const file of res) {
    const match = resolveSource(file);
    console.log(match);
    let shouldReplace = false;
    if (match.length) {
      if (file.t_created < match.t_created && file.t_modified > match.t_modified) shouldReplace = true;
      if (file.t_created >= match.t_created && file.t_modified > match.t_modified) shouldReplace = true;
    }
    if (shouldReplace) {
      db.prepare('DELETE FROM metaSource WHERE id = @id').run(match);
    }
    const newSourceId = db.prepare('INSERT INTO metaSource (type, name, size, t_created, t_modified, t_parsed) VALUES ("file", @name, @size, @t_created, @t_modified, @t_parsed)').run(file);
    file.id = newSourceId;
    await processFile(file);
  }
});
