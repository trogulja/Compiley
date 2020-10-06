const Database = require('better-sqlite3');
const paths = require('../util/pathHandler');

function handleProduct(product, meta) {
  if (meta.metaJobs[product]) return meta.metaJobs[product];

  const db = new Database(paths.database);
  const info = db.prepare('INSERT INTO metaJobs (product) VALUES (?)').run(product);

  if (info.changes !== 1) return false;

  meta.metaJobs[product] = info.lastInsertRowid;
  return info.lastInsertRowid;
}

function handleSource(file, meta) {
  // check if file exists in meta
  // drop it from db if it does

  // insert new one, return id
}

module.exports = { handleProduct, handleSource };
