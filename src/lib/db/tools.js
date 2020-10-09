const { setWith, get } = require('lodash');

function handleProduct(product, meta, db) {
  if (meta.jobs[product]) return meta.jobs[product];

  const info = db.prepare('INSERT INTO metaJobs (product) VALUES (?)').run(product);

  if (info.changes !== 1) return false;

  meta.jobs[product] = info.lastInsertRowid;
  return info.lastInsertRowid;
}

function handleSource(file, group, meta, db) {
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
  let id = meta.source.rev[file.name];
  if (id) {
    db.prepare('DELETE FROM metaSource WHERE id = ?').run(id);
    delete meta.source.all[id];
    delete meta.source.rev[file.name];
  }

  const info = db.prepare('INSERT INTO metaSource (type, name, size, t_created, t_modified, t_parsed) VALUES (@type, @name, @size, @t_created, @t_modified, @t_parsed)').run({ type: 'file', ...file });

  if (info.changes !== 1) return false;

  meta.source.rev[file.name] = info.lastInsertRowid;
  setWith(meta.source.all, `[${info.lastInsertRowid}]`, { type: 'file', ...file }, Object);

  return info.lastInsertRowid;
}

function handleDay(timestamp, meta, db) {
  // day should be from 3am to 3am, to catch that post-midnight work
  function breakDate(d) {
    if (typeof d === 'number') d = new Date(d);
    d.setHours(d.getHours() - 3); // Offset -3h to get same date range up to 3AM!
    return { year: d.getFullYear(), month: d.getMonth() + 1, day: d.getDate(), hour: d.getHours(), minute: d.getMinutes(), second: d.getSeconds() };
  }

  const pDate = breakDate(timestamp);
  if (get(meta.days, `[${pDate.year}][${pDate.month}][${pDate.day}]`)) return meta.days[pDate.year][pDate.month][pDate.day];

  const newDate = new Date(pDate.year, pDate.month - 1, pDate.day).getTime();
  let info = db.prepare('INSERT INTO days (year, month, day, timestamp) VALUES (@year, @month, @day, @timestamp)').run({ year: pDate.year, month: pDate.month, day: pDate.day, timestamp: newDate });

  if (info.changes !== 1) return false;

  setWith(meta.days, `[${pDate.year}][${pDate.month}][${pDate.day}]`, info.lastInsertRowid, Object);

  return info.lastInsertRowid;
}

function insertNewJob(row, db) {
  const info = db
    .prepare('INSERT INTO jobs (days, metaJobs, metaSource, metaTypes, metaUsers, amount, duration, d_type) VALUES (@days, @metaJobs, @metaSource, @metaTypes, @metaUsers, @amount, @duration, @d_type)')
    .run(row);

  if (info.changes !== 1) return false;

  return info.lastInsertRowid;
}

function insertTransactionJobsAtomic(transaction, db) {
  const insert = db.prepare('INSERT INTO jobsAtomic (jobs, hour, minute, second, duration, d_type) VALUES (@jobs, @hour, @minute, @second, @duration, @d_type)');

  const insertMany = db.transaction((jobs) => {
    for (const job of jobs) insert.run(job);
  });

  insertMany(transaction);
  return true;
}

module.exports = { handleProduct, handleSource, handleDay, insertNewJob, insertTransactionJobsAtomic };
