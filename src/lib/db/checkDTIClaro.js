'use strict';

const Database = require('better-sqlite3');
const path = require('path');
const paths = require('../util/pathHandler');
const tools = require('./tools');
const extras = require('../util/extras');
const notifier = require('../util/notifier');
const database = require('./init');
const getMeta = require('./meta');

function calculateDays(db) {
  const sql = db.prepare(
    'UPDATE days SET sum_images = ( SELECT sum(amount) FROM jobs WHERE jobs.days = days.id ), sum_users = ( SELECT DISTINCT (metaUsers) FROM jobs WHERE jobs.days = days.id ), sum_images_atomic = ( SELECT count( * ) FROM jobsAtomic LEFT JOIN jobs ON jobsAtomic.jobs = jobs.id WHERE jobs.days = days.id ), sum_users_atomic = ( SELECT DISTINCT (jobs.metaUsers) FROM jobsAtomic LEFT JOIN jobs ON jobsAtomic.jobs = jobs.id WHERE jobs.days = days.id ), sum_d_working = ( SELECT sum(duration) FROM jobs WHERE jobs.days = days.id ), sum_d_presence = ( SELECT sum(d_presence) FROM worktime WHERE worktime.days = days.id );'
  );

  try {
    sql.run();
  } catch (error) {
    console.log(error);
    return false;
  }

  return true;
}

function calculateWorktime(db) {
  const sql = db.prepare(
    'UPDATE worktime SET d_working = ( SELECT sum(duration) FROM jobs WHERE jobs.days = worktime.days AND jobs.metaUsers = worktime.metaUsers );'
  );

  try {
    sql.run();
  } catch (error) {
    console.log(error);
    return false;
  }

  return true;
}

function calculateJobs(db) {
  const sql = db.prepare(
    'UPDATE jobs SET amount = ( SELECT count( * ) FROM jobsAtomic WHERE jobs.id = jobsAtomic.jobs ), duration = ( SELECT sum(duration) FROM jobsAtomic WHERE jobs.id = jobsAtomic.jobs ), d_type = ( SELECT max(d_type) FROM jobsAtomic WHERE jobs.id = jobsAtomic.jobs ) WHERE EXISTS ( SELECT 1 FROM jobsAtomic WHERE jobsAtomic.jobs = jobs.id );'
  );

  try {
    sql.run();
  } catch (error) {
    console.log(error);
    return false;
  }

  return true;
}

function handleTypeSwitch(row, db) {
  /**
   * helperClaro, jobsAtomic, jobs, days, metaTypes, type, pstime, calctime, jobsAtomic:duration, jobsAtomic:d_type, jobs:duration, jobs:d_type, newType
   */

  const sqlInsert = db.prepare(
    `INSERT INTO jobs ( days, metaJobs, metaSource, metaTypes, metaUsers ) SELECT days, metaJobs, metaSource, ${row.newType}, metaUsers FROM jobs WHERE id = ${row.jobs};`
  );
  let info;
  try {
    info = sqlInsert.run();
    return info.lastInsertRowid;
  } catch (error) {
    const sqlSelect = db.prepare(
      `SELECT id FROM jobs WHERE days = ( SELECT days FROM jobs WHERE id = ${row.jobs} ) AND metaJobs = ( SELECT metaJobs FROM jobs WHERE id = ${row.jobs} ) AND metaSource = ( SELECT metaSource FROM jobs WHERE id = ${row.jobs} ) AND metaTypes = ${row.newType} AND metaUsers = ( SELECT metaUsers FROM jobs WHERE id = ${row.jobs} );`
    );
    try {
      const result = sqlSelect.all();
      if (result.length !== 1) throw new Error('Something is messed up in here, check it out!');
      if (result.id === row.jobs) throw new Error('This should not happen!');
      return result[0].id;
    } catch (error) {
      console.log(error);
      return false;
    }
  }
}

function handleDuration(type, duration, d_type, meta) {
  if (duration > 0) return { duration, d_type: Math.min(d_type, 1) };
  if (type === meta.types['auto']) {
    // Godišnja razina je pokazala da je avg hr automatska slika 4.339 sec
    // na to dodajemo +10 sec za dodatnu manualu, to je onda zaokruženo 15 sec
    // kasnije je potrebno provjeriti taj broj iz clara (kod loadanja istog)
    return { duration: 15, d_type: 3 };
  } else if (type === meta.types['standard']) {
    // Godišnja razina je pokazala da je avg hr inspektora 43.46 sec
    // na to dodajemo +60 sec za manual rad, to je onda zaokruženo 105 sec
    // kasnije je potrebno provjeriti taj broj iz clara (kod loadanja istog)
    return { duration: 105, d_type: 3 };
  }

  return { duration: 0, d_type: 4 };
}

