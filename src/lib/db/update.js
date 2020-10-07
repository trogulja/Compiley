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

function handleSource(file, group, meta) {
  /**
   * meta.source: {
   *   rev: { '.\\test\\Slike 24_2018-01-01-09-05-13.xls': 1 },
   *   all: {
   *     '1': {
   *       type: 'file',
   *       name: '.\\test\\Slike 24_2018-01-01-09-05-13.xls',
   *       size: 10752,
   *       t_created: 1601152576391.5225,
   *       t_modified: 1601152576391.5225,
   *       t_parsed: 1601313389239
   *     }
   *   }
   * }
   * 
   * file = {
   *   name: '.\\test\\Slike 24_2018-01-01-09-05-13.xls',
   *   size: 10752,
   *   t_created: 1601887270691.1484,
   *   t_modified: 1601887270691.1484,
   *   t_parsed: 1602069907561
   * },
   */
  // check if file exists in meta
  let id = meta.source.rev[file.name];
  if (id) {
    // drop it from db if it does
  }

  // insert new one, return id
}

function handleDay(timestamp, meta) {
  // day should be from 3am to 3am, to catch that post-midnight work
  // check if day exists in meta
  // return id if it does

  // insert new one, return id
}

module.exports = { handleProduct, handleSource, handleDay };
