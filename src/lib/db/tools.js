const { setWith, get } = require('lodash');

function handleProduct(p, meta, db) {
  /**
   * p.country
   * p.client_group
   * p.client
   * p.product_group
   * p.product
   * p.printType
   */
  const metaJob = get(meta.jobs, `["${p.client}"]["${p.product_group}"]["${p.product}"]`);
  if (metaJob) return metaJob;

  // console.log(p);
  if (!p.country) p.country = null;
  if (!p.client_group) p.client_group = null;
  if (!p.client) throw new Error('What do you mean, there is no client?!');
  if (!p.product_group) throw new Error('What do you mean, there is no product_group?!');
  if (!p.product) throw new Error('What do you mean, there is no product?!');

  if (!p.printType) {
    p.printType = null;
    for (const test of meta.helperPrintType) {
      // TODO - escape regexp string!!
      if (new RegExp(test.product).test(p.product)) p.printType = test.metaPrintTypes;
    }
  }
  if (!p.printType) {
    for (const test of meta.helperPrintType) {
      if (new RegExp(test.product).test(p.product_group)) p.printType = test.metaPrintTypes;
    }
  }

  const info = db
    .prepare(
      'INSERT INTO metaJobs (country, client_group, client, product_group, product, metaPrintTypes) VALUES (@country, @client_group, @client, @product_group, @product, @printType)'
    )
    .run(p);

  if (info.changes !== 1) {
    console.log();
    console.log(p);
    throw new Error("We tried to insert into db, but it didn't happen!");
    return false;
  }

  setWith(meta.jobs, `["${p.client}"]["${p.product_group}"]["${p.product}"]`, info.lastInsertRowid, Object);
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

  const info = db
    .prepare(
      'INSERT INTO metaSource (type, name, size, t_created, t_modified, t_parsed) VALUES (@type, @name, @size, @t_created, @t_modified, @t_parsed)'
    )
    .run({ type: 'file', ...file });

  if (info.changes !== 1) return false;

  meta.source.rev[file.name] = info.lastInsertRowid;
  setWith(meta.source.all, `[${info.lastInsertRowid}]`, { type: 'file', ...file }, Object);

  return info.lastInsertRowid;
}

function handleDay(timestamp, meta, db) {
  // day should be from 3am to 3am, to catch that post-midnight work
  // nope, because that will cause errors with unique stuff.
  function breakDate(d) {
    if (typeof d === 'number') d = new Date(d);
    // d.setHours(d.getHours() - 3); // Offset -3h to get same date range up to 3AM!
    return {
      year: d.getFullYear(),
      month: d.getMonth() + 1,
      day: d.getDate(),
      hour: d.getHours(),
      minute: d.getMinutes(),
      second: d.getSeconds(),
    };
  }

  const pDate = breakDate(timestamp);
  if (get(meta.days, `[${pDate.year}][${pDate.month}][${pDate.day}]`))
    return meta.days[pDate.year][pDate.month][pDate.day];

  const newDate = new Date(pDate.year, pDate.month - 1, pDate.day).getTime();
  let info = db
    .prepare('INSERT INTO days (year, month, day, timestamp) VALUES (@year, @month, @day, @timestamp)')
    .run({ year: pDate.year, month: pDate.month, day: pDate.day, timestamp: newDate });

  if (info.changes !== 1) return false;

  setWith(meta.days, `[${pDate.year}][${pDate.month}][${pDate.day}]`, info.lastInsertRowid, Object);

  return info.lastInsertRowid;
}

function insertNewJob(row, db) {
  const insert = db.prepare(
    'INSERT INTO jobs (days, metaJobs, metaSource, metaTypes, metaUsers, amount, duration, d_type) VALUES (@days, @metaJobs, @metaSource, @metaTypes, @metaUsers, @amount, @duration, @d_type)'
  );

  let info;
  try {
    info = insert.run(row);
  } catch (error) {
    // console.log(row);
    // console.log(error);
    return false;
  }

  if (info.changes !== 1) return false;

  return info.lastInsertRowid;
}

function insertTransactionJobs(transaction, db) {
  const insert = db.prepare(
    'INSERT INTO jobs (days, metaJobs, metaSource, metaTypes, metaUsers, amount, duration, d_type) VALUES (@days, @metaJobs, @metaSource, @metaTypes, @metaUsers, @amount, @duration, @d_type)'
  );

  const insertMany = db.transaction((jobs) => {
    for (const job of jobs) {
      try {
        insert.run(job);
      } catch (error) {
        console.log(job);
        console.log(error);
        throw new Error('There is something wrong with this job');
      }
    }
  });

  insertMany(transaction);
  return true;
}

function insertTransactionJobsAtomic(transaction, db) {
  const insert = db.prepare(
    'INSERT INTO jobsAtomic (jobs, hour, minute, second, duration, d_type, timestamp1, timestamp2, name) VALUES (@jobs, @hour, @minute, @second, @duration, @d_type, @timestamp1, @timestamp2, @name)'
  );

  const insertMany = db.transaction((jobs) => {
    for (const job of jobs) {
      try {
        insert.run(job);
      } catch (error) {
        console.log(job);
        console.log(error);
        continue;
      }
    }
  });

  insertMany(transaction);
  return true;
}

function insertTransactionWorktime(transaction, db) {
  const insert = db.prepare(
    'INSERT INTO worktime (days, metaSource, metaUsers, d_presence) VALUES (@days, @metaSource, @metaUsers, @d_presence)'
  );

  const insertMany = db.transaction((jobs) => {
    for (const job of jobs) {
      try {
        insert.run(job);
      } catch (error) {
        console.log(job);
        console.log(error);
        continue;
      }
    }
  });

  insertMany(transaction);
  return true;
}

module.exports = {
  handleProduct,
  handleSource,
  handleDay,
  insertNewJob,
  insertTransactionJobs,
  insertTransactionJobsAtomic,
  insertTransactionWorktime,
};