function updateMissingDuration(meta, db) {
  const sqlStandard = db.prepare(
    `UPDATE jobsAtomic SET duration = 105, d_type = 3 WHERE EXISTS ( SELECT * FROM jobs WHERE jobs.id = jobsAtomic.jobs AND jobs.metaTypes = ${meta.types['standard']} ) AND jobsAtomic.duration = 0;`
  );
  const sqlAutomatic = db.prepare(
    `UPDATE jobsAtomic SET duration = 15, d_type = 3 WHERE EXISTS ( SELECT * FROM jobs WHERE jobs.id = jobsAtomic.jobs AND jobs.metaTypes = ${meta.types['auto']} ) AND jobsAtomic.duration = 0;`
  );

  let changes = 0;
  const res1 = sqlStandard.run();
  changes += res1.changes;
  const res2 = sqlAutomatic.run();
  changes += res2.changes;

  return changes;
}

function updateTransaction(transaction, db) {
  const insertAll = db.transaction((jobs) => {
    for (const job of jobs) {
      try {
        db.prepare(job).run();
      } catch (error) {
        console.log(job);
        console.log(error);
        continue;
      }
    }
  });

  insertAll(transaction);
  return true;
}

function cleanEmptyJobs(db) {
  const sql = db.prepare(
    `DELETE FROM jobs WHERE id IN ( SELECT jobs.id FROM jobs LEFT JOIN metaJobs ON jobs.metaJobs = metaJobs.id LEFT JOIN metaTypes ON jobs.metaTypes = metaTypes.id WHERE metaJobs.country = 'HR' AND metaJobs.client_group = 'interni' AND metaJobs.product_group = 'DTI' AND jobs.id NOT IN ( SELECT DISTINCT jobsAtomic.jobs FROM jobsAtomic WHERE jobsAtomic.jobs = jobs.id ) );`
  );
  const info = sql.run();
  return true;
}

function vacuum(db) {
  const sql = db.prepare('VACUUM;');
  const info = sql.run();
  return true;
}

function main(meta, db) {
  // do an sql
  // console.log(extras.humanFileSize(extras.roughSizeOfObject(meta)));
  console.log(meta.types);
  const sql = `SELECT helperClaro.id AS helperClaro, jobsAtomic.id AS jobsAtomic, jobs.id AS jobs, jobs.days AS days, jobs.metaTypes, helperClaro.type, helperClaro.pstime, helperClaro.calctime, jobsAtomic.duration AS [jobsAtomic:duration], jobsAtomic.d_type AS [jobsAtomic:d_type], jobs.duration AS [jobs:duration], jobs.d_type AS [jobs:d_type] FROM helperClaro, jobsAtomic LEFT JOIN jobs ON jobsAtomic.jobs = jobs.id LEFT JOIN days ON jobs.days = days.id WHERE (helperClaro.type = 1 OR helperClaro.type = 2) AND helperClaro.processed IS NULL AND helperClaro.filename = jobsAtomic.name AND jobsAtomic.d_type = 4 AND ( (helperClaro.timestamp < jobsAtomic.timestamp1 AND helperClaro.timestamp + 3600000 >= jobsAtomic.timestamp1) OR (helperClaro.timestamp < jobsAtomic.timestamp2 AND helperClaro.timestamp + 3600000 >= jobsAtomic.timestamp2) ) AND helperClaro.metaUsers = jobs.metaUsers;`;
  const results = db.prepare(sql).all();

  const helperClaro = [];
  const jobsAtomic = [];
  for (const res of results) {
    // handleType!
    // let newType = meta.type['standard'];
    let newType = res.metaTypes;
    // res.type = 1 - inspector
    // res.type = 2 - automatic
    if (res.type === 2) newType = meta.types['auto'];
    if (res.calctime === 0) newType = meta.types['auto'];
    // TODO - mozda dodati half-auto?

    if (newType !== res.metaTypes) res.jobs = handleTypeSwitch({ ...res, newType }, db);
    if (!res.jobs) console.log(res);
    if (!res.jobs) throw new Error('We were supposed to get back the new job ID, but something failed!');

    const newDuration = handleDuration(newType, res.calctime, res['jobsAtomic:d_type'], meta);
    if (!newDuration.duration) throw new Error('We were supposed to get a number, but something failed!');

    helperClaro.push(`UPDATE helperClaro SET processed = true WHERE id = ${res.helperClaro};`);
    jobsAtomic.push(
      `UPDATE jobsAtomic SET jobs = ${res.jobs}, duration = ${newDuration.duration}, d_type = ${newDuration.d_type} WHERE id = ${res.jobsAtomic};`
    );
  }

  let success;

  success = updateTransaction([...helperClaro, ...jobsAtomic], db);
  if (!success) console.log('failed to updateTransaction()');

  updateMissingDuration(meta, db);

  success = calculateJobs(db);
  if (!success) console.log('failed to calculateJobs()');

  success = calculateWorktime(db);
  if (!success) console.log('failed to calculateWorktime()');

  success = calculateDays(db);
  if (!success) console.log('failed to calculateDays()');

  success = cleanEmptyJobs(db)
  if (!success) console.log('failed to cleanEmptyJobs()');

  success = vacuum(db);
  if (!success) console.log('failed to vacuum()');

  // console.log(results.length);
  // console.log(extras.humanFileSize(extras.roughSizeOfObject(results)));
  db.close();
}

// Testing
const db = database();
const meta = getMeta(db);
main(meta, db);
