'use strict';

const Database = require('better-sqlite3');
const path = require('path');
const paths = require('../util/pathHandler');
const tools = require('./tools');
const extras = require('../util/extras');
const notifier = require('../util/notifier');
const database = require('./init');
const getMeta = require('./meta');
const { get, setWith } = require('lodash');

function main(meta, db) {
  // do an sql
  // console.log(extras.humanFileSize(extras.roughSizeOfObject(meta)));
  console.log(meta.types);
  const sql = `SELECT helperClaro.id AS helperClaro, jobsAtomic.id AS jobsAtomic, jobs.id AS jobs, jobs.days AS days, jobs.metaTypes, helperClaro.type, helperClaro.pstime, helperClaro.calctime, jobsAtomic.duration AS [jobsAtomic:duration], jobsAtomic.d_type AS [jobsAtomic:d_type], jobs.duration AS [jobs:duration], jobs.d_type AS [jobs:d_type] FROM helperClaro, jobsAtomic LEFT JOIN jobs ON jobsAtomic.jobs = jobs.id LEFT JOIN days ON jobs.days = days.id WHERE (helperClaro.type = 1 OR helperClaro.type = 2) AND helperClaro.processed IS NULL AND helperClaro.filename = jobsAtomic.name AND jobsAtomic.d_type = 4 AND ( (helperClaro.timestamp < jobsAtomic.timestamp1 AND helperClaro.timestamp + 3600000 >= jobsAtomic.timestamp1) OR (helperClaro.timestamp < jobsAtomic.timestamp2 AND helperClaro.timestamp + 3600000 >= jobsAtomic.timestamp2) ) AND helperClaro.metaUsers = jobs.metaUsers;`;
  const results = db.prepare(sql).all();

  console.log(results[100]);

  const helperClaro = [];
  const jobsAtomic = [];
  const jobIDs = {};

  const typeSwitch = [];

  for (const res of result) {
    // handleType!
    let type = meta.type['standard'];
    let duration = res.calctime;
    if (res.type === 2) type = meta.type['auto'];
    if (duration === 0) type = meta.type['auto'];
    // TODO - mozda dodati half-auto?

    if (type !== res.metaTypes) {
      // handle type switch!
    }

    // res.type = 1 - inspector
    // res.type = 2 - automatic
    // handleDuration!
    // handleDType!
    helperClaro.push(`UPDATE helperClaro SET processed = true WHERE id = ${res.helperClaro};`);
    jobsAtomic.push(`UPDATE jobsAtomic SET duration = ${res.calctime}, d_type = 1 WHERE id = ${res.jobsAtomic};`);
    setWith(jobIDs, `[${res.jobs}]`, true, Object);
  }

  console.log(results[100]);
  // console.log(results.length);
  // console.log(extras.humanFileSize(extras.roughSizeOfObject(results)));
  db.close();
}

function handleMissingDuration() {
  // Godišnja razina je pokazala da je avg hr automatska slika 4.339 sec
  // na to dodajemo +10 sec za dodatnu manualu, to je onda zaokruženo 15 sec
  // kasnije je potrebno provjeriti taj broj iz clara (kod loadanja istog)
  //
  // Godišnja razina je pokazala da je avg hr inspektora 43.46 sec
  // na to dodajemo +60 sec za manual rad, to je onda zaokruženo 105 sec
  // kasnije je potrebno provjeriti taj broj iz clara (kod loadanja istog)
}

// Testing
const db = database();
const meta = getMeta(db);
main(meta, db);
